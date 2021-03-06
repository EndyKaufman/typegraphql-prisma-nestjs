import { SourceFile, OptionalKind, ExportDeclarationStructure } from "ts-morph";
import path from "path";

import {
  modelsFolderName,
  enumsFolderName,
  inputsFolderName,
  argsFolderName,
  outputsFolderName,
  resolversFolderName,
  crudResolversFolderName,
  relationsResolversFolderName,
} from "./config";
import { GenerateMappingData } from "./types";
import { GenerateCodeOptions } from "./options";

export function generateTypeGraphQLImport(sourceFile: SourceFile) {
  sourceFile.addImportDeclaration({
    moduleSpecifier: "@nestjs/graphql",
    namedImports: [
      "Resolver",
      "ResolveField",
      "Root",
      "Context",
      "Query",
      "Mutation",
      "Args",
      "registerEnumType",
      "ObjectType",
      "Field",
      "Int",
      "Float",
      "ID",
      "InputType",
      "ArgsType",
      "Info",
    ].sort(),
  });
}

export function generateGraphQLFieldsImport(sourceFile: SourceFile) {
  sourceFile.addImportDeclaration({
    moduleSpecifier: "graphql-fields",
    defaultImport: "graphqlFields",
  });
  sourceFile.addImportDeclaration({
    moduleSpecifier: "graphql",
    namedImports: ["GraphQLResolveInfo"],
  });
}

export function generateGraphQLScalarImport(sourceFile: SourceFile) {
  sourceFile.addImportDeclaration({
    moduleSpecifier: "graphql-type-json",
    defaultImport: "GraphQLJSON",
  });
}

export function generatePrismaJsonTypeImport(
  sourceFile: SourceFile,
  options: GenerateCodeOptions,
  level = 0,
) {
  sourceFile.addImportDeclaration({
    moduleSpecifier:
      options.absolutePrismaOutputPath ??
      (level === 0 ? "./" : "") +
        path.posix.join(
          ...Array(level).fill(".."),
          options.relativePrismaOutputPath,
        ),
    namedImports: ["JsonValue", "InputJsonValue"],
  });
}

export function generateArgsBarrelFile(
  sourceFile: SourceFile,
  argsTypeNames: string[],
) {
  sourceFile.addExportDeclarations(
    argsTypeNames
      .sort()
      .map<OptionalKind<ExportDeclarationStructure>>(argTypeName => ({
        moduleSpecifier: `./${argTypeName}`,
        namedExports: [argTypeName],
      })),
  );
}

export function generateModelsBarrelFile(
  sourceFile: SourceFile,
  modelNames: string[],
) {
  sourceFile.addExportDeclarations(
    modelNames
      .sort()
      .map<OptionalKind<ExportDeclarationStructure>>(modelName => ({
        moduleSpecifier: `./${modelName}`,
        namedExports: [modelName],
      })),
  );
}

export function generateEnumsBarrelFile(
  sourceFile: SourceFile,
  enumTypeNames: string[],
) {
  sourceFile.addExportDeclarations(
    enumTypeNames
      .sort()
      .map<OptionalKind<ExportDeclarationStructure>>(enumTypeName => ({
        moduleSpecifier: `./${enumTypeName}`,
        namedExports: [enumTypeName],
      })),
  );
}

export function generateInputsBarrelFile(
  sourceFile: SourceFile,
  inputTypeNames: string[],
) {
  sourceFile.addExportDeclarations(
    inputTypeNames
      .sort()
      .map<OptionalKind<ExportDeclarationStructure>>(inputTypeName => ({
        moduleSpecifier: `./${inputTypeName}`,
        namedExports: [inputTypeName],
      })),
  );
}

export function generateOutputsBarrelFile(
  sourceFile: SourceFile,
  outputTypeNames: string[],
  hasSomeArgs: boolean,
) {
  sourceFile.addExportDeclarations(
    outputTypeNames
      .sort()
      .map<OptionalKind<ExportDeclarationStructure>>(outputTypeName => ({
        moduleSpecifier: `./${outputTypeName}`,
        namedExports: [outputTypeName],
      })),
  );
  if (hasSomeArgs) {
    sourceFile.addExportDeclaration({ moduleSpecifier: `./${argsFolderName}` });
  }
}

