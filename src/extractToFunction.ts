import * as vscode from "vscode";
import { NodePath } from "@babel/traverse";
import {
  codeToAst,
  findParentComponent,
  getJSXIdentifierOnCursor,
} from "./ast";
import * as t from "@babel/types";

function createFunctionComponent(componentName: string) {
  return `function ${componentName}({ className }) {
    return (
      <div className={className}>
        ${componentName}
      </div>
    );
  }`;
}

export default async function extractToFunction() {
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
    const componentCode = createFunctionComponent(componentName);

    const parentComponentPath = findParentComponent(
      <NodePath>componentNamePath
    );

    const insertAt = new vscode.Position(
      parentComponentPath.node.loc!.start.line,
      0
    );

    editor.edit((edit) => {
      edit.insert(insertAt, componentCode + "\n\n");
    });

    await vscode.commands.executeCommand("editor.action.formatDocument");
  } catch (error) {
    vscode.window.showErrorMessage(error);
  }
}
