import { Range } from "vscode";
import { mergeRanges, unionRanges } from "../util/range";
import { Token } from "./lexer";
import { Separator } from "./statement";

type StatementPropeties = {
  name: string;
  parameter: string;
  parameters: string[];
  separator: Separator;
};

/**
 * ノード
 */
export class Node {
  readonly parent: Readonly<ParentNode> | undefined;
  protected _range: Range | undefined;

  get range(): Readonly<Range> | undefined {
    return this._range;
  }

  constructor(parent: ParentNode | undefined) {
    this.parent = parent;
  }
}

/**
 * 末端ノード
 */
export class LeafNode extends Node {
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
export class ParentNode<T extends Node = Node> extends Node {
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
  protected pushRange(...ranges: Range[]): void {
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
export class RootHeadersNode extends ParentNode<HeaderNode> {}
export class CourseNode extends ParentNode<CourseHeadersNode | CommandNode | ChartNode> {}
export class CourseHeadersNode extends ParentNode<HeaderNode> {}
export class HeaderNode extends ParentNode<NameNode | ParameterNode | ParametersNode> {
  protected _propeties: StatementPropeties;

  get propeties(): Readonly<StatementPropeties> {
    return this._propeties;
  }

  constructor(parent: ParentNode | undefined, separator: Separator) {
    super(parent);
    this._propeties = { name: "", parameter: "", parameters: [], separator: separator };
  }

  public override push(node: NameNode | ParameterNode | ParametersNode) {
    super.push(node);
    if (node instanceof NameNode) {
      this._propeties.name += node.value;
    } else if (node instanceof ParameterNode) {
      this._propeties.parameter += node.value;
      this._propeties.parameters.push(node.value);
    } else if (node instanceof ParametersNode) {
      this._propeties.parameter += node.children.map((x) => x.value).join("");
      this._propeties.parameters.push(
        ...node.children.filter((x) => x instanceof ParameterNode).map((x) => x.value)
      );
    }
  }
}
export class CommandNode extends ParentNode<NameNode | ParameterNode | ParametersNode> {
  protected _propeties: StatementPropeties;

  get propeties(): Readonly<StatementPropeties> {
    return this._propeties;
  }

  constructor(parent: ParentNode | undefined, separator: Separator) {
    super(parent);
    this._propeties = { name: "", parameter: "", parameters: [], separator: separator };
  }

  public override push(node: NameNode | ParameterNode | ParametersNode) {
    super.push(node);
    if (node instanceof NameNode) {
      this._propeties.name += node.value;
    } else if (node instanceof ParameterNode) {
      this._propeties.parameter += node.value;
      this._propeties.parameters.push(node.value);
    } else if (node instanceof ParametersNode) {
      this._propeties.parameter += node.children.map((x) => x.value).join("");
      this._propeties.parameters.push(
        ...node.children.filter((x) => x instanceof ParameterNode).map((x) => x.value)
      );
    }
  }
}
export class ChartNode extends ParentNode<CommandNode | MeasureNode> {}
export class MeasureNode extends ParentNode<NoteNode | CommandNode | MeasureEndNode> {}
export class ParametersNode extends ParentNode<ParameterNode | DelimiterNode> {}
export class NameNode extends LeafNode {}
export class ParameterNode extends LeafNode {}
export class DelimiterNode extends LeafNode {}
export class NoteNode extends LeafNode {}
export class MeasureEndNode extends LeafNode {}
