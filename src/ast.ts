import * as vscode from "vscode";
import traverse, { NodePath } from "@babel/traverse";
import * as parser from "@babel/parser";
import * as t from "@babel/types";

export function codeToAst(code: string) {
  return parser.parse(code, {
    startLine: 0,
    plugins: ["objectRestSpread", "classProperties", "typescript", "jsx"],
    sourceType: "module",
  });
}

export function getJSXIdentifierOnCursor(
  ast: t.File,
  position: vscode.Position
): NodePath<t.JSXIdentifier> | void {
  let match;

  traverse(ast, {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    JSXIdentifier(path) {
      if (!path.node.loc) {
        return;
      }

      const isCapitalized =
        path.node.name[0] === path.node.name[0].toUpperCase();
      const isOnLine = path.node.loc.start.line === position.line;
      const isWithinColumns =
        path.node.loc.start.column <= position.character &&
        position.character <= path.node.loc.end.column;

      const conditions = [isCapitalized, isOnLine, isWithinColumns];

      if (conditions.every(Boolean)) {
        match = path;
        path.stop();
      }
    },
  });

  return match;
}

export function findParentComponent(path: NodePath): NodePath {
  const parent = path.findParent(
    (path) =>
      path.isClassDeclaration() ||
      path.isVariableDeclarator() ||
      path.isFunctionDeclaration()
  );

  if (!parent) {
    throw new Error("Invalid component.");
  }

  return parent;
}
