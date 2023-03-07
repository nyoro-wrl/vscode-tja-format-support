import * as vscode from "vscode";
import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { addSyntaxError, clearDiagnostics } from "../error";
import { Lexer, Token } from "./lexer";
import { CommandNode, HeaderNode, Node, NodeKind, ParameterNode, TextNode } from "./node";
import { findLast } from "lodash";
import { tokenizedRawParameter } from "../util/lexer";
import { Range } from "vscode";

// TODO 1行の複数小節をエラーにする

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
  private chartAfter: boolean = false;
  /**
   * 一度でも譜面部分に入ったかどうか
   */
  private chartAfterOnce: boolean = false;

  constructor(document: vscode.TextDocument) {
    const lexer = new Lexer(document);
    const tokens = lexer.tokenized();
    this.tokens = tokens;
  }

  public parse(): Node {
    clearDiagnostics();
    const node = new Node("Global", new Range(0, 0, 0, 0), undefined);
    return this.parseNode(node);
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
            if (section === "Course" || this.chartAfterOnce) {
              if (this.chartAfter) {
                this.chartAfter = false;
                let node = new Node("Course", token.range, parent);
                node = this.parseNode(node);
                parent.push(node);
              } else {
                let node = this.findLastOrCreateChildren(parent, "Course", token.range);
                node = this.parseNode(node);
              }
            } else if (section === "Global" || section === "Unknown") {
              let node = this.findLastOrCreateChildren(parent, "GlobalHeaders", token.range);
              node = this.parseNode(node);
            } else {
              addSyntaxError(
                token.range,
                `No processing defined for HeaderSection = "${section}".`
              );
            }
          } else if (token.kind === "Command") {
            if (this.chartAfter) {
              this.chartAfter = false;
              let node = new Node("Course", token.range, parent);
              node = this.parseNode(node);
              parent.push(node);
            } else {
              let node = this.findLastOrCreateChildren(parent, "Course", token.range);
              node = this.parseNode(node);
            }
          } else if (token.kind === "Notes") {
            addSyntaxError(token.range, "Missing #START.");
          } else if (token.kind === "MeasureEnd") {
            addSyntaxError(token.range, "Invalid text.");
          } else if (token.kind === "EndOfLine") {
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent.kind === "GlobalHeaders" || parent.kind === "CourseHeaders") {
          if (token.kind === "Header") {
            let node = new HeaderNode(token, parent);
            node = this.parseNode(node);
            parent.push(node);
            return parent;
          } else if (token.kind === "Command") {
            this.position--;
            return parent;
          } else if (token.kind === "Notes") {
            addSyntaxError(token.range, "Missing #START.");
          } else if (token.kind === "MeasureEnd") {
            addSyntaxError(token.range, "Invalid text.");
          } else if (token.kind === "EndOfLine") {
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent.kind === "Course") {
          if (token.kind === "Header") {
            const section = headers.get(token.value)?.section ?? "Unknown";
            if (section === "Course" || section === "Unknown" || this.chartAfterOnce) {
              if (this.chartAfter) {
                this.position--;
                return parent;
              } else {
                let node = this.findLastOrCreateChildren(parent, "CourseHeaders", token.range);
                node = this.parseNode(node);
              }
            } else if (section === "Global") {
              this.position--;
              return parent;
            } else {
              addSyntaxError(
                token.range,
                `No processing defined for HeaderSection = "${section}".`
              );
            }
          } else if (token.kind === "Command") {
            const section = commands.get(token.value)?.section ?? "Unknown";
            if (section === "Outer" || section === "Unknown") {
              let node = new CommandNode(token, parent);
              node = this.parseNode(node);
              parent.push(node);
            } else if (section === "Start") {
              let chart = new Node("Chart", token.range, parent);
              let start = new CommandNode(token, chart);
              start = this.parseNode(start);
              chart.push(start);
              this.position++;
              chart = this.parseNode(chart);
              parent.push(chart);
            } else if (section === "Inner" || section === "End") {
              let node = new CommandNode(token, parent);
              node = this.parseNode(node);
              parent.push(node);
              addSyntaxError(node.range, "Invalid command position.");
            } else {
              addSyntaxError(
                token.range,
                `No processing defined for CommandSection = "${section}".`
              );
            }
          } else if (token.kind === "Notes") {
            addSyntaxError(token.range, "Missing #START.");
          } else if (token.kind === "MeasureEnd") {
            addSyntaxError(token.range, "Invalid text.");
          } else if (token.kind === "EndOfLine") {
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent.kind === "Header" || parent.kind === "Command") {
          if (
            (parent.kind === "Header" && token.kind === "Header") ||
            (parent.kind === "Command" && token.kind === "Command")
          ) {
            const node = new TextNode("Directive", token, parent);
            parent.push(node);
          } else if (token.kind === "RawParameter") {
            if (parent instanceof ParameterNode) {
              const rawParameter = new Node("Parameters", token.range, parent);
              const parameters = tokenizedRawParameter(token, parent.separator);
              if (parameters.length === 1) {
                const node = new TextNode("Parameter", token, parent);
                parent.push(node);
              } else {
                for (const parameter of parameters) {
                  let kind: NodeKind;
                  if (parameter.kind === "RawParameter" || parameter.kind === "Parameter") {
                    kind = "Parameter";
                  } else if (parameter.kind === "Delimiter") {
                    kind = "Delimiter";
                  } else {
                    return parent;
                  }
                  const node = new TextNode(kind, parameter, rawParameter);
                  rawParameter.push(node);
                }
                parent.push(rawParameter);
              }
            } else {
              addSyntaxError(token.range, "No processing defined for instance.");
            }
            return parent;
          } else if (token.kind === "EndOfLine") {
            return parent;
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent.kind === "Chart") {
          if (token.kind === "Header") {
            addSyntaxError(token.range, "Invalid header position.");
          } else if (token.kind === "Command") {
            const section = commands.get(token.value)?.section ?? "Unknown";
            if (section === "Outer" || section === "Start") {
              let node = new CommandNode(token, parent);
              node = this.parseNode(node);
              parent.push(node);
              addSyntaxError(token.range, "Invalid command position.");
            } else if (section === "Inner" || section === "Unknown") {
              let node = new CommandNode(token, parent);
              node = this.parseNode(node);
              parent.push(node);
            } else if (section === "End") {
              let node = new CommandNode(token, parent);
              node = this.parseNode(node);
              parent.push(node);
              this.chartAfter = true;
              this.chartAfterOnce = true;
              return parent;
            } else {
              addSyntaxError(
                token.range,
                `No processing defined for CommandSection = "${section}".`
              );
            }
          } else if (token.kind === "Notes" || token.kind === "MeasureEnd") {
            let node = new Node("Measure", token.range, parent);
            node = this.parseNode(node);
            parent.push(node);
          } else if (token.kind === "EndOfLine") {
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else if (parent.kind === "Measure") {
          if (token.kind === "Header") {
            addSyntaxError(token.range, "Invalid header position.");
          } else if (token.kind === "Command") {
            const section = commands.get(token.value)?.section ?? "Unknown";
            if (section === "Outer" || section === "Start") {
              let node = new CommandNode(token, parent);
              node = this.parseNode(node);
              parent.push(node);
              addSyntaxError(token.range, "Invalid command position.");
            } else if (section === "Inner" || section === "Unknown") {
              let node = new CommandNode(token, parent);
              node = this.parseNode(node);
              parent.push(node);
            } else if (section === "End") {
              const previewToken = this.tokens[this.position - 1];
              addSyntaxError(previewToken.range, "Unclosed measure.");
              this.position--;
              return parent;
            } else {
              addSyntaxError(
                token.range,
                `No processing defined for CommandSection = "${section}".`
              );
            }
          } else if (token.kind === "Notes") {
            const node = new TextNode("Note", token, parent);
            parent.push(node);
          } else if (token.kind === "MeasureEnd") {
            const node = new TextNode("MeasureEnd", token, parent);
            parent.push(node);
            return parent;
          } else if (token.kind === "EndOfLine") {
          } else {
            addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
          }
        } else {
          addSyntaxError(token.range, `No processing defined for NodeKind = "${parent.kind}".`);
        }
      }
    }
    if (this.position >= this.tokens.length) {
      if (parent.kind === "Chart") {
        const previewToken = this.tokens[this.position - 1];
        addSyntaxError(previewToken.range, "Missing #END.");
      }
    }
    return parent;
  }
}
