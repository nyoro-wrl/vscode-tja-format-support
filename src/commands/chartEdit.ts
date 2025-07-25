import * as vscode from "vscode";
import { ChartTokenNode, CommandNode, NoteNode } from "../types/node";
import { documents } from "../extension";
import { Note } from "../types/note";
import { Position, Range, TextEditor, TextEditorEdit } from "vscode";
import { ChartTruncater } from "../types/chartTruncater";
import { commands } from "../constants/commands";
import {
  getChartState,
  isEndOfLineIgnoringWhitespace,
  isStartOfLineIgnoringWhitespace,
  isTmg,
  toTmgCommandText,
} from "../util/util";
import { ICommand } from "../types/command";
import { easingStrings, isEasingType, lerp } from "../util/easing";
import { getRegExp } from "../types/statement";

/**
 * 譜面の拡大
 * @returns
 */
export async function zoom(textEditor: TextEditor, edit: TextEditorEdit) {
  const root = documents.parse(textEditor.document);
  if (!root) {
    return;
  }
  const notes: NoteNode[] = [];
  for (const selection of textEditor.selections) {
    notes.push(
      ...root.filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode)
    );
  }
  if (notes.length === 0) {
    vscode.window.showWarningMessage("選択範囲に譜面が見つかりませんでした");
    return;
  }

  const input = await vscode.window.showInputBox({
    title: "譜面の拡大",
    prompt: "拡大させる倍率を入力してください",
    value: "2",
    validateInput: (text) => {
      if (!text) {
        return;
      }
      if (Number.isNaN(Number(text))) {
        return "整数を入力してください";
      }
      const scale = Number(text);
      if (scale < 2) {
        return "2以上の整数を入力してください";
      }
      if (!Number.isInteger(scale)) {
        return "整数を入力してください";
      }
    },
  });
  if (input === undefined || input === "") {
    return;
  }
  const scale = Number(input);
  const insertText = "0".repeat(scale - 1);

  textEditor.edit((editBuilder) => {
    notes.forEach((note) => editBuilder.insert(note.range.end, insertText));
  });
}

/**
 * 譜面の切り詰め
 * @param textEditor
 * @param edit
 * @returns
 */
export function truncate(textEditor: TextEditor, edit: TextEditorEdit) {
  const document = textEditor.document;
  const root = documents.parse(document);
  if (!root) {
    return;
  }
  const items = root.filter<ChartTokenNode | CommandNode>(
    (x) =>
      textEditor.selection.contains(x.range) &&
      (x instanceof ChartTokenNode || x instanceof CommandNode)
  );
  const timingsList = ChartTruncater.toTimingData(items);
  const deleteRanges: Range[] = [];
  for (const timings of timingsList) {
    const gcd = ChartTruncater.getGCD(timings);
    for (const timing of timings) {
      const newLength = timing.length / gcd;
      const ranges = timing.getTruncateRanges(newLength);
      ranges: for (const range of ranges) {
        for (let index = 0; index < deleteRanges.length; index++) {
          const deleteRange = deleteRanges[index];
          // 同じ行内での範囲結合
          if (deleteRange.end.isEqual(range.start)) {
            deleteRanges[index] = deleteRange.union(range);
            continue ranges;
          }
          // 隣接する行での範囲結合
          if (
            deleteRange.end.line + 1 === range.start.line &&
            range.start.character === 0 &&
            isEndOfLineIgnoringWhitespace(document, deleteRange.end)
          ) {
            deleteRanges[index] = deleteRange.union(range);
            continue ranges;
          }
        }
        // 新規作成
        deleteRanges.push(range);
      }
    }
  }
  // 行全体の削除に変換
  for (let index = 0; index < deleteRanges.length; index++) {
    const deleteRange = deleteRanges[index];
    if (
      isStartOfLineIgnoringWhitespace(document, deleteRange.start) &&
      isEndOfLineIgnoringWhitespace(document, deleteRange.end)
    ) {
      deleteRanges[index] = new Range(deleteRange.start.line, 0, deleteRange.end.line + 1, 0);
    }
  }
  // ,のみになる場合に手前の改行を削除
  for (let index = 0; index < deleteRanges.length; index++) {
    const deleteRange = deleteRanges[index];
    if (!isStartOfLineIgnoringWhitespace(document, deleteRange.start)) {
      continue;
    }
    const afterChar = document.lineAt(deleteRange.end.line).text.charAt(deleteRange.end.character);
    if (afterChar !== ",") {
      continue;
    }
    const prevToken = root.findLastRange<NoteNode>(
      (x) => x.range.end.line < deleteRange.start.line && x instanceof NoteNode
    );
    if (prevToken === undefined) {
      continue;
    }
    const range = new Range(prevToken.range.end, deleteRange.start);
    if (document.getText(range).trim() !== "") {
      continue;
    }
    deleteRanges[index] = range.union(deleteRange);
  }
  // 削除
  for (const deleteRange of deleteRanges) {
    edit.delete(deleteRange);
  }
}