export function generateIndexFile(
  sourceFile: SourceFile,
  hasSomeRelations: boolean,
) {
  sourceFile.addExportDeclarations([
    { moduleSpecifier: `./${enumsFolderName}` },
    { moduleSpecifier: `./${modelsFolderName}` },
    { moduleSpecifier: `./${resolversFolderName}/${crudResolversFolderName}` },
    ...(hasSomeRelations
      ? [
          {
            moduleSpecifier: `./${resolversFolderName}/${relationsResolversFolderName}`,
          },
        ]
      : []),
    { moduleSpecifier: `./${resolversFolderName}/${inputsFolderName}` },
    { moduleSpecifier: `./${resolversFolderName}/${outputsFolderName}` },
  ]);
}

export function generateResolversBarrelFile(
  type: "crud" | "relations",
  sourceFile: SourceFile,
  resolversData: GenerateMappingData[],
) {
  resolversData
    .sort((a, b) =>
      a.modelName > b.modelName ? 1 : a.modelName < b.modelName ? -1 : 0,
    )
    .forEach(
      ({
        modelName,
        resolverName,
        actionResolverNames,
        hasSomeArgs: hasArgs,
      }) => {
        sourceFile.addExportDeclaration({
          moduleSpecifier: `./${modelName}/${resolverName}`,
          namedExports: [resolverName],
        });
        if (actionResolverNames) {
          actionResolverNames.forEach(actionResolverName => {
            sourceFile.addExportDeclaration({
              moduleSpecifier: `./${modelName}/${actionResolverName}`,
              namedExports: [actionResolverName],
            });
          });
        }
        if (hasArgs) {
          sourceFile.addExportDeclaration({
            moduleSpecifier: `./${modelName}/args`,
          });
        }
      },
    );

  const providers: string[] = [];
  resolversData
    .sort((a, b) =>
      a.modelName > b.modelName ? 1 : a.modelName < b.modelName ? -1 : 0,
    )
    .forEach(
      ({
        modelName,
        resolverName,
        actionResolverNames,
        hasSomeArgs: hasArgs,
      }) => {
        sourceFile.addImportDeclaration({
          moduleSpecifier: `./${modelName}/${resolverName}`,
          namedImports: [resolverName],
        });
        providers.push(resolverName);
        if (actionResolverNames) {
          actionResolverNames.forEach(actionResolverName => {
            sourceFile.addImportDeclaration({
              moduleSpecifier: `./${modelName}/${actionResolverName}`,
              namedImports: [actionResolverName],
            });
            providers.push(actionResolverName);
          });
        }
      },
    );

  const moduleName =
    type === "crud" ? "CrudResolversModule" : "RelationsResolversModule";

  sourceFile.addImportDeclaration({
    moduleSpecifier: "@nestjs/common",
    namedImports: ["Module"].sort(),
  });
  sourceFile.addClass({
    name: moduleName,
    isExported: true,
    decorators: [
      {
        name: "Module",
        arguments: [
          `{
  providers: [
    ${providers.join(`,\n    `)}
  ],
  exports: [
    ${providers.join(`,\n    `)}
  ]
}`,
        ],
      },
    ],
  });
}

export const generateModelsImports = createImportGenerator(modelsFolderName);
export const generateEnumsImports = createImportGenerator(enumsFolderName);
export const generateInputsImports = createImportGenerator(inputsFolderName);
export const generateOutputsImports = createImportGenerator(outputsFolderName);
export const generateArgsImports = createImportGenerator(argsFolderName);
function createImportGenerator(elementsDirName: string) {
  return (sourceFile: SourceFile, elementsNames: string[], level = 1) => {
    const distinctElementsNames = [...new Set(elementsNames)].sort();
    for (const elementName of distinctElementsNames) {
      sourceFile.addImportDeclaration({
        moduleSpecifier:
          (level === 0 ? "./" : "") +
          path.posix.join(
            ...Array(level).fill(".."),
            elementsDirName,
            elementName,
          ),
        // TODO: refactor to default exports
        // defaultImport: elementName,
        namedImports: [elementName],
      });
    }
  };
}
