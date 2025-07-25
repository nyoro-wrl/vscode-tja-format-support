import { CancellationToken, Range } from "vscode";
import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { Token } from "../lexer";
import { Note } from "./note";
import { BranchState, ChartState, RollState, TriBoolean } from "./state";
import { getRegExp, Separator } from "./statement";

interface HeadersProperties {
  readonly headers: StatementProperties[];
}

interface StatementProperties {
  name: string;
  parameter: string;
  readonly parameters: string[];
  readonly separator: Separator;
}

interface CouseProperties {
  course: string;
  readonly styles: StyleProperties[];
}

interface StyleProperties extends HeadersProperties {
  /**
   * プレイスタイル
   */
  style: string;
  /**
   * 風船打数が譜面分岐ごとに記載されているかどうか
   */
  isBranchBalloon: boolean;
}

interface ChartInfoProperties {
  measure: number;
  isBranch: boolean;
  hasNormal: boolean;
  hasExpert: boolean;
  hasMaster: boolean;
  notes: Note[];
  normalNotes: Note[];
  expertNotes: Note[];
  masterNotes: Note[];
}

interface ChartProperties {
  start: StatementProperties | undefined;
  end: StatementProperties | undefined;
  info: ChartInfoProperties;
}

interface SongProperties {
  nextsong: StatementProperties | undefined;
  measureCount: number;
  info: ChartInfoProperties;
}

export interface ChartStateProperties {
  measure: number;
  showBarline: TriBoolean;
  isGogotime: TriBoolean;
  isDummyNote: TriBoolean;
  rollState: RollState;
  branchState: BranchState;
  bpm: number | undefined;
  scroll: number | undefined;
  measureNumerator: number;
  measureDenominator: number;
}

interface MeasureProperties {
  measure: number;
  notesLength: number;
  notes: Note[];
  startChartState: ChartStateProperties;
  endChartState: ChartStateProperties;
}

interface ChartStateCommandProperties extends StatementProperties {
  chartState: ChartStateProperties;
}

interface BranchProperties {
  readonly startChartState: ChartState;
  endChartState: ChartState;
  measureCount: number;
  hasNormal: boolean;
  hasExpert: boolean;
  hasMaster: boolean;
  normalNotes: Note[];
  expertNotes: Note[];
  masterNotes: Note[];
}

export type BranchKind = "N" | "E" | "M";

interface BranchSectionProperties {
  kind: BranchKind;
  notes: Note[];
  measureCount: number;
  endChartState: ChartStateProperties;
}

interface ParameterProperties {
  index: number;
}

interface NoteProperties extends ChartStateProperties {
  note: Note;
}

export interface FindParentOptions {
  /**
   * 自身を検索対象に含むかどうか
   */
  includeSelf?: boolean;
  /**
   * キャンセル可能なトークン
   */
  token?: CancellationToken;
}

export interface FindOptions {
  /**
   * 引き返す条件（それ以上の再帰処理を行わない）
   */
  return?: (node: Node) => boolean;
  /**
   * 自身を検索対象に含む
   */
  includeSelf?: boolean;
  /**
   * キャンセル可能なトークン
   */
  token?: CancellationToken;
}

export interface FilterOptions {
  /**
   * 引き返す条件（それ以上の再帰処理を行わない）
   */
  return?: (node: Node) => boolean;
  /**
   * 条件が一致しても再帰を続ける
   */
  continue?: boolean;
  /**
   * 自身を検索対象に含む
   */
  includeSelf?: boolean;
  /**
   * キャンセル可能なトークン
   */
  token?: CancellationToken;
}

export interface FildLastRangeOptions {
  /**
   * 引き返す条件（それ以上の再帰処理を行わない）
   */
  return?: (node: Node) => boolean;
  /**
   * 条件が一致しても再帰を続ける
   */
  continue?: boolean;
  /**
   * 自身を検索対象に含む
   */
  includeSelf?: boolean;
  /**
   * キャンセル可能なトークン
   */
  token?: CancellationToken;
}

export interface FindDepthOptions {
  /**
   * 引き返す条件（それ以上の再帰処理を行わない）
   */
  return?: (node: Node) => boolean;
  /**
   * 条件が一致しても再帰を続ける
   */
  continue?: boolean;
  /**
   * 自身を検索対象に含む
   */
  includeSelf?: boolean;
  /**
   * キャンセル可能なトークン
   */
  token?: CancellationToken;
}