/**
 * スクロール速度の一定化
 * @param textEditor
 * @param edit
 * @returns
 */
export async function constantScroll(textEditor: TextEditor, edit: TextEditorEdit) {
  const document = textEditor.document;
  const root = documents.parse(document);
  if (!root) {
    return;
  }
  const selection = textEditor.selection;

  // BPM変更がされてから最初のノーツを集める
  const bpmChangeFirstNotes: NoteNode[] = [];
  const firstNote = root.find<NoteNode>(
    (x) => selection.contains(x.range) && x instanceof NoteNode
  );
  if (firstNote) {
    bpmChangeFirstNotes.push(firstNote);
  }
  const bpmChangeLines = root
    .filter<CommandNode>(
      (x) =>
        selection.contains(x.range) &&
        x instanceof CommandNode &&
        getRegExp(commands.items.bpmchange).test(x.properties.name)
    )
    .map((x) => x.range.start.line);
  for (const bpmChangeLine of bpmChangeLines) {
    const note = root.find<NoteNode>(
      (x) => x instanceof NoteNode && x.range.start.line > bpmChangeLine
    );
    if (note) {
      bpmChangeFirstNotes.push(note);
    }
  }
  const notes = bpmChangeFirstNotes.unique();

  if (notes.length === 0) {
    vscode.window.showWarningMessage("選択範囲に譜面が見つかりませんでした");
    return;
  }

  const input = await vscode.window.showInputBox({
    title: "スクロール速度の一定化",
    prompt: "スクロール速度の基準となるBPMを入力してください",
    placeHolder: "BPM",
    validateInput: (text) => {
      if (!text) {
        return;
      }
      if (Number.isNaN(Number(text))) {
        return "数値を入力してください";
      }
    },
  });
  if (input === undefined || input === "") {
    return;
  }
  const inputBpm = Number(input);

  textEditor.edit((editBuilder) => {
    // 既存のSCROLL命令を全て削除
    root
      .filter<CommandNode>(
        (x) =>
          selection.contains(x.range) &&
          x instanceof CommandNode &&
          getRegExp(commands.items.scroll).test(x.properties.name)
      )
      .forEach((command) => {
        const start = new Position(command.range.start.line, 0);
        const end = new Position(command.range.start.line + 1, 0);
        const range = new Range(start, end);
        editBuilder.delete(range);
      });

    // SCROLL命令の挿入
    const startChartState = getChartState(document, selection.start);
    let beforeScroll = startChartState?.scroll;
    for (const note of notes) {
      const position = new Position(note.range.start.line, 0);
      if (!note.properties.bpm || Number.isNaN(note.properties.bpm)) {
        continue;
      }
      const rawScroll = inputBpm / note.properties.bpm;
      const scroll = Math.round(rawScroll * 1000) / 1000;
      if (beforeScroll && beforeScroll === scroll) {
        continue;
      }
      const rawCommand = `#SCROLL ${scroll}`;
      const command = isTmg(document) ? toTmgCommandText(rawCommand) : rawCommand;

      editBuilder.insert(position, command + "\r\n");
      beforeScroll = scroll;
    }
  });
}

