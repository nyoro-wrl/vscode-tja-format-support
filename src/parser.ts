import * as vscode from "vscode";
import { Position, Range } from "vscode";
import { commands } from "./constants/commands";
import { headers } from "./constants/headers";
import { Split, splitToRegExp } from "./type/statement";

const deleteCommentRegExp = /^\s*(.*)\s*\/\/\s*.*\s*$/;
const headerLineRegExp = /^\s*([A-Z0-9]+):(.*)?\s*$/;
const commandLineRegExp = /^\s*#([A-Z0-9]+)( (.*)+)?\s*$/;
const notesRegExp = /[0-9]/;
const measureEndRegExp = /,/;
const unknowsRegExp = /[\S]/;

type TokenType =
  | "Header"
  | "Command"
  | "RawParameter"
  | "Parameter"
  | "Notes"
  | "MeasureEnd"
  | "EndOfLine"
  | "Unknown";

type Token = {
  readonly type: TokenType;
  readonly value: string;
  readonly range: Range;
};

/**
 * 字句解析
 */
export class Lexer {
  readonly document: vscode.TextDocument;
  private range: vscode.Range = new Range(0, 0, 0, 0);

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
  private getRegExpRange(matches: RegExpExecArray, index: number): Range {
    const start = this.range.start.character + matches[0].indexOf(matches[index]);
    const end = start + matches[index].length;
    return new Range(this.range.start.line, start, this.range.end.line, end);
  }

  /**
   * 正規表現結果をトークンに変換
   * @param type
   * @param matches
   * @param index
   * @returns
   */
  private regExpToToken(matches: RegExpExecArray, index: number, type: TokenType): Token {
    const value = matches[index];
    const range = this.getRegExpRange(matches, index);
    return { type: type, value: value, range: range };
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
    const header = this.regExpToToken(matches, 1, "Header");
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
    const command = this.regExpToToken(matches, 1, "Command");
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
    const line = this.range.start.line;
    const start = this.range.start.character;
    const end = this.range.end.character;
    for (let index = start; index < end; index++) {
      const range = new Range(line, index, line, index + 1);
      const char = this.document.getText(range);
      if (notesRegExp.test(char)) {
        const token: Token = { type: "Notes", value: char, range: range };
        tokens.push(token);
      } else if (measureEndRegExp.test(char)) {
        const token: Token = { type: "MeasureEnd", value: char, range: range };
        tokens.push(token);
      } else if (unknowsRegExp.test(char)) {
        const token: Token = { type: "Unknown", value: char, range: range };
        tokens.push(token);
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
      const eolToken: Token = { type: "EndOfLine", value: "", range: eolRange };
      tokens.push(eolToken);
    }
    return tokens;
  }
}

class Expression {}

export class GlobalExpression extends Expression {
  readonly headers: HeaderExpression[] = [];
  readonly courses: CourseExpression[] = [];

  public getCourse(): CourseExpression {
    if (this.courses.length === 0) {
      this.courses.push(new CourseExpression());
    }
    return this.courses[this.courses.length - 1];
  }

  public getRange(): Range | undefined {
    const ranges: Range[] = [];
    for (const header of this.headers) {
      const headerRanges = header.getRange();
      if (headerRanges !== undefined) {
        ranges.push(headerRanges);
      }
    }
    for (const course of this.courses) {
      const courseRanges = course.getRange();
      if (courseRanges !== undefined) {
        ranges.push(courseRanges);
      }
    }
    return concatRange(...ranges);
  }
}

export class HeaderExpression extends Expression {
  readonly name: TextExpression;
  readonly split: Split;
  rawParameter: TextExpression | undefined;
  readonly parameters: TextExpression[] = [];

  constructor(token: Token) {
    super();
    if (token.type !== "Header") {
      throw new Error('TokenType must be "Header".');
    }
    this.name = new TextExpression(token);
    const statement = headers.get(token.value);
    this.split = statement?.split ?? "Unknown";
  }

  public getRange(): Range | undefined {
    const ranges: Range[] = [];
    ranges.push(this.name.range);
    if (this.rawParameter !== undefined) {
      ranges.push(this.rawParameter.range);
    }
    return concatRange(...ranges);
  }
}

class CommandExpression extends Expression {
  readonly name: TextExpression;
  readonly split: Split;
  rawParameter: TextExpression | undefined;
  readonly parameters: TextExpression[] = [];

  constructor(token: Token) {
    super();
    if (token.type !== "Command") {
      throw new Error('TokenType must be "Command".');
    }
    this.name = new TextExpression(token);
    const statement = commands.get(token.value);
    this.split = statement?.split ?? "Unknown";
  }

