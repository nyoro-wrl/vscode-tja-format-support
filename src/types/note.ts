import { Range } from "vscode";
import { Token } from "../lexer";
import { TriBoolean } from "./state";

type NoteType = "Don" | "Ka" | "Roll" | "Balloon" | "Bomb" | "Fuze" | "Adlib" | "Kadon" | undefined;
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

  // ノーツ一覧
  // 1: Don, Small
  // 3: Don, Big
  // A: Don, Big, Hands
  // 2: Ka, Small
  // 4: Ka, Big
  // B: Ka, Big, Hands
  // G: Kadon, Big
  // 5: Roll, Small
  // 6: Roll, Big
  // 7: Balloon, Small
  // 9: Balloon, Big
  // C: Bomb
  // D: Fuze
  // F: Adlib

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
      this.isLong = false;
    } else if (token.value === "D") {
      this.type = "Fuze";
      this.isLong = true;
    } else if (token.value === "F") {
      this.type = "Adlib";
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

  /**
   * ドンに変換
   * @param value
   * @returns
   */
  static toDon(value: string): string {
    switch (value) {
      case "2":
        return "1";
      case "4":
        return "3";
      case "B":
        return "A";
      default:
        return value;
    }
  }

  /**
   * カッに変換
   * @param value
   * @returns
   */
  static toKa(value: string): string {
    switch (value) {
      case "1":
        return "2";
      case "3":
        return "4";
      case "A":
        return "B";
      default:
        return value;
    }
  }

  /**
   * あべこべ
   * @param value
   * @returns
   */
  static reverse(value: string): string {
    switch (value) {
      case "1":
        return "2";
      case "2":
        return "1";
      case "3":
        return "4";
      case "4":
        return "3";
      case "A":
        return "B";
      case "B":
        return "A";
      default:
        return value;
    }
  }

  /**
   * 大音符に変換
   * @param value
   * @returns
   */
  static toBig(value: string): string {
    switch (value) {
      case "1":
        return "3";
      case "2":
        return "4";
      case "5":
        return "6";
      default:
        return value;
    }
  }

  /**
   * 小音符に変換
   * @param value
   * @returns
   */
  static toSmall(value: string): string {
    switch (value) {
      case "3":
        return "1";
      case "4":
        return "2";
      case "6":
        return "5";
      default:
        return value;
    }
  }
}