/**
 * スクロール速度の遷移
 * @param textEditor
 * @param edit
 */
export async function transitionScroll(textEditor: TextEditor, edit: TextEditorEdit) {
  const document = textEditor.document;
  const root = documents.parse(document);
  if (!root) {
    return;
  }
  const selection = textEditor.selection;

  const notes = root.filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode);
  if (notes.length === 0) {
    vscode.window.showWarningMessage("選択範囲に譜面が見つかりませんでした");
    return;
  }

  const startInput = await vscode.window.showInputBox({
    title: "スクロール速度の開始値",
    prompt: "スクロール速度の開始値を入力してください",
    placeHolder: "1",
    validateInput: (text) => {
      if (!text) {
        return;
      }
      if (Number.isNaN(Number(text))) {
        return "数値を入力してください";
      }
    },
  });
  if (startInput === undefined || startInput === "") {
    return;
  }
  const start = Number(startInput);

  const endInput = await vscode.window.showInputBox({
    title: "スクロール速度の終了値",
    prompt: "スクロール速度の終了値を入力してください",
    placeHolder: "1",
    validateInput: (text) => {
      if (!text) {
        return;
      }
      if (Number.isNaN(Number(text))) {
        return "数値を入力してください";
      }
    },
  });
  if (endInput === undefined || endInput === "") {
    return;
  }
  const end = Number(endInput);

  const frequencySelected = await vscode.window.showQuickPick(["小節", "行", "音符", "常時"], {
    title: "スクロール速度の遷移頻度",
    placeHolder: "スクロール速度を遷移させる頻度を選択してください",
  });
  if (frequencySelected === undefined) {
    return;
  }

  const easingSelected = await vscode.window.showQuickPick(easingStrings, {
    title: "スクロール速度のイージング",
    placeHolder: "イージングを選択してください",
  });
  if (easingSelected === undefined || !isEasingType(easingSelected)) {
    return;
  }

  // 挿入位置を集める
  const positions: Position[] = [];
  if (frequencySelected === "小節") {
    positions.push(
      ...notes
        .filter(
          (note, index, self) =>
            index ===
            self.findIndex(
              (x) =>
                x.properties.measure === note.properties.measure &&
                x.properties.branchState === note.properties.branchState
            )
        )
        .map((x) => x.range.start)
    );
  } else if (frequencySelected === "行") {
    positions.push(
      ...notes
        .map((x) => x.range.start.line)
        .unique()
        .map((x) => new Position(x, 0))
    );
  } else if (frequencySelected === "音符") {
    positions.push(...notes.filter((x) => x.value !== "0").map((x) => x.range.start));
  } else if (frequencySelected === "常時") {
    positions.push(...notes.map((x) => x.range.start));
  }

  textEditor.edit((editBuilder) => {
    // 既存のSCROLL命令を全て削除
    root
      .filter<CommandNode>(
        (x) =>
          selection.contains(x.range) &&
          x instanceof CommandNode &&
          getRegExp(commands.items.scroll).test(x.properties.name)
      )
      .forEach((command) => {
        const start = new Position(command.range.start.line, 0);
        const end = new Position(command.range.start.line + 1, 0);
        const range = new Range(start, end);
        editBuilder.delete(range);
      });

    // SCROLL命令の挿入
    for (let index = 0; index < positions.length; index++) {
      const position = positions[index];
      const t = index / (positions.length - 1);
      const raw = lerp(start, end, t, easingSelected);
      const value = Math.round(raw * 1000) / 1000;
      const prefix = position.character > 0 ? "\r\n" : "";
      editBuilder.insert(position, `${prefix}#SCROLL ${value}\r\n`);
    }
  });
}

/**
 * 命令の一括削除
 * @param textEditor
 * @param edit
 * @returns
 */
