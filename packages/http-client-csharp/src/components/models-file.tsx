import { IndentContext, mapJoin } from "@alloy-js/core";
import * as csharp from "@alloy-js/csharp";
import { Model } from "@typespec/compiler";
import * as ef from "@typespec/emitter-framework/csharp";

export interface ModelsFileProps {
  path?: string;
  models: Model[];
}

export function ModelsFile(props: ModelsFileProps) {
  return (
    <csharp.SourceFile path={props.path ?? "models.cs"}>
      <IndentContext.Provider value={{ indent: "    ", indentString: "", level: 0 }}>
      {mapJoin(
        props.models,
        (model) => {
          return <ef.ClassDefinition type={model} />
        },
        { joiner: "\n\n" }
      )}
      </IndentContext.Provider>
    </csharp.SourceFile>
  );
}
