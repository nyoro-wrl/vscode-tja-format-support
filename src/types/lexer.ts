import * as vscode from "vscode";
import { Range } from "vscode";
import { splitString } from "../util/string";

const headerLineRegExp = /^\s*([A-Z0-9]+):(.*)?\s*$/;
const commandLineRegExp = /^\s*#([A-Z0-9]+)( (.*)+)?\s*$/;
const notesRegExp = /^([0-9])/;
const measureEndRegExp = /^(,)/;
const spaceRegExp = /^(\s+)/;

/**
 * トークンの種類
 *
 *     "Header" // ヘッダ（先頭）
 *     "Command" // 命令（先頭）
 *     "RawParameter" // ヘッダまたは命令のパラメーター（分割なし）
 *     "Parameter" // ヘッダまたは命令のパラメーター
 *     "Delimiter" // パラメーターの区切り文字
 *     "Notes" // ノーツ
 *     "MeasureEnd" // 小節の終わり
 *     "EndOfLine" // 行末
 *     "Unknown" // 不明
 */
export type TokenKind =
  | "Header"
  | "Command"
  | "RawParameter"
  | "Parameter"
  | "Delimiter"
  | "Notes"
  | "MeasureEnd"
  | "EndOfLine"
  | "Unknown";

export type Token = {
  /**
   * トークンの種類
   */
  readonly kind: TokenKind;
  /**
   * トークンの値
   */
  readonly value: string;
  /**
   * トークンの位置
   */
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
   * テキストをトークンに変換
   * @returns
   */
  public tokenized(): Token[] {
    const tokens: Token[] = [];
    for (let line = 0; line < this.document.lineCount; line++) {
      // テキスト
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

      // 行末
      const eolRange = new Range(line, this.range.end.character, line, this.range.end.character);
      const eolToken: Token = { kind: "EndOfLine", value: "", range: eolRange };
      tokens.push(eolToken);
    }
    return tokens;
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
    const matches = /^\s*(.*)\s*\/\/\s*.*\s*$/.exec(text);
    if (matches === null) {
      return;
    }
    this.range = this.getRegExpRange(matches, 1);
  }

  /**
   * 行がヘッダかどうか
   * @returns
   */
  private isHeader(): boolean {
    const text = this.getText();
    return headerLineRegExp.test(text);
  }

  /**
   * ヘッダ行のトークンを取得
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
          vscode.window.showErrorMessage("字句解析に失敗しました。");
          throw new Error("字句解析に失敗しました。");
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
          vscode.window.showErrorMessage("字句解析に失敗しました。");
          throw new Error("字句解析に失敗しました。");
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
        // 小節後のテキストを全てUnknownとして処理する
        const afterText = this.document.getText(this.range);
        if (/[^\s]+/.test(afterText)) {
          const [matches, _] = splitString(afterText, /\s+/g);
          for (const match of matches.filter((x) => x.value !== "")) {
            const range = new Range(
              this.range.start.line,
              match.start + this.range.start.character,
              this.range.start.line,
              match.end + this.range.start.character
            );
            const token: Token = { kind: "Unknown", value: match.value, range: range };
            tokens.push(token);
          }
        }
        break;
      } else if (spaceRegExp.test(text)) {
        const matches = spaceRegExp.exec(text);
        if (matches === null) {
          vscode.window.showErrorMessage("字句解析に失敗しました。");
          throw new Error("字句解析に失敗しました。");
        }
        const length = matches[1].length;
        this.range = new Range(
          this.range.start.line,
          this.range.start.character + length,
          this.range.end.line,
          this.range.end.character
        );
      } else {
        const matches = /^([^0-9,\s]+)/.exec(text);
        if (matches === null) {
          vscode.window.showErrorMessage("字句解析に失敗しました。");
          throw new Error("字句解析に失敗しました。");
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
}