/**
 * ノード
 */
export abstract class Node {
  readonly parent: ParentNode | undefined;
  protected _range: Range;

  get range(): Readonly<Range> {
    return this._range;
  }

  constructor(parent: ParentNode | undefined, range: Range) {
    this.parent = parent;
    this._range = range;
  }

  /**
   * 親ノードを再帰的に検索し、最初に一致したNodeを返す
   * @param predicate 一致する条件
   * @param options 検索設定
   * @returns
   */
  public findParent<T extends Node = Node>(
    predicate: (node: Node) => boolean,
    { includeSelf = true, token }: FindParentOptions = {}
  ): T | undefined {
    if (token?.isCancellationRequested) {
      return;
    }
    if (includeSelf && predicate(this)) {
      return this as unknown as T;
    }
    if (this.parent !== undefined) {
      const result = this.parent.findParent<T>(predicate, { token });
      if (result !== undefined) {
        return result;
      }
    }
  }
}

/**
 * 末端ノード
 */
export abstract class LeafNode extends Node {
  readonly value: string;
  readonly _range: Range;

  get range(): Readonly<Range> {
    return this._range;
  }

  constructor(parent: ParentNode | undefined, token: Token) {
    super(parent, token.range);
    this.value = token.value;
    this._range = token.range;
  }
}

/**
 * 親ノード
 */
export abstract class ParentNode<T extends Node = Node> extends Node {
  protected _children: T[] = [];

  get children(): readonly T[] {
    return this._children;
  }

  constructor(parent: ParentNode | undefined, range: Range) {
    super(parent, range);
  }

  /**
   * 子ノードを再帰的に検索し、最初に一致したNodeを返す
   * @param predicate 一致する条件
   * @param options 検索設定
   * @returns
   */
  public find<T extends Node = Node>(
    predicate: (node: Node) => boolean,
    { return: ignorePredicate, includeSelf = true, token }: FindOptions = {}
  ): T | undefined {
    if (token?.isCancellationRequested) {
      return;
    }
    if (includeSelf && predicate(this)) {
      return this as unknown as T;
    }
    if (includeSelf && ignorePredicate !== undefined && ignorePredicate(this)) {
      return;
    }
    for (const child of this.children) {
      if (token?.isCancellationRequested) {
        return;
      }
      if (child instanceof ParentNode) {
        const result = child.find<T>(predicate, { token });
        if (result !== undefined) {
          return result;
        }
      } else if (predicate(child)) {
        return child as unknown as T;
      }
    }
  }

  /**
   * 子ノードを再帰的に検索し、一致した全てのNodeを返す
   * @param predicate 一致する条件
   * @param options 検索設定
   * @returns
   */
  public filter<T extends Node = Node>(
    predicate: (node: Node) => boolean,
    {
      return: ignorePredicate,
      continue: _continue = false,
      includeSelf = true,
      token,
    }: FilterOptions = {}
  ): T[] {
    const results: T[] = [];
    if (token?.isCancellationRequested) {
      return results;
    }
    if (includeSelf && predicate(this)) {
      results.push(this as unknown as T);
      if (_continue === false) {
        return results;
      }
    }
    if (includeSelf && ignorePredicate !== undefined && ignorePredicate(this)) {
      return results;
    }
    for (const child of this.children) {
      if (token?.isCancellationRequested) {
        return results;
      }
      if (child instanceof ParentNode) {
        const result = child.filter<T>(predicate, {
          return: ignorePredicate,
          continue: _continue,
          token,
        });
        results.push(...result);
      } else if (predicate(child)) {
        results.push(child as unknown as T);
      }
    }
    return results;
  }

  /**
   * 子ノードを再帰的に検索し、範囲末尾が最も後ろにあるNodeを返す
   * @param predicate 一致する条件
   * @param options 検索設定
   * @returns
   */
  public findLastRange<T extends Node = Node>(
    predicate: (node: Node) => boolean,
    {
      return: ignorePredicate,
      continue: _continue = false,
      includeSelf = true,
      token,
    }: FildLastRangeOptions = {}
  ): T | undefined {
    const nodes: T[] = this.filter<T>(predicate, {
      return: ignorePredicate,
      continue: _continue,
      includeSelf,
      token,
    });
    let result: T | undefined;
    for (const node of nodes) {
      if (token?.isCancellationRequested) {
        return result;
      } else if (result === undefined) {
        result = node;
      } else if (
        result.range.end.line < node.range.end.line ||
        (result.range.end.line === node.range.end.line &&
          result.range.end.character <= node.range.end.character)
      ) {
        result = node;
      }
    }
    return result;
  }

