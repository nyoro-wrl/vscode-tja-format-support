import { Range } from "vscode";
import { commands } from "../constants/commands";
import { Token } from "./lexer";
import { Separator } from "./statement";

interface HeadersProperties {
  readonly headers: StatementProperties[];
}

interface StatementProperties {
  name: string;
  parameter: string;
  parameters: string[];
  separator: Separator;
}

interface ChartTokenProperties {
  readonly isGogotime: boolean;
  readonly isDummyNote: boolean;
}

interface CouseProperties {
  course: string;
  styles: StyleProperties[];
}

interface StyleProperties extends HeadersProperties {
  style: string;
}

interface ChartProperties {
  start: StatementProperties | undefined;
  end: StatementProperties | undefined;
  measure: number;
}

interface BranchProperties {
  readonly startMeasure: number;
  measureCount: number;
}

interface BranchSectionProperties {
  measureCount: number;
}

interface MeasureProperties {
  readonly measure: number;
  showBarline: boolean;
}

interface ParameterProperties {
  index: number;
}

interface NoteProperties extends ChartTokenProperties {
  readonly balloonId: number | undefined;
}

/**
 * ノード
 */
export abstract class Node {
  readonly parent: ParentNode | undefined;
  protected _range: Range | undefined;

  get range(): Readonly<Range> | undefined {
    return this._range;
  }

  constructor(parent: ParentNode | undefined) {
    this.parent = parent;
  }

  /**
   * 親ノードを再帰的に検索し、最初に一致したNodeを返す
   * @param predicate
   * @param includeSelf 自身を検索対象に含む
   * @returns
   */
  public findParent(
    predicate: (node: Node) => boolean,
    includeSelf: boolean = true
  ): Node | undefined {
    if (includeSelf && predicate(this)) {
      return this;
    }
    if (this.parent !== undefined) {
      const result = this.parent.findParent(predicate);
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
    super(parent);
    this.value = token.value;
    this._range = token.range;
  }
}

/**
 * 親ノード
 */
export abstract class ParentNode<T extends Node = Node> extends Node {
  protected _children: T[] = [];
  protected _range: Range | undefined;

  get children(): readonly T[] {
    return this._children;
  }

  constructor(parent: ParentNode | undefined) {
    super(parent);
  }

  /**
   * 子ノードを再帰的に検索し、最初に一致したNodeを返す
   * @param predicate
   * @param includeSelf 自身を検索対象に含む
   * @returns
   */
  public find(predicate: (node: Node) => boolean, includeSelf: boolean = true): Node | undefined {
    if (includeSelf && predicate(this)) {
      return this;
    }
    for (const child of this.children) {
      if (child instanceof ParentNode) {
        const result = child.find(predicate);
        if (result !== undefined) {
          return result;
        }
      } else if (predicate(child)) {
        return child;
      }
    }
  }

  /**
   * 子ノードを再帰的に検索し、一致した全てのNodeを返す
   * @param predicate
   * @param includeSelf 自身を検索対象に含む
   * @returns
   */
  public findAll(predicate: (node: Node) => boolean, includeSelf: boolean = true): Node[] {
    const results: Node[] = [];
    if (includeSelf && predicate(this)) {
      results.push(this);
    }
    for (const child of this.children) {
      if (child instanceof ParentNode) {
        const result = child.findAll(predicate);
        results.push(...result);
      } else if (predicate(child)) {
        results.push(child);
      }
    }
    return results;
  }

