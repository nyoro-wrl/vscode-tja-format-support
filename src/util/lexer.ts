import { Range } from "vscode";
import { Token, TokenKind } from "../types/lexer";
import { Separator } from "../types/statement";
import { splitToRegExp } from "./statement";
import { splitStringWithRegexDelimiter } from "./string";

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
  const [texts, delimiters] = splitStringWithRegexDelimiter(rawParameter.value, regexp);
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
      result.start,
      rawParameter.range.end.line,
      result.end
    );
    const parameter: Token = { kind: "Delimiter", value: value, range: range };
    parameters.push(parameter);
  }
  return parameters;
}