  /**
   * 子ノードを再帰的に検索し、最も範囲の狭いNodeを返す
   * @param predicate 一致する条件
   * @param options 検索設定
   * @returns
   */
  public findDepth<T extends Node = Node>(
    predicate: (node: Node) => boolean,
    {
      return: ignorePredicate,
      continue: _continue = false,
      includeSelf = true,
      token,
    }: FindDepthOptions = {}
  ): T | undefined {
    const nodes: T[] = this.filter<T>(predicate, {
      continue: _continue,
      return: ignorePredicate,
      includeSelf,
      token,
    });
    let result: { node: T; line: number; length: number | undefined } | undefined;
    for (const node of nodes) {
      if (token?.isCancellationRequested) {
        return result?.node;
      }
      const line = node.range.end.line - node.range.start.line + 1;
      const length = line === 1 ? node.range.end.character - node.range.start.character : undefined;
      const nodeInfo = { node: node, line: line, length: length };
      if (result === undefined) {
        result = nodeInfo;
      } else if (
        result.line >= nodeInfo.line ||
        (result.length !== undefined &&
          nodeInfo.length !== undefined &&
          result.length >= nodeInfo.length)
      ) {
        result = nodeInfo;
      }
    }
    return result?.node;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  protected _push(node: T): void {
    this._children.push(node);
    this.pushRange(node.range);
  }

  /**
   * 範囲の追加
   * @param range
   */
  public pushRange(range: Range): void {
    this._range = this._range.union(range);
    if (this.parent !== undefined && this.parent instanceof ParentNode) {
      this.parent.pushRange(range);
    }
  }
}

/**
 * ヘッダの集合ノード
 */
export abstract class HeadersNode extends ParentNode<HeaderNode> {
  properties: HeadersProperties = { headers: [] };

  /**
   * childrenにNodeを追加
   * @param node
   *
   */
  protected _pushHeaders(node: HeaderNode) {
    super._push(node);
    this.properties.headers.push(node.properties);
  }
}

/**
 * 式（ヘッダ･命令）ノード
 */
export abstract class StatementNode extends ParentNode<StatementNameNode | ParametersNode> {
  properties: StatementProperties;

  constructor(parent: ParentNode | undefined, range: Range, separator: Separator) {
    super(parent, range);
    this.properties = { name: "", parameter: "", parameters: [], separator: separator };
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  protected _pushStatement(node: StatementNameNode | ParametersNode) {
    super._push(node);
    if (node instanceof StatementNameNode) {
      this.properties.name += node.value;
    } else if (node instanceof ParametersNode) {
      this.properties.parameter += node.children.map((x) => x.value).join("");
      this.properties.parameters.push(
        ...node.children.filter((x) => x instanceof ParameterNode).map((x) => x.value)
      );
    }
  }
}

/**
 * 譜面分岐の区分（普通譜面･玄人譜面･達人譜面）ノード
 */
export class BranchSectionNode extends ParentNode<
  CommandNode | ChartStateCommandNode | MeasureNode
> {
  properties: BranchSectionProperties;

  constructor(parent: BranchNode, range: Range, branchKind: BranchKind) {
    super(parent, range);
    this.properties = {
      kind: branchKind,
      notes: [],
      measureCount: 0,
      endChartState: { ...parent.properties.startChartState },
    };
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: CommandNode | ChartStateCommandNode | MeasureNode) {
    super._push(node);

    if (node instanceof MeasureNode) {
      this.properties.measureCount++;
      this.properties.notes.push(...node.properties.notes);
      // 分岐状態以外を適用する
      const chartState = { ...node.properties.endChartState };
      chartState.branchState = this.properties.endChartState.branchState;
      this.properties.endChartState = chartState;
    } else if (node instanceof ChartStateCommandNode && node.properties.chartState !== undefined) {
      // 小節番号と分岐状態以外を適用する
      const chartState = { ...node.properties.chartState };
      chartState.measure = this.properties.endChartState.measure;
      chartState.branchState = this.properties.endChartState.branchState;
      this.properties.endChartState = chartState;
    }
  }
}

/**
 * 音符と小節末（,）ノード
 */
export abstract class ChartTokenNode extends LeafNode {
  readonly parent: MeasureNode;
  properties: ChartStateProperties;