  public getRange(): Range | undefined {
    const ranges: Range[] = [];
    ranges.push(this.name.range);
    if (this.rawParameter !== undefined) {
      ranges.push(this.rawParameter.range);
    }
    return concatRange(...ranges);
  }
}

class CourseExpression extends Expression {
  readonly headers: HeaderExpression[] = [];
  readonly commands: CommandExpression[] = [];
  readonly charts: ChartExpression[] = [];

  public getRange(): Range | undefined {
    const ranges: Range[] = [];
    for (const header of this.headers) {
      const headerRanges = header.getRange();
      if (headerRanges !== undefined) {
        ranges.push(headerRanges);
      }
    }
    for (const command of this.commands) {
      const commandRanges = command.getRange();
      if (commandRanges !== undefined) {
        ranges.push(commandRanges);
      }
    }
    for (const chart of this.charts) {
      const chartRanges = chart.getRange();
      if (chartRanges !== undefined) {
        ranges.push(chartRanges);
      }
    }
    return concatRange(...ranges);
  }
}

class ChartExpression extends Expression {
  start: CommandExpression | undefined;
  readonly measures: MeasureExpression[] = [];
  end: CommandExpression | undefined;

  public getRange(): Range | undefined {
    const ranges: Range[] = [];
    if (this.start !== undefined) {
      const startRanges = this.start.getRange();
      if (startRanges !== undefined) {
        ranges.push();
      }
    }
    for (const measure of this.measures) {
      const measureRanges = measure.getRange();
      if (measureRanges !== undefined) {
        ranges.push();
      }
    }
    if (this.end !== undefined) {
      const endRanges = this.end.getRange();
      if (endRanges !== undefined) {
        ranges.push(endRanges);
      }
    }
    return concatRange(...ranges);
  }
}

class MeasureExpression extends Expression {
  readonly charts: (TextExpression | CommandExpression)[] = [];
  end: TextExpression | undefined;

  public getRange(): Range | undefined {
    const ranges: Range[] = [];
    for (const chart of this.charts) {
      if (chart instanceof TextExpression) {
        ranges.push(chart.range);
      } else if (chart instanceof CommandExpression) {
        ranges.push(chart.name.range);
        if (chart.rawParameter !== undefined) {
          ranges.push(chart.rawParameter.range);
        }
      }
    }
    return concatRange(...ranges);
  }
}

export class TextExpression extends Expression {
  readonly value: string;
  readonly range: Range;

