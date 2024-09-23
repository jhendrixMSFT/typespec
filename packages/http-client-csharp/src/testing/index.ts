import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const HttpClientCSharpEmitterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "http-client-csharp",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../"),
});