  constructor(parent: MeasureNode, token: Token, chartState: ChartStateProperties) {
    super(parent, token);
    this.parent = parent;
    this.properties = { ...chartState };
  }
}

/**
 * 最上位ノード
 */
export class RootNode extends ParentNode<RootHeadersNode | CourseNode> {
  readonly parent: undefined;
  readonly text: string;

  constructor(text: string) {
    super(undefined, new Range(0, 0, 0, 0));
    this.text = text;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: RootHeadersNode | CourseNode) {
    super._push(node);
  }
}

/**
 * 共通ヘッダの集合ノード
 */
export class RootHeadersNode extends HeadersNode {
  readonly parent: RootNode;

  constructor(parent: RootNode, range: Range) {
    super(parent, range);
    this.parent = parent;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: HeaderNode) {
    super._pushHeaders(node);
  }
}

/**
 * 難易度ノード
 */
export class CourseNode extends ParentNode<StyleNode> {
  readonly parent: RootNode;
  properties: CouseProperties = { course: "", styles: [] };

  constructor(parent: RootNode, range: Range) {
    super(parent, range);
    this.parent = parent;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: StyleNode) {
    super._push(node);

    this.properties.styles.push(node.properties);

    const courseHeaders = <StyleHeadersNode>(
      node.children.find((x) => x instanceof StyleHeadersNode)
    );
    if (courseHeaders !== undefined) {
      const courseHeader = courseHeaders.properties.headers.find((x) =>
        getRegExp(headers.items.course).test(x.name)
      );
      if (courseHeader !== undefined) {
        this.properties.course = courseHeader.parameter;
      }
    }
  }
}

/**
 * プレイスタイルノード
 */
export class StyleNode extends ParentNode<StyleHeadersNode | CommandNode | ChartNode> {
  readonly parent: CourseNode;
  properties: StyleProperties = { style: "", headers: [], isBranchBalloon: false };

  constructor(parent: CourseNode, range: Range) {
    super(parent, range);
    this.parent = parent;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: StyleHeadersNode | CommandNode | ChartNode) {
    super._push(node);

    if (node instanceof StyleHeadersNode) {
      this.properties.headers.push(...node.properties.headers);
      const styleHeader = node.properties.headers.find((x) =>
        getRegExp(headers.items.style).test(x.name)
      );
      if (styleHeader !== undefined) {
        this.properties.style = styleHeader.parameter;
      }
      this.properties.isBranchBalloon = node.properties.headers.some(
        (x) =>
          getRegExp(headers.items.balloonnor).test(x.name) ||
          getRegExp(headers.items.balloonexp).test(x.name) ||
          getRegExp(headers.items.balloonmas).test(x.name)
      );
    }
  }
}

/**
 * プレイスタイル別ヘッダの集合ノード
 */
export class StyleHeadersNode extends HeadersNode {
  readonly parent: StyleNode;

  constructor(parent: StyleNode, range: Range) {
    super(parent, range);
    this.parent = parent;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: HeaderNode) {
    super._pushHeaders(node);
  }
}

/**
 * ヘッダノード
 */
export class HeaderNode extends StatementNode {
  readonly parent: HeadersNode;

  constructor(parent: HeadersNode, range: Range, separator: Separator) {
    super(parent, range, separator);
    this.parent = parent;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: StatementNameNode | ParametersNode) {
    super._pushStatement(node);
  }
}

/**
 * 命令ノード
 */
export class CommandNode extends StatementNode {
  readonly parent: BranchSectionNode | StyleNode | ChartNode | SongNode | MeasureNode | BranchNode;

  constructor(
    parent: BranchSectionNode | StyleNode | ChartNode | SongNode | MeasureNode | BranchNode,
    range: Range,
    separator: Separator
  ) {
    super(parent, range, separator);
    this.parent = parent;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: StatementNameNode | ParametersNode) {
    super._pushStatement(node);
  }
}

export class ChartStateCommandNode extends CommandNode {
  readonly parent: BranchSectionNode | ChartNode | SongNode | MeasureNode;
  properties: ChartStateCommandProperties;

