import { Collection, ICollection } from "./collection";

/**
 * パラメーターの区切り文字
 */
type Split = "Comma" | "Space" | "None";

/**
 * TJAで使用できる文
 */
export interface IStatement {
  /**
   * 一致する正規表現
   */
  readonly regexp: RegExp;
  /**
   * 構文テキスト
   */
  readonly syntax: string;
  /**
   * 補完テキスト
   */
  readonly snippet: string;
  /**
   * 解説テキスト
   */
  readonly documentation: string;
  /**
   * パラメーターの区切り文字
   */
  readonly split: Split;
}

interface IStatementCollection<T extends IStatement> extends ICollection<T> {
  /**
   * 一致するStatementを取得
   * @param string
   */
  getStatement(string: string): T | undefined;
}

export class StatementCollection<T extends IStatement>
  extends Collection<T>
  implements IStatementCollection<T>
{
  getStatement(string: string): T | undefined {
    for (const statement of this) {
      if (statement.regexp.test(string)) {
        return statement;
      }
    }
  }
}
