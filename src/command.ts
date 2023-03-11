import * as vscode from "vscode";
import { Selection } from "vscode";
import { documents } from "./documents";
import { ChartNode, MeasureNode } from "./types/node";

export const jumpMeasure = vscode.commands.registerTextEditorCommand(
  "tja.jumpMeasure",
  async (textEditor, edit) => {
    // 現在のカーソル位置が譜面内か検証する
    const position = textEditor.selection.active;
    const root = documents.get(textEditor.document).parse();
    const chartNode = root.findLast(
      (x) => x instanceof ChartNode && x.range !== undefined && x.range.contains(position)
    ) as ChartNode | undefined;

    if (chartNode === undefined) {
      vscode.window.showErrorMessage("譜面外です");
      return;
    }

    const maxMeasure = chartNode.properties.measure;

    const input = await vscode.window.showInputBox({
      prompt: "移動先の小節番号を入力してください",
      placeHolder: `1 ~ ${maxMeasure}`,
      validateInput: (text) => {
        if (!text) {
          return;
        }
        if (Number.isNaN(Number(text))) {
          return "数値を入力してください";
        }
        const number = Number(text);
        if (!Number.isInteger(number)) {
          return "整数を入力してください";
        } else if (!(number >= 1 && number <= maxMeasure)) {
          return "範囲外です";
        }
      },
    });
    if (input === undefined) {
      return;
    }

    const measure = Number(input);
    const jump = chartNode.find(
      (x) => x instanceof MeasureNode && x.properties.measure === measure
    );
    if (jump?.range !== undefined) {
      textEditor.selection = new Selection(jump.range.start, jump.range.end);
      textEditor.revealRange(jump.range, vscode.TextEditorRevealType.InCenter);
    }
    // ステータスバーから呼ばれるため、フォーカスをドキュメントに戻す
    vscode.window.showTextDocument(textEditor.document);
  }
);
