import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { Lexer, Token } from "./lexer";
import { findLast } from "lodash";
import { tokenizedRawParameter } from "../util/lexer";
import { DiagnosticSeverity, Range, TextDocument } from "vscode";
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
import { documents } from "../documents";

/**
 * 構文解析
 */
export class Parser {
  readonly document: TextDocument;
  /**
   * 字句解析から取得したトークン配列
   */
  readonly tokens: Token[];
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
   * 小節線の表示
   */
  private showBarline: boolean = true;
  /**
   * ゴーゴータイム
   */
  private isGogotime: boolean = false;
  /**
   * ダミーノーツ
   */
  private isDummyNote: boolean = false;
  /**
   * 風船音符
   */
  private isBalloon: boolean = false;
  /**
   * 風船音符のID
   */
  private balloonId: number = -1;

  constructor(document: TextDocument) {
    this.document = document;
    const lexer = new Lexer(this.document);
    const tokens = lexer.tokenized();
    this.tokens = tokens;
  }

  /**
   * 構文解析して構文木を取得
   * @returns
   */
  public parse(): RootNode {
    documents.get(this.document).clearDiagnostics();
    let node = new RootNode(undefined);
    node = this.parseNode(node);
    documents.get(this.document).showRealtimeDiagnostic();
    return node;
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
        documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
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
              documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
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
            documents.get(this.document).addDiagnostic(token.range, "#START がありません。");
          } else if (token.kind === "MeasureEnd") {
            documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
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
            documents.get(this.document).addDiagnostic(token.range, "#START がありません。");
          } else if (token.kind === "MeasureEnd") {
            documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
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
              documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
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
              if (node.range !== undefined) {
                documents.get(this.document).addDiagnostic(node.range, "#START がありません。");
              }
            } else {
              documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
            }
          } else if (token.kind === "Notes") {
            documents.get(this.document).addDiagnostic(token.range, "#START がありません。");
          } else if (token.kind === "MeasureEnd") {
            documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
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
              const node = new ParameterNode(parent, token, 0);
              parent.push(node);
            } else {
              let parameterIndex = 0;
              for (const parameter of parameters) {
                if (parameter.kind === "RawParameter" || parameter.kind === "Parameter") {
                  const node = new ParameterNode(
                    parent,
                    {
                      kind: parameter.kind,
                      range: parameter.range,
                      value: parameter.value,
                    },
                    parameterIndex++
                  );
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
            return parent;
          } else {
            documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
          }
        } else if (parent instanceof ChartNode) {
          if (token.kind === "Header") {
            documents.get(this.document).addDiagnostic(token.range, "ヘッダの位置が不正です。");
          } else if (token.kind === "Command") {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            const separator = info?.separator ?? "Unknown";
            if (section === "Outer" || section === "Start") {
              let node = new CommandNode(parent, separator);
              node = this.parseNode(node);
              parent.push(node);
              if (node.range !== undefined) {
                documents.get(this.document).addDiagnostic(token.range, "命令の位置が不正です。");
              }
            } else if (section === "Inner" || section === "MeasureHead" || section === "Unknown") {
              let node = new MeasureNode(parent, this.measure, this.showBarline);
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
              this.showBarline = true;
              this.isGogotime = false;
              this.isDummyNote = false;
              this.isBalloon = false;
              this.balloonId = -1;
              return parent;
            } else {
              documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
            }
          } else if (token.kind === "Notes" || token.kind === "MeasureEnd") {
            let node = new MeasureNode(parent, this.measure, this.showBarline);
            node = this.parseNode(node);
            this.measure++;
            parent.push(node);
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
          }
        } else if (parent instanceof MeasureNode) {
          if (token.kind === "Header") {
            documents.get(this.document).addDiagnostic(token.range, "ヘッダの位置が不正です。");
          } else if (token.kind === "Command") {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            const separator = info?.separator ?? "Unknown";
            if (section === "Outer" || section === "Start") {
              let node = new CommandNode(parent, separator);
              node = this.parseNode(node);
              parent.push(node);
              if (node.range !== undefined) {
                documents.get(this.document).addDiagnostic(node.range, "命令の位置が不正です。");
              }
            } else if (section === "Inner" || section === "MeasureHead" || section === "Unknown") {
              let node = new CommandNode(parent, separator);
              node = this.parseNode(node);
              parent.push(node);
              if (commands.items.barlineoff.regexp.test(node.properties.name)) {
                this.showBarline = false;
              } else if (commands.items.barlineon.regexp.test(node.properties.name)) {
                this.showBarline = true;
              } else if (commands.items.gogostart.regexp.test(node.properties.name)) {
                this.isGogotime = true;
              } else if (commands.items.gogoend.regexp.test(node.properties.name)) {
                this.isGogotime = false;
              } else if (commands.items.dummystart.regexp.test(node.properties.name)) {
                this.isDummyNote = true;
              } else if (commands.items.dummyend.regexp.test(node.properties.name)) {
                this.isDummyNote = false;
              } else if (
                commands.items.n.regexp.test(node.properties.name) ||
                commands.items.e.regexp.test(node.properties.name) ||
                commands.items.m.regexp.test(node.properties.name) ||
                commands.items.branchend.regexp.test(node.properties.name)
              ) {
                this.isBalloon = false;
              }
              if (parent.find((x) => x instanceof ChartTokenNode) !== undefined) {
                parent.properties.showBarline = this.showBarline;
                if (section === "MeasureHead" && node.range !== undefined) {
                  documents
                    .get(this.document)
                    .addDiagnostic(
                      node.range,
                      "小節の途中に配置されています。",
                      "Realtime",
                      DiagnosticSeverity.Warning
                    );
                }
              }
            } else if (section === "End") {
              if (!parent.children.every((x) => x instanceof CommandNode)) {
                const node = parent.findLast((x) => x instanceof NoteNode) as NoteNode | undefined;
                if (node !== undefined) {
                  documents
                    .get(this.document)
                    .addDiagnostic(
                      new Range(node.range.end, node.range.end),
                      "小節が閉じられていません。",
                      "Unedited"
                    );
                }
              }
              this.position--;
              return parent;
            } else {
              documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
            }
          } else if (token.kind === "Notes") {
            if (/[79]/.test(token.value)) {
              this.isBalloon = true;
              this.balloonId++;
            } else if (/[123456]/.test(token.value)) {
              this.isBalloon = false;
            }
            const balloonId = this.isBalloon ? this.balloonId : undefined;
            const node = new NoteNode(parent, token, this.isGogotime, this.isDummyNote, balloonId);
            parent.push(node);
            if (this.isBalloon && /8/.test(token.value)) {
              this.isBalloon = false;
            }
          } else if (token.kind === "MeasureEnd") {
            const node = new MeasureEndNode(parent, token, this.isGogotime, this.isDummyNote);
            parent.push(node);
            return parent;
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
          }
        } else {
          documents.get(this.document).addDiagnostic(token.range, "No processing defined");
        }
      }
    }
    if (this.position >= this.tokens.length) {
      if (parent instanceof ChartNode) {
        const lastEol = findLast(this.tokens, (x) => x.kind === "EndOfLine");
        if (lastEol?.range !== undefined) {
          documents.get(this.document).addDiagnostic(lastEol.range, "#END がありません。");
        }
      }
    }
    return parent;
  }
}
