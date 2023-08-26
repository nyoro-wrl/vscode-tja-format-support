import { Range } from "vscode";
import { Token } from "../lexer";
import { TriBoolean } from "./state";

type NoteType = "Don" | "Ka" | "Roll" | "Balloon" | "Bomb" | "Adlib" | "Kadon" | undefined;
type NoteSize = "Small" | "Big" | undefined;

export class Note {
  /**
   * 音符の種類
   */
  readonly type: NoteType;
  /**
   * 音符の大きさ
   */
  readonly size: NoteSize;
  /**
   * 長い音符かどうか
   */
  readonly isLong: boolean | undefined;
  /**
   * ゴーゴータイムかどうか
   */
  readonly isGogotime: TriBoolean;
  /**
   * ダミーかどうか
   */
  readonly isDummyNote: TriBoolean;
  /**
   * コンボに加算されるかどうか
   */
  readonly isCombo: boolean;
  /**
   * 風船音符の識別子
   */
  readonly balloonId?: number;
  /**
   * 位置
   */
  readonly range: Range;

  constructor(token: Token, isGogotime: TriBoolean, isDummyNote: TriBoolean, balloonId?: number) {
    this.range = token.range;
    this.isGogotime = isGogotime;
    this.isDummyNote = isDummyNote;
    this.balloonId = balloonId;
    if (token.value === "1") {
      this.type = "Don";
      this.size = "Small";
      this.isLong = false;
    } else if (token.value === "2") {
      this.type = "Ka";
      this.size = "Small";
      this.isLong = false;
    } else if (token.value === "3" || token.value === "A") {
      this.type = "Don";
      this.size = "Big";
      this.isLong = false;
    } else if (token.value === "4" || token.value === "B") {
      this.type = "Ka";
      this.size = "Big";
      this.isLong = false;
    } else if (token.value === "5") {
      this.type = "Roll";
      this.size = "Small";
      this.isLong = true;
    } else if (token.value === "6") {
      this.type = "Roll";
      this.size = "Big";
      this.isLong = true;
    } else if (token.value === "7") {
      this.type = "Balloon";
      this.size = "Small";
      this.isLong = true;
    } else if (token.value === "9") {
      this.type = "Balloon";
      this.size = "Big";
      this.isLong = true;
    } else if (token.value === "C") {
      this.type = "Bomb";
      this.size = "Small";
      this.isLong = false;
    } else if (token.value === "F") {
      this.type = "Adlib";
      this.size = "Small";
      this.isLong = false;
    } else if (token.value === "G") {
      this.type = "Kadon";
      this.size = "Big";
      this.isLong = false;
    }
    this.isCombo =
      (this.type === "Don" || this.type === "Ka" || this.type === "Kadon") &&
      this.isDummyNote !== true;
  }
}
