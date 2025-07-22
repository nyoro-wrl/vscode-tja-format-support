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
  /**
   * BPM
   */
  bpm: number | undefined = undefined;
  /**
   * スクロール速度
   */
  scroll: number | undefined = 1;
  /**
   * 拍子の分子（デフォルトは4拍子の4）
   */
  measureNumerator: number = 4;
  /**
   * 拍子の分母（デフォルトは4拍子の4）
   */
  measureDenominator: number = 4;

  constructor(bpm: number | undefined = undefined) {
    this.bpm = bpm;
  }
}
