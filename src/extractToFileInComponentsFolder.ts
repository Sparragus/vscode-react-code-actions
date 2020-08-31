import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as t from "@babel/types";
import traverse, { NodePath } from "@babel/traverse";

import { codeToAst, getJSXIdentifierOnCursor } from "./ast";

function getInsertImportAt(ast: t.File) {
  let position = new vscode.Position(0, 0);

  traverse(ast, {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ImportDeclaration(p) {
      if (!p.node.loc) {
        return;
      }

      position = new vscode.Position(p.node.loc.start.line + 1, 0);
    },
  });

  return position;
}

function createIndexFile(componentName: string): string {
  return `
    import ${componentName} from './${componentName}';
    export default ${componentName};
  `;
}

function createFileFunctionComponent(componentName: string): string {
  return `
    import * as React from 'react';

    export default function ${componentName}({ className }) {
      return (
        <div className={className}>
          ${componentName}
        </div>
      );
    }
  `;
}

function fileOrDirectoryExists(path: string): boolean {
  try {
    fs.accessSync(path);
    return true;
  } catch (error) {
    return false;
  }
}

// TODO: make this recursive. will be way easier.
function findComponentsDirectory(editor: vscode.TextEditor): string {
  let cwd = path.resolve(editor.document.fileName, "..");
  let found = fileOrDirectoryExists(path.resolve(cwd, "components"));

  while (!found) {
    if (fileOrDirectoryExists(path.resolve(cwd, "package.json"))) {
      throw new Error("Couldn't find the components directory");
    }

    cwd = path.resolve(cwd, "..");
    found = fileOrDirectoryExists(path.resolve(cwd, "components"));
  }

  return path.resolve(cwd, "components");
}

export default async function extractToFileInComponentsFolder() {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  try {
    const allComponentsDirectory = findComponentsDirectory(editor);

    const code = editor.document.getText();
    const position = editor.selection.active;

    const ast = codeToAst(code);
    const componentNamePath = <NodePath<t.JSXIdentifier>>(
      getJSXIdentifierOnCursor(ast, position)
    );

    const componentName = componentNamePath.node.name;

    const componentDirectory = path.resolve(
      allComponentsDirectory,
      componentName
    );
    fs.mkdirSync(componentDirectory);

    const indexFile = path.resolve(componentDirectory, "index.js");
    fs.writeFileSync(indexFile, createIndexFile(componentName));

    const componentFile = path.resolve(
      componentDirectory,
      `${componentName}.js`
    );
    fs.writeFileSync(componentFile, createFileFunctionComponent(componentName));

    const relativePath = path.relative(
      editor.document.fileName,
      componentDirectory
    );

    const insertImportAt = getInsertImportAt(ast);

    editor.edit((edit) => {
      edit.insert(
        insertImportAt,
        `import ${componentName} from '${relativePath}';` + "\n"
      );
    });
  } catch (error) {
    vscode.window.showErrorMessage(error);
  }
}
