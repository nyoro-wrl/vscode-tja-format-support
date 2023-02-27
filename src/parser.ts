import { commands } from "./constants/commands";
import { headers } from "./constants/headers";
import { Split } from "./type/statement";

const commentRegExp = /^(.*)\/\/\s*.*$/;
const headerRegExp = /^([A-Z0-9]+):(.*)$/;
const commandRegExp = /^#([A-Z0-9]+)(\s+(.*))?$/;
const chartRegExp = /^[0-9\s],?$/;
const notesRegExp = /[0-9]/;

type TokenType = "header" | "command" | "rawParameter" | "parameter" | "notes" | "measureEnd";

type Token = {
  readonly type: TokenType;
  readonly value: string;
};

/**
 * 字句解析
 */
export class Lexer {
  private inputs: string[];
  private text = "";

  constructor(input: string) {
    this.inputs = input.split(/\r\n|\n/);
  }

  /**
   * コメント部分の削除
   * @returns
   */
  private deleteComment(): string {
    const matches = commentRegExp.exec(this.text);
    if (matches === null) {
      return this.text;
    }
    return matches[1].trimEnd();
  }

  /**
   * 行がヘッダーかどうか
   * @returns
   */
  private isHeader(): boolean {
    return headerRegExp.test(this.text);
  }

  /**
   * ヘッダー行のトークンを取得
   * @returns
   */
  private getHeader(): Token[] {
    const tokens: Token[] = [];
    const matches = headerRegExp.exec(this.text);
    if (matches === null) {
      return tokens;
    }
    const headerValue = matches[1];
    const headerToken: Token = { type: "header", value: headerValue };
    tokens.push(headerToken);
    const rawParameterValue = matches[2];
    if (rawParameterValue.length > 0) {
      const rawParameterToken: Token = { type: "rawParameter", value: rawParameterValue };
      tokens.push(rawParameterToken);
    }
    return tokens;
  }

  /**
   * 行が命令かどうか
   * @returns
   */
  private isCommand(): boolean {
    return commandRegExp.test(this.text);
  }

  /**
   * 命令行からトークンを取得
   * @returns
   */
  private getCommand(): Token[] {
    const tokens: Token[] = [];
    const matches = commandRegExp.exec(this.text);
    if (matches === null) {
      return tokens;
    }
    const commandValue = matches[1];
    const commandToken: Token = { type: "command", value: commandValue };
    tokens.push(commandToken);
    if (matches[3] !== undefined) {
      const rawParameterValue = matches[3];
      if (rawParameterValue.length > 0) {
        const rawParameterToken: Token = { type: "rawParameter", value: rawParameterValue };
        tokens.push(rawParameterToken);
      }
    }
    return tokens;
  }

  private isChart(): boolean {
    return chartRegExp.test(this.text);
  }

  /**
   * 譜面のトークンを取得
   * @returns
   */
  private getChart(): Token[] {
    const tokens: Token[] = [];
    for (const char of this.text) {
      if (notesRegExp.test(char)) {
        const notesToken: Token = { type: "notes", value: char };
        tokens.push(notesToken);
      } else if (char === ",") {
        const measureEndToken: Token = { type: "measureEnd", value: char };
        tokens.push(measureEndToken);
      }
    }
    return tokens;
  }

  /**
   * テキストをトークンに変換
   * @returns
   */
  public tokenized(): Token[] {
    const tokens: Token[] = [];
    for (let line = 0; line < this.inputs.length; line++) {
      this.text = this.inputs[line].trim();
      this.text = this.deleteComment();
      if (this.isHeader()) {
        tokens.push(...this.getHeader());
      } else if (this.isCommand()) {
        tokens.push(...this.getCommand());
      } else if (this.isChart()) {
        tokens.push(...this.getChart());
      }
    }
    return tokens;
  }
}

// 全ての表現
class Expression {
  readonly tokens: Token[] = [];
  readonly children: Expression[] = [];

  constructor(...tokens: Token[]) {
    this.tokens.push(...tokens);
  }
}

// 全ての親
class TopExpression extends Expression {}

class ParameterExpression extends Expression {
  readonly split: Split;

  constructor(token: Token) {
    super(token);
    this.split = this.getParameterSplitType(token);
  }

  public parameterParse(token: Token): void {
    switch (this.split) {
      case "Unknown":
        this.tokens.push(token);
        break;
      case "None": {
        const value = token.value;
        const parameterToken: Token = { type: "parameter", value: value };
        this.tokens.push(parameterToken);
        break;
      }
      case "Space": {
        const parameters = token.value.split(" ");
        for (const parameter of parameters) {
          const trimValue = parameter.trim();
          const parameterToken: Token = { type: "parameter", value: trimValue };
          this.tokens.push(parameterToken);
        }
        break;
      }
      case "Comma": {
        const parameters = token.value.split(",");
        for (const parameter of parameters) {
          const trimValue = parameter.trim();
          const parameterToken: Token = { type: "parameter", value: trimValue };
          this.tokens.push(parameterToken);
        }
        break;
      }
      default:
        throw new Error("parameterSplitTypeに対応する処理がありません");
    }
  }

  private getParameterSplitType(token: Token): Split {
    switch (token.type) {
      case "header": {
        const header = headers.get(token.value);
        if (header === undefined) {
          return "Unknown";
        } else {
          return header.split;
        }
      }
      case "command": {
        const command = commands.get(token.value);
        if (command === undefined) {
          return "Unknown";
        } else {
          return command.split;
        }
      }
      default:
        throw new Error("パラメーターを持つトークンではありません");
    }
  }
}

// ヘッダー
class HeaderExpression extends ParameterExpression {}