  /**
   * 子ノードを再帰的に検索し、最後に一致したNodeを返す
   * @param predicate
   * @param includeSelf 自身を検索対象に含む
   * @returns
   */
  public findLast(
    predicate: (node: Node) => boolean,
    includeSelf: boolean = true
  ): Node | undefined {
    let result: Node | undefined;
    if (includeSelf && predicate(this)) {
      result = this;
    }
    for (const child of this.children) {
      if (child instanceof ParentNode) {
        const node = child.findLast(predicate);
        if (node !== undefined) {
          result = node;
        }
      } else if (predicate(child)) {
        result = child;
      }
    }
    return result;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  protected _push(node: T): void {
    this._children.push(node);
    if (node.range !== undefined) {
      this.pushRange(node.range);
    }
  }

  /**
   * 範囲の追加
   * @param range
   */
  public pushRange(range: Range): void {
    if (this._range === undefined) {
      this._range = range;
    } else {
      this._range = this._range.union(range);
    }
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

  constructor(parent: ParentNode | undefined, separator: Separator) {
    super(parent);
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
export abstract class BranchSectionNode extends ParentNode<CommandNode | MeasureNode> {
  properties: BranchSectionProperties = { measureCount: 0 };

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: CommandNode | MeasureNode) {
    super._push(node);

    if (node instanceof MeasureNode) {
      this.properties.measureCount++;
    }
  }
}

/**
 * 音符と小節末（,）ノード
 */
export abstract class ChartTokenNode extends LeafNode {
  properties: ChartTokenProperties;

  constructor(
    parent: ParentNode | undefined,
    token: Token,
    isGogotime: boolean,
    isDummyNote: boolean
  ) {
    super(parent, token);
    this.properties = { isGogotime: isGogotime, isDummyNote: isDummyNote };
  }
}

/**
 * 最上位ノード
 */
export class RootNode extends ParentNode<RootHeadersNode | CourseNode> {
  readonly parent: undefined;

  constructor() {
    super(undefined);
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

  constructor(parent: RootNode) {
    super(parent);
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

  constructor(parent: RootNode) {
    super(parent);
    this.parent = parent;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: StyleNode) {
    super._push(node);

    this.properties.styles.push(node.properties);

    const courseHeaders = node.find((x) => x instanceof StyleHeadersNode) as
      | StyleHeadersNode
      | undefined;
    if (courseHeaders !== undefined) {
      const courseHeader = courseHeaders.properties.headers.find((x) => x.name === "COURSE");
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
  properties: StyleProperties = { style: "", headers: [] };

  constructor(parent: CourseNode) {
    super(parent);
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
      const styleHeader = node.properties.headers.find((x) => x.name === "STYLE");
      if (styleHeader !== undefined) {
        this.properties.style = styleHeader.parameter;
      }
    }
  }
}

/**
 * プレイスタイル別ヘッダの集合ノード
 */
export class StyleHeadersNode extends HeadersNode {
  readonly parent: StyleNode;

  constructor(parent: StyleNode) {
    super(parent);
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

  constructor(parent: HeadersNode, separator: Separator) {
    super(parent, separator);
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
  readonly parent: BranchSectionNode | StyleNode | ChartNode | MeasureNode | BranchNode;

  constructor(
    parent: BranchSectionNode | StyleNode | ChartNode | MeasureNode | BranchNode,
    separator: Separator
  ) {
    super(parent, separator);
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
 * 譜面ノード
 */
export class ChartNode extends ParentNode<CommandNode | MeasureNode | BranchNode> {
  readonly parent: StyleNode;
  properties: ChartProperties = { start: undefined, end: undefined, measure: 0 };

  constructor(parent: StyleNode) {
    super(parent);
    this.parent = parent;
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: CommandNode | MeasureNode | BranchNode) {
    super._push(node);
    if (node instanceof CommandNode) {
      if (commands.items.start.regexp.test(node.properties.name)) {
        this.properties.start = node.properties;
      } else if (commands.items.end.regexp.test(node.properties.name)) {
        this.properties.end = node.properties;
      }
    } else if (node instanceof MeasureNode) {
      this.properties.measure = node.properties.measure;
    } else if (node instanceof MeasureNode) {
    }
  }
}

/**
 * 小節ノード
 */
export class MeasureNode extends ParentNode<NoteNode | CommandNode | MeasureEndNode> {
  readonly parent: ChartNode | BranchSectionNode;
  properties: MeasureProperties;

  constructor(parent: ChartNode | BranchSectionNode, measure: number, showBarline: boolean) {
    super(parent);
    this.parent = parent;
    this.properties = { measure: measure, showBarline: showBarline };
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: NoteNode | CommandNode | MeasureEndNode) {
    super._push(node);
  }
}

/**
 * 式（ヘッダ･命令）のパラメータの集合ノード
 */
export class ParametersNode extends ParentNode<ParameterNode | DelimiterNode> {
  readonly parent: StatementNode;

  constructor(parent: StatementNode) {
    super(parent);
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
  readonly parent: ChartNode;
  properties: BranchProperties;

  constructor(parent: ChartNode, startMeasure: number) {
    super(parent);
    this.parent = parent;
    this.properties = { startMeasure: startMeasure, measureCount: 0 };
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: BranchSectionNode | CommandNode) {
    super._push(node);

    if (
      node instanceof BranchSectionNode &&
      this.properties.measureCount < node.properties.measureCount
    ) {
      this.properties.measureCount = node.properties.measureCount;
    }
  }
}

/**
 * 普通譜面ノード
 */
export class NBranchSectionNode extends BranchSectionNode {}

/**
 * 玄人譜面ノード
 */
export class EBranchSectionNode extends BranchSectionNode {}

/**
 * 達人譜面ノード
 */
export class MBranchSectionNode extends BranchSectionNode {}

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
    isGogotime: boolean,
    isDummyNote: boolean,
    balloonId: number | undefined
  ) {
    super(parent, token, isGogotime, isDummyNote);
    this.parent = parent;
    this.properties = { isGogotime: isGogotime, isDummyNote: isDummyNote, balloonId: balloonId };
  }
}

/**
 * 小節末（,）ノード
 */
export class MeasureEndNode extends ChartTokenNode {
  readonly parent: MeasureNode;

  constructor(parent: MeasureNode, token: Token, isGogotime: boolean, isDummyNote: boolean) {
    super(parent, token, isGogotime, isDummyNote);
    this.parent = parent;
  }
}