  constructor(
    parent: BranchSectionNode | ChartNode | SongNode | MeasureNode,
    range: Range,
    separator: Separator,
    chartState: ChartStateProperties
  ) {
    super(parent, range, separator);
    this.parent = parent;
    this.properties = {
      name: "",
      parameter: "",
      parameters: [],
      separator: separator,
      chartState: { ...chartState },
    };
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: StatementNameNode | ParametersNode) {
    super._pushStatement(node);

    if (node instanceof ParametersNode) {
      if (getRegExp(commands.items.bpmchange).test(this.properties.name)) {
        const rawValue =
          node.children[0] !== undefined ? Number(node.children[0].value) : undefined;
        const value = Number.isNaN(rawValue) ? undefined : rawValue;
        this.properties.chartState.bpm = value;
      } else if (getRegExp(commands.items.scroll).test(this.properties.name)) {
        const rawValue =
          node.children[0] !== undefined ? Number(node.children[0].value) : undefined;
        const value = Number.isNaN(rawValue) ? undefined : rawValue;
        this.properties.chartState.scroll = value;
      }
    }
  }
}

/**
 * 譜面ノード
 */
export class ChartNode extends ParentNode<
  CommandNode | ChartStateCommandNode | MeasureNode | BranchNode | SongNode
> {
  readonly parent: StyleNode;
  properties: ChartProperties = {
    start: undefined,
    end: undefined,
    info: {
      measure: 0,
      isBranch: false,
      hasNormal: false,
      hasExpert: false,
      hasMaster: false,
      notes: [],
      normalNotes: [],
      expertNotes: [],
      masterNotes: [],
    },
  };

  constructor(parent: StyleNode, range: Range) {
    super(parent, range);
    this.parent = parent;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: CommandNode | ChartStateCommandNode | MeasureNode | BranchNode | SongNode) {
    super._push(node);
    if (node instanceof CommandNode) {
      if (
        this.properties.start === undefined &&
        getRegExp(commands.items.start).test(node.properties.name)
      ) {
        this.properties.start = node.properties;
      } else if (
        this.properties.end === undefined &&
        getRegExp(commands.items.end).test(node.properties.name)
      ) {
        this.properties.end = node.properties;
      }
    } else if (node instanceof MeasureNode) {
      this.properties.info.measure = node.properties.startChartState.measure;
      this.properties.info.notes.push(...node.properties.notes);
    } else if (node instanceof BranchNode) {
      this.properties.info.measure = node.properties.endChartState.measure;
      this.properties.info.isBranch = true;
      this.properties.info.hasNormal = this.properties.info.hasNormal || node.properties.hasNormal;
      this.properties.info.hasExpert = this.properties.info.hasExpert || node.properties.hasExpert;
      this.properties.info.hasMaster = this.properties.info.hasMaster || node.properties.hasMaster;
      this.properties.info.normalNotes.push(...node.properties.normalNotes);
      this.properties.info.expertNotes.push(...node.properties.expertNotes);
      this.properties.info.masterNotes.push(...node.properties.masterNotes);
    } else if (node instanceof SongNode) {
      this.properties.info.measure = node.properties.info.measure;
      this.properties.info.isBranch =
        this.properties.info.isBranch || node.properties.info.isBranch;
      this.properties.info.hasNormal =
        this.properties.info.hasNormal || node.properties.info.hasNormal;
      this.properties.info.hasExpert =
        this.properties.info.hasExpert || node.properties.info.hasExpert;
      this.properties.info.hasMaster =
        this.properties.info.hasMaster || node.properties.info.hasMaster;
      this.properties.info.notes.push(...node.properties.info.notes);
      this.properties.info.normalNotes.push(...node.properties.info.normalNotes);
      this.properties.info.expertNotes.push(...node.properties.info.expertNotes);
      this.properties.info.masterNotes.push(...node.properties.info.masterNotes);
    }
  }
}

/**
 * 曲ノード（#NEXTSONG）
 */
export class SongNode extends ParentNode<
  CommandNode | ChartStateCommandNode | MeasureNode | BranchNode
> {
  readonly parent: ChartNode;
  properties: SongProperties = {
    nextsong: undefined,
    measureCount: 0,
    info: {
      measure: 0,
      isBranch: false,
      hasNormal: false,
      hasExpert: false,
      hasMaster: false,
      notes: [],
      normalNotes: [],
      expertNotes: [],
      masterNotes: [],
    },
  };

  constructor(parent: ChartNode, range: Range) {
    super(parent, range);
    this.parent = parent;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: CommandNode | ChartStateCommandNode | MeasureNode | BranchNode) {
    super._push(node);
    if (node instanceof CommandNode) {
      if (
        this.properties.nextsong === undefined &&
        getRegExp(commands.items.nextsong).test(node.properties.name)
      ) {
        this.properties.nextsong = node.properties;
      }
    } else if (node instanceof MeasureNode) {
      this.properties.measureCount++;
      this.properties.info.measure = node.properties.startChartState.measure;
      this.properties.info.notes.push(...node.properties.notes);
    } else if (node instanceof BranchNode) {
      this.properties.measureCount += node.properties.measureCount;
      this.properties.info.measure = node.properties.endChartState.measure;
      this.properties.info.isBranch = true;
      this.properties.info.hasNormal = this.properties.info.hasNormal || node.properties.hasNormal;
      this.properties.info.hasExpert = this.properties.info.hasExpert || node.properties.hasExpert;
      this.properties.info.hasMaster = this.properties.info.hasMaster || node.properties.hasMaster;
      this.properties.info.normalNotes.push(...node.properties.normalNotes);
      this.properties.info.expertNotes.push(...node.properties.expertNotes);
      this.properties.info.masterNotes.push(...node.properties.masterNotes);
    }
  }
}

/**
 * 小節ノード
 */
export class MeasureNode extends ParentNode<
  NoteNode | CommandNode | ChartStateCommandNode | MeasureEndNode
> {
  readonly parent: ChartNode | SongNode | BranchSectionNode;
  properties: MeasureProperties;

  constructor(
    parent: ChartNode | SongNode | BranchSectionNode,
    range: Range,
    chartState: ChartStateProperties
  ) {
    super(parent, range);
    this.parent = parent;
    const cloneChartState = { ...chartState };
    this.properties = {
      measure: cloneChartState.measure,
      notes: [],
      notesLength: 0,
      startChartState: cloneChartState,
      endChartState: cloneChartState,
    };
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: NoteNode | CommandNode | ChartStateCommandNode | MeasureEndNode) {
    super._push(node);

    let chartState: ChartStateProperties | undefined;
    if (node instanceof NoteNode) {
      chartState = node.properties;
      this.properties.notesLength++;
      this.properties.notes.push(node.properties.note);
    } else if (node instanceof ChartStateCommandNode) {
      chartState = node.properties.chartState;
    } else if (node instanceof MeasureEndNode) {
      chartState = node.properties;
    }

    if (chartState !== undefined) {
      if (!this.children.some((x) => x instanceof ChartTokenNode)) {
        // 命令のみの場合はstartChartStateを更新する
        this.properties.startChartState = { ...chartState };
      }

      if (this.properties.endChartState === this.properties.startChartState) {
        this.properties.endChartState = { ...chartState };
      } else {
        if (this.properties.endChartState.measure < chartState.measure) {
          this.properties.endChartState.measure = chartState.measure;
        }
        if (this.properties.endChartState.showBarline !== chartState.showBarline) {
          this.properties.endChartState.showBarline = "unknown";
        }
        if (this.properties.endChartState.isGogotime !== chartState.isGogotime) {
          this.properties.endChartState.isGogotime = "unknown";
        }
        if (this.properties.endChartState.isDummyNote !== chartState.isDummyNote) {
          this.properties.endChartState.isDummyNote = "unknown";
        }
        if (this.properties.endChartState.rollState !== chartState.rollState) {
          this.properties.endChartState.rollState = "None";
        }
        if (this.properties.endChartState.bpm !== chartState.bpm) {
          this.properties.endChartState.bpm = undefined;
        }
        if (this.properties.endChartState.scroll !== chartState.scroll) {
          this.properties.endChartState.scroll = undefined;
        }
      }
    }
  }
}

/**
 * 式（ヘッダ･命令）のパラメータの集合ノード
 */
export class ParametersNode extends ParentNode<ParameterNode | DelimiterNode> {
  readonly parent: StatementNode;

