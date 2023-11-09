import { Range } from "vscode";
import { CommandNode, NoteNode, MeasureEndNode, ChartTokenNode } from "./node";
import { gcdArray } from "../util/util";

export class ChartTruncater {
  /**
   * タイミングデータに変換
   * @param values
   * @returns
   */
  static toTimingData(values: (ChartTokenNode | CommandNode)[]): Timing[][] {
    const results: Timing[][] = [];
    let timings: Timing[] = [];
    let isTiming: boolean = true;
    for (const value of values) {
      if (value instanceof NoteNode) {
        if (value.value !== "0" || isTiming) {
          timings.push(new Timing(value.range));
        } else {
          timings[timings.length - 1].push(value.range);
        }
        isTiming = false;
      } else if (value instanceof CommandNode) {
        isTiming = true;
      } else if (value instanceof MeasureEndNode && timings.length > 0) {
        results.push(timings);
        timings = [];
        isTiming = true;
      }
    }
    if (timings.length > 0) {
      results.push(timings);
      timings = [];
      isTiming = true;
    }
    return results;
  }

  static getGCD(value: Timing[]): number {
    return gcdArray(value.map((x) => x.length));
  }
}

class Timing {
  length: number = 0;
  readonly ranges: Range[] = [];

  constructor(value: Range) {
    this.push(value);
  }

  public push(value: Range) {
    this.length += 1;
    this.ranges.push(value);
  }

  public getTruncateRanges(length: number): Range[] {
    return this.ranges.slice(length);
  }
}
