import * as vscode from "vscode";
import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { addSyntaxError, clearDiagnostics } from "../error";
import { Lexer, Token } from "./lexer";
import { HeaderNode, Node, NodeKind, TextNode } from "./node";
import { findLast } from "lodash";
import { tokenizedRawParameter } from "../util/lexer";
import { Range } from "vscode";

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
  private chartIn: boolean = false;
  /**
   * 一度でも譜面部分に入ったかどうか
   */
  private chartInOnce: boolean = false;

  constructor(document: vscode.TextDocument) {
    const lexer = new Lexer(document);
    const tokens = lexer.tokenized();
    this.tokens = tokens;
  }

  /**
   * parent.childrenからkindが一致する最後の子要素を取得する。見つからない場合は作成する
   * @param parent
   * @param kind
   * @returns
   */
  private findLastOrCreateChildren(parent: Node, kind: NodeKind, range: Range): Node {
    let node = findLast(parent.children, (x) => x.kind === kind);
    if (node === undefined) {
      node = new Node(kind, range, parent);
      parent.push(node);
    }
    return node;
  }

  private parseNode<T extends Node>(parent: T): T {
    for (; this.position < this.tokens.length; this.position++) {
      const token = this.tokens[this.position];
      if (token.kind === "Unknown") {
        addSyntaxError(token.range, "Invalid text.");
      } else {
        if (parent.kind === "Global") {
          if (token.kind === "Header") {
            const section = headers.get(token.value)?.section ?? "Unknown";
            if (section === "Global" || section === "Unknown") {
              if (this.chartInOnce) {
                // Course単位の命令として解釈する
                let node = this.findLastOrCreateChildren(parent, "Course", token.range);
                node = this.parseNode(node);
              } else {
                let node = this.findLastOrCreateChildren(parent, "GlobalHeaders", token.range);
                node = this.parseNode(node);
              }
            } else if (section === "Course") {
              let node = this.findLastOrCreateChildren(parent, "Course", token.range);
              node = this.parseNode(node);
            } else {
              addSyntaxError(
                token.range,
                `No processing defined for HeaderSection = "${section}".`
              );
            }
          } else if (token.kind === "Command") {
            let node = this.findLastOrCreateChildren(parent, "Course", token.range);
            node = this.parseNode(node);
          } else if (token.kind === "Notes") {
            addSyntaxError(token.range, "Invalid notes position.");
          } else if (token.kind === "MeasureEnd") {
            addSyntaxError(token.range, "Invalid measure end position.");
          } else if (token.kind === "EndOfLine") {
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent.kind === "GlobalHeaders" || parent.kind === "CourseHeaders") {
          if (token.kind === "Header") {
            let node = new HeaderNode(token, parent);
            node = this.parseNode(node);
            parent.push(node);
          } else if (token.kind === "Command") {
            return parent;
          } else if (token.kind === "Notes") {
            addSyntaxError(token.range, "Invalid notes position.");
          } else if (token.kind === "MeasureEnd") {
            addSyntaxError(token.range, "Invalid measure end position.");
          } else if (token.kind === "EndOfLine") {
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent.kind === "Header") {
          if (token.kind === "Header") {
            const section = headers.get(token.value)?.section ?? "Unknown";
            if (section === ) {
              
            }
            const node = new TextNode("Name", token, parent);
            parent.push(node);
          } else if (token.kind === "RawParameter") {
            if (parent instanceof HeaderNode) {
              const rawParameter = new Node("Parameters", token.range, parent);
              const parameters = tokenizedRawParameter(token, parent.separator);
              if (parameters.length === 1) {
                const node = new TextNode("Parameter", token, parent);
                parent.push(node);
              } else {
                for (const parameter of parameters) {
                  const node = new TextNode("Parameter", parameter, rawParameter);
                  rawParameter.push(node);
                }
                parent.push(rawParameter);
              }
            }
          } else if (token.kind === "Parameter") {
            const node = new TextNode("Parameter", token, parent);
            parent.push(node);
          } else if (token.kind === "EndOfLine") {
            return parent;
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent.kind === "Course") {
          if (token.kind === "Header") {
          } else if (token.kind === "Command") {
          } else if (token.kind === "RawParameter") {
          } else if (token.kind === "Parameter") {
          } else if (token.kind === "Notes") {
          } else if (token.kind === "MeasureEnd") {
          } else if (token.kind === "EndOfLine") {
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent.kind === "Command") {
          if (token.kind === "Header") {
          } else if (token.kind === "Command") {
          } else if (token.kind === "RawParameter") {
          } else if (token.kind === "Parameter") {
          } else if (token.kind === "Notes") {
          } else if (token.kind === "MeasureEnd") {
          } else if (token.kind === "EndOfLine") {
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent.kind === "Chart") {
          if (token.kind === "Header") {
          } else if (token.kind === "Command") {
          } else if (token.kind === "RawParameter") {
          } else if (token.kind === "Parameter") {
          } else if (token.kind === "Notes") {
          } else if (token.kind === "MeasureEnd") {
          } else if (token.kind === "EndOfLine") {
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent.kind === "Measure") {
          if (token.kind === "Header") {
          } else if (token.kind === "Command") {
          } else if (token.kind === "RawParameter") {
          } else if (token.kind === "Parameter") {
          } else if (token.kind === "Notes") {
          } else if (token.kind === "MeasureEnd") {
          } else if (token.kind === "EndOfLine") {
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent.kind === "Note") {
          if (token.kind === "Header") {
          } else if (token.kind === "Command") {
          } else if (token.kind === "RawParameter") {
          } else if (token.kind === "Parameter") {
          } else if (token.kind === "Notes") {
          } else if (token.kind === "MeasureEnd") {
          } else if (token.kind === "EndOfLine") {
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent.kind === "MeasureEnd") {
          if (token.kind === "Header") {
          } else if (token.kind === "Command") {
          } else if (token.kind === "RawParameter") {
          } else if (token.kind === "Parameter") {
          } else if (token.kind === "Notes") {
          } else if (token.kind === "MeasureEnd") {
          } else if (token.kind === "EndOfLine") {
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else {
          addSyntaxError(token.range, `No processing defined for NodeKind = "${parent.kind}".`);
        }
      }
    }
    return parent;
  }

  public parse(): Node {
    clearDiagnostics();
    const node = new Node("Global", new Range(0, 0, 0, 0), undefined);
    return this.parseNode(node);
  }
}
