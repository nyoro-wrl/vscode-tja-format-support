import { Range } from "vscode";
import { commands } from "../constants/commands";
import { mergeRanges, unionRanges } from "../util/range";
import { Token } from "./lexer";
import { Separator } from "./statement";

type HeadersProperties = {
  readonly headers: StatementProperties[];
};

type StatementProperties = {
  name: string;
  parameter: string;
  parameters: string[];
  separator: Separator;
};

type ChartProperties = {
  start: StatementProperties | undefined;
  end: StatementProperties | undefined;
  measure: number;
};

type MeasureProperties = {
  readonly measure: number;
  barlineShow: boolean;
};

type ChartTokenProperties = {
  readonly gogotime: boolean;
};

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
  protected _ranges: Range[] = [];

  get children(): readonly T[] {
    return this._children;
  }

  get ranges(): readonly Range[] {
    return this._ranges;
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
    if (node instanceof ParentNode) {
      this.pushRange(...node.ranges);
    } else if (node instanceof LeafNode) {
      this.pushRange(node.range);
    }
  }

  /**
   * 範囲の追加
   * @param ranges
   */
  public pushRange(...ranges: Range[]): void {
    for (const range of ranges) {
      this._ranges.push(range);
    }
    this._ranges = mergeRanges(this._ranges);
    const range = unionRanges(this._ranges);
    if (range !== undefined) {
      this._range = range;
    }
    if (this.parent !== undefined && this.parent instanceof ParentNode) {
      this.parent.pushRange(...this._ranges);
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

  constructor(parent: ParentNode | undefined, measure: number, barlineShow: boolean) {
    super(parent);
    this.properties = { measure: measure, barlineShow: barlineShow };
  }
}
export class ParametersNode extends ParentNode<ParameterNode | DelimiterNode> {}
export class NameNode extends LeafNode {}
export class ParameterNode extends LeafNode {}
export class DelimiterNode extends LeafNode {}
export abstract class ChartTokenNode extends LeafNode {
  properties: ChartTokenProperties;

  constructor(parent: ParentNode | undefined, token: Token, gogoTime: boolean) {
    super(parent, token);
    this.properties = { gogotime: gogoTime };
  }
}
export class NoteNode extends ChartTokenNode {}
export class MeasureEndNode extends ChartTokenNode {}
