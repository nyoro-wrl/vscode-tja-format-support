import { SnippetString } from "vscode";
import { Collection, ICollection } from "./collection";

/**
 * パラメーターの区切り文字
 */
export type Separator = "Comma" | "Space" | "None" | "Unknown";

export type FilePathType = "Audio" | "tja" | "Image" | "Movie" | "Lyrics" | "File";

export type SnippetParameter = {
  value: string;
  detail: string;
};

/**
 * パラメータ定義
 */
export type StatementParameter = {
  name: string;
  description: string;
  snippet?: readonly SnippetParameter[] | FilePathType;
  isOptional?: true;
};

/**
 * 文（ヘッダー･命令）
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
   * 解説テキスト
   */
  readonly documentation: string;
  /**
   * パラメータ定義の配列
   */
  readonly parameter: readonly StatementParameter[];
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
  /**
   * 一致する正規表現
   */
  readonly regexp?: RegExp;
  /**
   * 補完テキスト
   */
  readonly snippet?: SnippetString;
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
      if (getRegExp(statement).test(string)) {
        return statement;
      }
    }
  }
}

export function getRegExp(header: IStatement): RegExp {
  return header.regexp || new RegExp(`^${header.name}$`);
}
