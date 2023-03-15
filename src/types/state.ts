import { ChartStateProperties } from "./node";

export type TriBoolean = boolean | "unknown";
export type RollState = "None" | "Roll" | "RollBig" | "Balloon" | "BalloonBig";
export type BranchState = "None" | "Normal" | "Expert" | "Master";

/**
 * 譜面状態
 */
export class ChartState implements ChartStateProperties {
  /**
   * 小節数
   */
  measure: number = 0;
  /**
   * 小節線の表示
   */
  showBarline: TriBoolean = true;
  /**
   * ゴーゴータイム
   */
  isGogotime: TriBoolean = false;
  /**
   * ダミーノーツ
   */
  isDummyNote: TriBoolean = false;
  /**
   * 連打状態
   */
  rollState: RollState = "None";
  /**
   * 分岐状態
   */
  branchState: BranchState = "None";
}
