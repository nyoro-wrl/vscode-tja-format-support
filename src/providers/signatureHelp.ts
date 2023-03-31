import * as vscode from "vscode";

export class CommandSignatureHelpProvider implements vscode.SignatureHelpProvider {
  async provideSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.SignatureHelpContext
  ): Promise<vscode.SignatureHelp> {
    // TODO 命令のサポート
    const result = new vscode.SignatureHelp();
    return Promise.resolve(result);
  }
}
