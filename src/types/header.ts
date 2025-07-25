import { IStatement, StatementCollection, StatementParameter } from "./statement";

/**
 * ヘッダーの記載位置
 *
 *     "Root" // 共通ヘッダー
 *     "Course" // 難易度別ヘッダー
 *     "Style" // プレイスタイル別ヘッダー
 *     "Unknown" // 不明
 */
type HeaderSection = "Root" | "Course" | "Style" | "Unknown";

/**
 * ヘッダー
 */
export interface IHeader extends IStatement {
  /**
   * ヘッダーの記載位置
   */
  readonly section: HeaderSection;
  /**
   * この後に書かれる可能性の高いヘッダー
   */
  readonly recommend: readonly string[];
}

/**
 * ヘッダーのマッピング
 */
interface IHeaderRecord extends Record<string, IHeader> {
  readonly title: IHeader;
  readonly level: IHeader;
  readonly bpm: IHeader;
  readonly wave: IHeader;
  readonly offset: IHeader;
  readonly balloon: IHeader;
  readonly songvol: IHeader;
  readonly sevol: IHeader;
  readonly scoreinit: IHeader;
  readonly scorediff: IHeader;
  readonly course: IHeader;
  readonly style: IHeader;
  readonly life: IHeader;
  readonly demostart: IHeader;
  readonly side: IHeader;
  readonly subtitle: IHeader;
  readonly song: IHeader;
  readonly siderev: IHeader;
  readonly scoremode: IHeader;
  readonly total: IHeader;
  readonly balloonnor: IHeader;
  readonly balloonexp: IHeader;
  readonly balloonmas: IHeader;
  readonly genre: IHeader;
  readonly movieoffset: IHeader;
  readonly bgimage: IHeader;
  readonly bgmovie: IHeader;
  readonly hiddenbranch: IHeader;
  readonly exam: IHeader;
  readonly preimage: IHeader;
  readonly bgoffset: IHeader;
  readonly dantick: IHeader;
  readonly dantickcolor: IHeader;
  readonly maker: IHeader;
  readonly bga: IHeader;
  readonly lyrics: IHeader;
  readonly explicit: IHeader;
}

export class HeaderCollection extends StatementCollection<IHeader> {
  constructor(readonly items: IHeaderRecord) {
    super(items);
  }
}
