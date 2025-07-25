import * as vscode from "vscode";
import { Hover, MarkdownString } from "vscode";
import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { documents } from "../extension";
import { HeaderNode, HeadersNode, NoteNode, ParameterNode, StyleNode } from "../types/node";
import {
  generateCommandSyntax,
  generateHeaderSyntax,
  getSeparatorChar,
  isInComment,
} from "../util/util";
import { getRegExp, StatementParameter } from "../types/statement";
import { IHeader } from "../types/header";
import { ICommand } from "../types/command";
import { isTmg, detectCommandInfo, calculateCommandParameterPosition } from "../util/util";

/**
 * ヘッダーのマウスホバーヒント
 */
export class HeaderHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position, /(?<=^\s*)[A-Z0-9]+:/);
    if (wordRange === undefined || position.isEqual(wordRange.end)) {
      return Promise.reject();
    }
    const currentWord = document.getText(wordRange).slice(0, -1);
    const item = headers.get(currentWord);
    if (item === undefined) {
      return Promise.reject();
    }
    const syntax = generateHeaderSyntax(item.name, item.parameter, item.separator);
    const symbol = new MarkdownString(syntax);
    const documentation = new MarkdownString(item.documentation);
    return new Hover([symbol, documentation], wordRange);
  }
}

/**
 * 命令のマウスホバーヒント
 */
export class CommandHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position, /(?<=^\s*)#[A-Z0-9]+/);
    if (wordRange === undefined || position.isEqual(wordRange.end)) {
      return Promise.reject();
    }
    const currentWord = document.getText(wordRange).slice(1);
    const item = commands.get(currentWord);
    if (item === undefined) {
      return Promise.reject();
    }
    const syntax = generateCommandSyntax(item.name, item.parameter, item.separator);
    const symbol = new MarkdownString(syntax);
    const documentation = new MarkdownString(item.documentation);
    return new Hover([symbol, documentation], wordRange);
  }
}

/**
 * 風船打数の表示（雑実装）
 */
export class BalloonHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position, /([79]0*8?|0*8|0+)/);
    if (wordRange === undefined || position.isEqual(wordRange.end)) {
      return Promise.reject();
    }

    const root = documents.parse(document, token);
    if (root === undefined) {
      return Promise.reject();
    }
    const balloonNote = root.find<NoteNode>(
      (x) =>
        x instanceof NoteNode &&
        x.range.contains(position) &&
        x.properties.note.balloonId !== undefined,
      { return: (x) => x instanceof HeadersNode, token }
    );
    const balloonId = balloonNote?.properties.note.balloonId;
    const style = balloonNote?.findParent((x) => x instanceof StyleNode, { token });
    if (balloonNote === undefined || balloonId === undefined || style === undefined) {
      return Promise.reject();
    }
    const balloonHeader = balloonNote
      .findParent<StyleNode>((x) => x instanceof StyleNode, { token })
      ?.find<HeaderNode>(
        (x) =>
          x instanceof HeaderNode &&
          ((balloonNote.properties.branchState === "None" &&
            getRegExp(headers.items.balloon).test(x.properties.name)) ||
            (balloonNote.properties.branchState === "Normal" &&
              getRegExp(headers.items.balloonnor).test(x.properties.name)) ||
            (balloonNote.properties.branchState === "Expert" &&
              getRegExp(headers.items.balloonexp).test(x.properties.name)) ||
            (balloonNote.properties.branchState === "Master" &&
              getRegExp(headers.items.balloonmas).test(x.properties.name))),
        { token }
      );
    if (balloonHeader === undefined) {
      return Promise.reject();
    }
    // Find parameter by balloonId using the parameter's index property
    const balloonParameter = balloonHeader.find<ParameterNode>(
      (x) => x instanceof ParameterNode && x.properties.index === balloonId,
      { token }
    );
    if (!balloonParameter) {
      return Promise.reject();
    }

    const symbol = new MarkdownString(balloonParameter.value);
    return new Hover([symbol], wordRange);
  }
}

