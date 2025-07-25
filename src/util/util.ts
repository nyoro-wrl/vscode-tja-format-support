import { Position, TextDocument, MarkdownString, CancellationToken } from "vscode";
import { documents } from "../extension";
import {
  ChartStateProperties,
  ChartNode,
  ChartTokenNode,
  ChartStateCommandNode,
  BranchNode,
} from "../types/node";
import { ChartState } from "../types/state";
import { Separator, StatementParameter } from "../types/statement";
import { ICommand } from "../types/command";
import { commands } from "../constants/commands";
import path = require("path");

/**
 * 特定位置の譜面状態を取得
 * @param document
 * @param position
 * @param token
 * @returns
 */
export function getChartState(
  document: TextDocument,
  position: Position,
  token?: CancellationToken
): ChartStateProperties | undefined {
  const root = documents.parse(document, token);
  if (root === undefined) {
    return;
  }
  let chartState: ChartStateProperties = new ChartState();
  const nowNode = root.findDepth((x) => x.range.contains(position), { continue: true, token });
  if (nowNode === undefined) {
    return;
  }
  const isBranchNode = nowNode.findParent((x) => x instanceof BranchNode, { token }) !== undefined;
  const chartNode = root.find<ChartNode>(
    (x) => x instanceof ChartNode && x.range.contains(position),
    { token }
  );
  if (chartNode !== undefined) {
    const beforeChartStateNode = chartNode.findLastRange<
      ChartTokenNode | ChartStateCommandNode | BranchNode
    >(
      (x) =>
        (x instanceof ChartTokenNode ||
          x instanceof ChartStateCommandNode ||
          (!isBranchNode && x instanceof BranchNode)) &&
        (x.range.start.line < position.line ||
          (x.range.start.line === position.line && x.range.start.character < position.character)),
      { continue: true, token }
    );
    if (beforeChartStateNode === undefined) {
      return;
    } else if (beforeChartStateNode instanceof ChartTokenNode) {
      chartState = beforeChartStateNode.properties;
    } else if (beforeChartStateNode instanceof ChartStateCommandNode) {
      chartState = beforeChartStateNode.properties.chartState;
    } else if (beforeChartStateNode instanceof BranchNode) {
      chartState = beforeChartStateNode.properties.endChartState;
    } else {
      return;
    }
  }
  return chartState;
}

/**
 * 指定位置が行頭かどうか（手前の空文字を無視する）
 * @param document
 * @param position
 * @returns
 */
export function isStartOfLineIgnoringWhitespace(
  document: TextDocument,
  position: Position
): boolean {
  // 行が存在するかチェック
  if (position.line >= document.lineCount) {
    return false;
  }

  const line = document.lineAt(position.line);

  // 行頭の空白文字を除いた最初の文字の位置を取得
  const firstNonWhitespaceIndex = line.firstNonWhitespaceCharacterIndex;

  // 現在位置が、空白を除いた行頭以前にあるかチェック
  return position.character <= firstNonWhitespaceIndex;
}

/**
 * 指定位置が行末かどうか（後ろの空文字を無視する）
 * @param document
 * @param position
 * @returns
 */
export function isEndOfLineIgnoringWhitespace(document: TextDocument, position: Position): boolean {
  // 行が存在するかチェック
  if (position.line >= document.lineCount) {
    return false;
  }

  const line = document.lineAt(position.line);

  // 行末の空白文字を除いた文字列の長さを取得
  const trimmedLength = line.text.trimEnd().length;

  // 現在位置が、空白を除いた行末以降にあるかチェック
  return position.character >= trimmedLength;
}

export function isTmg(document: TextDocument | undefined): boolean {
  if (document) {
    return path.extname(document.fileName) === ".tmg";
  } else {
    return false;
  }
}

/**
 * 命令をTMG形式に変換する
 * @param text
 * @returns
 */
