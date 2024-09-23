import { Refkey, refkey as getRefkey, mapJoin } from "@alloy-js/core";
import * as csharp from "@alloy-js/csharp";
import { Model } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { TypeExpression } from "./type-expression.js";

export interface ClassDefinitionProps extends Omit<csharp.ClassProps, "name"> {
  type: Model;
  name?: string;
}

export function ClassDefinition(props: ClassDefinitionProps) {
  const { type, ...coreProps } = props;

  const model = $.model.getEffectiveModel(type);

  // if a name wasn't specified, use the name based on the type
  const name = coreProps.name ?? $.type.getPlausibleName(model);
  const refkey = coreProps.refkey ?? getRefkey(type);

  let typeParams: Record<string, Refkey> | undefined;
  const arrayOfProps = Array.from(model.properties.values());
  const members = mapJoin(arrayOfProps, (prop) => {
    let typeParamRefkey: Refkey | undefined;
    if (prop.type.kind === "TemplateParameter") {
      if (!typeParams) {
        typeParams = {};
      }
      typeParamRefkey = getRefkey();
      // TODO: class name
      typeParams[prop.name] = typeParamRefkey;
    }
    return <csharp.ClassMember accessModifier="public" name={prop.name} type={typeParamRefkey ?? <TypeExpression type={prop.type} />} />
  });

  return (
    <csharp.Class name={name} typeParameters={typeParams} refkey={refkey}>
      {members}{coreProps.children}
    </csharp.Class>
  )
}
