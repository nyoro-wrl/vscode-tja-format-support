import * as vscode from "vscode";
import { Configs } from "../configs";
import { t } from "../i18n";

export const changeLiteModeCommand: vscode.Command = {
  command: "tja.changeLiteMode",
  title: "軽量モード切り替え",
  tooltip: "軽量モード切り替え",
};

export async function changeLiteMode(value: boolean | undefined): Promise<void> {
  if (value === undefined) {
    const normalText = t("messages.liteModeNormal");
    const liteText = t("messages.liteModeLite");
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
