import * as vscode from "vscode";
import { Range, Diagnostic, DiagnosticSeverity } from "vscode";

const collection = vscode.languages.createDiagnosticCollection("tja");
const realtimeDiagnostics: Diagnostic[] = [];
const savedDiagnostics: Diagnostic[] = [];

type ErrorTiming = "Realtime" | "Saved";

export function addDiagnostic(
  range: Range,
  message: string,
  timing: ErrorTiming = "Realtime",
  severity: DiagnosticSeverity = DiagnosticSeverity.Error
) {
  if (vscode.window.activeTextEditor === undefined) {
    return;
  }
  const diagnostic = new Diagnostic(range, message, severity);
  if (timing === "Realtime") {
    realtimeDiagnostics.push(diagnostic);
  } else if (timing === "Saved") {
    savedDiagnostics.push(diagnostic);
  }
  collection.set(vscode.window.activeTextEditor.document.uri, realtimeDiagnostics);
  showSavedDiagnostic();
}

export function showSavedDiagnostic() {
  if (vscode.window.activeTextEditor === undefined) {
    return;
  }
  if (!vscode.window.activeTextEditor.document.isDirty) {
    collection.set(vscode.window.activeTextEditor.document.uri, savedDiagnostics);
  }
}

export function clearDiagnostics() {
  if (vscode.window.activeTextEditor === undefined) {
    return;
  }
  realtimeDiagnostics.length = 0;
  savedDiagnostics.length = 0;
  collection.set(vscode.window.activeTextEditor.document.uri, realtimeDiagnostics);
  collection.set(vscode.window.activeTextEditor.document.uri, savedDiagnostics);
}
