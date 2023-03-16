import * as vscode from "vscode";
import { RenameProvider, WorkspaceEdit } from "vscode";
import { documents } from "../extension";
import { HeaderNode, NoteNode, ParameterNode, StyleNode } from "../types/node";

// TODO RenameProviderで風船音符の打数を書き換えられるようにする

export class BalloonRenameProvider implements RenameProvider {
  provideRenameEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<WorkspaceEdit> {
    // 打数の場所を取得する
    const wordRange = document.getWordRangeAtPosition(position, /([79]0*8?|0*8|0+)/);
    if (wordRange === undefined || position.isEqual(wordRange.end)) {
      return;
    }
    const root = documents.parse(document);
    const balloonNote = root.find<NoteNode>(
      (x) =>
        x instanceof NoteNode &&
        x.range.contains(position) &&
        x.properties.balloonInfo !== undefined
    );
    const balloonInfo = balloonNote?.properties.balloonInfo;
    const style = balloonNote?.findParent((x) => x instanceof StyleNode);
    if (balloonNote === undefined || balloonInfo === undefined || style === undefined) {
      return;
    }
    const balloonHeader = balloonNote
      .findParent<StyleNode>((x) => x instanceof StyleNode)
      ?.find<HeaderNode>(
        (x) => x instanceof HeaderNode && x.properties.name === balloonInfo.headerName
      );
    if (balloonHeader === undefined) {
      return;
    }
    const balloonParameters = balloonHeader.filter<ParameterNode>(
      (x) => x instanceof ParameterNode
    );
    if (balloonParameters.length <= balloonInfo.id) {
      return;
    }
    const balloonParameter = balloonParameters[balloonInfo.id];

    const workspaceEdit = new WorkspaceEdit();
    workspaceEdit.insert(document.uri, balloonParameter.range.start, newName);
    // workspaceEdit.replace(document.uri, balloonParameter.range, newName);
    return workspaceEdit;
  }
}