  constructor(token: Token) {
    super();
    this.value = token.value;
    this.range = token.range;
  }
}

function splitWithPositions(
  str: string,
  separator: RegExp
): Array<{ text: string; start: number; end: number }> {
  const result = [];
  let start = 0;
  let match = separator.exec(str);
  while ((match = separator.exec(str))) {
    const end = match.index;
    if (end > start) {
      result.push({ text: str.substring(start, end), start: start, end: end });
    }
    start = separator.lastIndex;
  }
  if (start < str.length) {
    result.push({ text: str.substring(start), start: start, end: str.length });
  }
  return result;
}

function tokenizedRawParameter(rawParameter: Token, split: Split): Token[] {
  if (rawParameter.type !== "RawParameter") {
    throw new Error('TokenType must be "RawParameter".');
  }
  const parameters: Token[] = [];
  const tokenType: TokenType = split === "Unknown" ? "RawParameter" : "Parameter";
  const regexp = splitToRegExp(split);
  const results = splitWithPositions(rawParameter.value, regexp);
  for (const result of results) {
    const value = result.text;
    const range = new Range(
      rawParameter.range.start.line,
      rawParameter.range.start.character + result.start,
      rawParameter.range.end.line,
      rawParameter.range.start.character + result.end
    );
    const parameter: Token = { type: tokenType, value: value, range: range };
    parameters.push(parameter);
  }
  return parameters;
}

// TODO 複数コースに対応
// TODO プレイヤーごとのChartに対応

export class Parser {
  readonly tokens: Token[];
  position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private parseExpression<T extends Expression>(parent: T): T {
    for (; this.position < this.tokens.length; this.position++) {
      const token = this.tokens[this.position];
      switch (token.type) {
        case "Header": {
          if (parent instanceof GlobalExpression) {
            const info = headers.get(token.value);
            const section = info?.section ?? "Unknown";
            switch (section) {
              case "Global":
              case "Unknown": {
                let expression = new HeaderExpression(token);
                this.position++;
                expression = this.parseExpression(expression);
                parent.headers.push(expression);
                break;
              }
              case "Course": {
                // CourseExpressionで取得させる
                let expression = parent.getCourse();
                expression = this.parseExpression(expression);
                break;
              }
              default:
                throw new ReferenceError("No action defined for HeaderSection.");
            }
          } else if (parent instanceof CourseExpression) {
            const info = headers.get(token.value);
            const section = info?.section ?? "Unknown";
            switch (section) {
              case "Course":
              case "Unknown": {
                let expression = new HeaderExpression(token);
                this.position++;
                expression = this.parseExpression(expression);
                parent.headers.push(expression);
                break;
              }
              case "Global": {
                // CourseExpressionから出てGlobalExpressionで取得させる
                this.position--;
                return parent;
              }
              default:
                throw new ReferenceError("No action defined for HeaderSection.");
            }
          } else {
            // 不正
          }
          break;
        }
        case "Command": {
          if (parent instanceof GlobalExpression) {
            // CourseExpressionで取得させる
            let expression = parent.getCourse();
            expression = this.parseExpression(expression);
          } else if (parent instanceof CourseExpression) {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            switch (section) {
              case "Outer":
              case "Unknown": {
                let expression = new CommandExpression(token);
                this.position++;
                expression = this.parseExpression(expression);
                parent.commands.push(expression);
                break;
              }
              case "Start": {
                let expression = new ChartExpression();
                expression = this.parseExpression(expression);
                parent.charts.push(expression);
                break;
              }
              case "Inner": {
                // 不正
                break;
              }
              case "End": {
                // 不正
                break;
              }
              default:
                throw new ReferenceError("No action defined for CommandSection.");
            }
          } else if (parent instanceof ChartExpression) {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            switch (section) {
              case "Outer": {
                // 不正
                break;
              }
              case "Start": {
                let expression = new CommandExpression(token);
                this.position++;
                expression = this.parseExpression(expression);
                parent.start = expression;
                break;
              }
              case "Inner":
              case "Unknown": {
                let expression = new MeasureExpression();
                expression = this.parseExpression(expression);
                parent.measures.push(expression);
                break;
              }
              case "End": {
                let expression = new CommandExpression(token);
                this.position++;
                expression = this.parseExpression(expression);
                parent.end = expression;
                // ChartExpressionから出る
                this.position--;
                return parent;
              }
              default:
                throw new ReferenceError("No action defined for CommandSection.");
            }
          } else if (parent instanceof MeasureExpression) {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            switch (section) {
              case "Outer": {
                // 不正
                break;
              }
              case "Start": {
                // 不正
                break;
              }
              case "Inner":
              case "Unknown": {
                let expression = new CommandExpression(token);
                this.position++;
                expression = this.parseExpression(expression);
                parent.charts.push(expression);
                break;
              }
              case "End": {
                // 不正
                break;
              }
              default:
                throw new ReferenceError("No action defined for CommandSection.");
            }
          } else {
            // 不正
          }
          break;
        }
        case "RawParameter": {
          if (parent instanceof HeaderExpression || parent instanceof CommandExpression) {
            parent.rawParameter = new TextExpression(token);
            const tokens = tokenizedRawParameter(token, parent.split);
            parent.parameters.push(...tokens);
          } else {
            // 不正
          }
          break;
        }
        case "Notes": {
          if (parent instanceof ChartExpression) {
            let expression = new MeasureExpression();
            expression = this.parseExpression(expression);
            parent.measures.push(expression);
          } else if (parent instanceof MeasureExpression) {
            let expression = new TextExpression(token);
            parent.charts.push(expression);
          } else {
            // 不正
          }
          break;
        }
        case "MeasureEnd": {
          if (parent instanceof ChartExpression) {
            let expression = new MeasureExpression();
            expression = this.parseExpression(expression);
            parent.measures.push(expression);
          } else if (parent instanceof MeasureExpression) {
            let expression = new TextExpression(token);
            parent.end = expression;
            return parent;
          }
          break;
        }
        case "EndOfLine": {
          if (parent instanceof HeaderExpression || parent instanceof CommandExpression) {
            return parent;
          }
          break;
        }
        case "Unknown": {
          throw new ReferenceError('No action defined for TokenType = "Unknown".');
        }
        default:
          throw new ReferenceError("No action defined for TokenType.");
      }
    }
    return parent;
  }

  public parse(): GlobalExpression {
    const global = new GlobalExpression();
    return this.parseExpression(global);
  }
}

export function concatRange(...ranges: Range[]): Range | undefined {
  if (ranges.length === 0) {
    return;
  }
  let min = ranges[0].start;
  let max = ranges[0].end;
  for (const { start, end } of ranges.slice(1)) {
    if (min.line >= start.line && min.character > start.character) {
      min = start;
    }
    if (max.line <= end.line && max.character < end.character) {
      max = end;
    }
  }
  return new Range(min, max);
}
