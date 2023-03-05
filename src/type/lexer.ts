import * as vscode from "vscode";
import { Range } from "vscode";

const deleteCommentRegExp = /^\s*(.*)\s*\/\/\s*.*\s*$/;
const headerLineRegExp = /^\s*([A-Z0-9]+):(.*)?\s*$/;
const commandLineRegExp = /^\s*#([A-Z0-9]+)( (.*)+)?\s*$/;
const notesRegExp = /^([0-9])/;
const measureEndRegExp = /^(,)/;
const spaceRegExp = /^(\s+)/;
const unknownRegExp = /^([^0-9,\s]+)/;

export type TokenKind =
  | "Header"
  | "Command"
  | "RawParameter"
  | "Parameter"
  | "Notes"
  | "MeasureEnd"
  | "EndOfLine"
  | "Unknown";

export type Token = {
  readonly kind: TokenKind;
  readonly value: string;
  readonly range: Range;
};

/**
 * 字句解析
 */
export class Lexer {
  private readonly document: vscode.TextDocument;
  private range = new Range(0, 0, 0, 0);

  constructor(document: vscode.TextDocument) {
    this.document = document;
  }

  /**
   * 現在の範囲のテキストを取得
   * @returns
   */
  private getText(): string {
    return this.document.getText(this.range);
  }

  /**
   * 正規表現結果から範囲を取得
   * @param matches
   * @param index
   * @returns
   */
  private getRegExpRange(
    matches: RegExpExecArray,
    index: number,
    startCharacterOffset: number = 0,
    endCharacterOffset: number = 0
  ): Range {
    const start = this.range.start.character + matches[0].indexOf(matches[index]);
    const end = start + matches[index].length;
    return new Range(
      this.range.start.line,
      start + startCharacterOffset,
      this.range.end.line,
      end + endCharacterOffset
    );
  }

  /**
   * 正規表現結果をトークンに変換
   * @param type
   * @param matches
   * @param index
   * @returns
   */
  private regExpToToken(
    matches: RegExpExecArray,
    index: number,
    type: TokenKind,
    startCharacterOffset: number = 0,
    endCharacterOffset: number = 0
  ): Token {
    const value = matches[index];
    const range = this.getRegExpRange(matches, index, startCharacterOffset, endCharacterOffset);
    return { kind: type, value: value, range: range };
  }

  /**
   * コメント範囲の削除
   * @returns
   */
  private deleteCommentRange(): void {
    const text = this.getText();
    const matches = deleteCommentRegExp.exec(text);
    if (matches === null) {
      return;
    }
    this.range = this.getRegExpRange(matches, 1);
  }

  /**
   * 行がヘッダーかどうか
   * @returns
   */
  private isHeader(): boolean {
    const text = this.getText();
    return headerLineRegExp.test(text);
  }

  /**
   * ヘッダー行のトークンを取得
   * @returns
   */
  private getHeader(): Token[] {
    const tokens: Token[] = [];
    const text = this.getText();
    const matches = headerLineRegExp.exec(text);
    if (matches === null) {
      return tokens;
    }
    const header = this.regExpToToken(matches, 1, "Header", undefined, 1);
    tokens.push(header);
    if (matches[2] !== undefined) {
      const rawParameter = this.regExpToToken(matches, 2, "RawParameter");
      tokens.push(rawParameter);
    }
    return tokens;
  }

  /**
   * 行が命令かどうか
   * @returns
   */
  private isCommand(): boolean {
    const text = this.getText();
    return commandLineRegExp.test(text);
  }

  /**
   * 命令行からトークンを取得
   * @returns
   */
  private getCommand(): Token[] {
    const tokens: Token[] = [];
    const text = this.getText();
    const matches = commandLineRegExp.exec(text);
    if (matches === null) {
      return tokens;
    }
    const command = this.regExpToToken(matches, 1, "Command", -1);
    tokens.push(command);
    if (matches[3] !== undefined) {
      const rawParameter = this.regExpToToken(matches, 3, "RawParameter");
      tokens.push(rawParameter);
    }
    return tokens;
  }

  /**
   * 譜面のトークンを取得
   * @returns
   */
  private getChart(): Token[] {
    const tokens: Token[] = [];
    while (true) {
      const text = this.document.getText(this.range);
      if (text === "") {
        break;
      }
      if (notesRegExp.test(text)) {
        const matches = notesRegExp.exec(text);
        if (matches === null) {
          throw new Error();
        }
        const value = matches[1];
        const length = matches[1].length;
        const range = new Range(
          this.range.start.line,
          this.range.start.character,
          this.range.start.line,
          this.range.start.character + length
        );
        const token: Token = { kind: "Notes", value: value, range: range };
        tokens.push(token);
        this.range = new Range(
          this.range.start.line,
          this.range.start.character + length,
          this.range.end.line,
          this.range.end.character
        );
      } else if (measureEndRegExp.test(text)) {
        const matches = measureEndRegExp.exec(text);
        if (matches === null) {
          throw new Error();
        }
        const value = matches[1];
        const length = matches[1].length;
        const range = new Range(
          this.range.start.line,
          this.range.start.character,
          this.range.start.line,
          this.range.start.character + length
        );
        const token: Token = { kind: "MeasureEnd", value: value, range: range };
        tokens.push(token);
        this.range = new Range(
          this.range.start.line,
          this.range.start.character + length,
          this.range.end.line,
          this.range.end.character
        );
      } else if (spaceRegExp.test(text)) {
        const matches = spaceRegExp.exec(text);
        if (matches === null) {
          throw new Error();
        }
        const length = matches[1].length;
        this.range = new Range(
          this.range.start.line,
          this.range.start.character + length,
          this.range.end.line,
          this.range.end.character
        );
      } else {
        const matches = unknownRegExp.exec(text);
        if (matches === null) {
          throw new Error();
        }
        const value = matches[1];
        const length = matches[1].length;
        const range = new Range(
          this.range.start.line,
          this.range.start.character,
          this.range.start.line,
          this.range.start.character + length
        );
        const token: Token = { kind: "Unknown", value: value, range: range };
        tokens.push(token);
        this.range = new Range(
          this.range.start.line,
          this.range.start.character + length,
          this.range.end.line,
          this.range.end.character
        );
      }
    }
    return tokens;
  }

  /**
   * テキストをトークンに変換
   * @returns
   */
  public tokenized(): Token[] {
    const tokens: Token[] = [];
    for (let line = 0; line < this.document.lineCount; line++) {
      const textLine = this.document.lineAt(line);
      this.range = textLine.range;
      this.deleteCommentRange();
      if (this.isHeader()) {
        tokens.push(...this.getHeader());
      } else if (this.isCommand()) {
        tokens.push(...this.getCommand());
      } else {
        tokens.push(...this.getChart());
      }
      const eolRange = new Range(line, this.range.end.character, line, this.range.end.character);
      const eolToken: Token = { kind: "EndOfLine", value: "", range: eolRange };
      tokens.push(eolToken);
    }
    return tokens;
  }
}