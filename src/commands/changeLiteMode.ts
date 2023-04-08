import * as vscode from "vscode";
import { Configs } from "../configs";

export const changeLiteModeCommand: vscode.Command = {
  command: "tja.changeLiteMode",
  title: "軽量モード切り替え",
  tooltip: "軽量モード切り替え",
};

export async function changeLiteMode(value: boolean | undefined): Promise<void> {
  if (value === undefined) {
    const normalText = "通常モード";
    const liteText = "軽量モード";
    const input = await vscode.window.showQuickPick([normalText, liteText]);
    if (input === normalText) {
      value = false;
    } else if (input === liteText) {
      value = true;
    } else {
      return;
    }
  }
  new Configs().liteMode.update(value);
}
