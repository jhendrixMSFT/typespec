import { Child, Children, code, mapJoin, refkey } from "@alloy-js/core";
import * as csharp from "@alloy-js/csharp";
import { ModelProperty, Operation } from "@typespec/compiler";
import * as ef from "@typespec/emitter-framework/csharp";
import { $ } from "@typespec/compiler/typekit";

export interface ClientsProps {
  operations: Map<string, Array<Operation>>;
}

export function Clients(props: ClientsProps) {
  return (
      mapJoin(props.operations, (clientName, operations) => {
      return <csharp.SourceFile path={`${clientName}.cs`} using={["System", "System.Net", "System.Net.Http"]}>
        <csharp.Class name={clientName}>
          <csharp.ClassMember accessModifier="private" name="endpoint" type="string" />
          <csharp.ClassMember accessModifier="private" name="client" type="HttpClient" />

          <csharp.ClassConstructor accessModifier="public" parameters={[{name: "endpoint", type: "string"}]}>
            this.endpoint = endpoint;
            this.client = new HttpClient();
          </csharp.ClassConstructor>

          {mapJoin(operations, (operation) => {
            let params: Array<csharp.ParameterProps> | undefined;
            const httpOp = $.httpOperation.get(operation);

            // TODO: this doesn't match 1:1 with param ordering in tsp
            for (const param of httpOp.parameters.parameters) {
              if (!params) {
                params = new Array<csharp.ParameterProps>();
              }
              params.push({name: param.name, type: <ef.TypeExpression type={param.param.type} />});
            }

            if (httpOp.parameters.body) {
              const body = httpOp.parameters.body;
              if (!params) {
                params = new Array<csharp.ParameterProps>();
              }
              params.push({name: "body", type: <ef.TypeExpression type={body.type} />});
            }

            const responses = $.httpOperation.getResponses(operation).filter(r => r.statusCode !== "*")

            let httpResponse: Children | undefined;
            let resBody: any = undefined;
            if (responses[0].responseContent.body?.type && $.model.is(responses[0].responseContent.body.type)) {
              httpResponse = refkey(responses[0].responseContent.body.type);
              const targetSrc = csharp.useSourceFile();
              targetSrc!.addUsing("System.Net.Http.Json");
              resBody = <>
              {"\n"}return HttpContentJsonExtensions.ReadFromJsonAsync{"<"}{httpResponse}{">"}(res.Content).Result;
              </>
            }

            let clientVerbMethod: string;
            switch (httpOp.verb) {
              case "delete":
                clientVerbMethod = "DeleteAsync";
                break;
              case "get":
                clientVerbMethod = "GetAsync";
                break;
              case "head":
                clientVerbMethod = "HeadAsync";
                break;
              case "patch":
                clientVerbMethod = "PatchAsync";
                break;
              case "post":
                clientVerbMethod = "PostAsync";
                break;
              case "put":
                clientVerbMethod = "PutAsync";
                break;
            }

            let opPath = `"${httpOp.path}"`;
            const rawQP = new Map<string, ModelProperty>();
            for (const param of httpOp.parameters.parameters) {
              switch (param.type) {
                case "header":
                  throw new Error("header params NYI");
                case "path":
                  opPath += `.Replace("{${param.name}}", ${param.param.name}.ToString())`;
                  break;
                case "query":
                  rawQP.set(param.name, param.param);
              }
            }

            let queryParams: any = undefined;
            if (rawQP.size > 0) {
              const targetSrc = csharp.useSourceFile();
              targetSrc!.addUsing("System.Web");
              queryParams = <>
              {"\n"}var qp = HttpUtility.ParseQueryString(req.Query);
              {mapJoin(rawQP, (key, val) => {
                let setQP: Child = `qp["${key}"] = ${val.name}.ToString();`;
                if (val.optional) {
                  setQP = code`
                  if (${val.name} != null)
                  {
                    ${setQP}
                  }
                  `;
                }
                return setQP;
              })}
              req.Query = qp.ToString();
              </>
            }

            const reqBody: {
              toJson: any,
              bodyParam: any,
            } = {
              toJson: undefined,
              bodyParam: undefined,
            };
            if (httpOp.parameters.body) {
              const targetSrc = csharp.useSourceFile();
              targetSrc!.addUsing("System.Net.Http.Json");
              reqBody.toJson = <>
              {"\n"}var content = JsonContent.Create(body);
              </>
              reqBody.bodyParam = ", content";
            }

            return (
              <csharp.ClassMethod accessModifier="public" name={operation.name} parameters={params} returns={httpResponse}>
                var req = new UriBuilder(this.endpoint + {opPath});{queryParams}{reqBody.toJson}
                var res = this.client.{clientVerbMethod}(req.Uri{reqBody.bodyParam}).Result;
                if (res.StatusCode != HttpStatusCode.OK)
                {"{"}
                  throw new Exception(res.ToString());
                {"}"}{resBody}
              </csharp.ClassMethod>
            );
          }, {joiner: "\n\n"})}
        </csharp.Class>
      </csharp.SourceFile>
      },
      { joiner: "\n\n" })
  );
}
