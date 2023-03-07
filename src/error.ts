import * as vscode from "vscode";
import { Range, Diagnostic, DiagnosticSeverity } from "vscode";

const collection = vscode.languages.createDiagnosticCollection("tja");
let diagnosticCollection: Diagnostic[] = [];

/**
 * 構文エラーを報告する（雑実装）
 * @param range
 * @param message
 * @param severity
 * @returns
 */
export function addSyntaxError(
  range: Range,
  message: string,
  severity: DiagnosticSeverity = DiagnosticSeverity.Error
) {
  if (vscode.window.activeTextEditor === undefined) {
    return;
  }
  const diagnostic = new Diagnostic(range, message, severity);
  diagnosticCollection.push(diagnostic);
  collection.set(vscode.window.activeTextEditor.document.uri, diagnosticCollection);
}

/**
 * 構文エラーのクリア（雑実装）
 * @returns
 */
export function clearDiagnostics() {
  diagnosticCollection = [];
  if (vscode.window.activeTextEditor === undefined) {
    return;
  }
  collection.set(vscode.window.activeTextEditor.document.uri, diagnosticCollection);
}
