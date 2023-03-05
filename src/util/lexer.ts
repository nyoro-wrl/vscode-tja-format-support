import { Range } from "vscode";
import { Token, TokenKind } from "../type/lexer";
import { Separator } from "../type/statement";
import { splitToRegExp } from "./statement";
import { splitWithPositions } from "./string";

/**
 * RawParameterをParameterに変換する
 * @param rawParameter
 * @param separator
 * @returns
 */
export function tokenizedRawParameter(rawParameter: Token, separator: Separator): Token[] {
  if (rawParameter.kind !== "RawParameter") {
    throw new Error('TokenKind must be "RawParameter".');
  }
  const parameters: Token[] = [];
  const kind: TokenKind = separator === "Unknown" ? "RawParameter" : "Parameter";
  const regexp = splitToRegExp(separator);
  const results = splitWithPositions(rawParameter.value, regexp);
  for (const result of results) {
    const value = result.text;
    const range = new Range(
      rawParameter.range.start.line,
      rawParameter.range.start.character + result.start,
      rawParameter.range.end.line,
      rawParameter.range.start.character + result.end
    );
    const parameter: Token = { kind: kind, value: value, range: range };
    parameters.push(parameter);
  }
  return parameters;
}
