import { ChartStateProperties } from "./node";

export type MixBoolean = boolean | "mix";

/**
 * 譜面状態
 */
export class ChartState implements ChartStateProperties {
  /**
   * 小節数
   */
  measure: number = 1;
  /**
   * 小節線の表示
   */
  showBarline: MixBoolean = true;
  /**
   * ゴーゴータイム
   */
  isGogotime: MixBoolean = false;
  /**
   * ダミーノーツ
   */
  isDummyNote: MixBoolean = false;
}
