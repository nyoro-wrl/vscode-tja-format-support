import * as vscode from "vscode";
import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { clearDiagnostics, addSyntaxError } from "../error";
import { Lexer, Token } from "./lexer";
import {
  ChartExpression,
  CommandExpression,
  CourseExpression,
  Expression,
  GlobalExpression,
  HeaderExpression,
  MeasureExpression,
  TextExpression,
} from "./expression";
import { tokenizedRawParameter } from "../util/lexer";

// TODO Parserでは許容してるけど1行に複数小節って書ける？

/**
 * 構文解析
 */
export class Parser {
  /**
   * 字句解析から取得したトークン配列
   */
  private readonly tokens: Token[];
  /**
   * 処理中のトークン位置
   */
  private position: number = 0;
  /**
   * 直前まで譜面部分に入っていたかどうか
   */
  private chartIn: boolean = false;
  /**
   * 一度でも譜面部分に入ったかどうか
   */
  private chartInOnce: boolean = false;

  constructor(document: vscode.TextDocument) {
    const lexer = new Lexer(document);
    const tokens = lexer.tokenized();
    this.tokens = tokens;
  }

  private parseExpression<T extends Expression>(parent: T): T {
    for (; this.position < this.tokens.length; this.position++) {
      const token = this.tokens[this.position];
      switch (token.kind) {
        case "Header": {
          if (parent instanceof GlobalExpression) {
            const info = headers.get(token.value);
            const section = info?.section ?? "Unknown";
            switch (section) {
              case "Global":
              case "Unknown": {
                if (this.chartIn) {
                  // Course単位の命令として解釈する
                  // 新しくCourseを作成
                  this.chartIn = false;
                  let expression = new CourseExpression();
                  expression = this.parseExpression(expression);
                  parent.courses.push(expression);
                } else {
                  let expression = new HeaderExpression(token);
                  this.position++;
                  expression = this.parseExpression(expression);
                  parent.headers.push(expression);
                }
                break;
              }
              case "Course": {
                if (this.chartIn) {
                  // 新しくCourseを作成
                  this.chartIn = false;
                  let expression = new CourseExpression();
                  expression = this.parseExpression(expression);
                  parent.courses.push(expression);
                } else {
                  // 最新のCourseで取得させる（ない場合は作成）
                  let expression = parent.getCourse();
                  expression = this.parseExpression(expression);
                }
                break;
              }
              default: {
                addSyntaxError(
                  token.range,
                  `No processing defined for HeaderSection = "${section}".`
                );
                break;
              }
            }
          } else if (parent instanceof CourseExpression) {
            const info = headers.get(token.value);
            const section = info?.section ?? "Unknown";
            switch (section) {
              case "Course":
              case "Unknown": {
                if (this.chartIn) {
                  // CourseExpressionから出る
                  this.position--;
                  return parent;
                } else {
                  let expression = new HeaderExpression(token);
                  this.position++;
                  expression = this.parseExpression(expression);
                  parent.headers.push(expression);
                }
                break;
              }
              case "Global": {
                if (this.chartIn) {
                  // CourseExpressionから出る
                  this.position--;
                  return parent;
                } else if (this.chartInOnce) {
                  // Course単位の命令として解釈する
                  let expression = new HeaderExpression(token);
                  this.position++;
                  expression = this.parseExpression(expression);
                  parent.headers.push(expression);
                } else {
                  // CourseExpressionから出てGlobalExpressionで取得させる
                  this.position--;
                  return parent;
                }
                break;
              }
              default: {
                addSyntaxError(
                  token.range,
                  `No processing defined for HeaderSection = "${section}".`
                );
                break;
              }
            }
          } else {
            addSyntaxError(token.range, "Invalid header position.");
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
                this.chartIn = true;
                this.chartInOnce = true;
                break;
              }
              case "Inner": {
                addSyntaxError(token.range, "Invalid command position.");
                break;
              }
              case "End": {
                addSyntaxError(token.range, "Invalid command position.");
                break;
              }
              default: {
                addSyntaxError(
                  token.range,
                  `No processing defined for CommandSection = "${section}".`
                );
                break;
              }
            }
          } else if (parent instanceof ChartExpression) {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            switch (section) {
              case "Outer": {
                addSyntaxError(token.range, "Invalid command position.");
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
              default: {
                addSyntaxError(
                  token.range,
                  `No processing defined for CommandSection = "${section}".`
                );
                break;
              }
            }
          } else if (parent instanceof MeasureExpression) {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            switch (section) {
              case "Outer": {
                addSyntaxError(token.range, "Invalid command position.");
                break;
              }
              case "Start": {
                addSyntaxError(token.range, "Invalid command position.");
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
                if (
                  parent instanceof MeasureExpression &&
                  parent.charts.every((x) => x instanceof CommandExpression)
                ) {
                  // #END直前に配置された命令のみの小節対応
                  // MeasureExpressionから出る
                  this.position--;
                  return parent;
                }
                const previewToken = this.tokens[this.position - 1];
                addSyntaxError(previewToken.range, "Unclosed measure.");
                break;
              }
              default: {
                addSyntaxError(
                  token.range,
                  `No processing defined for CommandSection = "${section}".`
                );
                break;
              }
            }
          } else {
            addSyntaxError(token.range, "Invalid command position.");
          }
          break;
        }
        case "RawParameter": {
          if (parent instanceof HeaderExpression || parent instanceof CommandExpression) {
            parent.rawParameter = new TextExpression(token);
            const tokens = tokenizedRawParameter(token, parent.separator);
            parent.parameters.push(...tokens);
          } else {
            addSyntaxError(token.range, "Invalid parameter position.");
          }
          break;
        }
        case "Parameter": {
          // 普通ここには来ない（Parse時には全てRawParameterで入ってくるため）
          // 字句解析側でRawParameterをParameterに変換した場合はここの処理が使われる
          if (parent instanceof HeaderExpression || parent instanceof CommandExpression) {
            parent.parameters.push(new TextExpression(token));
          } else {
            addSyntaxError(token.range, "Invalid parameter position.");
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
            addSyntaxError(token.range, "Invalid note position.");
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
          } else {
            addSyntaxError(token.range, "Invalid measure end position.");
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
          addSyntaxError(token.range, "Invalid text.");
          break;
        }
        default: {
          addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          break;
        }
      }
    }
    if (this.position <= this.tokens.length) {
      const token = this.tokens[this.tokens.length - 1];
      if (parent instanceof CourseExpression) {
        if (!this.chartIn) {
          addSyntaxError(token.range, "No chart provided.");
        }
      } else if (parent instanceof ChartExpression) {
        addSyntaxError(token.range, "Missing #END.");
      } else if (parent instanceof MeasureExpression) {
        addSyntaxError(token.range, "Unclosed measure.");
      }
    }
    return parent;
  }

  public parse(): GlobalExpression {
    clearDiagnostics();
    const global = new GlobalExpression();
    return this.parseExpression(global);
  }
}
