import * as vscode from "vscode";
import { Range } from "vscode";
import { Token, TokenKind } from "../lexer";
import { Separator } from "../types/statement";

interface StringPosition {
  /**
   * 文字列
   */
  value: string;
  /**
   * 開始位置
   */
  start: number;
  /**
   * 終了位置
   */
  end: number;
}

/**
 * 区切り文字で分割し、分割した文字列とそれぞれの区切り文字の{文字列,開始位置,終了位置}を取得
 * @param input
 * @param sepalater
 * @returns
 */
export function splitString(
  input: string,
  sepalater: RegExp
): [StringPosition[], StringPosition[]] {
  const tokens: StringPosition[] = [];
  const delimiters: StringPosition[] = [];
  let match;
  let start = 0;
  while ((match = sepalater.exec(input)) !== null) {
    tokens.push({
      value: input.slice(start, match.index),
      start,
      end: match.index,
    });
    delimiters.push({
      value: match[0],
      start: match.index,
      end: sepalater.lastIndex,
    });
    start = sepalater.lastIndex;
  }
  tokens.push({
    value: input.slice(start),
    start,
    end: input.length,
  });
  return [tokens, delimiters];
}

/**
 * RawParameterをParameterに変換する
 * @param rawParameter
 * @param separator
 * @returns
 */
export function tokenizedRawParameter(rawParameter: Token, separator: Separator): Token[] {
  if (rawParameter.kind !== "RawParameter") {
    vscode.window.showErrorMessage('TokenKind must be "RawParameter".');
    throw new Error('TokenKind must be "RawParameter".');
  }
  const parameters: Token[] = [];
  const kind: TokenKind = separator === "Unknown" ? "RawParameter" : "Parameter";
  const regexp = splitToRegExp(separator);
  const [texts, delimiters] = splitString(rawParameter.value, regexp);
  for (const result of texts) {
    const value = result.value;
    const range = new Range(
      rawParameter.range.start.line,
      result.start + rawParameter.range.start.character,
      rawParameter.range.end.line,
      result.end + rawParameter.range.start.character
    );
    const parameter: Token = { kind: kind, value: value, range: range };
    parameters.push(parameter);
  }
  for (const result of delimiters) {
    const value = result.value;
    const range = new Range(
      rawParameter.range.start.line,
      result.start + rawParameter.range.start.character,
      rawParameter.range.end.line,
      result.end + rawParameter.range.start.character
    );
    const parameter: Token = { kind: "Delimiter", value: value, range: range };
    parameters.push(parameter);
  }
  parameters.sort((a, b) => a.range.start.character - b.range.start.character);
  return parameters;
}

/**
 * Separatorから区切り用正規表現に変換
 * @param separator
 * @returns
 */
function splitToRegExp(separator: Separator): RegExp {
  switch (separator) {
    case "Comma":
      return /\s*,\s*/g;
    case "Space":
      return /\s+/g;
    case "None":
    case "Unknown":
      return /(?!)/g;
    default:
      vscode.window.showErrorMessage("No action defined for Separator.");
      throw new ReferenceError("No action defined for Separator.");
  }
}
