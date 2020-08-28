import * as vscode from "vscode";
import * as parser from "@babel/parser";
import * as t from "@babel/types";
import traverse from "@babel/traverse";

function codeToAst(code: string) {
  return parser.parse(code, {
    startLine: 0,
    plugins: ["objectRestSpread", "classProperties", "typescript", "jsx"],
    sourceType: "module",
  });
}

function isCursorOnJSXIdentifier(
  ast: t.File,
  position: vscode.Position
): boolean {
  let match = false;

  traverse(ast, {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    JSXIdentifier(path) {
      if (!path.node.loc) {
        return;
      }

      const isCapitalized =
        path.node.name[0] === path.node.name[0].toUpperCase();
      const isOnLine = path.node.loc.start.line === position.line;
      const isWithinColums =
        path.node.loc.start.column <= position.character &&
        position.character <= path.node.loc.end.column;

      const conditions = [isCapitalized, isOnLine, isWithinColums];

      if (conditions.every(Boolean)) {
        match = true;
        path.stop();
      }
    },
  });

  return match;
}

function isCodeActionAvailable(editor: vscode.TextEditor) {
  const code = editor.document.getText();
  const cursorPosition = editor.selection.active;

  const ast = codeToAst(code);
  return isCursorOnJSXIdentifier(ast, cursorPosition);
}

export class CodeActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(): vscode.Command[] {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.selection.isEmpty) {
      return [];
    }

    const codeActions = [];
    if (isCodeActionAvailable(editor)) {
      codeActions.push({
        command: "react-code-actions.extractToFuntion",
        title: "React: Extract Component to function",
      });
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
    vscode.commands.registerCommand("react-code-actions.extractToFile", () =>
      vscode.window.setStatusBarMessage("hello", 2000)
    )
  );
}

export function deactivate() {}