/**
 * ヘッダーパラメーターのマウスホバーヒント
 */
export class HeaderParameterHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover> {
    const line = document.lineAt(position).text;

    // コメント内の場合はホバーを無効化
    if (isInComment(line, position)) {
      return Promise.reject();
    }

    // ヘッダー名を特定するための処理
    let headerName: string | undefined = undefined;
    let headerInfo: IHeader | undefined = undefined;

    // 行全体でヘッダーマッチングを試行
    const fullLineMatch = line.match(/^\s*([A-Z0-9]+):(.*?)\s*$/);
    if (fullLineMatch) {
      const testHeaderName = fullLineMatch[1];
      const testHeaderInfo = headers.get(testHeaderName);

      // コロンの位置を取得
      const colonPosition = line.indexOf(":");
      const isInParameterPart = colonPosition !== -1 && position.character > colonPosition;

      if (testHeaderInfo && isInParameterPart) {
        headerName = testHeaderName;
        headerInfo = testHeaderInfo;
      }
    }

    // 特殊なヘッダー処理（EXAM等の数字付きヘッダー）
    if (!headerInfo) {
      const specialMatch = line.match(/^\s*([A-Z]+)([0-9]+):(.*?)\s*$/);
      if (specialMatch) {
        const baseName = specialMatch[1];
        const number = specialMatch[2];
        const fullHeaderName = baseName + number;
        const testHeaderInfo = headers.get(fullHeaderName);

        const colonPosition = line.indexOf(":");
        const isInParameterPart = colonPosition !== -1 && position.character > colonPosition;

        if (testHeaderInfo && isInParameterPart) {
          headerInfo = testHeaderInfo;
          headerName = fullHeaderName;
        }
      }
    }

    if (!headerInfo || !headerName) {
      return Promise.reject();
    }

    // 現在のパラメーター位置を計算
    const parameterInfo = this.calculateParameterPosition(line, position, headerInfo);
    if (!parameterInfo) {
      return Promise.reject();
    }

    const { currentParam, parameterValue } = parameterInfo;

    // ホバー情報を構築
    const hoverContent = this.buildHoverContent(currentParam, headerName);

    // パラメーター範囲を計算
    const parameterRange = this.calculateParameterRange(document, position, line, headerInfo);

