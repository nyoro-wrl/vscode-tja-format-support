import { Collection, ICollection } from "./collection";

/**
 * パラメーターの区切り文字
 */
export type Separator = "Comma" | "Space" | "None" | "Unknown";

/**
 * 文（ヘッダ･命令）
 */
export interface IStatement {
  /**
   * 名称
   */
  readonly name: string;
  /**
   * 簡潔な説明
   */
  readonly detail: string;
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
  readonly separator: Separator;
  /**
   * 優先度
   *
   *     0 // トップレベルに表示
   *     1 // 比較的使う
   *     2 // 明確な目的がないと使わない
   */
  readonly order: number;
}

interface IStatementCollection<T extends IStatement> extends ICollection<T> {
  /**
   * 一致するStatementを取得
   * @param string
   */
  get(string: string): T | undefined;
}

export class StatementCollection<T extends IStatement>
  extends Collection<T>
  implements IStatementCollection<T>
{
  /**
   * 一致するStatementを取得
   * @param string
   */
  get(string: string): T | undefined {
    for (const statement of this) {
      if (statement.regexp.test(string)) {
        return statement;
      }
    }
  }
}
