import { Range } from "vscode";
import { Token, TokenKind } from "../types/lexer";
import { Separator } from "../types/statement";
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
  const [texts, delimiters] = splitWithPositions(regexp, rawParameter.value);
  for (const result of texts) {
    const value = result.value;
    const range = new Range(
      rawParameter.range.start.line,
      rawParameter.range.start.character + result.start,
      rawParameter.range.end.line,
      rawParameter.range.start.character + result.end
    );
    const parameter: Token = { kind: kind, value: value, range: range };
    parameters.push(parameter);
  }
  for (const result of delimiters) {
    const value = result.value;
    const range = new Range(
      rawParameter.range.start.line,
      rawParameter.range.start.character + result.start,
      rawParameter.range.end.line,
      rawParameter.range.start.character + result.end
    );
    const parameter: Token = { kind: "Delimiter", value: value, range: range };
    parameters.push(parameter);
  }
  return parameters;
}
