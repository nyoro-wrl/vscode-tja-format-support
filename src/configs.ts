import * as vscode from "vscode";

const id = "tjaFormatSupport";

class Property<T> {
  constructor(private readonly id: string, private readonly name: string) {}

  get() {
    return vscode.workspace.getConfiguration(this.id).get<T>(this.name);
  }

  update(value: T, configurationTarget?: boolean | vscode.ConfigurationTarget | undefined) {
    if (configurationTarget === undefined) {
      // 保存ターゲットの自動判定
      if (vscode.workspace.workspaceFolders) {
        const inspect = vscode.workspace.getConfiguration(this.id).inspect<T>(this.name);
        if (inspect === undefined) {
          configurationTarget = vscode.ConfigurationTarget.Global;
        } else if (
          inspect.workspaceFolderValue !== undefined ||
          inspect.workspaceFolderLanguageValue !== undefined
        ) {
          configurationTarget = vscode.ConfigurationTarget.WorkspaceFolder;
        } else if (
          inspect.workspaceValue !== undefined ||
          inspect.workspaceLanguageValue !== undefined
        ) {
          configurationTarget = vscode.ConfigurationTarget.Workspace;
        } else {
          configurationTarget = vscode.ConfigurationTarget.Global;
        }
      } else {
        configurationTarget = vscode.ConfigurationTarget.Global;
      }
    }
    vscode.workspace.getConfiguration(this.id).update(this.name, value, configurationTarget);
  }

  getName() {
    return this.id + "." + this.name;
  }
}

export class Configs {
  getName(): string {
    return id;
  }
  gogotimeHighlight = new Property<boolean>(id, "gogotimeHighlight");
  branchHighlight = new Property<boolean>(id, "branchHighlight");
  liteMode = new Property<boolean>(id, "liteMode");
  language = new Property<string>(id, "language");
}