  constructor(parent: StatementNode, range: Range) {
    super(parent, range);
    this.parent = parent;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: ParameterNode | DelimiterNode) {
    super._push(node);
  }
}

/**
 * 譜面分岐ノード
 */
export class BranchNode extends ParentNode<BranchSectionNode | CommandNode> {
  readonly parent: ChartNode | SongNode;
  properties: BranchProperties;

  constructor(parent: ChartNode | SongNode, range: Range, startChartState: ChartState) {
    super(parent, range);
    this.parent = parent;
    const chartStateClone = { ...startChartState };
    this.properties = {
      startChartState: chartStateClone,
      endChartState: chartStateClone,
      measureCount: 0,
      hasNormal: false,
      hasExpert: false,
      hasMaster: false,
      normalNotes: [],
      expertNotes: [],
      masterNotes: [],
    };
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: BranchSectionNode | CommandNode) {
    super._push(node);

    if (node instanceof BranchSectionNode) {
      if (node.properties.kind === "N") {
        this.properties.hasNormal = true;
        this.properties.normalNotes.push(...node.properties.notes);
      } else if (node.properties.kind === "E") {
        this.properties.hasExpert = true;
        this.properties.expertNotes.push(...node.properties.notes);
      } else if (node.properties.kind === "M") {
        this.properties.hasMaster = true;
        this.properties.masterNotes.push(...node.properties.notes);
      }
      if (this.properties.measureCount > node.properties.measureCount) {
        this.properties.measureCount = node.properties.measureCount;
      }
      if (this.properties.endChartState === this.properties.startChartState) {
        this.properties.endChartState = { ...node.properties.endChartState };
      } else {
        if (this.properties.endChartState.measure < node.properties.endChartState.measure) {
          this.properties.endChartState.measure = node.properties.endChartState.measure;
        }
        if (
          this.properties.endChartState.showBarline !== node.properties.endChartState.showBarline
        ) {
          this.properties.endChartState.showBarline = "unknown";
        }
        if (this.properties.endChartState.isGogotime !== node.properties.endChartState.isGogotime) {
          this.properties.endChartState.isGogotime = "unknown";
        }
        if (
          this.properties.endChartState.isDummyNote !== node.properties.endChartState.isDummyNote
        ) {
          this.properties.endChartState.isDummyNote = "unknown";
        }
        if (this.properties.endChartState.rollState !== node.properties.endChartState.rollState) {
          this.properties.endChartState.rollState = "None";
        }
        if (this.properties.endChartState.bpm !== node.properties.endChartState.bpm) {
          this.properties.endChartState.bpm = undefined;
        }
        if (this.properties.endChartState.scroll !== node.properties.endChartState.scroll) {
          this.properties.endChartState.scroll = undefined;
        }
      }
    }
  }
}

/**
 * 式（ヘッダ･命令）の名前ノード
 */
export class StatementNameNode extends LeafNode {
  readonly parent: StatementNode;