export async function deleteCommands(textEditor: TextEditor, edit: TextEditorEdit) {
  const root = documents.parse(textEditor.document);
  if (!root) {
    return;
  }
  const nodes: CommandNode[] = [];
  for (const selection of textEditor.selections) {
    nodes.push(
      ...root.filter<CommandNode>(
        (x) =>
          selection.contains(x.range) &&
          x instanceof CommandNode &&
          x.properties.name !== "START" &&
          x.properties.name !== "END"
      )
    );
  }
  if (nodes.length === 0) {
    vscode.window.showWarningMessage("選択範囲に命令が見つかりませんでした");
    return;
  }
  const commandNames = nodes.map((x) => "#" + x.properties.name).uniqueSorted();

  const allDelete = "すべて";
  const options: string[] = [allDelete, ...commandNames];
  let deleteName: string;
  let deleteCommand: ICommand | undefined;
  if (options.length === 2) {
    deleteName = allDelete;
  } else {
    const selected = await vscode.window.showQuickPick(options, {
      title: "命令の一括削除",
      placeHolder: "削除する命令を選択してください",
    });
    if (selected === undefined) {
      return;
    }
    deleteName = selected.replace(/^#/g, "");
    deleteCommand = commands.get(deleteName);
  }

  textEditor.edit((editBuilder) => {
    for (const node of nodes) {
      const command = commands.get(node.properties.name);
      if (deleteName === allDelete || deleteCommand === command) {
        const start = new Position(node.range.start.line, 0);
        const end = new Position(node.range.start.line + 1, 0);
        const range = new Range(start, end);
        editBuilder.delete(range);
      }
    }
  });
}

/**
 * 大音符に変換
 * @param textEditor
 * @param edit
 * @returns
 */
export function toBig(textEditor: TextEditor, edit: TextEditorEdit) {
  const root = documents.parse(textEditor.document);
  if (!root) {
    return;
  }
  for (const selection of textEditor.selections) {
    root
      .filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode)
      .forEach((note) => edit.replace(note.range, Note.toBig(note.value)));
  }
}

/**
 * 小音符に変換
 * @param textEditor
 * @param edit
 * @returns
 */
export function toSmall(textEditor: TextEditor, edit: TextEditorEdit) {
  const root = documents.parse(textEditor.document);
  if (!root) {
    return;
  }
  for (const selection of textEditor.selections) {
    root
      .filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode)
      .forEach((note) => edit.replace(note.range, Note.toSmall(note.value)));
  }
}

/**
 * 休符に変換
 * @param textEditor
 * @param edit
 * @returns
 */
export function toRest(textEditor: TextEditor, edit: TextEditorEdit) {
  const root = documents.parse(textEditor.document);
  if (!root) {
    return;
  }
  for (const selection of textEditor.selections) {
    root
      .filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode)
      .forEach((note) => edit.replace(note.range, "0"));
  }
}

// /**
//  * 特定音符の削除
//  * @param textEditor
//  * @param edit
//  * @returns
//  */
// export function toDelete(textEditor: TextEditor, edit: TextEditorEdit) {
//   const root = documents.parse(textEditor.document);
//   if (!root) {
//     return;
//   }
//   for (const selection of textEditor.selections) {
//     root
//       .filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode)
//       .forEach((note) => edit.replace(note.range, "0"));
//   }
// }

/**
 * 色の反転
 * @param textEditor
 * @param edit
 * @returns
 */
export async function reverse(textEditor: TextEditor, edit: TextEditorEdit) {
  const root = documents.parse(textEditor.document);
  if (!root) {
    return;
  }
  textEditor.edit((editBuilder) => {
    for (const selection of textEditor.selections) {
      root
        .filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode)
        .forEach((note) => {
          editBuilder.replace(note.range, Note.reverse(note.value));
        });
    }
  });
}

/**
 * 色の反転
 * @param textEditor
 * @param edit
 * @returns
 */
export async function random(textEditor: TextEditor, edit: TextEditorEdit) {
  const root = documents.parse(textEditor.document);
  if (!root) {
    return;
  }
  textEditor.edit((editBuilder) => {
    for (const selection of textEditor.selections) {
      root
        .filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode)
        .forEach((note) => {
          if (Math.random() > 0.5) {
            editBuilder.replace(note.range, Note.reverse(note.value));
          }
        });
    }
  });
}
