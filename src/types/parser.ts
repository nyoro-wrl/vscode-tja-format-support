import * as vscode from "vscode";
import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { addSyntaxError, clearDiagnostics } from "../error";
import { Lexer, Token } from "./lexer";
import { findLast } from "lodash";
import { tokenizedRawParameter } from "../util/lexer";
import { Range } from "vscode";
import {
  ChartNode,
  CommandNode,
  CourseHeadersNode,
  CourseNode,
  DelimiterNode,
  RootHeadersNode,
  RootNode,
  HeaderNode,
  NameNode,
  MeasureEndNode,
  MeasureNode,
  NoteNode,
  ParameterNode,
  ParametersNode,
  ParentNode,
  StatementNode,
  ChartTokenNode,
} from "./node";

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
  private chartAfter: boolean = false;
  /**
   * 一度でも譜面部分に入ったかどうか
   */
  private chartAfterOnce: boolean = false;
  /**
   * 小節数
   */
  private measure: number = 1;
  /**
   * ゴーゴータイム
   */
  private gogotime: boolean = false;
  /**
   * 小節線の表示
   */
  private barlineShow: boolean = true;

  constructor(document: vscode.TextDocument) {
    const lexer = new Lexer(document);
    const tokens = lexer.tokenized();
    this.tokens = tokens;
  }

  public parse(): RootNode {
    clearDiagnostics();
    const node = new RootNode(undefined);
    return this.parseNode(node);
  }

  private childrenFindLastOrCreateCourse(parent: RootNode): CourseNode {
    const findNode = findLast(parent.children, (x) => x instanceof CourseNode) as
      | CourseNode
      | undefined;
    if (findNode === undefined) {
      let node = new CourseNode(parent);
      parent.push(node);
      return node;
    } else {
      return findNode;
    }
  }

  private childrenFindLastOrCreateRootHeaders(parent: RootNode): RootHeadersNode {
    const findNode = findLast(parent.children, (x) => x instanceof RootHeadersNode) as
      | RootHeadersNode
      | undefined;
    if (findNode === undefined) {
      let node = new RootHeadersNode(parent);
      parent.push(node);
      return node;
    } else {
      return findNode;
    }
  }

  private childrenFindLastOrCreateCourseHeaders(parent: CourseNode): CourseHeadersNode {
    const findNode = findLast(parent.children, (x) => x instanceof CourseHeadersNode) as
      | CourseHeadersNode
      | undefined;
    if (findNode === undefined) {
      let node = new CourseHeadersNode(parent);
      parent.push(node);
      return node;
    } else {
      return findNode;
    }
  }

  private parseNode<T extends ParentNode>(parent: T): T {
    for (; this.position < this.tokens.length; this.position++) {
      const token = this.tokens[this.position];
      if (token.kind === "Unknown") {
        addSyntaxError(token.range, "不正なテキストです。");
      } else {
        if (parent instanceof RootNode) {
          if (token.kind === "Header") {
            const section = headers.get(token.value)?.section ?? "Unknown";
            if (section === "Course" || this.chartAfterOnce) {
              if (this.chartAfter) {
                this.chartAfter = false;
                let node = new CourseNode(parent);
                node = this.parseNode(node);
                parent.push(node);
              } else {
                let node = this.childrenFindLastOrCreateCourse(parent);
                node = this.parseNode(node);
              }
            } else if (section === "Root" || section === "Unknown") {
              let node = this.childrenFindLastOrCreateRootHeaders(parent);
              node = this.parseNode(node);
            } else {
              addSyntaxError(
                token.range,
                `No processing defined for HeaderSection = "${section}".`
              );
            }
          } else if (token.kind === "Command") {
            if (this.chartAfter) {
              this.chartAfter = false;
              let node = new CourseNode(parent);
              node = this.parseNode(node);
              parent.push(node);
            } else {
              let node = this.childrenFindLastOrCreateCourse(parent);
              node = this.parseNode(node);
            }
          } else if (token.kind === "Notes") {
            addSyntaxError(token.range, "#START がありません。");
          } else if (token.kind === "MeasureEnd") {
            addSyntaxError(token.range, "不正なテキストです。");
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent instanceof RootHeadersNode || parent instanceof CourseHeadersNode) {
          if (token.kind === "Header") {
            const info = headers.get(token.value);
            const section = info?.section ?? "Unknown";
            if (parent instanceof RootHeadersNode && section === "Course") {
              this.position--;
              return parent;
            }
            const separator = info?.separator ?? "Unknown";
            let node = new HeaderNode(parent, separator);
            node = this.parseNode(node);
            parent.push(node);
          } else if (token.kind === "Command") {
            this.position--;
            return parent;
          } else if (token.kind === "Notes") {
            addSyntaxError(token.range, "#START がありません。");
          } else if (token.kind === "MeasureEnd") {
            addSyntaxError(token.range, "不正なテキストです。");
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent instanceof CourseNode) {
          if (token.kind === "Header") {
            const section = headers.get(token.value)?.section ?? "Unknown";
            if (section === "Course" || section === "Unknown" || this.chartAfterOnce) {
              if (this.chartAfter) {
                this.position--;
                return parent;
              } else {
                let node = this.childrenFindLastOrCreateCourseHeaders(parent);
                node = this.parseNode(node);
              }
            } else if (section === "Root") {
              this.position--;
              return parent;
            } else {
              addSyntaxError(
                token.range,
                `No processing defined for HeaderSection = "${section}".`
              );
            }
          } else if (token.kind === "Command") {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            const separator = info?.separator ?? "Unknown";
            if (section === "Outer" || section === "Unknown") {
              let node = new CommandNode(parent, separator);
              node = this.parseNode(node);
              parent.push(node);
            } else if (section === "Start") {
              let chart = new ChartNode(parent);
              let start = new CommandNode(chart, separator);
              start = this.parseNode(start);
              chart.push(start);
              this.position++;
              chart = this.parseNode(chart);
              parent.push(chart);
            } else if (section === "Inner" || section === "MeasureHead" || section === "End") {
              let node = new CommandNode(parent, separator);
              node = this.parseNode(node);
              parent.push(node);
              addSyntaxError(node.range ?? new Range(0, 0, 0, 0), "#START がありません。");
            } else {
              addSyntaxError(
                token.range,
                `No processing defined for CommandSection = "${section}".`
              );
            }
          } else if (token.kind === "Notes") {
            addSyntaxError(token.range, "#START がありません。");
          } else if (token.kind === "MeasureEnd") {
            addSyntaxError(token.range, "不正なテキストです。");
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent instanceof StatementNode) {
          if (
            (parent instanceof HeaderNode && token.kind === "Header") ||
            (parent instanceof CommandNode && token.kind === "Command")
          ) {
            const node = new NameNode(parent, token);
            parent.push(node);
          } else if (token.kind === "RawParameter") {
            const rawParameter = new ParametersNode(parent);
            const parameters = tokenizedRawParameter(token, parent.properties.separator);
            if (parameters.length === 1) {
              const node = new ParameterNode(parent, token);
              parent.push(node);
            } else {
              for (const parameter of parameters) {
                if (parameter.kind === "RawParameter" || parameter.kind === "Parameter") {
                  const node = new ParameterNode(parent, {
                    kind: parameter.kind,
                    range: parameter.range,
                    value: parameter.value,
                  });
                  rawParameter.push(node);
                } else if (parameter.kind === "Delimiter") {
                  const node = new DelimiterNode(parent, {
                    kind: parameter.kind,
                    range: parameter.range,
                    value: parameter.value,
                  });
                  rawParameter.push(node);
                } else {
                  return parent;
                }
              }
              parent.push(rawParameter);
            }
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
            return parent;
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent instanceof ChartNode) {
          if (token.kind === "Header") {
            addSyntaxError(token.range, "ヘッダの位置が不正です。");
          } else if (token.kind === "Command") {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            const separator = info?.separator ?? "Unknown";
            if (section === "Outer" || section === "Start") {
              let node = new CommandNode(parent, separator);
              node = this.parseNode(node);
              parent.push(node);
              addSyntaxError(token.range, "命令の位置が不正です。");
            } else if (section === "Inner" || section === "MeasureHead" || section === "Unknown") {
              let node = new MeasureNode(parent, this.measure, this.barlineShow);
              node = this.parseNode(node);
              if (node.children.every((x) => x instanceof CommandNode)) {
                // 命令のみの場合は小節から命令に置き換える
                for (const child of node.children) {
                  const node = child as CommandNode;
                  parent.push(node);
                }
              } else {
                this.measure++;
                parent.push(node);
              }
            } else if (section === "End") {
              let node = new CommandNode(parent, separator);
              node = this.parseNode(node);
              parent.push(node);
              this.chartAfter = true;
              this.chartAfterOnce = true;
              this.measure = 1;
              this.gogotime = false;
              this.barlineShow = true;
              return parent;
            } else {
              addSyntaxError(
                token.range,
                `No processing defined for CommandSection = "${section}".`
              );
            }
          } else if (token.kind === "Notes" || token.kind === "MeasureEnd") {
            let node = new MeasureNode(parent, this.measure, this.barlineShow);
            node = this.parseNode(node);
            this.measure++;
            parent.push(node);
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent instanceof MeasureNode) {
          if (token.kind === "Header") {
            addSyntaxError(token.range, "ヘッダの位置が不正です。");
          } else if (token.kind === "Command") {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            const separator = info?.separator ?? "Unknown";
            if (section === "Outer" || section === "Start") {
              let node = new CommandNode(parent, separator);
              node = this.parseNode(node);
              parent.push(node);
              addSyntaxError(token.range, "命令の位置が不正です。");
            } else if (section === "Inner" || section === "MeasureHead" || section === "Unknown") {
              let node = new CommandNode(parent, separator);
              node = this.parseNode(node);
              parent.push(node);
              if (commands.items.gogostart.regexp.test(node.properties.name)) {
                this.gogotime = true;
              } else if (commands.items.gogoend.regexp.test(node.properties.name)) {
                this.gogotime = false;
              } else if (commands.items.barlineoff.regexp.test(node.properties.name)) {
                this.barlineShow = false;
              } else if (commands.items.barlineon.regexp.test(node.properties.name)) {
                this.barlineShow = true;
              }
              if (parent.find((x) => x instanceof ChartTokenNode) !== undefined) {
                parent.properties.barlineShow = this.barlineShow;
                if (section === "MeasureHead") {
                  addSyntaxError(token.range, "命令の位置が不正です。");
                }
              }
            } else if (section === "End") {
              if (!parent.children.every((x) => x instanceof CommandNode)) {
                const previewToken = this.tokens[this.position - 1];
                addSyntaxError(previewToken.range, "小節が閉じられていません。");
              }
              this.position--;
              return parent;
            } else {
              addSyntaxError(
                token.range,
                `No processing defined for CommandSection = "${section}".`
              );
            }
          } else if (token.kind === "Notes") {
            const node = new NoteNode(parent, token, this.gogotime);
            parent.push(node);
          } else if (token.kind === "MeasureEnd") {
            const node = new MeasureEndNode(parent, token, this.gogotime);
            parent.push(node);
            return parent;
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else {
          addSyntaxError(token.range, "No processing defined");
        }
      }
    }
    if (this.position >= this.tokens.length) {
      if (parent instanceof ChartNode) {
        const previewToken = this.tokens[this.position - 1];
        addSyntaxError(previewToken.range, "#END がありません。");
      }
    }
    return parent;
  }
}