    return new Hover(hoverContent, parameterRange);
  }

  /**
   * 現在のパラメーター位置とその情報を計算
   */
  private calculateParameterPosition(
    line: string,
    position: vscode.Position,
    headerInfo: IHeader
  ): { currentParam: StatementParameter; parameterValue: string } | null {
    const separatorChar = getSeparatorChar(headerInfo.separator);
    const colonPosition = line.indexOf(":");
    const afterColon = line.substring(colonPosition + 1);

    let currentParamIndex = 0;
    let parameterStart = 0;
    let parameterEnd = afterColon.length;

    if (separatorChar === "") {
      // 区切り文字が存在しない場合は常に最初のパラメータ
      currentParamIndex = 0;
      parameterStart = 0;
      parameterEnd = afterColon.length;
    } else {
      const separatorRegex = new RegExp(separatorChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const positionInParams = position.character - colonPosition - 1;

      let match;
      let lastEnd = 0;
      let paramIndex = 0;

      while ((match = separatorRegex.exec(afterColon)) !== null) {
        if (positionInParams >= lastEnd && positionInParams < match.index) {
          currentParamIndex = paramIndex;
          parameterStart = lastEnd;
          parameterEnd = match.index;
          break;
        }
        lastEnd = match.index + match[0].length;
        paramIndex++;
      }

      // 最後のパラメーターの場合
      if (positionInParams >= lastEnd) {
        currentParamIndex = paramIndex;
        parameterStart = lastEnd;
        parameterEnd = afterColon.length;
      }
    }

    // パラメータ数を超えた場合
    if (currentParamIndex >= headerInfo.parameter.length) {
      return null;
    }

    const currentParam = headerInfo.parameter[currentParamIndex];
    const parameterValue = afterColon.substring(parameterStart, parameterEnd).trim();

    return { currentParam, parameterValue };
  }

  /**
   * ホバー内容を構築
   */
  private buildHoverContent(parameter: StatementParameter, headerName: string): MarkdownString[] {
    const contents: MarkdownString[] = [];

    // パラメーター名とタイプ
    const parameterTitle = new MarkdownString();
    const param = parameter.isOptional ? `{${parameter.name}}` : `<${parameter.name}>`;
    parameterTitle.appendCodeblock(`${headerName}:${param}`);
    contents.push(parameterTitle);

    // パラメーターの説明
    if (parameter.description) {
      const description = new MarkdownString(parameter.description);
      contents.push(description);
    }

    // 選択肢がある場合は表示
    if (Array.isArray(parameter.snippet) && parameter.snippet.length > 0) {
      const options = new MarkdownString();
      options.appendMarkdown("**利用可能な値:**\n\n");
      parameter.snippet.forEach((option) => {
        options.appendMarkdown(`- \`${option.value}\`: ${option.detail}\n`);
      });
      contents.push(options);
    }

    return contents;
  }

  /**
   * パラメーター範囲を計算
   */
  private calculateParameterRange(
    document: vscode.TextDocument,
    position: vscode.Position,
    line: string,
    headerInfo: IHeader
  ): vscode.Range | undefined {
    const separatorChar = getSeparatorChar(headerInfo.separator);
    const colonPosition = line.indexOf(":");
    const afterColon = line.substring(colonPosition + 1);
    const positionInParams = position.character - colonPosition - 1;

    if (separatorChar === "") {
      // 区切り文字がない場合は全体
      let start = colonPosition + 1;
      while (start < line.length && line[start] === " ") {
        start++;
      }
      return new vscode.Range(
        position.line,
        Math.max(start, colonPosition + 1),
        position.line,
        line.length
      );
    }

    const separatorRegex = new RegExp(separatorChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    let match;
    let lastEnd = 0;

    while ((match = separatorRegex.exec(afterColon)) !== null) {
      if (positionInParams >= lastEnd && positionInParams < match.index) {
        const startPos = colonPosition + 1 + lastEnd;
        const endPos = colonPosition + 1 + match.index;
        return new vscode.Range(position.line, startPos, position.line, endPos);
      }
      lastEnd = match.index + match[0].length;
    }

    // 最後のパラメーターの場合
    if (positionInParams >= lastEnd) {
      const startPos = colonPosition + 1 + lastEnd;
      return new vscode.Range(position.line, startPos, position.line, line.length);
    }

    return undefined;
  }
}

/**
 * コマンドパラメーターのマウスホバーヒント
 */
export class CommandParameterHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover> {
    const line = document.lineAt(position).text;

    // コメント内の場合はホバーを無効化
    if (isInComment(line, position)) {
      return Promise.reject();
    }

    const _isTmg = isTmg(document);

    // コマンド情報を検出
    const commandDetection = detectCommandInfo(line, position, _isTmg);
    if (!commandDetection || !commandDetection.isInParameterArea) {
      return Promise.reject();
    }

    const { commandName, commandInfo } = commandDetection;

    // 現在のパラメーター位置を計算
    const parameterInfo = calculateCommandParameterPosition(line, position, commandInfo, _isTmg);
    if (!parameterInfo) {
      return Promise.reject();
    }

    const { currentParam, parameterValue, parameterIndex } = parameterInfo;

    // ホバー情報を構築
    const hoverContent = this.buildHoverContent(currentParam, commandName);

    // パラメーター範囲を計算
    const parameterRange = this.calculateParameterRange(
      document,
      position,
      line,
      commandInfo,
      _isTmg,
      parameterIndex
    );

    return new Hover(hoverContent, parameterRange);
  }

  /**
   * ホバー内容を構築
   */
  private buildHoverContent(parameter: StatementParameter, commandName: string): MarkdownString[] {
    const contents: MarkdownString[] = [];

    // パラメーター名とタイプ
    const parameterTitle = new MarkdownString();
    const param = parameter.isOptional ? `{${parameter.name}}` : `<${parameter.name}>`;
    parameterTitle.appendCodeblock(`#${commandName} ${param}`);
    contents.push(parameterTitle);

    // パラメーターの説明
    if (parameter.description) {
      const description = new MarkdownString(parameter.description);
      contents.push(description);
    }

    // 選択肢がある場合は表示
    if (Array.isArray(parameter.snippet) && parameter.snippet.length > 0) {
      const options = new MarkdownString();
      options.appendMarkdown("**利用可能な値:**\n\n");
      parameter.snippet.forEach((option) => {
        options.appendMarkdown(`- \`${option.value}\`: ${option.detail}\n`);
      });
      contents.push(options);
    }

    return contents;
  }

  /**
   * パラメーター範囲を計算
   */
  private calculateParameterRange(
    document: vscode.TextDocument,
    position: vscode.Position,
    line: string,
    commandInfo: ICommand,
    isTmgFormat: boolean,
    parameterIndex: number
  ): vscode.Range | undefined {
    const separatorChar = getSeparatorChar(commandInfo.separator);

    if (isTmgFormat) {
      // TMG形式の範囲計算
      const openParenPos = line.indexOf("(");
      if (openParenPos === -1) {
        return undefined;
      }

      // 全パラメータ部分を取得
      const allParams = line.substring(openParenPos + 1);
      const closingParenPos = allParams.indexOf(")");
      const paramsPart =
        closingParenPos === -1 ? allParams : allParams.substring(0, closingParenPos);
      const params = paramsPart.split(",");

      if (parameterIndex < params.length) {
        let startPos = openParenPos + 1;
        for (let i = 0; i < parameterIndex; i++) {
          startPos += params[i].length + 1; // +1 for comma
        }
        const endPos = startPos + params[parameterIndex].length;
        return new vscode.Range(position.line, startPos, position.line, endPos);
      }
    } else {
      // 通常形式の範囲計算
      const sharpPos = line.indexOf("#");
      const commandEndPos = sharpPos + 1 + commandInfo.name.length;
      const parameterPart = line.substring(commandEndPos);

      if (
        separatorChar === "" ||
        separatorChar === "None" ||
        commandInfo.separator === "None" ||
        commandInfo.separator === "Space"
      ) {
        // スペース区切りの場合
        const trimmedPart = parameterPart.trim();
        const params = trimmedPart.split(/\s+/).filter((p) => p.length > 0);

        if (parameterIndex < params.length) {
          // パラメータの開始位置を計算
          let paramStart = commandEndPos;
          while (paramStart < line.length && line[paramStart] === " ") {
            paramStart++;
          }

          for (let i = 0; i < parameterIndex; i++) {
            paramStart += params[i].length;
            while (paramStart < line.length && line[paramStart] === " ") {
              paramStart++;
            }
          }

          const paramEnd = paramStart + params[parameterIndex].length;
          return new vscode.Range(position.line, paramStart, position.line, paramEnd);
        }
      } else {
        // カンマ区切りなどの場合
        const separatorRegex = new RegExp(
          separatorChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g"
        );
        const trimmedPart = parameterPart.trim();
        const params = trimmedPart.split(separatorRegex);

        if (parameterIndex < params.length) {
          let paramStart = commandEndPos;
          while (paramStart < line.length && line[paramStart] === " ") {
            paramStart++;
          }

          // 指定されたパラメーターまでの位置を計算
          for (let i = 0; i < parameterIndex; i++) {
            paramStart += params[i].length;
            if (i < params.length - 1) {
              paramStart += separatorChar.length;
            }
          }

          const paramEnd = paramStart + params[parameterIndex].length;
          return new vscode.Range(position.line, paramStart, position.line, paramEnd);
        }
      }
    }

    return undefined;
  }
}