export function toTmgCommandText(text: string): string {
  const regex = /(#)?([A-Z0-9]+)(\s+)?(.+)?/;
  const match = text.match(regex);

  if (!match) {
    return text;
  }

  let [, sharp, name, spaces, parameter] = match;

  if (sharp === undefined) {
    sharp = "";
  }

  if (spaces && parameter) {
    return sharp + name + "(" + parameter.replace(/\s+/g, ",") + ")";
  }

  return sharp + name + "()";
}

export function toPercent(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * 最大公約数を計算
 * @param a
 * @param b
 * @returns
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * 最大公約数を計算
 * @param arr
 * @returns
 */
export function gcdArray(arr: number[]): number {
  let currentGcd = arr[0];
  for (let i = 1; i < arr.length; i++) {
    currentGcd = gcd(currentGcd, arr[i]);
  }
  return currentGcd;
}

declare global {
  interface Array<T> {
    /**
     * 重複の削除
     */
    unique(): Array<T>;
    /**
     * 重複を削除して重複した数の順番に並び替える
     * @param order
     */
    uniqueSorted(order?: "asc" | "desc"): Array<T>;
  }
}

Array.prototype.unique = function <T>(): Array<T> {
  return [...new Set(this)];
};

Array.prototype.uniqueSorted = function <T>(order: "asc" | "desc" = "desc"): Array<T> {
  const uniqueElements = this.unique();
  const frequencyMap: Record<string, number> = {};

  // 各要素の出現回数をカウント
  for (const item of this) {
    const key = JSON.stringify(item);
    frequencyMap[key] = (frequencyMap[key] || 0) + 1;
  }

  // 出現回数に応じて並び替え
  return uniqueElements.sort((a, b) => {
    const aCount = frequencyMap[JSON.stringify(a)];
    const bCount = frequencyMap[JSON.stringify(b)];
    if (order === "asc") {
      return aCount - bCount;
    } else {
      return bCount - aCount;
    }
  });
};

/**
 * Separatorタイプから実際の区切り文字を取得
 * @param separator 区切り文字タイプ
 * @returns 実際の区切り文字（文字列）
 */
export function getSeparatorChar(separator: Separator): string {
  switch (separator) {
    case "Comma":
      return ",";
    case "Space":
      return " ";
    case "None":
    case "Unknown":
    default:
      return ""; // 区切り文字が存在しない
  }
}

/**
 * 指定位置がコメント内かどうかを判定
 * @param line 行のテキスト
 * @param position カーソル位置
 * @returns コメント内の場合true
 */
export function isInComment(line: string, position: Position): boolean {
  // コメント開始位置を計算
  const commentStart = line.indexOf("//");
  return commentStart !== -1 && position.character >= commentStart;
}

/**
 * パラメータ定義からsyntax文字列を生成
 * @param name ヘッダー名
 * @param parameters パラメータ定義配列
 * @param separator 区切り文字タイプ
 * @returns Markdown形式のsyntax文字列
 */
export function generateHeaderSyntax(
  name: string,
  parameters: readonly StatementParameter[],
  separator: Separator
): string {
  const separatorChar = getSeparatorChar(separator);
  const paramPart = parameters
    .map((x) => (x.isOptional === true ? `{${x.name}}` : `<${x.name}>`))
    .join(separatorChar);
  return new MarkdownString().appendCodeblock(`${name}:${paramPart}`).value;
}

/**
 * パラメータ定義からsyntax文字列を生成
 * @param name ヘッダー名
 * @param parameters パラメータ定義配列
 * @param separator 区切り文字タイプ
 * @returns Markdown形式のsyntax文字列
 */
export function generateCommandSyntax(
  name: string,
  parameters: readonly StatementParameter[],
  separator: Separator
): string {
  const separatorChar = getSeparatorChar(separator);
  if (parameters.length === 0) {
    return new MarkdownString().appendCodeblock(`#${name}`).value;
  }
  const paramPart = parameters
    .map((x) => (x.isOptional === true ? `{${x.name}}` : `<${x.name}>`))
    .join(separatorChar);
  return new MarkdownString().appendCodeblock(`#${name} ${paramPart}`).value;
}

/**
 * コマンド情報を検出する結果の型
 */
export interface CommandDetectionResult {
  commandName: string;
  commandInfo: ICommand;
  isInParameterArea: boolean;
}

/**
 * 行からコマンド情報を検出する
 * @param line 現在の行テキスト
 * @param position カーソル位置
 * @param isTmg TMG形式かどうか
 * @returns コマンド検出結果、または検出できない場合はundefined
 */
export function detectCommandInfo(
  line: string,
  position: Position,
  isTmg: boolean
): CommandDetectionResult | undefined {
  let commandName: string | undefined = undefined;
  let commandInfo: ICommand | undefined = undefined;
  let isInParameterArea = false;

  if (isTmg) {
    // TMG形式: #COMMAND(param1,param2)
    const beforeCursor = line.substring(0, position.character);
    const commandMatch = beforeCursor.match(/^(\s*)#([A-Z0-9]+)\s*\(([^)]*)$/);
    if (commandMatch) {
      commandName = commandMatch[2];
      commandInfo = commands.get(commandName);
      isInParameterArea = true;
    }
  } else {
    // 通常形式: #COMMAND param1 param2
    const lineMatch = line.match(/^(\s*)#([A-Z0-9]+)(\s.*)?$/);
    if (lineMatch) {
      commandName = lineMatch[2];
      commandInfo = commands.get(commandName);

      // コマンド名の後（パラメータ部分）にカーソルがあるかチェック
      const sharpPos = line.indexOf("#");
      const commandEndPos = sharpPos + 1 + commandName.length;
      isInParameterArea = position.character > commandEndPos;
    }
  }

  if (!commandInfo || !commandName) {
    return undefined;
  }

  return {
    commandName,
    commandInfo,
    isInParameterArea,
  };
}

/**
 * パラメーター位置計算の結果の型
 */
export interface ParameterPositionResult {
  parameterIndex: number;
  parameterValue: string;
  currentParam: StatementParameter;
}

/**
 * コマンドパラメーターの位置を計算する
 * @param line 現在の行テキスト
 * @param position カーソル位置
 * @param commandInfo コマンド情報
 * @param isTmg TMG形式かどうか
 * @returns パラメーター位置結果、または計算できない場合はundefined
 */
export function calculateCommandParameterPosition(
  line: string,
  position: Position,
  commandInfo: ICommand,
  isTmg: boolean
): ParameterPositionResult | undefined {
  const separatorChar = getSeparatorChar(commandInfo.separator);

  if (isTmg) {
    // TMG形式: #COMMAND(param1,param2)
    const openParenPos = line.indexOf("(");
    if (openParenPos === -1 || position.character <= openParenPos) {
      return undefined;
    }

    const beforeCurrentPos = line.substring(0, position.character);
    const afterOpenParen = beforeCurrentPos.substring(openParenPos + 1);

    // TMG形式ではカンマ区切り
    const commaCount = (afterOpenParen.match(/,/g) || []).length;
    const currentParamIndex = commaCount >= commandInfo.parameter.length ? -1 : commaCount;

    if (currentParamIndex === -1 || currentParamIndex >= commandInfo.parameter.length) {
      return undefined;
    }

    // パラメーター値を取得
    const allParams = line.substring(openParenPos + 1);
    const closingParenPos = allParams.indexOf(")");
    const paramsPart = closingParenPos === -1 ? allParams : allParams.substring(0, closingParenPos);
    const params = paramsPart.split(",");
    const parameterValue =
      currentParamIndex < params.length ? params[currentParamIndex].trim() : "";

    return {
      parameterIndex: currentParamIndex,
      parameterValue,
      currentParam: commandInfo.parameter[currentParamIndex],
    };
  } else {
    // 通常形式: #COMMAND param1 param2
    const sharpPos = line.indexOf("#");
    const commandEndPos = sharpPos + 1 + commandInfo.name.length;

    if (position.character <= commandEndPos) {
      return undefined;
    }

    // パラメータ部分の文字列を取得
    const parameterPart = line.substring(commandEndPos, position.character);
    let currentParamIndex = 0;

    if (
      separatorChar === "" ||
      separatorChar === "None" ||
      commandInfo.separator === "None" ||
      commandInfo.separator === "Space"
    ) {
      // スペース区切り（separatorがNoneまたはSpaceの場合）
      const trimmedPart = parameterPart.trim();

      if (trimmedPart === "") {
        currentParamIndex = 0;
      } else {
        const params = trimmedPart.split(/\s+/).filter((p) => p.length > 0);

        if (parameterPart.endsWith(" ")) {
          currentParamIndex = params.length;
        } else {
          currentParamIndex = params.length - 1;
        }
      }
    } else {
      // 他の区切り文字
      const separatorRegex = new RegExp(separatorChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const separatorCount = (parameterPart.match(separatorRegex) || []).length;
      currentParamIndex = separatorCount;
    }

    if (currentParamIndex >= commandInfo.parameter.length) {
      return undefined;
    }

    // パラメーター値を取得
    const allParameterPart = line.substring(commandEndPos).trim();
    let params: string[];
    if (
      separatorChar === "" ||
      separatorChar === "None" ||
      commandInfo.separator === "None" ||
      commandInfo.separator === "Space"
    ) {
      params = allParameterPart.split(/\s+/).filter((p) => p.length > 0);
    } else {
      const separatorRegex = new RegExp(separatorChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      params = allParameterPart.split(separatorRegex);
    }

    const parameterValue =
      currentParamIndex < params.length ? params[currentParamIndex].trim() : "";

    return {
      parameterIndex: currentParamIndex,
      parameterValue,
      currentParam: commandInfo.parameter[currentParamIndex],
    };
  }
}
