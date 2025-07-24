import { IStatement, StatementCollection } from "./statement";

/**
 * 命令の記載位置
 *
 *     "Start" // 譜面の開始
 *     "End" // 譜面の終了
 *     "Outer" // 譜面の外側
 *     "Inner" // 譜面の内側
 *     "MeasureHead" // 小節頭
 *     "Song" // 段位道場課題曲
 *     "Branch" // 譜面分岐
 *     "Unknown" // 不明
 */
export type CommandSection =
  | "Start"
  | "End"
  | "Outer"
  | "Inner"
  | "MeasureHead"
  | "Song"
  | "Branch"
  | "Unknown";

/**
 * 命令のカテゴリー
 *
 *     "Base" // 基本
 *     "TJAP" // TJAPlayer2forPC and TJAPlayer3
 *     "TMG" // TaikoManyGimmicks
 *     "OpTk" // OpenTaiko
 */
export type CommandCategory = "Base" | "TJAP" | "TMG" | "OpTk";

/**
 * 命令
 */
export interface ICommand extends IStatement {
  /**
   * 構文テキスト
   */
  readonly syntax: string;
  /**
   * 命令の記載位置
   */
  readonly section: CommandSection;
  /**
   * 命令のカテゴリー
   */
  readonly category: CommandCategory;
}

/**
 * 命令のマッピング
 */
interface ICommandRecord extends Record<string, ICommand> {
  readonly start: ICommand;
  readonly end: ICommand;
  readonly bpmchange: ICommand;
  readonly gogostart: ICommand;
  readonly gogoend: ICommand;
  readonly measure: ICommand;
  readonly scroll: ICommand;
  readonly delay: ICommand;
  readonly section: ICommand;
  readonly branchstart: ICommand;
  readonly branchend: ICommand;
  readonly n: ICommand;
  readonly e: ICommand;
  readonly m: ICommand;
  readonly levelhold: ICommand;
  readonly bmscroll: ICommand;
  readonly hbscroll: ICommand;
  readonly barlineoff: ICommand;
  readonly barlineon: ICommand;
  readonly lyric: ICommand;
  readonly sudden: ICommand;
  readonly direction: ICommand;
  readonly jposscroll: ICommand;
  readonly nextsong: ICommand;
  readonly judgedelay: ICommand;
  readonly dummystart: ICommand;
  readonly dummyend: ICommand;
  readonly notespawn: ICommand;
  readonly size: ICommand;
  readonly color: ICommand;
  readonly angle: ICommand;
  readonly gradation: ICommand;
  readonly barlinesize: ICommand;
  readonly resetcommand: ICommand;
  readonly alpha: ICommand;
}

export class CommandCollection extends StatementCollection<ICommand> {
  constructor(readonly items: ICommandRecord) {
    super(items);
  }
}
