import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { Lexer, Token } from "./lexer";
import { findLast } from "lodash";
import { tokenizedRawParameter } from "../util/lexer";
import { DiagnosticSeverity, Range, TextDocument } from "vscode";
import {
  ChartNode,
  CommandNode,
  StyleHeadersNode,
  CourseNode,
  DelimiterNode,
  RootHeadersNode,
  RootNode,
  HeaderNode,
  StatementNameNode,
  MeasureEndNode,
  MeasureNode,
  NoteNode,
  ParameterNode,
  ParametersNode,
  ParentNode,
  ChartTokenNode,
  StyleNode,
  BranchNode,
  NBranchSectionNode,
  EBranchSectionNode,
  MBranchSectionNode,
  BranchSectionNode,
  ChartStateCommandNode,
} from "./node";
import { documents } from "../documents";
import { ChartState } from "./state";

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
   * 風船音符
   */
  private isBalloon: boolean = false;
  /**
   * 風船音符のID
   */
  private balloonId: number = -1;
  /**
   * 譜面状態
   */
  private chartState: ChartState = new ChartState();

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
    let node = new RootNode();
    node = this.parseNode(node);
    documents.get(this.document).showRealtimeDiagnostic();
    return node;
  }

  /**
   * 子から最後のCourseNodeを検索（ない場合は作成）し、パースする
   * @param parent
   * @returns
   */
  private parseFindLastOrPushCourse(parent: RootNode): CourseNode {
    let findNode = findLast(parent.children, (x) => x instanceof CourseNode) as
      | CourseNode
      | undefined;
    if (findNode === undefined) {
      let node = new CourseNode(parent);
      node = this.parseNode(node);
      parent.push(node);
      return node;
    } else {
      findNode = this.parseNode(findNode);
      return findNode;
    }
  }

  /**
   * 子から最後のRootHeadersNodeを検索（ない場合は作成）し、パースする
   * @param parent
   * @returns
   */
  private parseFindLastOrPushRootHeaders(parent: RootNode): RootHeadersNode {
    let findNode = findLast(parent.children, (x) => x instanceof RootHeadersNode) as
      | RootHeadersNode
      | undefined;
    if (findNode === undefined) {
      let node = new RootHeadersNode(parent);
      node = this.parseNode(node);
      parent.push(node);
      return node;
    } else {
      findNode = this.parseNode(findNode);
      return findNode;
    }
  }

  /**
   * 子から最後のStyleHeadersNodeを検索（ない場合は作成）し、パースする
   * @param parent
   * @returns
   */
  private parseFindLastOrPushStyleHeaders(parent: StyleNode): StyleHeadersNode {
    let findNode = findLast(parent.children, (x) => x instanceof StyleHeadersNode) as
      | StyleHeadersNode
      | undefined;
    if (findNode === undefined) {
      let node = new StyleHeadersNode(parent);
      node = this.parseNode(node);
      parent.push(node);
      return node;
    } else {
      findNode = this.parseNode(findNode);
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
            if (section === "Course" || section === "Style" || this.chartAfterOnce) {
              if (this.chartAfter) {
                this.chartAfter = false;
                let node = new CourseNode(parent);
                node = this.parseNode(node);
                parent.push(node);
              } else {
                this.parseFindLastOrPushCourse(parent);
              }
            } else if (section === "Root" || section === "Unknown") {
              this.parseFindLastOrPushRootHeaders(parent);
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
              this.parseFindLastOrPushCourse(parent);
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
        } else if (parent instanceof RootHeadersNode || parent instanceof StyleHeadersNode) {
          if (token.kind === "Header") {
            const info = headers.get(token.value);
            const section = info?.section ?? "Unknown";
            if (
              parent instanceof RootHeadersNode &&
              (section === "Course" || section === "Style")
            ) {
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
            if (
              section === "Course" ||
              section === "Style" ||
              section === "Unknown" ||
              this.chartAfterOnce
            ) {
              if (this.chartAfter && section !== "Style") {
                this.position--;
                return parent;
              } else {
                let node = new StyleNode(parent);
                node = this.parseNode(node);
                parent.push(node);
              }
            } else if (section === "Root") {
              this.position--;
              return parent;
            } else {
              documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
            }
          } else if (token.kind === "Command") {
            let node = new StyleNode(parent);
            node = this.parseNode(node);
            parent.push(node);
          } else if (token.kind === "Notes") {
            documents.get(this.document).addDiagnostic(token.range, "#START がありません。");
          } else if (token.kind === "MeasureEnd") {
            documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
          }
        } else if (parent instanceof StyleNode) {
          if (token.kind === "Header") {
            const section = headers.get(token.value)?.section ?? "Unknown";
            if (
              section === "Course" ||
              section === "Style" ||
              section === "Unknown" ||
              this.chartAfterOnce
            ) {
              if (this.chartAfter) {
                if (section === "Style") {
                  this.chartAfter = false;
                }
                this.position--;
                return parent;
              } else {
                this.parseFindLastOrPushStyleHeaders(parent);
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
            } else if (
              section === "Inner" ||
              section === "MeasureHead" ||
              section === "Branch" ||
              section === "End"
            ) {
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
        } else if (parent instanceof HeaderNode || parent instanceof CommandNode) {
          if (
            (parent instanceof HeaderNode && token.kind === "Header") ||
            (parent instanceof CommandNode && token.kind === "Command")
          ) {
            const node = new StatementNameNode(parent, token);
            parent.push(node);
          } else if (token.kind === "RawParameter") {
            const rawParameter = new ParametersNode(parent);
            const parameters = tokenizedRawParameter(token, parent.properties.separator);
            let parameterIndex = 0;
            for (const parameter of parameters) {
              if (parameter.kind === "RawParameter" || parameter.kind === "Parameter") {
                const node = new ParameterNode(
                  rawParameter,
                  {
                    kind: parameter.kind,
                    range: parameter.range,
                    value: parameter.value,
                  },
                  parameterIndex++
                );
                rawParameter.push(node);
              } else if (parameter.kind === "Delimiter") {
                const node = new DelimiterNode(rawParameter, {
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
          } else if (token.kind === "EndOfLine") {
            return parent;
          } else {
            documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
          }
        } else if (parent instanceof ChartNode || parent instanceof BranchSectionNode) {
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
              let node = new MeasureNode(parent, this.chartState);
              node = this.parseNode(node);
              if (
                node.children.length > 0 &&
                node.children.every((x) => x instanceof CommandNode)
              ) {
                // 命令のみの場合は小節から命令に置き換える
                for (const child of node.children as (CommandNode | ChartStateCommandNode)[]) {
                  parent.push(child);
                }
              } else {
                this.chartState.measure++;
                parent.push(node);
              }
            } else if (section === "Branch") {
              if (info === commands.items.branchstart) {
                if (parent instanceof BranchSectionNode) {
                  // 分岐から抜ける
                  this.position--;
                  return parent;
                } else {
                  // 譜面分岐の開始
                  this.chartState.measure--;
                  let branch = new BranchNode(parent, this.chartState);
                  let command = new CommandNode(branch, separator);
                  command = this.parseNode(command);
                  branch.push(command);
                  this.position++;
                  branch = this.parseNode(branch);
                  parent.push(branch);
                  // 分岐ごとの小節数を調べる
                  const sections = branch.findAll(
                    (x) => x instanceof BranchSectionNode
                  ) as BranchSectionNode[];
                  for (const section of sections.filter(
                    (x) => x.properties.measureCount !== branch.properties.measureCount
                  )) {
                    const nem = section.find((x) => x instanceof CommandNode) as
                      | CommandNode
                      | undefined;
                    if (nem !== undefined && nem.range !== undefined) {
                      documents
                        .get(this.document)
                        .addDiagnostic(
                          nem.range,
                          "譜面分岐の小節数が統一されていません。",
                          "Unedited",
                          DiagnosticSeverity.Warning
                        );
                    }
                  }
                  // 譜面状態の取得
                  this.chartState = { ...branch.properties.endChartState };
                  this.chartState.measure++;
                }
              } else if (
                info === commands.items.n ||
                info === commands.items.e ||
                info === commands.items.m ||
                info === commands.items.branchend
              ) {
                if (parent instanceof BranchSectionNode) {
                  // 分岐から抜ける
                  this.position--;
                  return parent;
                } else {
                  // 普通の命令と同じ対応をした上で構文エラーとする
                  let node = new MeasureNode(parent, this.chartState);
                  node = this.parseNode(node);
                  if (
                    node.children.length > 0 &&
                    node.children.every((x) => x instanceof CommandNode)
                  ) {
                    // 命令のみの場合は小節から命令に置き換える
                    for (const child of node.children as (CommandNode | ChartStateCommandNode)[]) {
                      parent.push(child);
                    }
                  } else {
                    this.chartState.measure++;
                    parent.push(node);
                  }
                  if (node.range !== undefined) {
                    documents
                      .get(this.document)
                      .addDiagnostic(token.range, "#BRANCHSTART がありません。");
                  }
                }
              } else {
                if (parent instanceof BranchSectionNode) {
                  // 分岐から抜ける
                  this.position--;
                  return parent;
                } else {
                  // 普通の命令と同じ対応をする
                  let node = new MeasureNode(parent, this.chartState);
                  node = this.parseNode(node);
                  if (
                    node.children.length > 0 &&
                    node.children.every((x) => x instanceof CommandNode)
                  ) {
                    // 命令のみの場合は小節から命令に置き換える
                    for (const child of node.children as (CommandNode | ChartStateCommandNode)[]) {
                      parent.push(child);
                    }
                  } else {
                    this.chartState.measure++;
                    parent.push(node);
                  }
                }
              }
            } else if (section === "End") {
              if (parent instanceof BranchSectionNode) {
                // 分岐を抜ける
                this.position--;
                return parent;
              } else {
                let node = new CommandNode(parent, separator);
                node = this.parseNode(node);
                parent.push(node);
                this.chartAfter = true;
                this.chartAfterOnce = true;
                this.chartState = new ChartState();
                this.isBalloon = false;
                this.balloonId = -1;
                return parent;
              }
            } else {
              documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
            }
          } else if (token.kind === "Notes" || token.kind === "MeasureEnd") {
            let node = new MeasureNode(parent, this.chartState);
            node = this.parseNode(node);
            this.chartState.measure++;
            parent.push(node);
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            documents.get(this.document).addDiagnostic(token.range, "不正なテキストです。");
          }
        } else if (parent instanceof BranchNode) {
          if (token.kind === "Header") {
            documents.get(this.document).addDiagnostic(token.range, "ヘッダの位置が不正です。");
          } else if (token.kind === "Command") {
            const info = commands.get(token.value);
            const separator = info?.separator ?? "Unknown";
            if (
              info === commands.items.n ||
              info === commands.items.e ||
              info === commands.items.m
            ) {
              let branchSection: BranchSectionNode;
              this.chartState = { ...parent.properties.startChartState };
              this.chartState.measure++;
              if (info === commands.items.n) {
                branchSection = new NBranchSectionNode(parent);
              } else if (info === commands.items.e) {
                branchSection = new EBranchSectionNode(parent);
              } else {
                branchSection = new MBranchSectionNode(parent);
              }
              let command = new CommandNode(branchSection, separator);
              command = this.parseNode(command);
              branchSection.push(command);
              this.position++;
              branchSection = this.parseNode(branchSection);
              parent.push(branchSection);
            } else if (info === commands.items.branchend) {
              let node = new CommandNode(parent, separator);
              node = this.parseNode(node);
              parent.push(node);
              return parent;
            } else {
              documents
                .get(this.document)
                .addDiagnostic(
                  token.range,
                  "暗黙的に #BRANCHEND が挿入されています。",
                  "Realtime",
                  DiagnosticSeverity.Hint
                );
              this.position--;
              return parent;
            }
          } else if (token.kind === "Notes" || token.kind === "MeasureEnd") {
            documents.get(this.document).addDiagnostic(token.range, "譜面分岐の区分がありません。");
            this.position--;
            return parent;
          } else if (token.kind === "EndOfLine") {
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
              if (info === commands.items.barlineoff) {
                this.chartState.showBarline = false;
              } else if (info === commands.items.barlineon) {
                this.chartState.showBarline = true;
              } else if (info === commands.items.gogostart) {
                this.chartState.isGogotime = true;
              } else if (info === commands.items.gogoend) {
                this.chartState.isGogotime = false;
              } else if (info === commands.items.dummystart) {
                this.chartState.isDummyNote = true;
              } else if (info === commands.items.dummyend) {
                this.chartState.isDummyNote = false;
              } else if (
                info === commands.items.n ||
                info === commands.items.e ||
                info === commands.items.m ||
                info === commands.items.branchend
              ) {
                this.isBalloon = false;
              }
              let node = new ChartStateCommandNode(parent, separator, this.chartState);
              node = this.parseNode(node);
              parent.push(node);
              if (parent.find((x) => x instanceof ChartTokenNode) !== undefined) {
                // TODO これなんのために書いてたっけ
                parent.properties.showBarline = this.chartState.showBarline;
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
            } else if (section === "Branch") {
              if (info === commands.items.section) {
                // 普通の命令と同じ対応をする
                let node = new CommandNode(parent, separator);
                node = this.parseNode(node);
                parent.push(node);
                if (parent.find((x) => x instanceof ChartTokenNode) !== undefined) {
                  // TODO これなんのために書いてたっけ
                  parent.properties.showBarline = this.chartState.showBarline;
                }
              } else if (
                parent.children.length > 0 &&
                parent.children.every((x) => x instanceof CommandNode)
              ) {
                // 命令のみの場合は抜ける
                this.position--;
                return parent;
              } else {
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
                this.position--;
                return parent;
              }
            } else if (section === "End") {
              if (
                parent.children.length > 0 &&
                !parent.children.every((x) => x instanceof CommandNode)
              ) {
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
            const node = new NoteNode(parent, token, this.chartState, balloonId);
            parent.push(node);
            if (balloonId !== undefined && this.isBalloon && /[79]/.test(token.value)) {
              const styleNode = parent.findParent((x) => x instanceof StyleNode) as
                | StyleNode
                | undefined;
              if (styleNode !== undefined) {
                const balloonHeader = styleNode.properties.headers.find(
                  (x) => x.name === "BALLOON"
                );
                const wordRange = this.document.getWordRangeAtPosition(
                  token.range.end,
                  /([79]0*8?|0*8|0+)/
                );
                if (
                  wordRange !== undefined &&
                  (balloonHeader === undefined || balloonHeader.parameters.length <= balloonId)
                ) {
                  documents
                    .get(this.document)
                    .addDiagnostic(
                      wordRange,
                      "風船音符の打数が定義されていません。",
                      "Unedited",
                      DiagnosticSeverity.Warning
                    );
                }
              }
            }
            if (this.isBalloon && /8/.test(token.value)) {
              this.isBalloon = false;
            }
          } else if (token.kind === "MeasureEnd") {
            const node = new MeasureEndNode(parent, token, this.chartState);
            parent.push(node);
            return parent;
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            documents
              .get(this.document)
              .addDiagnostic(token.range, "不正なテキストです。", "Unedited");
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
