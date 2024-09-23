import * as ay from "@alloy-js/core";
import * as csharp from "@alloy-js/csharp";
import { EmitContext, listServices, navigateProgram, Namespace, navigateType, Model, Union, Enum, Scalar, Operation, Type, navigateTypesInNamespace } from "@typespec/compiler";
import { Clients } from "./components/clients.jsx";
import { ModelsFile } from "./components/models-file.js";

export async function $onEmit(context: EmitContext) {
  const service = listServices(context.program)[0];
  const visited = operationWalker(context, service.type);
  const csNamePolicy = csharp.createCSharpNamePolicy();
  const outputDir = context.emitterOutputDir;

  return (
    <ay.Output namePolicy={csNamePolicy}>
      <csharp.ProjectDirectory name={service.type.name} version="0.1.0" path={outputDir} description={service.title ?? service.type.name}>
        <csharp.Namespace name={`${service.type.name}.Models`}>
          <ay.SourceDirectory path="models">
            <ModelsFile models={visited.dataTypes.filter((m) => m.kind === "Model")} />
          </ay.SourceDirectory>
        </csharp.Namespace>
        <csharp.Namespace name={service.type.name}>
          <Clients operations={visited.operations} />
        </csharp.Namespace>
      </csharp.ProjectDirectory>
    </ay.Output>
  );
}

type DataType =  Model | Union | Enum | Scalar;

function operationWalker(context: EmitContext, rootNS: Namespace) {
  const isNSChildOfRootNS = (currentNS: Namespace): boolean => {
    let parentNS = currentNS.namespace;
    while (parentNS) {
      if (parentNS.name === rootNS.name) {
        return true;
      }
      parentNS = parentNS.namespace;
    }
    return false;
  }

  const dataTypes = new Array<DataType>();
  const nsOperations = new Map<string, Array<Operation>>();
  navigateProgram(context.program, {
    namespace(n) {
      if (isNSChildOfRootNS(n)) {
        nsOperations.set(n.name, new Array<Operation>());
        navigateTypesInNamespace(n, {
          operation(o) {
            nsOperations.get(n.name)!.push(o);
            navigateType(o, {
              model(m) {
                trackType(dataTypes, m);
              }, modelProperty(p) {
                trackType(dataTypes, p.type);
              },
              scalar(s) {
                if(s.namespace?.name !== "TypeSpec") {
                  return;
                }
      
                trackType(dataTypes, s);
              },
              enum(e) {
                trackType(dataTypes, e);
              },
              union(u) {
                trackType(dataTypes, u);
              },
              unionVariant(v) {
                trackType(dataTypes, v.type);
              }
            }, {includeTemplateDeclaration: false});
          }
        })
      }
    },
  }, {includeTemplateDeclaration: false});

  return {dataTypes, operations: nsOperations};
 
}

function isDataType(type: Type): type is DataType {
  return type.kind === "Model" || type.kind === "Union" || type.kind === "Enum" || type.kind === "Scalar";
}

function isDeclaredType(type: Type): boolean {
  if("namespace" in type && type.namespace?.name === "TypeSpec") {
    return false;
  }
  
  if(!isDataType(type)) {
    return false;
  }

  if(type.name === undefined || type.name === "") {
    return false;
  }

  return true;
}

function trackType(types: Array<DataType>, type: Type) {

  if(!isDataType(type)) {
    return;
  }

  if(!isDeclaredType(type)) {
    return;
  }

  if (!types.includes(type)) {
    types.push(type);
  }
}
