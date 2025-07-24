import * as vscode from "vscode";
import { headers } from "../constants/headers";
import { getSeparatorChar, isInComment } from "../util/util";
import {
  MarkdownString,
  ParameterInformation,
  SignatureHelp,
  SignatureHelpProvider,
  SignatureInformation,
} from "vscode";
import { IHeader } from "../types/header";

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
}
