import { commands } from "./constants/commands";
import { headers } from "./constants/headers";
import { Lexer, Token } from "./lexer";
import { findLast } from "lodash";
import { tokenizedRawParameter } from "./util/lexerUtil";
import { Diagnostic, DiagnosticSeverity, Range, TextDocument } from "vscode";
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
  BalloonInfo,
} from "./types/node";
import { ChartState } from "./types/state";
import { DiagnosticResult } from "./diagnostics";

// TODO #BRANCHENDを跨いた風船音符ってどうなる？切れる？
// TODO 二人用譜面のとき、風船音符は1Pと2Pで分けて書ける？

type ParseResult = {
  root: RootNode;
  diagnostics: DiagnosticResult;
};

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
  private balloonInfo: BalloonInfo = { id: 0, headerName: "BALLOON" };
  /**
   * 風船音符のID
   */
  private balloonId: number = -1;
  private norBalloonId: number = -1;
  private expBalloonId: number = -1;
  private masBalloonId: number = -1;
  /**
   * 譜面状態
   */
  private chartState: ChartState = new ChartState();

  private diagnostics: DiagnosticResult = { realtime: [], unedited: [] };

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
  public parse(): ParseResult {
    this.diagnostics = { realtime: [], unedited: [] };
    let node = new RootNode(this.document.getText());
    node = this.parseNode(node);
    return { root: node, diagnostics: this.diagnostics };
  }

  /**
   * 子から最後のRootHeadersNodeを検索（ない場合は作成）し、パースする
   * @param parent
   * @param token
   * @returns
   */
  private parseFindLastOrPushRootHeaders(parent: RootNode, token: Token): RootHeadersNode {
    let findNode = parent.findLastRange<RootHeadersNode>((x) => x instanceof RootHeadersNode);
    if (findNode === undefined) {
      let node = new RootHeadersNode(parent, token.range);
      node = this.parseNode(node);
      parent.push(node);
      return node;
    } else {
      findNode = this.parseNode(findNode);
      return findNode;
    }
  }

  /**
   * 子から最後のCourseNodeを検索（ない場合は作成）し、パースする
   * @param parent
   * @param token
   * @returns
   */
  private parseFindLastOrPushCourse(parent: RootNode, token: Token): CourseNode {
    let findNode = parent.findLastRange<CourseNode>((x) => x instanceof CourseNode);
    if (findNode === undefined) {
      let node = new CourseNode(parent, token.range);
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
   * @param token
   * @returns
   */
  private parseFindLastOrPushStyleHeaders(parent: StyleNode, token: Token): StyleHeadersNode {
    let findNode = parent.findLastRange<StyleHeadersNode>((x) => x instanceof StyleHeadersNode);
    if (findNode === undefined) {
      let node = new StyleHeadersNode(parent, token.range);
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
        this.diagnostics.realtime.push(new Diagnostic(token.range, "不正なテキストです。"));
        parent.pushRange(token.range);
      } else {
        if (parent instanceof RootNode) {
          if (token.kind === "Header") {
            const section = headers.get(token.value)?.section ?? "Unknown";
            if (section === "Course" || section === "Style" || this.chartAfterOnce) {
              if (this.chartAfter) {
                this.chartAfter = false;
                let node = new CourseNode(parent, token.range);
                node = this.parseNode(node);
                parent.push(node);
              } else {
                this.parseFindLastOrPushCourse(parent, token);
              }
            } else if (section === "Root" || section === "Unknown") {
              this.parseFindLastOrPushRootHeaders(parent, token);
            } else {
              this.diagnostics.realtime.push(new Diagnostic(token.range, "不正なテキストです。"));
              parent.pushRange(token.range);
            }
          } else if (token.kind === "Command") {
            if (this.chartAfter) {
              this.chartAfter = false;
              let node = new CourseNode(parent, token.range);
              node = this.parseNode(node);
              parent.push(node);
            } else {
              this.parseFindLastOrPushCourse(parent, token);
            }
          } else if (token.kind === "Notes") {
            this.diagnostics.realtime.push(new Diagnostic(token.range, "#START がありません。"));
            parent.pushRange(token.range);
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            this.diagnostics.realtime.push(new Diagnostic(token.range, "不正なテキストです。"));
            parent.pushRange(token.range);
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
            let node = new HeaderNode(parent, token.range, separator);
            node = this.parseNode(node);
            parent.push(node);
          } else if (token.kind === "Command") {
            this.position--;
            return parent;
          } else if (token.kind === "Notes") {
            this.diagnostics.realtime.push(new Diagnostic(token.range, "#START がありません。"));
            parent.pushRange(token.range);
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            this.diagnostics.realtime.push(new Diagnostic(token.range, "不正なテキストです。"));
            parent.pushRange(token.range);
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
                let node = new StyleNode(parent, token.range);
                node = this.parseNode(node);
                parent.push(node);
                this.chartState = new ChartState();
                this.isBalloon = false;
                this.balloonId = -1;
                this.norBalloonId = -1;
                this.expBalloonId = -1;
                this.masBalloonId = -1;
              }
            } else if (section === "Root") {
              this.position--;
              return parent;
            } else {
              this.diagnostics.realtime.push(new Diagnostic(token.range, "不正なテキストです。"));
              parent.pushRange(token.range);
            }
          } else if (token.kind === "Command") {
            let node = new StyleNode(parent, token.range);
            node = this.parseNode(node);
            parent.push(node);
            this.chartState = new ChartState();
            this.isBalloon = false;
            this.balloonId = -1;
            this.norBalloonId = -1;
            this.expBalloonId = -1;
            this.masBalloonId = -1;
          } else if (token.kind === "Notes") {
            this.diagnostics.realtime.push(new Diagnostic(token.range, "#START がありません。"));
            parent.pushRange(token.range);
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            this.diagnostics.realtime.push(new Diagnostic(token.range, "不正なテキストです。"));
            parent.pushRange(token.range);
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
                this.parseFindLastOrPushStyleHeaders(parent, token);
              }
            } else if (section === "Root") {
              this.position--;
              return parent;
            } else {
              this.diagnostics.realtime.push(new Diagnostic(token.range, "不正なテキストです。"));
              parent.pushRange(token.range);
            }
          } else if (token.kind === "Command") {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            const separator = info?.separator ?? "Unknown";
            if (section === "Outer" || section === "Unknown") {
              let node = new CommandNode(parent, token.range, separator);
              node = this.parseNode(node);
              parent.push(node);
            } else if (section === "Start") {
              let chart = new ChartNode(parent, token.range);
              let start = new CommandNode(chart, token.range, separator);
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
              let node = new CommandNode(parent, token.range, separator);
              node = this.parseNode(node);
              parent.push(node);
              this.diagnostics.realtime.push(new Diagnostic(node.range, "#START がありません。"));
              parent.pushRange(token.range);
            } else {
              this.diagnostics.realtime.push(new Diagnostic(token.range, "不正なテキストです。"));
              parent.pushRange(token.range);
            }
          } else if (token.kind === "Notes") {
            this.diagnostics.realtime.push(new Diagnostic(token.range, "#START がありません。"));
            parent.pushRange(token.range);
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            this.diagnostics.realtime.push(new Diagnostic(token.range, "不正なテキストです。"));
            parent.pushRange(token.range);
          }
        } else if (parent instanceof HeaderNode || parent instanceof CommandNode) {
          if (
            (parent instanceof HeaderNode && token.kind === "Header") ||
            (parent instanceof CommandNode && token.kind === "Command")
          ) {
            const node = new StatementNameNode(parent, token);
            parent.push(node);
          } else if (token.kind === "RawParameter") {
            const rawParameter = new ParametersNode(parent, token.range);
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
            this.diagnostics.realtime.push(new Diagnostic(token.range, "不正なテキストです。"));
            parent.pushRange(token.range);
          }
        } else if (parent instanceof ChartNode || parent instanceof BranchSectionNode) {
          if (token.kind === "Header") {
            this.diagnostics.realtime.push(new Diagnostic(token.range, "ヘッダの位置が不正です。"));
            parent.pushRange(token.range);
          } else if (token.kind === "Command") {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            const separator = info?.separator ?? "Unknown";
            if (section === "Outer" || section === "Start") {
              let node = new CommandNode(parent, token.range, separator);
              node = this.parseNode(node);
              parent.push(node);
              this.diagnostics.realtime.push(new Diagnostic(token.range, "命令の位置が不正です。"));
            } else if (section === "Inner" || section === "MeasureHead" || section === "Unknown") {
              this.chartState.measure++;
              let node = new MeasureNode(parent, token.range, this.chartState);
              node = this.parseNode(node);
              if (
                node.children.length > 0 &&
                node.children.every((x) => x instanceof CommandNode)
              ) {
                // 命令のみの場合は小節から命令に置き換える
                this.chartState.measure--;
                for (const child of node.children as (CommandNode | ChartStateCommandNode)[]) {
                  if (child instanceof ChartStateCommandNode) {
                    child.properties.chartState.measure--;
                  }
                  parent.push(child);
                }
              } else {
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
                  let branch = new BranchNode(parent, token.range, this.chartState);
                  let command = new CommandNode(branch, token.range, separator);
                  command = this.parseNode(command);
                  branch.push(command);
                  this.position++;
                  branch = this.parseNode(branch);
                  parent.push(branch);
                  // 分岐ごとの差分を調べる
                  const sections = branch.filter<BranchSectionNode>(
                    (x) => x instanceof BranchSectionNode
                  );
                  const branchChartState = branch.properties.endChartState;
                  for (const section of sections) {
                    const nem = section.find((x) => x instanceof CommandNode);
                    if (nem === undefined) {
                      continue;
                    }
                    const sectionChartState = section.properties.endChartState;
                    if (branchChartState.measure !== sectionChartState.measure) {
                      this.diagnostics.unedited.push(
                        new Diagnostic(
                          nem.range,
                          `譜面分岐の小節数が統一されていません。\n${
                            branchChartState.measure - sectionChartState.measure
                          }小節足りていません。`,
                          DiagnosticSeverity.Warning
                        )
                      );
                    }
                  }
                  // 譜面状態の取得
                  this.chartState = { ...branch.properties.endChartState };
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
                  this.chartState.measure++;
                  let node = new MeasureNode(parent, token.range, this.chartState);
                  node = this.parseNode(node);
                  if (
                    node.children.length > 0 &&
                    node.children.every((x) => x instanceof CommandNode)
                  ) {
                    // 命令のみの場合は小節から命令に置き換える
                    this.chartState.measure--;
                    for (const child of node.children as (CommandNode | ChartStateCommandNode)[]) {
                      if (child instanceof ChartStateCommandNode) {
                        child.properties.chartState.measure--;
                      }
                      parent.push(child);
                    }
                  } else {
                    parent.push(node);
                  }
                }
              } else {
                if (parent instanceof BranchSectionNode) {
                  // 分岐から抜ける
                  this.position--;
                  return parent;
                } else {
                  // 普通の命令と同じ対応をする
                  this.chartState.measure++;
                  let node = new MeasureNode(parent, token.range, this.chartState);
                  node = this.parseNode(node);
                  if (
                    node.children.length > 0 &&
                    node.children.every((x) => x instanceof CommandNode)
                  ) {
                    // 命令のみの場合は小節から命令に置き換える
                    this.chartState.measure--;
                    for (const child of node.children as (CommandNode | ChartStateCommandNode)[]) {
                      if (child instanceof ChartStateCommandNode) {
                        child.properties.chartState.measure--;
                      }
                      parent.push(child);
                    }
                  } else {
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
                if (this.chartState.rollState !== "None") {
                  const lastMeasure = parent.findLastRange((x) => x instanceof MeasureNode);
                  if (lastMeasure !== undefined) {
                    const text =
                      this.chartState.rollState === "Roll" ||
                      this.chartState.rollState === "RollBig"
                        ? "連打"
                        : "風船";
                    this.diagnostics.unedited.push(
                      new Diagnostic(
                        new Range(lastMeasure.range.end, lastMeasure.range.end),
                        `${text}音符が途切れています。`,
                        DiagnosticSeverity.Error
                      )
                    );
                  }
                }
                let node = new CommandNode(parent, token.range, separator);
                node = this.parseNode(node);
                parent.push(node);
                this.chartAfter = true;
                this.chartAfterOnce = true;
                return parent;
              }
            } else {
              this.diagnostics.realtime.push(new Diagnostic(token.range, "不正なテキストです。"));
              parent.pushRange(token.range);
            }
          } else if (token.kind === "Notes" || token.kind === "MeasureEnd") {
            this.chartState.measure++;
            let node = new MeasureNode(parent, token.range, this.chartState);
            node = this.parseNode(node);
            parent.push(node);
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            this.diagnostics.realtime.push(new Diagnostic(token.range, "不正なテキストです。"));
            parent.pushRange(token.range);
          }
        } else if (parent instanceof BranchNode) {
          if (token.kind === "Header") {
            this.diagnostics.realtime.push(new Diagnostic(token.range, "ヘッダの位置が不正です。"));
            parent.pushRange(token.range);
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
              if (info === commands.items.n) {
                this.chartState.branchState = "Normal";
                branchSection = new NBranchSectionNode(parent, token.range);
              } else if (info === commands.items.e) {
                this.chartState.branchState = "Expert";
                branchSection = new EBranchSectionNode(parent, token.range);
              } else {
                this.chartState.branchState = "Master";
                branchSection = new MBranchSectionNode(parent, token.range);
              }
              let command = new CommandNode(branchSection, token.range, separator);
              command = this.parseNode(command);
              branchSection.push(command);
              this.position++;
              branchSection = this.parseNode(branchSection);
              this.chartState.branchState = "None";
              if (
                (parent.properties.normal && branchSection instanceof NBranchSectionNode) ||
                (parent.properties.expert && branchSection instanceof EBranchSectionNode) ||
                (parent.properties.master && branchSection instanceof MBranchSectionNode)
              ) {
                this.diagnostics.realtime.push(
                  new Diagnostic(branchSection.range, "譜面分岐が重複しています。")
                );
              }
              parent.push(branchSection);
            } else if (info === commands.items.branchend) {
              let node = new CommandNode(parent, token.range, separator);
              node = this.parseNode(node);
              parent.push(node);
              return parent;
            } else {
              this.position--;
              return parent;
            }
          } else if (token.kind === "Notes" || token.kind === "MeasureEnd") {
            this.diagnostics.realtime.push(
              new Diagnostic(token.range, "譜面分岐の区分がありません。")
            );
            this.position--;
            return parent;
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          }
        } else if (parent instanceof MeasureNode) {
          if (token.kind === "Header") {
            this.diagnostics.realtime.push(new Diagnostic(token.range, "ヘッダの位置が不正です。"));
            parent.pushRange(token.range);
          } else if (token.kind === "Command") {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            const separator = info?.separator ?? "Unknown";
            if (section === "Outer" || section === "Start") {
              let node = new CommandNode(parent, token.range, separator);
              node = this.parseNode(node);
              parent.push(node);
              this.diagnostics.realtime.push(new Diagnostic(node.range, "命令の位置が不正です。"));
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
              let node = new ChartStateCommandNode(parent, token.range, separator, this.chartState);
              node = this.parseNode(node);
              parent.push(node);
              if (parent.find((x) => x instanceof ChartTokenNode) !== undefined) {
                if (section === "MeasureHead") {
                  this.diagnostics.realtime.push(
                    new Diagnostic(
                      node.range,
                      "小節の途中に配置されています。",
                      DiagnosticSeverity.Warning
                    )
                  );
                }
              }
            } else if (section === "Branch") {
              if (
                info !== commands.items.branchstart &&
                parent.findParent((x) => x instanceof BranchNode) === undefined
              ) {
                // 普通の命令と同じ対応をする
                let node = new CommandNode(parent, token.range, separator);
                node = this.parseNode(node);
                parent.push(node);
                this.diagnostics.realtime.push(
                  new Diagnostic(node.range, "#BRANCHSTART がありません。")
                );
              } else if (
                parent.children.length > 0 &&
                parent.children.every((x) => x instanceof CommandNode)
              ) {
                // 命令のみの場合は抜ける
                this.position--;
                return parent;
              } else {
                const node = parent.findDepth((x) => x instanceof NoteNode);
                if (node !== undefined) {
                  this.diagnostics.unedited.push(
                    new Diagnostic(
                      new Range(node.range.end, node.range.end),
                      "小節が閉じられていません。"
                    )
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
                const node = parent.findDepth((x) => x instanceof NoteNode);
                if (node !== undefined) {
                  this.diagnostics.unedited.push(
                    new Diagnostic(
                      new Range(node.range.end, node.range.end),
                      "小節が閉じられていません。"
                    )
                  );
                }
              }
              this.position--;
              return parent;
            } else {
              this.diagnostics.realtime.push(new Diagnostic(token.range, "不正なテキストです。"));
              parent.pushRange(token.range);
            }
          } else if (token.kind === "Notes" || token.kind === "MeasureEnd") {
            // 曖昧な譜面状態を警告
            if (this.chartState.showBarline === "unknown") {
              this.chartState.showBarline = false;
              this.diagnostics.realtime.push(
                new Diagnostic(
                  token.range,
                  "譜面分岐後の小節線表示状態（#BARLINEOFF,#BARLINEON）が統一されていません。",
                  DiagnosticSeverity.Hint
                )
              );
            }
            if (this.chartState.isGogotime === "unknown") {
              this.chartState.isGogotime = false;
              this.diagnostics.realtime.push(
                new Diagnostic(
                  token.range,
                  "譜面分岐後のゴーゴータイム状態（#GOGOSTART,#GOGOEND）が統一されていません。",
                  DiagnosticSeverity.Hint
                )
              );
            }
            if (this.chartState.isDummyNote === "unknown") {
              this.chartState.isDummyNote = false;
              this.diagnostics.realtime.push(
                new Diagnostic(
                  token.range,
                  "譜面分岐後のダミーノーツ状態（#DUMMYSTART,#DUMMYEND）が統一されていません。",
                  DiagnosticSeverity.Hint
                )
              );
            }
            if (token.kind === "Notes") {
              if (token.value === "5") {
                this.chartState.rollState = "Roll";
              } else if (token.value === "6") {
                this.chartState.rollState = "RollBig";
              } else if (token.value === "7") {
                this.chartState.rollState = "Balloon";
              } else if (token.value === "9") {
                this.chartState.rollState = "BalloonBig";
              } else if (!/[80]/.test(token.value)) {
                if (token.value !== "8" && this.chartState.rollState !== "None") {
                  const text =
                    this.chartState.rollState === "Roll" || this.chartState.rollState === "RollBig"
                      ? "連打"
                      : "風船";
                  this.diagnostics.realtime.push(
                    new Diagnostic(
                      token.range,
                      `${text}音符が途切れています。`,
                      DiagnosticSeverity.Warning
                    )
                  );
                }
                this.chartState.rollState = "None";
              }
              if (/[79]/.test(token.value)) {
                this.isBalloon = true;
                // 風船打数が分岐で書かれているかどうかの確認
                const branchSection = parent.findParent((x) => x instanceof BranchSectionNode);
                const style = parent.findParent<StyleNode>((x) => x instanceof StyleNode);
                if (
                  branchSection === undefined ||
                  style === undefined ||
                  !style.properties.isBranchBalloon
                ) {
                  this.balloonInfo.headerName = "BALLOON";
                  this.balloonId++;
                  this.balloonInfo.id = this.balloonId;
                } else if (branchSection instanceof NBranchSectionNode) {
                  this.balloonInfo.headerName = "BALLOONNOR";
                  this.norBalloonId++;
                  this.balloonInfo.id = this.norBalloonId;
                } else if (branchSection instanceof EBranchSectionNode) {
                  this.balloonInfo.headerName = "BALLOONEXP";
                  this.expBalloonId++;
                  this.balloonInfo.id = this.expBalloonId;
                } else if (branchSection instanceof MBranchSectionNode) {
                  this.balloonInfo.headerName = "BALLOONMAS";
                  this.masBalloonId++;
                  this.balloonInfo.id = this.masBalloonId;
                }
              } else if (/[123456]/.test(token.value)) {
                this.isBalloon = false;
              }
              const balloonInfo = this.isBalloon ? this.balloonInfo : undefined;
              const node = new NoteNode(parent, token, this.chartState, balloonInfo);
              parent.push(node);
              if (balloonInfo !== undefined && this.isBalloon && /[79]/.test(token.value)) {
                const styleNode = parent.findParent<StyleNode>((x) => x instanceof StyleNode);
                if (styleNode !== undefined) {
                  const balloonHeader = styleNode.properties.headers.find(
                    (x) => x.name === balloonInfo.headerName
                  );
                  const wordRange = this.document.getWordRangeAtPosition(
                    token.range.end,
                    /([79]0*8?|0*8|0+)/
                  );
                  if (
                    wordRange !== undefined &&
                    (balloonHeader === undefined ||
                      balloonHeader.parameters.length <= balloonInfo.id)
                  ) {
                    this.diagnostics.unedited.push(
                      new Diagnostic(
                        wordRange,
                        "風船音符の打数が定義されていません。",
                        DiagnosticSeverity.Warning
                      )
                    );
                  }
                }
              }
              if (/8/.test(token.value)) {
                this.chartState.rollState = "None";
                this.isBalloon = false;
              }
            } else {
              const node = new MeasureEndNode(parent, token, this.chartState);
              parent.push(node);
              return parent;
            }
          } else if (token.kind === "EndOfLine") {
            parent.pushRange(token.range);
          } else {
            this.diagnostics.unedited.push(new Diagnostic(token.range, "不正なテキストです。"));
            parent.pushRange(token.range);
          }
        } else {
          this.diagnostics.realtime.push(new Diagnostic(token.range, "No processing defined"));
          parent.pushRange(token.range);
        }
      }
    }
    if (this.position >= this.tokens.length) {
      if (parent instanceof ChartNode) {
        const lastEol = findLast(this.tokens, (x) => x.kind === "EndOfLine");
        if (lastEol !== undefined) {
          this.diagnostics.realtime.push(new Diagnostic(lastEol.range, "#END がありません。"));
        }
      }
    }
    return parent;
  }
}
