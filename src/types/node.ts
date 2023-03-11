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

interface ChartProperties {
  start: StatementProperties | undefined;
  end: StatementProperties | undefined;
  measure: number;
}

interface MeasureProperties {
  readonly measure: number;
  showBarline: boolean;
}

interface ChartTokenProperties {
  readonly isGogotime: boolean;
  readonly isDummyNote: boolean;
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
  override readonly _range: Range;

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
  protected override _range: Range | undefined;

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
        const result = child.find(predicate);
        if (result !== undefined) {
          results.push(result);
        }
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
  public push(node: T): void {
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

export class RootNode extends ParentNode<RootHeadersNode | CourseNode> {}
export abstract class HeadersNode extends ParentNode<HeaderNode> {
  properties: HeadersProperties = { headers: [] };
}
export class RootHeadersNode extends HeadersNode {}
export class CourseNode extends ParentNode<CourseHeadersNode | CommandNode | ChartNode> {}
export class CourseHeadersNode extends HeadersNode {}
export abstract class StatementNode<T extends Node> extends ParentNode<T> {
  properties: StatementProperties;

  constructor(parent: ParentNode | undefined, separator: Separator) {
    super(parent);
    this.properties = { name: "", parameter: "", parameters: [], separator: separator };
  }

  public override push(node: T) {
    super.push(node);
    if (node instanceof NameNode) {
      this.properties.name += node.value;
    } else if (node instanceof ParameterNode) {
      this.properties.parameter += node.value;
      this.properties.parameters.push(node.value);
    } else if (node instanceof ParametersNode) {
      this.properties.parameter += node.children.map((x) => x.value).join("");
      this.properties.parameters.push(
        ...node.children.filter((x) => x instanceof ParameterNode).map((x) => x.value)
      );
    }

    if (this.parent instanceof HeadersNode) {
      this.parent.properties.headers.push(this.properties);
    }
  }
}
export class HeaderNode extends StatementNode<NameNode | ParameterNode | ParametersNode> {}
export class CommandNode extends StatementNode<NameNode | ParameterNode | ParametersNode> {}
export class ChartNode extends ParentNode<CommandNode | MeasureNode> {
  properties: ChartProperties = { start: undefined, end: undefined, measure: 0 };

  public override push(node: CommandNode | MeasureNode) {
    super.push(node);
    if (node instanceof CommandNode) {
      if (commands.items.start.regexp.test(node.properties.name)) {
        this.properties.start = node.properties;
      } else if (commands.items.end.regexp.test(node.properties.name)) {
        this.properties.end = node.properties;
      }
    } else if (node instanceof MeasureNode) {
      this.properties.measure = node.properties.measure;
    }
  }
}
export class MeasureNode extends ParentNode<NoteNode | CommandNode | MeasureEndNode> {
  properties: MeasureProperties;

  constructor(parent: ParentNode | undefined, measure: number, showBarline: boolean) {
    super(parent);
    this.properties = { measure: measure, showBarline: showBarline };
  }
}
export class ParametersNode extends ParentNode<ParameterNode | DelimiterNode> {}
export class NameNode extends LeafNode {}
export class ParameterNode extends LeafNode {}
export class DelimiterNode extends LeafNode {}
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
export class NoteNode extends ChartTokenNode {}
export class MeasureEndNode extends ChartTokenNode {}
