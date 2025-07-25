import * as vscode from "vscode";
import { headers } from "../constants/headers";
import { commands } from "../constants/commands";
import { getSeparatorChar, isInComment, isTmg } from "../util/util";
import {
  MarkdownString,
  ParameterInformation,
  SignatureHelp,
  SignatureHelpProvider,
  SignatureInformation,
} from "vscode";
import { IHeader } from "../types/header";
import { ICommand } from "../types/command";

export class CommandSignatureHelpProvider implements SignatureHelpProvider {
  async provideSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.SignatureHelpContext
  ): Promise<SignatureHelp> {
    const result = new SignatureHelp();

    // 現在行のテキストを取得
    const line = document.lineAt(position).text;

    // コメント内の場合は署名ヘルプを無効化
    if (isInComment(line, position)) {
      return Promise.resolve(result);
    }

    // コマンド処理を先に試行
    const commandResult = this.handleCommandSignature(document, line, position, context);
    if (commandResult) {
      return Promise.resolve(commandResult);
    }

    // ヘッダー名を特定するための事前チェック
    let headerName: string | undefined = undefined;
    let headerInfo: IHeader | undefined = undefined;

    // 通常のヘッダー処理を優先
    const beforeCursor = line.substring(0, position.character);
    const headerMatch = beforeCursor.match(/([A-Z]+[0-9]*):(.*)$/);
    if (headerMatch) {
      headerName = headerMatch[1];
      headerInfo = headers.get(headerName);
    }

    // 特殊なヘッダー処理（EXAM等の数字付きヘッダー）
    // 通常のマッチが失敗した場合のみ実行
    if (!headerInfo) {
      const specialMatch = line.match(/^([A-Z]+)([0-9]+):?(.*)$/);
      if (specialMatch) {
        const baseName = specialMatch[1];
        const number = specialMatch[2];
        const fullHeaderName = baseName + number;
        headerInfo = headers.get(fullHeaderName);
        headerName = fullHeaderName;
      }
    }

    // トリガー文字の検証
    if (context.triggerCharacter && headerInfo && !context.isRetrigger) {
      const expectedSeparator = getSeparatorChar(headerInfo.separator);
      const colonPosition = line.indexOf(":");

      // ヘッダー直後のコロン vs パラメーター部分の判定
      // ヘッダー直後のコロンは colonPosition と position.character が一致する
      const isHeaderColon = colonPosition !== -1 && position.character === colonPosition + 1;
      const isInParameterPart = colonPosition !== -1 && position.character > colonPosition + 1;

      if (context.triggerCharacter === ":") {
        // コロンでトリガーされた場合
        if (isHeaderColon) {
          // ヘッダー名直後のコロンは常に許可
        } else if (isInParameterPart) {
          // パラメーター部分でのコロンは無効
          return Promise.resolve(result);
        } else {
          // その他の位置でのコロンは無効
          return Promise.resolve(result);
        }
      } else {
        // コロン以外の文字でトリガーされた場合
        if (isInParameterPart) {
          // パラメーター部分では、期待される区切り文字のみ許可
          if (expectedSeparator === "" || context.triggerCharacter !== expectedSeparator) {
            return Promise.resolve(result);
          }
        } else {
          // パラメーター部分以外での区切り文字トリガーは無効
          return Promise.resolve(result);
        }
      }
    }

    // 特殊なヘッダー処理（EXAM等の数字付きヘッダー）
    const specialMatch = line.match(/^([A-Z]+)([0-9]+):?(.*)$/);
    if (specialMatch && headerInfo && headerInfo.parameter.length > 1) {
      const baseName = specialMatch[1];
      const number = specialMatch[2];
      const fullHeaderName = baseName + number;

      const colonPosition = line.indexOf(":");
      const isInNumberPart = colonPosition === -1 || position.character <= colonPosition;
      const isInParameterPart = colonPosition !== -1 && position.character > colonPosition;

      if (isInNumberPart && number) {
        // 数字部分での表示 - examNumberパラメータを使用
        const separatorChar = getSeparatorChar(headerInfo.separator);
        const paramNames = headerInfo.parameter.map((x) => `<${x.name}>`).join(separatorChar);
        const signature = new SignatureInformation(`${baseName}<n>:${paramNames}`);

        const numberParameter = new ParameterInformation(
          [4, 7],
          new MarkdownString(this.getNumberParameterDescription(baseName))
        );
        signature.parameters = [numberParameter];

        result.signatures = [signature];
        result.activeSignature = 0;
        result.activeParameter = 0;

        return Promise.resolve(result);
      } else if (isInParameterPart) {
        // パラメータ部分での表示 - headers定義を使用
        const displayName = fullHeaderName;
        const separatorChar = getSeparatorChar(headerInfo.separator);
        const paramNames = headerInfo.parameter.map((x) => `<${x.name}>`).join(separatorChar);

        // 区切り文字の位置から現在のパラメータインデックスを計算
        const beforeCurrentPos = line.substring(0, position.character);
        const afterColon = beforeCurrentPos.substring(colonPosition + 1);
        let currentParamIndex = 0;

        if (separatorChar === "") {
          // 区切り文字が存在しない場合は常に最初のパラメータ
          currentParamIndex = 0;
        } else {
          const separatorRegex = new RegExp(
            separatorChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "g"
          );
          const separatorCount = (afterColon.match(separatorRegex) || []).length;
          // パラメータ数を超えた場合はハイライトを無効にする
          currentParamIndex = separatorCount >= headerInfo.parameter.length ? -1 : separatorCount;
        }

        const signature = new SignatureInformation(`${displayName}:${paramNames}`);

        // headers定義からパラメータ情報を作成
        const parameters = headerInfo.parameter.map(
          (x) => new ParameterInformation(`<${x.name}>`, new MarkdownString(x.description))
        );

        signature.parameters = parameters;

        result.signatures = [signature];
        result.activeSignature = 0;
        result.activeParameter = currentParamIndex;

        return Promise.resolve(result);
      }
    }

    // 通常のヘッダー処理
    if (headerMatch && headerInfo) {
      // 通常のヘッダー
      const displayName = headerMatch[1];
      const separatorChar = getSeparatorChar(headerInfo.separator);
      const paramNames = headerInfo.parameter.map((x) => `<${x.name}>`).join(separatorChar);
      const signature = new SignatureInformation(`${displayName}:${paramNames}`);

      // パラメータ情報を作成
      const parameters = headerInfo.parameter.map(
        (x) => new ParameterInformation(`<${x.name}>`, new MarkdownString(x.description))
      );
      signature.parameters = parameters;

      // パラメータインデックスを計算
      const parameterValue = headerMatch[2];
      let currentParamIndex = 0;

      if (separatorChar === "") {
        // 区切り文字が存在しない場合は常に最初のパラメータ
        currentParamIndex = 0;
      } else {
        const separatorRegex = new RegExp(
          separatorChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g"
        );
        const separatorCount = (parameterValue.match(separatorRegex) || []).length;
        // パラメータ数を超えた場合はハイライトを無効にする
        currentParamIndex = separatorCount >= headerInfo.parameter.length ? -1 : separatorCount;
      }

      if (parameters.length > 0) {
        result.signatures = [signature];
      }
      result.activeSignature = 0;
      result.activeParameter = currentParamIndex;
    }

    return Promise.resolve(result);
  }

  private getNumberParameterDescription(baseName: string): string {
    // ヘッダー名に応じた数字パラメータの説明を返す
    switch (baseName) {
      case headers.items.exam.name:
        return "1以上の整数を指定します。ヘッダを呼ぶごとに数を増やします。";
      default:
        return "数字を指定します。";
    }
  }

  /**
   * コマンドのシグネチャヘルプを処理
   */
  private handleCommandSignature(
    document: vscode.TextDocument,
    line: string,
    position: vscode.Position,
    context: vscode.SignatureHelpContext
  ): SignatureHelp | null {
    const _isTmg = isTmg(document);

    // コマンドのマッチングパターン（通常形式とTMG形式）
    let commandMatch: RegExpMatchArray | null = null;
    let commandName: string | undefined = undefined;
    let commandInfo: ICommand | undefined = undefined;

    if (_isTmg) {
      // TMG形式: #COMMAND(param1,param2)
      const beforeCursor = line.substring(0, position.character);
      commandMatch = beforeCursor.match(/^(\s*)#([A-Z0-9]+)\s*\(([^)]*)$/);
      if (commandMatch) {
        commandName = commandMatch[2];
        commandInfo = commands.get(commandName);
      }
    } else {
      // 通常形式: #COMMAND param1 param2 (カーソル位置まで)
      const beforeCursor = line.substring(0, position.character);
      commandMatch = beforeCursor.match(/^(\s*)#([A-Z0-9]+)(\s+(.*))?$/);
      if (commandMatch) {
        commandName = commandMatch[2];
        commandInfo = commands.get(commandName);
      }
    }

    if (!commandInfo || !commandName || !commandMatch) {
      return null;
    }

    // パラメータが存在しない場合は署名ヘルプを表示しない
    if (commandInfo.parameter.length === 0) {
      return null;
    }

    // トリガー文字の検証
    if (context.triggerCharacter && !context.isRetrigger) {
      const isValidTrigger = this.validateCommandTrigger(
        line, 
        position, 
        context.triggerCharacter, 
        commandInfo, 
        commandName, 
        _isTmg
      );
      if (!isValidTrigger) {
        return null;
      }
    }

    const separatorChar = getSeparatorChar(commandInfo.separator);

    if (_isTmg) {
      // TMG形式の処理
      return this.handleTmgCommandSignature(line, position, commandInfo, commandName, commandMatch, separatorChar);
    } else {
      // 通常形式の処理
      return this.handleNormalCommandSignature(line, position, commandInfo, commandName, commandMatch, separatorChar);
    }
  }

  /**
   * コマンドのトリガー文字を検証
   */
  private validateCommandTrigger(
    line: string,
    position: vscode.Position,
    triggerChar: string,
    commandInfo: ICommand,
    commandName: string,
    isTmg: boolean
  ): boolean {
    const separatorChar = getSeparatorChar(commandInfo.separator);
    const sharpPos = line.indexOf("#");
    const commandEndPos = sharpPos + 1 + commandName.length;

    if (isTmg) {
      // TMG形式の場合
      const openParenPos = line.indexOf("(");
      if (openParenPos === -1) {
        return false;
      }

      if (triggerChar === "(") {
        // 開き括弧でトリガーされた場合、コマンド名直後であることを確認
        return position.character === openParenPos + 1;
      } else if (triggerChar === ",") {
        // カンマでトリガーされた場合、括弧内であることを確認
        return position.character > openParenPos;
      }
    } else {
      // 通常形式の場合
      if (triggerChar === " ") {
        if (separatorChar === " ") {
          // スペース区切りのコマンドの場合、パラメータ部分でのスペースも許可
          // スペースをスキップしてパラメータ開始位置を取得
          let parameterStartPos = commandEndPos;
          while (parameterStartPos < line.length && line[parameterStartPos] === " ") {
            parameterStartPos++;
          }
          return position.character >= commandEndPos + 1; // コマンド名直後以降のスペース
        } else {
          // スペース区切りでない場合、コマンド名直後のスペースのみ許可
          return position.character === commandEndPos + 1;
        }
      } else if (separatorChar && separatorChar !== "" && separatorChar !== " " && triggerChar === separatorChar) {
        // スペース以外の区切り文字でトリガーされた場合、パラメータ部分であることを確認
        // スペースをスキップしてパラメータ開始位置を取得
        let parameterStartPos = commandEndPos;
        while (parameterStartPos < line.length && line[parameterStartPos] === " ") {
          parameterStartPos++;
        }
        return position.character > parameterStartPos;
      }
    }

    return false;
  }

  /**
   * 通常形式のコマンドシグネチャヘルプを処理
   */
  private handleNormalCommandSignature(
    line: string,
    position: vscode.Position,
    commandInfo: ICommand,
    commandName: string,
    commandMatch: RegExpMatchArray,
    separatorChar: string
  ): SignatureHelp | null {
    const result = new SignatureHelp();

    // コマンド名の開始位置と終了位置を計算
    const sharpPos = line.indexOf("#");
    const commandStartPos = sharpPos + 1;
    const commandEndPos = commandStartPos + commandName.length;

    // パラメータ部分を取得
    const parameterPart = commandMatch[4] || "";
    
    // スペースを飛ばしてパラメータ開始位置を取得
    let parameterStartPos = commandEndPos;
    while (parameterStartPos < line.length && line[parameterStartPos] === " ") {
      parameterStartPos++;
    }

    // 現在のパラメータインデックスを計算
    let currentParamIndex = 0;
    const beforeCurrentPos = line.substring(0, position.character);
    const parameterBeforePos = beforeCurrentPos.substring(parameterStartPos);

    if (separatorChar === "" || separatorChar === "None") {
      // 区切り文字が存在しない場合（スペース区切り）
      // スペースで分割してパラメータ数を数える
      const params = parameterBeforePos.trim().split(/\s+/).filter(p => p.length > 0);
      currentParamIndex = params.length > 0 ? params.length - 1 : 0;
      if (currentParamIndex >= commandInfo.parameter.length) {
        currentParamIndex = -1;
      }
    } else {
      // カンマ区切りなど特定の区切り文字がある場合
      const separatorRegex = new RegExp(separatorChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const separatorCount = (parameterBeforePos.match(separatorRegex) || []).length;
      currentParamIndex = separatorCount >= commandInfo.parameter.length ? -1 : separatorCount;
    }

    // シグネチャを作成
    let paramNames: string;
    if (separatorChar === "" || separatorChar === "None") {
      paramNames = commandInfo.parameter.map((x) => `<${x.name}>`).join(" ");
    } else {
      paramNames = commandInfo.parameter.map((x) => `<${x.name}>`).join(separatorChar);
    }
    const signature = new SignatureInformation(`#${commandName} ${paramNames}`);

    // パラメータ情報を作成
    const parameters = commandInfo.parameter.map(
      (x) => new ParameterInformation(`<${x.name}>`, new MarkdownString(x.description))
    );
    signature.parameters = parameters;

    result.signatures = [signature];
    result.activeSignature = 0;
    result.activeParameter = currentParamIndex;

    return result;
  }

  /**
   * TMG形式のコマンドシグネチャヘルプを処理
   */
  private handleTmgCommandSignature(
    line: string,
    position: vscode.Position,
    commandInfo: ICommand,
    commandName: string,
    commandMatch: RegExpMatchArray,
    separatorChar: string
  ): SignatureHelp | null {
    const result = new SignatureHelp();

    // 括弧内にカーソルがあるかチェック
    const openParenPos = line.indexOf("(");
    const closeParenPos = line.lastIndexOf(")");
    
    if (openParenPos === -1 || position.character <= openParenPos) {
      return null;
    }

    // 括弧内のパラメータ部分を取得
    const parameterPart = commandMatch[3] || "";
    
    // 現在のパラメータインデックスを計算
    let currentParamIndex = 0;
    const beforeCurrentPos = line.substring(0, position.character);
    const afterOpenParen = beforeCurrentPos.substring(openParenPos + 1);

    // TMG形式ではカンマ区切り
    const commaCount = (afterOpenParen.match(/,/g) || []).length;
    currentParamIndex = commaCount >= commandInfo.parameter.length ? -1 : commaCount;

    // シグネチャを作成
    const paramNames = commandInfo.parameter.map((x) => `<${x.name}>`).join(",");
    const signature = new SignatureInformation(`#${commandName}(${paramNames})`);

    // パラメータ情報を作成
    const parameters = commandInfo.parameter.map(
      (x) => new ParameterInformation(`<${x.name}>`, new MarkdownString(x.description))
    );
    signature.parameters = parameters;

    result.signatures = [signature];
    result.activeSignature = 0;
    result.activeParameter = currentParamIndex;

    return result;
  }
}
