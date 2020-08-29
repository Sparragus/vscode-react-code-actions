import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as t from "@babel/types";

import { codeToAst, getJSXIdentifierOnCursor } from "./ast";
import traverse, { NodePath } from "@babel/traverse";

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

function createFileFunctionComponent(componentName: string): string {
  return `import * as React from 'react';

export default function ${componentName}({ className }) {
  return (
    <div className={className}>
      ${componentName}
    </div>
  );
}`;
}

export default async function extractToFileInSameFolder() {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  try {
    const code = editor.document.getText();
    const position = editor.selection.active;

    const ast = codeToAst(code);
    const componentNamePath = <NodePath<t.JSXIdentifier>>(
      getJSXIdentifierOnCursor(ast, position)
    );

    const componentName = componentNamePath.node.name;

    const componentFilePath = path.resolve(
      path.dirname(editor.document.fileName),
      `${componentName}.js`
    );

    fs.writeFileSync(
      componentFilePath,
      createFileFunctionComponent(componentName)
    );

    const insertImportAt = getInsertImportAt(ast);

    editor.edit((edit) => {
      edit.insert(
        insertImportAt,
        `import ${componentName} from './${componentName}.js';` + "\n"
      );
    });
  } catch (error) {
    vscode.window.showErrorMessage(error);
  }
}
