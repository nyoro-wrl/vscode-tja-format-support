import * as vscode from "vscode";
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
  BranchSectionNode,
  ChartStateCommandNode,
  SongNode,
  HeadersNode,
} from "./types/node";
import { ChartState } from "./types/state";
import { DiagnosticResult } from "./providers/diagnostics";
import { Separator } from "./types/statement";
import { CommandSection, ICommand } from "./types/command";
import { isTmg } from "./util/util";

// TODO #BRANCHSTART #BRANCHENDを跨いた風船音符の対応（不明とする）
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
   * 譜面状態
   */
  private chartState: ChartState = new ChartState();
  private initialBpm: number | undefined = undefined;
  private nowBalloonId: number | undefined;
  private balloonId: number = -1;
  private norBalloonId: number = -1;
  private expBalloonId: number = -1;
  private masBalloonId: number = -1;

  private diagnostics: DiagnosticResult = { realtime: [], unedited: [] };

  private parseCancel: vscode.CancellationToken | undefined;

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
  public parse(cancel?: vscode.CancellationToken): ParseResult {
    this.diagnostics = { realtime: [], unedited: [] };
    let node = new RootNode(this.document.getText());
    this.parseCancel = cancel;
    node = this.parseNode(node);
    this.parseCancel = undefined;
    return { root: node, diagnostics: this.diagnostics };
  }

  /**
   * 共通ヘッダの作成
   * @param parent
   * @param token
   * @returns
   */
  private parseRootHeaders(parent: RootNode, token: Token): void {
    let findNode = <RootHeadersNode>parent.children.find((x) => x instanceof RootHeadersNode);
    if (findNode === undefined) {
      // 共通ヘッダの作成
      let node = new RootHeadersNode(parent, token.range);
      node = this.parseNode(node);
      parent.push(node);
    } else {
      // 既存の共通ヘッダを参照
      findNode = this.parseNode(findNode);
    }
  }

  /**
   * コースの作成
   * @param parent
   * @param token
   */
  private parseCourse(parent: RootNode, token: Token): void {
    if (this.chartAfter) {
      this.chartAfter = false;
      let node = new CourseNode(parent, token.range);
      node = this.parseNode(node);
      parent.push(node);
    } else {
      this.parseFindLastOrPushCourse(parent, token);
    }
  }

  /**
   * プレイスタイルの作成
   * @param parent
   * @param token
   */
  private parseStyle(parent: CourseNode, token: Token): void {
    let node = new StyleNode(parent, token.range);
    node = this.parseNode(node);
    parent.push(node);

    // Check for unused balloon parameters after parsing the style
    this.checkUnusedBalloonParameters(node);

    this.chartState = new ChartState(this.initialBpm);
    this.nowBalloonId = undefined;
    this.balloonId = -1;
    this.norBalloonId = -1;
    this.expBalloonId = -1;
    this.masBalloonId = -1;
  }

  /**
   * 未使用の風船パラメータをチェックして警告を表示
   * @param styleNode
   */
  private checkUnusedBalloonParameters(styleNode: StyleNode): void {
    const balloonHeaders = [
      {
        header: styleNode.properties.headers.find((x) => headers.items.balloon.regexp.test(x.name)),
        maxId: this.balloonId,
      },
      {
        header: styleNode.properties.headers.find((x) =>
          headers.items.balloonnor.regexp.test(x.name)
        ),
        maxId: this.norBalloonId,
      },
      {
        header: styleNode.properties.headers.find((x) =>
          headers.items.balloonexp.regexp.test(x.name)
        ),
        maxId: this.expBalloonId,
      },
      {
        header: styleNode.properties.headers.find((x) =>
          headers.items.balloonmas.regexp.test(x.name)
        ),
        maxId: this.masBalloonId,
      },
    ];

    for (const { header, maxId } of balloonHeaders) {
      if (header) {
        // Check if there are any non-empty parameters
        const hasNonEmptyParameters = header.parameters.some((param) => param.trim() !== "");

        if (maxId === -1 && hasNonEmptyParameters) {
          // BALLOON: header has parameters but no balloon notes in chart - warn on parameters
          const headerNode = styleNode.find<HeaderNode>(
            (x) => x instanceof HeaderNode && x.properties.name === header.name
          );
          if (headerNode) {
            const parametersNode = headerNode.children.find((x) => x instanceof ParametersNode);
            if (parametersNode instanceof ParametersNode) {
              const diagnosticRange = new vscode.Range(
                parametersNode.range.start,
                parametersNode.range.end
              );
              this.addDiagnostic(
                "Unedited",
                diagnosticRange,
                "風船音符がありません。",
                DiagnosticSeverity.Warning
              );
            }
          }
        } else if (maxId > -1 && header.parameters.length > maxId + 1) {
          // Find the range of unused parameters
          const headerNode = styleNode.find<HeaderNode>(
            (x) => x instanceof HeaderNode && x.properties.name === header.name
          );
          if (headerNode) {
            const parametersNode = headerNode.children.find((x) => x instanceof ParametersNode);
            if (parametersNode instanceof ParametersNode) {
              // Find the first unused parameter
              const firstUnusedIndex = maxId + 1;
              let startRange: vscode.Range | undefined;
              let endRange: vscode.Range | undefined;

              // Find the start position (including preceding delimiter)
              for (let i = 0; i < parametersNode.children.length; i++) {
                const child = parametersNode.children[i];
                if (child instanceof ParameterNode && child.properties.index === firstUnusedIndex) {
                  // Look for the preceding delimiter
                  if (i > 0 && parametersNode.children[i - 1] instanceof DelimiterNode) {
                    startRange = parametersNode.children[i - 1].range;
                  } else {
                    startRange = child.range;
                  }
                  break;
                }
              }

              // Find the end position (last unused parameter)
              for (let i = parametersNode.children.length - 1; i >= 0; i--) {
                const child = parametersNode.children[i];
                if (child instanceof ParameterNode && child.properties.index >= firstUnusedIndex) {
                  endRange = child.range;
                  break;
                }
              }

              if (startRange && endRange) {
                const diagnosticRange = new vscode.Range(startRange.start, endRange.end);
                this.addDiagnostic(
                  "Unedited",
                  diagnosticRange,
                  "風船音符がありません。",
                  DiagnosticSeverity.Warning
                );
              }
            }
          }
        }
      }
    }
  }

  /**
   * プレイスタイル別ヘッダの作成
   * @param parent
   * @param token
   * @returns
   */
  private parseStyleHeaders(parent: StyleNode, token: Token): void {
    let findNode = <StyleHeadersNode>parent.children.find((x) => x instanceof StyleHeadersNode);
    if (findNode === undefined) {
      // プレイスタイル別ヘッダの作成
      let node = new StyleHeadersNode(parent, token.range);
      node = this.parseNode(node);
      parent.push(node);
    } else {
      // 既存のプレイスタイル別ヘッダを参照
      findNode = this.parseNode(findNode);
    }
  }

  /**
   * ヘッダの作成
   * @param parent
   * @param token
   * @param separator
   */
  private parseHeader(
    parent: RootHeadersNode | StyleHeadersNode,
    token: Token,
    separator: Separator
  ): void {
    let node = new HeaderNode(parent, token.range, separator);
    node = this.parseNode(node);
    parent.push(node);
  }

  /**
   * 命令の作成
   * @param parent
   * @param token
   * @param separator
   */
  private parseCommand(
    parent: StyleNode | ChartNode | MeasureNode | BranchNode | SongNode | BranchSectionNode,
    token: Token,
    separator: Separator
  ): CommandNode {
    let node = new CommandNode(parent, token.range, separator);
    node = this.parseNode(node);
    parent.push(node);
    return node;
  }

  /**
   * 譜面状態つき命令の作成
   * @param parent
   * @param token
   * @param section
   * @param separator
   * @param command
   */
  private parseChateStateCommand(
    parent: ChartNode | MeasureNode | SongNode | BranchSectionNode,
    token: Token,
    section: CommandSection,
    separator: Separator,
    command?: ICommand
  ): void {
    if (command === commands.items.barlineoff) {
      if (this.chartState.showBarline === false) {
        this.addDiagnostic("Unedited", token.range, "不要な命令です。", DiagnosticSeverity.Warning, "redundant-command");
      }
      this.chartState.showBarline = false;
    } else if (command === commands.items.barlineon) {
      if (this.chartState.showBarline === true) {
        this.addDiagnostic("Unedited", token.range, "不要な命令です。", DiagnosticSeverity.Warning, "redundant-command");
      }
      this.chartState.showBarline = true;
    } else if (command === commands.items.gogostart) {
      if (this.chartState.isGogotime === true) {
        this.addDiagnostic("Unedited", token.range, "不要な命令です。", DiagnosticSeverity.Warning, "redundant-command");
      }
      this.chartState.isGogotime = true;
    } else if (command === commands.items.gogoend) {
      if (this.chartState.isGogotime === false) {
        this.addDiagnostic("Unedited", token.range, "不要な命令です。", DiagnosticSeverity.Warning, "redundant-command");
      }
      this.chartState.isGogotime = false;
    } else if (command === commands.items.dummystart) {
      if (this.chartState.isDummyNote === true) {
        this.addDiagnostic("Unedited", token.range, "不要な命令です。", DiagnosticSeverity.Warning, "redundant-command");
      }
      this.chartState.isDummyNote = true;
    } else if (command === commands.items.dummyend) {
      if (this.chartState.isDummyNote === false) {
        this.addDiagnostic("Unedited", token.range, "不要な命令です。", DiagnosticSeverity.Warning, "redundant-command");
      }
      this.chartState.isDummyNote = false;
    } else if (
      command === commands.items.n ||
      command === commands.items.e ||
      command === commands.items.m ||
      command === commands.items.branchend
    ) {
      this.nowBalloonId = undefined;
    } else if (command === commands.items.resetcommand) {
      this.chartState.showBarline = true;
      this.chartState.isDummyNote = false;
      this.chartState.scroll = 1;
    }
    let node = new ChartStateCommandNode(parent, token.range, separator, this.chartState);
    node = this.parseNode(node);
    parent.push(node);
    if (parent.children.some((x) => x instanceof ChartTokenNode)) {
      if (section === "MeasureHead" || section === "Song") {
        this.addDiagnostic(
          "Realtime",
          node.range,
          "小節の途中に配置されています。",
          DiagnosticSeverity.Warning
        );
      }
    }
  }

  /**
   * 式（ヘッダ･命令）名の生成
   * @param parent
   * @param token
   */
  private parseStatementName(parent: HeaderNode | CommandNode, token: Token): void {
    const node = new StatementNameNode(parent, token);
    parent.push(node);
  }

  /**
   * 式（ヘッダ･命令）パラメーターの生成
   * @param parent
   * @param token
   * @returns
   */
  private parseStatementParameter(parent: HeaderNode | CommandNode, token: Token) {
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
          parameterIndex
        );
        rawParameter.push(node);
        parameterIndex++;
      } else if (parameter.kind === "Delimiter") {
        const node = new DelimiterNode(rawParameter, {
          kind: parameter.kind,
          range: parameter.range,
          value: parameter.value,
        });
        rawParameter.push(node);
        // Don't increment parameterIndex for delimiters
      } else {
        return parent;
      }
    }
    const name = parent.properties.name;
    if (parent instanceof HeaderNode && headers.items.bpm.regexp.test(name)) {
      const rawValue =
        rawParameter.children[0] !== undefined ? Number(rawParameter.children[0].value) : undefined;
      const value = Number.isNaN(rawValue) ? undefined : rawValue;
      this.initialBpm = value;
      this.chartState.bpm = value;
    }
    // Check for duplicate values in commands BEFORE updating chart state
    if (parent instanceof CommandNode) {
      const commandName = parent.properties.name;
      if (commandName === commands.items.bpmchange.name) {
        const bpmValue = Number(rawParameter.children[0]?.value);
        // Compare with current state before updating
        if (!Number.isNaN(bpmValue) && this.chartState.bpm === bpmValue) {
          this.addDiagnostic(
            "Unedited",
            parent.range,
            "不要な命令です。",
            DiagnosticSeverity.Warning,
            "redundant-command"
          );
        }
        // Update chart state with new BPM value
        if (!Number.isNaN(bpmValue)) {
          this.chartState.bpm = bpmValue;
        }
      } else if (commandName === commands.items.scroll.name) {
        const scrollValue = Number(rawParameter.children[0]?.value);
        // Compare with current state before updating
        if (!Number.isNaN(scrollValue) && this.chartState.scroll === scrollValue) {
          this.addDiagnostic(
            "Unedited",
            parent.range,
            "不要な命令です。",
            DiagnosticSeverity.Warning,
            "redundant-command"
          );
        }
        // Update chart state with new scroll value
        if (!Number.isNaN(scrollValue)) {
          this.chartState.scroll = scrollValue;
        }
      } else if (commandName === commands.items.measure.name) {
        // #MEASURE takes two parameters: numerator/denominator (e.g., 3/4)
        const numeratorValue = Number(rawParameter.children[0]?.value);
        const denominatorValue = Number(rawParameter.children[1]?.value);
        // Compare with current state before updating
        if (
          !Number.isNaN(numeratorValue) &&
          !Number.isNaN(denominatorValue) &&
          this.chartState.measureNumerator === numeratorValue &&
          this.chartState.measureDenominator === denominatorValue
        ) {
          this.addDiagnostic(
            "Unedited",
            parent.range,
            "不要な命令です。",
            DiagnosticSeverity.Warning,
            "redundant-command"
          );
        }
        // Update chart state with new measure values
        if (!Number.isNaN(numeratorValue)) {
          this.chartState.measureNumerator = numeratorValue;
        }
        if (!Number.isNaN(denominatorValue)) {
          this.chartState.measureDenominator = denominatorValue;
        }
      }
    }

    parent.push(rawParameter);
    if (parent instanceof ChartStateCommandNode) {
      this.chartState = parent.properties.chartState;
    }
  }

  /**
   * 現在までの実際の小節数を取得
   * @param parent
   * @returns
   */
  private getActualMeasureCount(parent: ChartNode | SongNode): number {
    // 親ノードから実際のMeasureNodeの数を数える
    const measureNodes = parent.filter((x) => x instanceof MeasureNode);
    return measureNodes.length;
  }

  /**
   * 譜面の作成
   * @param parent
   * @param token
   * @param separator
   */
  private parseChate(parent: StyleNode, token: Token, separator: Separator): void {
    let chart = new ChartNode(parent, token.range);
    this.parseCommand(chart, token, separator);
    this.position++;
    chart = this.parseNode(chart);
    parent.push(chart);
    this.chartState = new ChartState(this.initialBpm);
    this.nowBalloonId = undefined;
  }

  /**
   * 課題曲の作成
   * @param parent
   * @param token
   * @param separator
   */
  private parseSong(parent: ChartNode, token: Token, separator: Separator): void {
    let song = new SongNode(parent, token.range);
    this.parseCommand(song, token, separator);
    this.position++;
    song = this.parseNode(song);
    parent.push(song);
  }

  /**
   * 譜面分岐の作成
   * @param parent
   * @param token
   * @param separator
   */
  private parseBranch(parent: ChartNode | SongNode, token: Token, separator: Separator): void {
    // 現在までの実際の小節数を取得（命令のみ小節の影響を受けない正確な値）
    const actualMeasureCount = this.getActualMeasureCount(parent);
    const correctedChartState = { ...this.chartState };
    correctedChartState.measure = actualMeasureCount;

    let branch = new BranchNode(parent, token.range, correctedChartState);
    this.parseCommand(branch, token, separator);
    this.position++;
    branch = this.parseNode(branch);
    parent.push(branch);
    // 分岐ごとの差分を調べる
    const sections = <BranchSectionNode[]>(
      branch.children.filter((x) => x instanceof BranchSectionNode)
    );
    const branchChartState = branch.properties.endChartState;
    for (const section of sections) {
      const nem = section.children.find((x) => x instanceof CommandNode);
      if (nem === undefined) {
        continue;
      }
      const sectionChartState = section.properties.endChartState;
      if (branchChartState.measure !== sectionChartState.measure) {
        this.addDiagnostic(
          "Unedited",
          nem.range,
          `譜面分岐の小節数が統一されていません。\n${
            branchChartState.measure - sectionChartState.measure
          }小節足りていません。`,
          DiagnosticSeverity.Warning
        );
      }
    }
    // 譜面状態の取得
    this.chartState = { ...branch.properties.endChartState };
  }

  private parseBranchSection(
    parent: BranchNode,
    token: Token,
    separator: Separator,
    command: ICommand
  ): void {
    let branchSection: BranchSectionNode;
    this.chartState = { ...parent.properties.startChartState };
    if (command === commands.items.n) {
      this.chartState.branchState = "Normal";
      branchSection = new BranchSectionNode(parent, token.range, "N");
    } else if (command === commands.items.e) {
      this.chartState.branchState = "Expert";
      branchSection = new BranchSectionNode(parent, token.range, "E");
    } else {
      this.chartState.branchState = "Master";
      branchSection = new BranchSectionNode(parent, token.range, "M");
    }
    this.parseCommand(branchSection, token, separator);
    this.position++;
    branchSection = this.parseNode(branchSection);
    this.chartState.branchState = "None";
    if (
      (parent.properties.hasNormal && branchSection.properties.kind === "N") ||
      (parent.properties.hasExpert && branchSection.properties.kind === "E") ||
      (parent.properties.hasMaster && branchSection.properties.kind === "M")
    ) {
      this.addDiagnostic("Realtime", branchSection.range, "譜面分岐が重複しています。");
    }
    parent.push(branchSection);
  }

  /**
   * 小節の作成
   * @param parent
   * @param token
   */
  private parseMeasure(parent: BranchSectionNode | ChartNode | SongNode, token: Token): void {
    this.chartState.measure++;
    let node = new MeasureNode(parent, token.range, this.chartState);
    node = this.parseNode(node);
    if (node.children.length > 0 && node.children.every((x) => x instanceof CommandNode)) {
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

  /**
   * 音符の作成
   * @param parent
   * @param token
   */
  private parseNote(parent: MeasureNode, token: Token): void {
    if (/[1-79A-Z]/.test(token.value)) {
      if (token.value !== "8" && this.chartState.rollState !== "None") {
        const text =
          this.chartState.rollState === "Roll" || this.chartState.rollState === "RollBig"
            ? "連打"
            : "風船";
        this.addDiagnostic(
          "Realtime",
          token.range,
          `${text}音符が途切れています。`,
          DiagnosticSeverity.Warning
        );
      }
      this.chartState.rollState = "None";
      if (/[1-6A-Z]/.test(token.value)) {
        this.nowBalloonId = undefined;
        if (token.value === "5") {
          this.chartState.rollState = "Roll";
        } else if (token.value === "6") {
          this.chartState.rollState = "RollBig";
        }
      } else if (/[79]/.test(token.value)) {
        if (this.chartState.isDummyNote === false) {
          const isBranchBalloon = parent.findParent<StyleNode>((x) => x instanceof StyleNode)
            ?.properties.isBranchBalloon;
          if (this.chartState.branchState === "None" || isBranchBalloon !== true) {
            this.nowBalloonId = ++this.balloonId;
          } else {
            if (this.chartState.branchState === "Normal") {
              this.nowBalloonId = ++this.norBalloonId;
            } else if (this.chartState.branchState === "Expert") {
              this.nowBalloonId = ++this.expBalloonId;
            } else {
              this.nowBalloonId = ++this.masBalloonId;
            }
          }
        }
        if (token.value === "7") {
          this.chartState.rollState = "Balloon";
        } else if (token.value === "9") {
          this.chartState.rollState = "BalloonBig";
        }
      }
    }
    const node = new NoteNode(parent, token, this.chartState, this.nowBalloonId);
    parent.push(node);
    if (this.nowBalloonId !== undefined && /[79]/.test(token.value)) {
      const styleNode = parent.findParent<StyleNode>((x) => x instanceof StyleNode);
      if (styleNode !== undefined) {
        const isBranchBalloon = styleNode?.properties.isBranchBalloon;
        let headerRegExp: RegExp;
        if (this.chartState.branchState === "None" || isBranchBalloon !== true) {
          headerRegExp = headers.items.balloon.regexp;
        } else if (this.chartState.branchState === "Normal") {
          headerRegExp = headers.items.balloonnor.regexp;
        } else if (this.chartState.branchState === "Expert") {
          headerRegExp = headers.items.balloonexp.regexp;
        } else {
          headerRegExp = headers.items.balloonmas.regexp;
        }
        const balloonHeader = styleNode.properties.headers.find((x) => headerRegExp.test(x.name));
        const wordRange = this.document.getWordRangeAtPosition(
          token.range.end,
          /([79]0*8?|0*8|0+)/
        );
        if (wordRange !== undefined) {
          let shouldShowWarning = false;

          if (balloonHeader === undefined) {
            // ヘッダーが存在しない場合
            shouldShowWarning = true;
          } else if (balloonHeader.parameters.length <= this.nowBalloonId) {
            // パラメータの数が不足している場合
            shouldShowWarning = true;
          } else {
            // パラメータは存在するが、値が空または無効な場合
            const parameter = balloonHeader.parameters[this.nowBalloonId];
            if (!parameter || parameter.trim() === "") {
              shouldShowWarning = true;
            }
          }

          if (shouldShowWarning) {
            // 診断メッセージに風船音符の正確な位置情報とballoonIdを含める
            const balloonNoteInfo = `${token.range.start.line}:${token.range.start.character}:${this.nowBalloonId}`;
            this.addDiagnostic(
              "Unedited",
              wordRange,
              `打数が定義されていません。[${balloonNoteInfo}]`,
              DiagnosticSeverity.Warning
            );
          }
        }
      }
    }
    if (token.value === "8") {
      this.chartState.rollState = "None";
      this.nowBalloonId = undefined;
    }
  }

  /**
   * 小節終了の作成
   * @param parent
   * @param token
   */
  private parseMeasureEnd(parent: MeasureNode, token: Token): void {
    const node = new MeasureEndNode(parent, token, this.chartState);
    parent.push(node);
  }

  /**
   * 子から末尾のCourseNodeを検索（ない場合は作成）し、パースする
   * @param parent
   * @param token
   * @returns
   */
  private parseFindLastOrPushCourse(parent: RootNode, token: Token): CourseNode {
    let findNode = parent.findLastRange<CourseNode>(
      (x) => x instanceof CourseNode,
      false,
      (x) => x instanceof HeadersNode
    );
    if (findNode === undefined) {
      // コースの作成
      let node = new CourseNode(parent, token.range);
      node = this.parseNode(node);
      parent.push(node);
      return node;
    } else {
      // 末尾にある既存のコースを参照
      findNode = this.parseNode(findNode);
      return findNode;
    }
  }

  /**
   * 譜面状態を検証
   * @param token
   */
  private validateChateState(token: Token): void {
    if (this.chartState.showBarline === "unknown") {
      this.chartState.showBarline = false;
      this.addDiagnostic(
        "Realtime",
        token.range,
        "譜面分岐後の小節線表示状態（#BARLINEOFF,#BARLINEON）が統一されていません。",
        DiagnosticSeverity.Hint
      );
    }
    if (this.chartState.isGogotime === "unknown") {
      this.chartState.isGogotime = false;
      this.addDiagnostic(
        "Realtime",
        token.range,
        "譜面分岐後のゴーゴータイム状態（#GOGOSTART,#GOGOEND）が統一されていません。",
        DiagnosticSeverity.Hint
      );
    }
    if (this.chartState.isDummyNote === "unknown") {
      this.chartState.isDummyNote = false;
      this.addDiagnostic(
        "Realtime",
        token.range,
        "譜面分岐後のダミーノーツ状態（#DUMMYSTART,#DUMMYEND）が統一されていません。",
        DiagnosticSeverity.Hint
      );
    }
  }

  /**
   * 譜面終了時の検証
   * @param parent
   */
  private validateChateEnd(parent: ChartNode): void {
    if (this.chartState.rollState !== "None") {
      const lastMeasure = parent.findLastRange((x) => x instanceof MeasureNode, false);
      if (lastMeasure !== undefined) {
        const text =
          this.chartState.rollState === "Roll" || this.chartState.rollState === "RollBig"
            ? "連打"
            : "風船";
        this.addDiagnostic(
          "Unedited",
          new Range(lastMeasure.range.end, lastMeasure.range.end),
          `${text}音符が途切れています。`,
          DiagnosticSeverity.Error
        );
      }
    }
  }

  /**
   * 小節が閉じられているかの検証
   * @param parent
   */
  private validateMeasureEnd(parent: MeasureNode): void {
    const node = parent.findDepth((x) => x instanceof NoteNode, false);
    if (node !== undefined) {
      this.addDiagnostic(
        "Unedited",
        new Range(node.range.end, node.range.end),
        "小節が閉じられていません。"
      );
    }
  }

  /**
   * 診断情報の追加
   * @param kind
   * @param range
   * @param message
   * @param severity
   */
  private addDiagnostic(
    kind: "Realtime" | "Unedited",
    range: Range,
    message: string,
    severity?: vscode.DiagnosticSeverity,
    code?: string
  ): void {
    const diagnostic = new Diagnostic(range, message, severity);
    if (code) {
      diagnostic.code = code;
    }
    if (kind === "Realtime") {
      this.diagnostics.realtime.push(diagnostic);
    } else if (kind === "Unedited") {
      this.diagnostics.unedited.push(diagnostic);
    }
  }

  /**
   * ノードの順次解析
   * @param parent
   * @returns
   */
  private parseNode<T extends ParentNode>(parent: T): T {
    for (; this.position < this.tokens.length; this.position++) {
      if (this.parseCancel?.isCancellationRequested) {
        break;
      }
      const token = this.tokens[this.position];
      if (token.kind === "Unknown") {
        this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
        parent.pushRange(token.range);
      } else {
        if (parent instanceof RootNode) {
          if (token.kind === "Header") {
            const section = headers.get(token.value)?.section ?? "Unknown";
            if (section === "Course" || section === "Style" || this.chartAfterOnce) {
              this.parseCourse(parent, token);
            } else if (section === "Root" || section === "Unknown") {
              this.parseRootHeaders(parent, token);
            } else {
              this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
              parent.pushRange(token.range);
            }
          } else if (token.kind === "Command") {
            this.parseCourse(parent, token);
          } else {
            if (token.kind !== "EndOfLine") {
              this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
            }
            parent.pushRange(token.range);
          }
        } else if (parent instanceof RootHeadersNode || parent instanceof StyleHeadersNode) {
          if (token.kind === "Header") {
            const info = headers.get(token.value);
            const section = info?.section ?? "Unknown";
            const separator = info?.separator ?? "Unknown";
            if (
              parent instanceof RootHeadersNode &&
              (section === "Course" || section === "Style")
            ) {
              this.position--;
              return parent;
            }
            this.parseHeader(parent, token, separator);
          } else if (token.kind === "Command") {
            this.position--;
            return parent;
          } else {
            if (token.kind !== "EndOfLine") {
              this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
            }
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
                this.parseStyle(parent, token);
              }
            } else if (section === "Root") {
              this.position--;
              return parent;
            } else {
              this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
              parent.pushRange(token.range);
            }
          } else if (token.kind === "Command") {
            this.parseStyle(parent, token);
          } else {
            if (token.kind !== "EndOfLine") {
              this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
            }
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
                this.parseStyleHeaders(parent, token);
              }
            } else if (section === "Root") {
              this.position--;
              return parent;
            } else {
              this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
              parent.pushRange(token.range);
            }
          } else if (token.kind === "Command") {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            const separator = isTmg(this.document) ? "Comma" : info?.separator ?? "Unknown";
            if (section === "Outer" || section === "Unknown") {
              this.parseCommand(parent, token, separator);
            } else if (section === "Start") {
              this.parseChate(parent, token, separator);
            } else if (
              section === "Inner" ||
              section === "MeasureHead" ||
              section === "Song" ||
              section === "Branch" ||
              section === "End"
            ) {
              const node = this.parseCommand(parent, token, separator);
              this.addDiagnostic("Realtime", node.range, "#START がありません。");
            } else {
              this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
              parent.pushRange(token.range);
            }
          } else {
            if (token.kind !== "EndOfLine") {
              this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
            }
            parent.pushRange(token.range);
          }
        } else if (parent instanceof HeaderNode || parent instanceof CommandNode) {
          if (
            (parent instanceof HeaderNode && token.kind === "Header") ||
            (parent instanceof CommandNode && token.kind === "Command")
          ) {
            this.parseStatementName(parent, token);
          } else if (token.kind === "RawParameter") {
            this.parseStatementParameter(parent, token);
          } else if (token.kind === "EndOfLine") {
            return parent;
          } else {
            this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
            parent.pushRange(token.range);
          }
        } else if (
          parent instanceof ChartNode ||
          parent instanceof BranchSectionNode ||
          parent instanceof SongNode
        ) {
          if (token.kind === "Header") {
            this.addDiagnostic("Realtime", token.range, "ヘッダの位置が不正です。");
            parent.pushRange(token.range);
          } else if (token.kind === "Command") {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            const separator = isTmg(this.document) ? "Comma" : info?.separator ?? "Unknown";
            if (section === "Outer" || section === "Start") {
              this.parseCommand(parent, token, separator);
              this.addDiagnostic("Realtime", token.range, "命令の位置が不正です。");
            } else if (section === "Inner" || section === "MeasureHead" || section === "Unknown") {
              this.parseMeasure(parent, token);
            } else if (section === "Song") {
              if (parent instanceof ChartNode) {
                this.parseSong(parent, token, separator);
              } else if (parent instanceof SongNode) {
                this.position--;
                return parent;
              } else {
                this.parseMeasure(parent, token);
              }
            } else if (section === "Branch") {
              if (parent instanceof BranchSectionNode) {
                this.position--;
                return parent;
              } else if (info === commands.items.branchstart) {
                this.parseBranch(parent, token, separator);
              } else {
                this.parseMeasure(parent, token);
              }
            } else if (section === "End") {
              if (parent instanceof SongNode || parent instanceof BranchSectionNode) {
                this.position--;
                return parent;
              } else {
                this.validateChateEnd(parent);
                this.parseCommand(parent, token, separator);
                this.chartAfter = true;
                this.chartAfterOnce = true;
                return parent;
              }
            } else {
              this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
              parent.pushRange(token.range);
            }
          } else if (token.kind === "Notes" || token.kind === "MeasureEnd") {
            this.parseMeasure(parent, token);
          } else {
            if (token.kind !== "EndOfLine") {
              this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
            }
            parent.pushRange(token.range);
          }
        } else if (parent instanceof BranchNode) {
          if (token.kind === "Header") {
            this.addDiagnostic("Realtime", token.range, "ヘッダの位置が不正です。");
            parent.pushRange(token.range);
          } else if (token.kind === "Command") {
            const info = commands.get(token.value);
            const separator = isTmg(this.document) ? "Comma" : info?.separator ?? "Unknown";
            if (
              info === commands.items.n ||
              info === commands.items.e ||
              info === commands.items.m
            ) {
              this.parseBranchSection(parent, token, separator, info);
            } else if (info === commands.items.branchstart || info === commands.items.end) {
              this.position--;
              return parent;
            } else {
              const node = this.parseCommand(parent, token, separator);
              if (info === commands.items.branchend) {
                return parent;
              }
              this.addDiagnostic(
                "Realtime",
                node.range,
                "命令の位置が不正です。#BRANCHSTARTより前に配置してください。"
              );
            }
          } else if (token.kind === "Notes" || token.kind === "MeasureEnd") {
            this.addDiagnostic("Realtime", token.range, "譜面分岐の区分がありません。");
            this.position--;
            return parent;
          } else {
            if (token.kind !== "EndOfLine") {
              this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
            }
            parent.pushRange(token.range);
          }
        } else if (parent instanceof MeasureNode) {
          if (token.kind === "Header") {
            this.addDiagnostic("Realtime", token.range, "ヘッダの位置が不正です。");
            parent.pushRange(token.range);
          } else if (token.kind === "Command") {
            const info = commands.get(token.value);
            const section = info?.section ?? "Unknown";
            const separator = isTmg(this.document) ? "Comma" : info?.separator ?? "Unknown";
            if (section === "Outer" || section === "Start") {
              const node = this.parseCommand(parent, token, separator);
              this.addDiagnostic("Realtime", node.range, "命令の位置が不正です。");
            } else if (
              section === "Inner" ||
              section === "MeasureHead" ||
              section === "Song" ||
              section === "Unknown"
            ) {
              this.parseChateStateCommand(parent, token, section, separator, info);
            } else if (section === "Branch") {
              if (
                info !== commands.items.branchstart &&
                parent.findParent((x) => x instanceof BranchNode) === undefined
              ) {
                const node = this.parseCommand(parent, token, separator);
                this.addDiagnostic("Realtime", node.range, "#BRANCHSTART がありません。");
              } else if (
                parent.children.length > 0 &&
                parent.children.every((x) => x instanceof CommandNode)
              ) {
                // 命令のみの場合は抜ける
                this.position--;
                return parent;
              } else {
                this.validateMeasureEnd(parent);
                this.position--;
                return parent;
              }
            } else if (section === "End") {
              if (
                parent.children.length > 0 &&
                !parent.children.every((x) => x instanceof CommandNode)
              ) {
                this.validateMeasureEnd(parent);
              }
              this.position--;
              return parent;
            } else {
              this.addDiagnostic("Realtime", token.range, "不正なテキストです。");
              parent.pushRange(token.range);
            }
          } else if (token.kind === "Notes" || token.kind === "MeasureEnd") {
            this.validateChateState(token);
            if (token.kind === "Notes") {
              this.parseNote(parent, token);
            } else {
              this.parseMeasureEnd(parent, token);
              return parent;
            }
          } else {
            if (token.kind !== "EndOfLine") {
              this.addDiagnostic("Unedited", token.range, "不正なテキストです。");
            }
            parent.pushRange(token.range);
          }
        } else {
          this.addDiagnostic("Realtime", token.range, "拡張機能エラー");
          parent.pushRange(token.range);
        }
      }
    }
    if (this.position >= this.tokens.length) {
      if (parent instanceof ChartNode) {
        const lastEol = findLast(this.tokens, (x) => x.kind === "EndOfLine");
        if (lastEol !== undefined) {
          this.addDiagnostic("Realtime", lastEol.range, "#END がありません。");
        }
      }
    }
    return parent;
  }
}
