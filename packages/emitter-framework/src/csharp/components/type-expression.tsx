import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { isArray } from "../../core/utils/typeguards.js";

export interface TypeExpressionProps {
  type: Type;
}

export function TypeExpression(props: TypeExpressionProps): string {
  return recursiveTypeExpression(props.type);
}

function recursiveTypeExpression(type: Type): string {
  switch (type.kind) {
    case "Boolean":
      return "bool";
    case "Intrinsic":
      switch (type.name) {
        case "unknown":
          return "Object";
        default:
          throw new Error(`unhandled intrinsic type name ${type.name}`);
      }
    case "Model":
      if (isArray(type)) {
        return `List<${recursiveTypeExpression(type.indexer.value)}>`;
      }
      return type.name;
    case "Number":
      return "int";
    case "Scalar":
      switch (type.name) {
        case "float32":
          return "float";
        case "float64":
          return "double";
        case "int32":
          return "int";
        case "int64":
          return "long";
        case "string":
        case "url":
          return "string";
        default:
          throw new Error(`unhandled scalar type name ${type.name}`);
      }
    case "String":
      return "string";
    default:
      //return type.kind;
      throw new Error(`unhandled type kind ${type.kind}`);
  }
}