// 命令
class CommandExpression extends ParameterExpression {}

// 譜面外に記載する命令
class OuterChartCommandExpression extends CommandExpression {}

// 譜面内に記載する命令
class InnerChartCommandExpression extends CommandExpression {}

// 譜面部分（#START~#END）
class ChartExpression extends Expression {}

// 不正
class IllegalExpression extends Expression {}

export class Parser {
  private tokens: Token[];
  private position = 0;

  constructor(input: Token[] | string) {
    if (Array.isArray(input)) {
      this.tokens = input;
    } else {
      const lexer = new Lexer(input);
      const tokens = lexer.tokenized();
      this.tokens = tokens;
    }
  }

  public parse(): Expression {
    let expression = new TopExpression();
    expression = this.expressionParse(expression);
    return expression;
  }

  private expressionParse<TExpression extends Expression>(parent: TExpression): TExpression {
    for (this.position; this.position < this.tokens.length; this.position++) {
      const token = this.tokens[this.position];
      switch (token.type) {
        case "header": {
          if (parent instanceof TopExpression) {
            let headerExpression = new HeaderExpression(token);
            this.position++;
            headerExpression = this.expressionParse(headerExpression);
            parent.children.push(headerExpression);
          } else {
            return parent;
          }
          break;
        }
        case "command": {
          if (parent instanceof TopExpression) {
            let commandExpression = new CommandExpression(token);
            this.position++;
            commandExpression = this.expressionParse(commandExpression);
            parent.children.push(commandExpression);
          } else {
            return parent;
          }
          break;
        }
        case "rawParameter": {
          if (parent instanceof ParameterExpression) {
            parent.parameterParse(token);
          }
          return parent;
        }
        case "notes": {
          break;
        }
        case "measureEnd": {
          break;
        }
        default: {
          throw new Error("TokenTypeが見つかりません");
        }
      }
    }
    return parent;
  }

  // private parseExpression(parent: Expression): Expression {
  //   for (this.position; this.position < parent.tokens.length; this.position++) {
  //     const token = this.tokens[0];
  //     switch (token.type) {
  //       case TokenType.header: {
  //         if () {

  //         }
  //         const expression = new HeaderExpression(token);
  //         this.parseExpression(expression);
  //         parent.children.push(expression);
  //         break;
  //       }
  //       case TokenType.command: {
  //         const expression = new CommandExpression(token);
  //         expressions.push(expression);
  //         break;
  //       }
  //       case TokenType.rawParameter: {
  //         if (nowExpression instanceof HeaderExpression) {
  //           nowExpression.tokens.push(token);
  //         } else if (nowExpression instanceof CommandExpression) {
  //           nowExpression.tokens.push(token);
  //         } else {
  //           const expression = new IllegalExpression(token);
  //           expressions.push();
  //         }
  //         break;
  //       }
  //       case TokenType.notes: {
  //         break;
  //       }
  //       case TokenType.measureEnd: {
  //         break;
  //       }
  //       default: {
  //         throw new Error("TokenTypeが見つかりません");
  //       }
  //     }
  //   }
  //   return parent;
  // }

  // public parse() {
  //   const expression = new SongExpression(...this.tokens);
  //   this.parseExpression(expression);

  //   const nowExpression: Expression = new SongExpression();
  //   for (const token of this.tokens) {
  //     switch (token.type) {
  //       case TokenType.header: {
  //         if (nowExpression instanceof SongExpression) {
  //           nowExpression.children.push();
  //         }
  //         nowExpression = new HeaderExpression(token);
  //         expressions.push(nowExpression);
  //         break;
  //       }
  //       case TokenType.command: {
  //         const expression = new CommandExpression(token);
  //         expressions.push(expression);
  //         break;
  //       }
  //       case TokenType.rawParameter: {
  //         if (nowExpression instanceof HeaderExpression) {
  //           nowExpression.tokens.push(token);
  //         } else if (nowExpression instanceof CommandExpression) {
  //           nowExpression.tokens.push(token);
  //         } else {
  //           const expression = new IllegalExpression(token);
  //           expressions.push();
  //         }
  //         break;
  //       }
  //       case TokenType.notes: {
  //         break;
  //       }
  //       case TokenType.measureEnd: {
  //         break;
  //       }
  //       default: {
  //         throw new Error("TokenTypeが見つかりません");
  //       }
  //     }
  //     nodes.children.push({ token: token });
  //   }
  // }
}

// enum AstNodeType {
//   document,
//   heading,
// }

// interface AstNode {
//   type: AstNodeType;
// }

// interface HeadingNode extends AstNode {
//   type: AstNodeType.heading;
//   value: string;
// }

// interface DocumentNode extends AstNode {
//   type: AstNodeType.document;
//   children: AstNode[];
// }

// class OldParser {
//   private currentToken: Token | null = null;

//   constructor(private lexer: Lexer) {
//     this.currentToken = lexer.getNextToken();
//   }

//   private consume(type: TokenType): void {
//     if (this.currentToken?.type === type) {
//       this.currentToken = this.lexer.getNextToken();
//     } else {
//       throw new Error(`Unexpected token: ${this.currentToken?.value}`);
//     }
//   }

//   private parseHeading(): HeadingNode {
//     const value = this.currentToken?.value || "";
//     this.consume(TokenType.header);
//     return { type: AstNodeType.heading, value };
//   }

//   private parseDocument(): DocumentNode {
//     const children: AstNode[] = [];
//     while (this.currentToken?.type !== TokenType.rawParameter) {
//       children.push(this.parseHeading());
//     }
//     return { type: AstNodeType.document, children };
//   }

//   public parse(): AstNode {
//     return this.parseDocument();
//   }
// }