  constructor(parent: StatementNode, token: Token) {
    super(parent, token);
    this.parent = parent;
  }
}

/**
 * 式（ヘッダ･命令）のパラメータノード
 */
export class ParameterNode extends LeafNode {
  readonly parent: ParametersNode;
  properties: ParameterProperties;

  constructor(parent: ParametersNode, token: Token, index: number) {
    super(parent, token);
    this.parent = parent;
    this.properties = { index: index };
  }
}

/**
 * 区切り文字ノード
 */
export class DelimiterNode extends LeafNode {
  readonly parent: ParametersNode;

  constructor(parent: ParametersNode, token: Token) {
    super(parent, token);
    this.parent = parent;
  }
}

/**
 * 音符ノード
 */
export class NoteNode extends ChartTokenNode {
  readonly parent: MeasureNode;
  properties: NoteProperties;

  constructor(
    parent: MeasureNode,
    token: Token,
    chartState: ChartStateProperties,
    balloonId?: number
  ) {
    super(parent, token, chartState);
    this.parent = parent;
    const note = new Note(token, chartState.isGogotime, chartState.isDummyNote, balloonId);
    this.properties = { ...chartState, note: note };
  }
}

/**
 * 小節末（,）ノード
 */
export class MeasureEndNode extends ChartTokenNode {
  readonly parent: MeasureNode;

  constructor(parent: MeasureNode, token: Token, chartState: ChartStateProperties) {
    super(parent, token, { ...chartState });
    this.parent = parent;
  }
}
