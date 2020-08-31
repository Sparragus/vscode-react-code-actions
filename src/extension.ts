import * as vscode from "vscode";

import extractToFunction from "./extractToFunction";
import extractToFileInSameFolder from "./extractToFileInSameFolder";
import extractToFileInComponentsFolder from "./extractToFileInComponentsFolder";

import { codeToAst, getJSXIdentifierOnCursor } from "./ast";

function isCodeActionAvailable(editor: vscode.TextEditor): boolean {
  const code = editor.document.getText();
  const cursorPosition = editor.selection.active;

  const ast = codeToAst(code);
  const componentNamePath = getJSXIdentifierOnCursor(ast, cursorPosition);
  return !!componentNamePath;
}

export class CodeActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(): vscode.Command[] {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.selection.isEmpty) {
      return [];
    }

    const codeActions = [];
    if (isCodeActionAvailable(editor)) {
      codeActions.push(
        {
          command: "react-code-actions.extractToFunction",
          title: "Extract to function component in same file",
        },
        {
          command: "react-code-actions.extractToFileInSameFolder",
          title: "Extract to file in the same folder",
        },
        {
          command: "react-code-actions.extractToFileInComponentsFolder",
          title: "Extract to file in the components folder",
        }
      );
    }

    return codeActions;
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { pattern: "**/*.{js,jsx,ts,tsx}", scheme: "file" },
      new CodeActionProvider()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "react-code-actions.extractToFunction",
      extractToFunction
    ),
    vscode.commands.registerCommand(
      "react-code-actions.extractToFileInSameFolder",
      extractToFileInSameFolder
    ),
    vscode.commands.registerCommand(
      "react-code-actions.extractToFileInComponentsFolder",
      extractToFileInComponentsFolder
    )
  );
}

export function deactivate() {}
