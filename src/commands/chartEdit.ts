import * as vscode from "vscode";
import { CommandNode, MeasureEndNode, NoteNode } from "../types/node";
import { documents } from "../extension";
import { Note } from "../types/note";
import { TextEditor, TextEditorEdit } from "vscode";
import { ChartTruncater } from "../types/chartTruncater";

/**
 * 譜面の拡大
 * @param textEditor
 * @param edit
 * @returns
 */
export async function zoom() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const input = await vscode.window.showInputBox({
    prompt: "拡大させる倍率を入力してください",
    placeHolder: `2`,
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
  if (input === undefined) {
    return;
  }
  const scaleText = input === "" ? "2" : input;
  const scale = Number(scaleText);
  const insertText = "0".repeat(scale - 1);

  editor.edit((editBuilder) => {
    editor.selections.forEach((selection) => {
      const root = documents.parse(editor.document);
      if (!root) {
        return;
      }
      root
        .filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode)
        .forEach((note) => editBuilder.insert(note.range.end, insertText));
    });
  });
}

/**
 * 譜面の切り詰め
 * @param textEditor
 * @param edit
 * @returns
 */
export function truncate(textEditor: TextEditor, edit: TextEditorEdit) {
  const selection = textEditor.selection;
  const root = documents.parse(textEditor.document);
  if (!root) {
    return;
  }
  const items = root.filter<NoteNode | CommandNode | MeasureEndNode>(
    (x) =>
      selection.contains(x.range) &&
      (x instanceof NoteNode || x instanceof CommandNode || x instanceof MeasureEndNode)
  );

  const timingsList = ChartTruncater.toTimingData(items);
  for (const timings of timingsList) {
    const gcd = ChartTruncater.getGCD(timings);
    for (const timing of timings) {
      const newLength = timing.length / gcd;
      const ranges = timing.getTruncateRanges(newLength);
      for (const range of ranges) {
        edit.delete(range);
      }
    }
  }
}

/**
 * ドンに変換
 * @param textEditor
 * @param edit
 * @returns
 */
export function toDon(textEditor: TextEditor, edit: TextEditorEdit) {
  const root = documents.parse(textEditor.document);
  if (!root) {
    return;
  }
  for (const selection of textEditor.selections) {
    root
      .filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode)
      .forEach((note) => edit.replace(note.range, Note.toDon(note.value)));
  }
}

/**
 * カッに変換
 * @param textEditor
 * @param edit
 * @returns
 */
export function toKa(textEditor: TextEditor, edit: TextEditorEdit) {
  const root = documents.parse(textEditor.document);
  if (!root) {
    return;
  }
  for (const selection of textEditor.selections) {
    root
      .filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode)
      .forEach((note) => edit.replace(note.range, Note.toKa(note.value)));
  }
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
 * あべこべ
 * @param textEditor
 * @param edit
 * @returns
 */
export function reverse(textEditor: TextEditor, edit: TextEditorEdit) {
  const root = documents.parse(textEditor.document);
  if (!root) {
    return;
  }
  for (const selection of textEditor.selections) {
    root
      .filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode)
      .forEach((note) => edit.replace(note.range, Note.reverse(note.value)));
  }
}

/**
 * きまぐれ
 * @param textEditor
 * @param edit
 * @returns
 */
export function whimsical(textEditor: TextEditor, edit: TextEditorEdit) {
  const root = documents.parse(textEditor.document);
  if (!root) {
    return;
  }
  for (const selection of textEditor.selections) {
    root
      .filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode)
      .forEach((note) => {
        if (Math.random() < 0.25) {
          edit.replace(note.range, Note.reverse(note.value));
        }
      });
  }
}

/**
 * でたらめ
 * @param textEditor
 * @param edit
 * @returns
 */
export function haphazard(textEditor: TextEditor, edit: TextEditorEdit) {
  const root = documents.parse(textEditor.document);
  if (!root) {
    return;
  }
  for (const selection of textEditor.selections) {
    root
      .filter<NoteNode>((x) => selection.contains(x.range) && x instanceof NoteNode)
      .forEach((note) => {
        if (Math.random() < 0.5) {
          edit.replace(note.range, Note.reverse(note.value));
        }
      });
  }
}

/**
 * 休符
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

// TODO 音符をテキストで指定して削除するコマンド
