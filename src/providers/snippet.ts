import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import {
  CompletionItem,
  CompletionItemKind,
  MarkdownString,
  Position,
  Range,
  SnippetString,
} from "vscode";
import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { documents } from "../extension";
import {
  ChartNode,
  ChartTokenNode,
  CommandNode,
  StyleHeadersNode,
  HeaderNode,
  HeadersNode,
  MeasureEndNode,
  RootHeadersNode,
  BranchNode,
  BranchSectionNode,
  NoteNode,
} from "../types/node";
import { SortTextFactory } from "../types/sortTextFactory";
import { ChartState } from "../types/state";
import {
  getChartState,
  isTmg,
  generateHeaderSyntax,
  getSeparatorChar,
  isInComment,
  generateCommandSyntax,
  detectCommandInfo,
  calculateCommandParameterPosition,
} from "../util/util";
import { FilePathType, getRegExp } from "../types/statement";
import { IHeader } from "../types/header";
import { ICommand } from "../types/command";

/**
 * FilePathTypeに対応するファイル拡張子マッピング
 */
const FILE_EXTENSIONS: Record<FilePathType, readonly string[]> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Audio: [".wav", ".mp3", ".ogg", ".m4a", ".flac"],
  tja: [".tja", ".tjc"],
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Image: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Movie: [".mp4", ".avi", ".mov", ".wmv", ".webm"],
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Lyrics: [".txt", ".lrc"],
  // eslint-disable-next-line @typescript-eslint/naming-convention
  File: [],
} as const;

/**
 * FilePathTypeから対応する拡張子リストを取得
 * @param filePathType ファイルパスタイプ
 * @returns 対応する拡張子の配列
 */
function getExtensionsForFilePathType(filePathType: FilePathType): readonly string[] {
  return FILE_EXTENSIONS[filePathType] || [];
}

/**
 * ファイルパラメータの置換範囲を計算（ヘッダー用）
 * @param document テキストドキュメント
 * @param position カーソル位置
 * @returns 置換範囲、または計算できない場合はundefined
 */
function calculateParameterReplaceRange(
  document: vscode.TextDocument,
  position: vscode.Position
): vscode.Range | undefined {
  const currentLine = document.lineAt(position.line).text;
  const colonIndex = currentLine.indexOf(":");

  if (colonIndex === -1) {
    return undefined;
  }

  const parameterStart = colonIndex + 1;

  // 空白をスキップして実際のパラメータ開始位置を取得
  let actualStart = parameterStart;
  while (actualStart < currentLine.length && currentLine[actualStart] === " ") {
    actualStart++;
  }

  return new vscode.Range(position.line, actualStart, position.line, currentLine.length);
}

/**
 * コマンドパラメータの置換範囲を計算
 * @param document テキストドキュメント
 * @param position カーソル位置
 * @param commandInfo コマンド情報
 * @param currentParamIndex 現在のパラメータインデックス
 * @returns 置換範囲、または計算できない場合はundefined
 */
function calculateCommandParameterReplaceRange(
  document: vscode.TextDocument,
  position: vscode.Position,
  commandInfo: ICommand,
  currentParamIndex: number
): vscode.Range | undefined {
  const currentLine = document.lineAt(position.line).text;
  const sharpPos = currentLine.indexOf("#");

  if (sharpPos === -1) {
    return undefined;
  }

  const commandEndPos = sharpPos + 1 + commandInfo.name.length;
  const separatorChar = getSeparatorChar(commandInfo.separator);

  // パラメータ部分を取得
  const parameterPart = currentLine.substring(commandEndPos);

  if (
    separatorChar === "" ||
    separatorChar === "None" ||
    commandInfo.separator === "None" ||
    commandInfo.separator === "Space"
  ) {
    // スペース区切りの場合
    const trimmedPart = parameterPart.trim();
    if (trimmedPart === "" && currentParamIndex === 0) {
      // 最初のパラメータで空の場合、コマンド名の後から行末まで
      let paramStart = commandEndPos;
      while (paramStart < currentLine.length && currentLine[paramStart] === " ") {
        paramStart++;
      }
      return new vscode.Range(position.line, paramStart, position.line, currentLine.length);
    }

    // 既存のパラメータがある場合、現在のパラメータ位置を特定
    const params = trimmedPart.split(/\s+/).filter((p) => p.length > 0);
    let paramStartPos = commandEndPos;

    // 先頭の空白をスキップ
    while (paramStartPos < currentLine.length && currentLine[paramStartPos] === " ") {
      paramStartPos++;
    }

    // 現在のパラメータの開始位置を計算
    for (let i = 0; i < currentParamIndex && i < params.length; i++) {
      const paramLength = params[i].length;
      paramStartPos += paramLength;
      // 次のスペースをスキップ
      while (paramStartPos < currentLine.length && currentLine[paramStartPos] === " ") {
        paramStartPos++;
      }
    }

    let paramEndPos = currentLine.length;
    if (currentParamIndex < params.length) {
      // 既存パラメータの場合、そのパラメータの終了位置を計算
      paramEndPos = paramStartPos + params[currentParamIndex].length;
    }

    return new vscode.Range(position.line, paramStartPos, position.line, paramEndPos);
  } else {
    // カンマ区切りなどの場合
    const separatorRegex = new RegExp(separatorChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    const trimmedPart = parameterPart.trim();

    if (trimmedPart === "" && currentParamIndex === 0) {
      // 最初のパラメータで空の場合、コマンド名の後から行末まで
      let paramStart = commandEndPos;
      while (paramStart < currentLine.length && currentLine[paramStart] === " ") {
        paramStart++;
      }
      return new vscode.Range(position.line, paramStart, position.line, currentLine.length);
    }

    // 区切り文字で分割してパラメータを取得
    const params = trimmedPart.split(separatorRegex);

    // パラメータの開始位置を計算
    let paramStartPos = commandEndPos;
    // 先頭の空白をスキップ
    while (paramStartPos < currentLine.length && currentLine[paramStartPos] === " ") {
      paramStartPos++;
    }

    // 現在のパラメータまでの位置を計算
    for (let i = 0; i < currentParamIndex && i < params.length; i++) {
      paramStartPos += params[i].length;
      if (i < params.length - 1) {
        // 区切り文字の長さ分進める
        paramStartPos += separatorChar.length;
      }
    }

    let paramEndPos = currentLine.length;
    if (currentParamIndex < params.length) {
      // 既存パラメータの場合、そのパラメータの終了位置を計算
      paramEndPos = paramStartPos + params[currentParamIndex].length;
    }

    return new vscode.Range(position.line, paramStartPos, position.line, paramEndPos);
  }
}

/**
 * ヘッダの補完
 */
export class HeaderCompletionItemProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    const snippets: vscode.CompletionItem[] = [];

    // 現在行でカーソル位置より前にコロンが含まれている場合はヘッダー補完を無効化
    const line = document.lineAt(position).text;
    const beforeCursor = line.substring(0, position.character);

    if (beforeCursor.includes(":")) {
      return snippets;
    }

    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9]+/);
    const previewRange = new Range(new Position(position.line, 0), wordRange?.start ?? position);
    const previewText = document.getText(previewRange);
    const word = wordRange === undefined ? "" : document.getText(wordRange);
    if (/[^\s]/.test(previewText)) {
      return snippets;
    }

    const root = documents.parse(document, token);
    const node =
      root?.findDepth((x) => x.range.contains(position), { continue: true, token }) ?? root;
    if (root !== undefined && node?.findParent((x) => x instanceof ChartNode, { token })) {
      return snippets;
    }
    const chartAfter =
      root?.find((x) => x instanceof ChartNode && x.range.start.line < position.line, { token }) !==
      undefined;

    // 直前のヘッダを調べて関連性の高いヘッダを取得
    const recommend: string[] = [];
    const headersNode = node?.findParent<HeadersNode>((x) => x instanceof HeadersNode, { token });
    if (headersNode !== undefined) {
      const previewHeader = headersNode.findDepth<HeaderNode>(
        (x) => x instanceof HeaderNode && x.range.end.line < position.line,
        { token }
      );
      if (previewHeader !== undefined) {
        const previewHeaderInfo = headers.get(previewHeader.properties.name);
        if (previewHeaderInfo !== undefined) {
          recommend.push(...previewHeaderInfo.recommend);
        }
      }
    }

    let order = 0;
    for (const header of headers) {
      if (token.isCancellationRequested) {
        return snippets;
      }
      // 優先度の計算
      const sortText = new SortTextFactory();
      sortText.order4 += header.order;
      if (header.order > 1) {
        // 明確な目的がないと使わないヘッダは優先度を下げる
        sortText.order3++;
      }
      sortText.order5 += order;
      if (root === undefined) {
        sortText.order1++;
      }
      if (node instanceof HeadersNode) {
        for (const containHeader of node.properties.headers) {
          if (getRegExp(header).test(containHeader.name)) {
            // 既存のヘッダの場合は優先度を下げる
            sortText.order2++;
          }
        }
      }
      if (
        (node instanceof RootHeadersNode &&
          (header.section === "Course" || header.section === "Style")) ||
        (node instanceof StyleHeadersNode && header.section === "Root")
      ) {
        // コンテキストと合わない場合は優先度を下げる
        sortText.order3++;
      }
      if (chartAfter && (header.section === "Course" || header.section === "Style")) {
        // 譜面後はコースヘッダの優先度を上げる
        sortText.order2--;
      }
      if (chartAfter && header === headers.items.course) {
        // 譜面後はCOURSEの優先度を上げる
        sortText.order3--;
      }
      if (recommend.includes(header.name)) {
        // 直前のヘッダと関連性が高い場合は優先度を上げる
        sortText.order1--;
      }

      const snippet = new CompletionItem(header.name + ":", CompletionItemKind.Constant);
      const [isMatch, matchScore] = nearyMatch(word, header.name);
      if (isMatch) {
        snippet.filterText = word;
        sortText.order2 += matchScore;
      } else {
        continue;
      }
      snippet.insertText = header.snippet ?? new SnippetString(header.name + ":");
      const syntax = generateHeaderSyntax(header.name, header.parameter, header.separator);
      snippet.documentation = new MarkdownString().appendMarkdown(syntax + header.documentation);
      snippet.detail = header.detail;
      snippet.sortText = sortText.toString();
      // ヘッダー補完後に署名ヘルプをトリガー
      snippet.command = {
        command: "editor.action.triggerParameterHints",
        title: "Trigger Parameter Hints",
      };
      snippets.push(snippet);
      order++;
    }
    return snippets;
  }
}

/**
 * 命令の補完
 */
export class CommandCompletionItemProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    const snippets: vscode.CompletionItem[] = [];

    const _isTmg = isTmg(document);
    const wordRange = document.getWordRangeAtPosition(position, /([a-zA-Z]+|#[a-zA-Z]*)/);
    const word = wordRange === undefined ? "" : document.getText(wordRange);
    const containSharp = /^#/.test(word);
    const searchQuery = containSharp ? word.slice(1) : word;
    const previewRange = new Range(new Position(position.line, 0), wordRange?.start ?? position);
    const previewText = document.getText(previewRange);
    if (/[^\s]/.test(previewText)) {
      return snippets;
    }

    const root = documents.parse(document, token);
    const node = root?.findDepth((x) => x.range.contains(position), { continue: true, token });
    if (root !== undefined && node === undefined) {
      return snippets;
    }

    const chartNode = node?.findParent<ChartNode>((x) => x instanceof ChartNode, { token });
    const branchNode = node?.findParent<BranchNode>((x) => x instanceof BranchNode, { token });

    // 譜面状態を取得する
    const chartState = getChartState(document, position, token) ?? new ChartState();

    // 現在が小節頭かどうか取得
    const beforeChartTokenNode = chartNode?.findLastRange(
      (x) => x instanceof ChartTokenNode && x.range.start.line < position.line,
      { token }
    );
    const measureHead =
      beforeChartTokenNode === undefined || beforeChartTokenNode instanceof MeasureEndNode;

    // 設定から各カテゴリーの表示状態を取得
    const config = vscode.workspace.getConfiguration("tjaFormatSupport.completion");
    const showTJAPlayer = config.get<boolean>("tjap", true);
    const showOpenTaiko = config.get<boolean>("optk", false);
    const showTaikoManyGimmicks = config.get<boolean>("tmg", false);

    let order = 0;
    for (const command of commands) {
      if (token.isCancellationRequested) {
        return snippets;
      }

      // カテゴリーによるフィルタリング
      if (
        (command.category === "TJAP" && !showTJAPlayer) ||
        (command.category === "OpTk" && !showOpenTaiko) ||
        (!_isTmg && command.category === "TMG" && !showTaikoManyGimmicks)
      ) {
        continue;
      }
      if (root !== undefined) {
        // 補完の非表示判定
        if (
          (command.section === "Outer" || command.section === "Start") &&
          chartNode !== undefined
        ) {
          // 譜面外でしか書けない命令のため非表示
          continue;
        } else if (
          (command.section === "Inner" ||
            command.section === "MeasureHead" ||
            command.section === "Song" ||
            command.section === "Branch" ||
            command.section === "End") &&
          chartNode === undefined
        ) {
          // 譜面内でしか書けない命令のため非表示
          continue;
        } else if (
          (command === commands.items.branchend ||
            command === commands.items.n ||
            command === commands.items.e ||
            command === commands.items.m) &&
          branchNode === undefined
        ) {
          // 譜面分岐内でしか書けない命令のため非表示
          continue;
        } else if (
          branchNode !== undefined &&
          ((command === commands.items.n && branchNode.properties.hasNormal) ||
            (command === commands.items.e && branchNode.properties.hasExpert) ||
            (command === commands.items.m && branchNode.properties.hasMaster))
        ) {
          // 既に存在する分岐のため非表示
          continue;
        } else if (
          command.section === "End" &&
          chartNode !== undefined &&
          chartNode.properties.end !== undefined
        ) {
          // 既に#ENDが記載されているため非表示
          continue;
        }
      }

      // 優先度の計算
      const sortText = new SortTextFactory();
      sortText.order4 += command.order;
      sortText.order5 += order;
      if (root !== undefined && node !== undefined) {
        if (!node.findParent((x) => x instanceof ChartNode, { token })) {
          // ヘッダを優先したいため優先度を下げる
          sortText.order1++;
        }
        if (
          command.section === "End" &&
          chartNode !== undefined &&
          chartNode.properties.end === undefined
        ) {
          // #ENDが記載されていないため優先度を上げる
          sortText.order1--;
        }
        if (
          (command === commands.items.n ||
            command === commands.items.e ||
            command === commands.items.m) &&
          branchNode !== undefined &&
          !node.findParent((x) => x instanceof BranchSectionNode, { token })
        ) {
          sortText.order1--;
        }
        if (
          (command.section === "MeasureHead" ||
            command.section === "Song" ||
            command.section === "Branch" ||
            command.section === "End") &&
          !measureHead
        ) {
          sortText.order1++;
        }
        if (
          (command === commands.items.barlineoff && chartState.showBarline === false) ||
          (command === commands.items.barlineon && chartState.showBarline === true) ||
          (command === commands.items.gogostart && chartState.isGogotime === true) ||
          (command === commands.items.gogoend && chartState.isGogotime === false) ||
          (command === commands.items.dummystart && chartState.isDummyNote === true) ||
          (command === commands.items.dummyend && chartState.isDummyNote === false)
        ) {
          // コンテキストと合わない場合は優先度を下げる
          sortText.order1++;
        }
      }

      const snippet = new CompletionItem("#" + command.name, CompletionItemKind.Function);
      const [isMatch, matchScore] = nearyMatch(searchQuery, command.name);
      if (isMatch) {
        snippet.filterText = searchQuery;
        sortText.order1 += matchScore;
      } else {
        continue;
      }

      // insertTextを決定
      let insertTextValue: string;
      if (command.snippet) {
        // snippetが定義されている場合はそれを使用
        insertTextValue = command.snippet.value ?? command.name;
      } else {
        // snippetが省略されている場合
        insertTextValue = command.name;
        // 1つ目のパラメータが存在し、かつisOptionalではない場合はスペースを追加
        if (command.parameter.length > 0 && !command.parameter[0].isOptional) {
          insertTextValue += " ";
        }
      }

      snippet.insertText = new SnippetString((containSharp ? "" : "#") + insertTextValue);
      if (_isTmg) {
        snippet.insertText = toTmgCommandSnippetText(snippet.insertText);
      }
      const syntax = generateCommandSyntax(command.name, command.parameter, command.separator);
      snippet.documentation = new MarkdownString().appendMarkdown(syntax + command.documentation);
      snippet.detail = command.detail;
      snippet.sortText = sortText.toString();

      // コマンド補完後に署名ヘルプをトリガー（パラメータがあり、末尾がスペースの場合のみ）
      if (command.parameter.length > 0) {
        // insertTextがスペースで終わるかチェック
        const insertTextValue =
          snippet.insertText instanceof SnippetString
            ? snippet.insertText.value
            : snippet.insertText;

        if (insertTextValue && insertTextValue.endsWith(" ")) {
          snippet.command = {
            command: "editor.action.triggerParameterHints",
            title: "Trigger Parameter Hints",
          };
        }
      }

      snippets.push(snippet);
      order++;
    }

    if (node !== undefined) {
      // 未定義の命令を補完に載せる
      const chart = node.findParent<ChartNode>((x) => x instanceof ChartNode, { token });
      const unknownCommands =
        chart?.filter<CommandNode>(
          (x) =>
            x instanceof CommandNode &&
            commands.get(x.properties.name) === undefined &&
            x.range.contains(position) === false,
          { token }
        ) ?? [];
      for (const unknownCommand of unknownCommands) {
        if (token.isCancellationRequested) {
          return snippets;
        }
        // 優先度の計算
        const sortText = new SortTextFactory();
        sortText.order3++;
        if (!node.findParent((x) => x instanceof ChartNode, { token })) {
          // ヘッダを優先したいため優先度を下げる
          sortText.order1++;
        }

        const name = unknownCommand.properties.name;
        const snippet = new CompletionItem("#" + name, CompletionItemKind.Function);
        const [isMatch, matchScore] = nearyMatch(searchQuery, name);
        if (isMatch) {
          snippet.filterText = searchQuery;
          sortText.order1 += matchScore;
        } else {
          continue;
        }
        snippet.insertText = new SnippetString((containSharp ? "" : "#") + name);
        snippet.documentation = "譜面内で定義された命令";
        snippet.sortText = sortText.toString();
        snippets.push(snippet);
      }
    }

    return snippets;
  }
}

function nearyMatch(input: string, snippet: string): [boolean, number] {
  let matchScore = 0;
  let oldIndex = 0;
  const inputCharas = [...input.toUpperCase()];
  const snippetCharas = [...snippet];
  for (const inputChara of inputCharas) {
    const index = snippetCharas.findIndex((x, i) => i >= oldIndex && x === inputChara);
    if (index === -1) {
      return [false, 0];
    }
    const score = Math.abs(index - oldIndex);
    matchScore += score;
    oldIndex = index;
    snippetCharas.splice(index, 1);
  }
  return [true, matchScore];
}

/**
 * ヘッダーパラメーターの補完
 */
export class HeaderParameterCompletionItemProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    const snippets: vscode.CompletionItem[] = [];

    // 現在行のテキストを取得
    const line = document.lineAt(position).text;

    // コメント内の場合は補完を無効化
    if (isInComment(line, position)) {
      return snippets;
    }

    // ヘッダー名を特定するための処理
    let headerName: string | undefined = undefined;
    let headerInfo: IHeader | undefined = undefined;

    // 行全体でヘッダーマッチングを試行
    const fullLineMatch = line.match(/^([A-Z]+[0-9]*):(.*)$/);
    if (fullLineMatch) {
      const testHeaderName = fullLineMatch[1];
      const testHeaderInfo = headers.get(testHeaderName);

      // コロンの位置を取得
      const colonPosition = line.indexOf(":");
      const isInParameterPart = colonPosition !== -1 && position.character > colonPosition;

      if (testHeaderInfo && isInParameterPart) {
        headerName = testHeaderName;
        headerInfo = testHeaderInfo;
      }
    }

    // 特殊なヘッダー処理（EXAM等の数字付きヘッダー）
    if (!headerInfo) {
      const specialMatch = line.match(/^([A-Z]+)([0-9]+):?(.*)$/);
      if (specialMatch) {
        const baseName = specialMatch[1];
        const number = specialMatch[2];
        const fullHeaderName = baseName + number;
        const testHeaderInfo = headers.get(fullHeaderName);

        const colonPosition = line.indexOf(":");
        const isInParameterPart = colonPosition !== -1 && position.character > colonPosition;

        if (testHeaderInfo && isInParameterPart) {
          headerInfo = testHeaderInfo;
          headerName = fullHeaderName;
        }
      }
    }

    if (!headerInfo || !headerName) {
      return snippets;
    }

    // 区切り文字を取得
    const separatorChar = getSeparatorChar(headerInfo.separator);

    // 現在のパラメーター位置を計算
    const colonPosition = line.indexOf(":");
    const afterColon = line.substring(colonPosition + 1, position.character);
    let currentParamIndex = 0;

    if (separatorChar === "") {
      // 区切り文字が存在しない場合は常に最初のパラメータ
      currentParamIndex = 0;
    } else {
      const separatorRegex = new RegExp(separatorChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const separatorCount = (afterColon.match(separatorRegex) || []).length;
      // パラメータ数を超えた場合は補完を無効にする
      currentParamIndex = separatorCount >= headerInfo.parameter.length ? -1 : separatorCount;
    }

    // パラメータ数を超えた場合は補完しない
    if (currentParamIndex === -1) {
      return snippets;
    }

    // 現在のパラメーター位置のパラメーター定義を取得
    const currentParam = headerInfo.parameter[currentParamIndex];
    if (!currentParam || !currentParam.snippet) {
      return snippets;
    }

    // snippet の型によって処理を分ける
    if (Array.isArray(currentParam.snippet)) {
      // 選択肢系（SnippetParameter[]）の処理
      const snippetArray = currentParam.snippet;
      if (snippetArray.length === 0) {
        return snippets;
      }

      // 補完アイテムを作成（parameter.snippetの順番を保持）
      for (let i = 0; i < snippetArray.length; i++) {
        const item = snippetArray[i];

        // 数値と文字列でアイコンを分ける
        const isNumeric = /^\d+$/.test(item.value);
        const kind = isNumeric ? CompletionItemKind.Value : CompletionItemKind.EnumMember;

        const snippet = new CompletionItem(item.value, kind);
        snippet.insertText = item.value;
        snippet.detail = item.detail;
        snippet.documentation = new MarkdownString(currentParam.description);
        snippet.sortText = i.toString().padStart(3, "0");
        snippets.push(snippet);
      }
    } else {
      // ファイルパス系（FilePathType）の処理
      const filePathType = currentParam.snippet as FilePathType;
      const filePathCompletions = await this.getFilePathCompletions(
        document,
        position,
        filePathType,
        line
      );
      return filePathCompletions;
    }

    return snippets;
  }

  /**
   * ファイルパス補完を取得
   * @param document テキストドキュメント
   * @param position カーソル位置
   * @param filePathType ファイルパスタイプ
   * @param line 現在行のテキスト
   * @returns ファイルパス補完アイテムの配列
   */
  private async getFilePathCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
    filePathType: FilePathType,
    line: string
  ): Promise<vscode.CompletionItem[]> {
    // カーソルがコロンの後にあることを確認
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1 || position.character <= colonIndex) {
      return [];
    }

    try {
      // ドキュメントパスの検証
      if (!document.uri.fsPath) {
        return [];
      }

      const documentDir = path.dirname(document.uri.fsPath);
      const currentFileName = path.basename(document.uri.fsPath);

      // 現在のパラメータ値を取得
      const headerMatch = line.match(/^\s*([A-Z]+):\s*(.*)$/);
      const currentParameterValue = headerMatch ? headerMatch[2].trim() : "";

      return await this.getFileCompletions(
        documentDir,
        filePathType,
        currentFileName,
        currentParameterValue,
        position,
        document
      );
    } catch (error) {
      // エラーが発生した場合は空の配列を返す
      console.warn("Failed to get file path completions:", error);
      return [];
    }
  }

  /**
   * 指定ディレクトリからファイル補完候補を取得
   * @param directoryPath 検索対象ディレクトリパス
   * @param filePathType ファイルパスタイプ
   * @param currentFileName 現在のファイル名（除外対象）
   * @param currentParameterValue 現在のパラメータ値
   * @param position カーソル位置
   * @param document テキストドキュメント
   * @returns ファイル補完アイテムの配列
   */
  private async getFileCompletions(
    directoryPath: string,
    filePathType: FilePathType,
    currentFileName?: string,
    currentParameterValue?: string,
    position?: vscode.Position,
    document?: vscode.TextDocument
  ): Promise<vscode.CompletionItem[]> {
    const completionItems: vscode.CompletionItem[] = [];

    try {
      const files = await fs.promises.readdir(directoryPath, { withFileTypes: true });
      const allowedExtensions = getExtensionsForFilePathType(filePathType);

      for (const file of files) {
        if (file.isFile()) {
          const fileName = file.name;

          // 隠しファイルを除外
          if (fileName.startsWith(".")) {
            continue;
          }

          // 自身のファイルを除外
          if (currentFileName && fileName === currentFileName) {
            continue;
          }

          const fileExt = path.extname(fileName).toLowerCase();

          const completionItem = new vscode.CompletionItem(
            fileName,
            vscode.CompletionItemKind.File
          );

          // ソート用の優先度を設定（推奨拡張子ほど上位に）
          completionItem.sortText = this.getSortText(filePathType, fileExt, fileName);

          // 既存のパラメータ値を置換する範囲を設定
          if (position && document && currentParameterValue !== undefined) {
            const replaceRange = calculateParameterReplaceRange(document, position);
            if (replaceRange) {
              completionItem.range = replaceRange;
            }
          }

          completionItems.push(completionItem);
        } else if (file.isDirectory()) {
          // サブディレクトリも候補に追加
          const completionItem = new vscode.CompletionItem(
            file.name + "/",
            vscode.CompletionItemKind.Folder
          );
          completionItem.detail = "フォルダ";
          completionItem.insertText = file.name + "/";
          completionItem.command = {
            command: "editor.action.triggerSuggest",
            title: "Re-trigger completions",
          };

          // フォルダにも同じ置換範囲を設定
          if (position && document && currentParameterValue !== undefined) {
            const replaceRange = calculateParameterReplaceRange(document, position);
            if (replaceRange) {
              completionItem.range = replaceRange;
            }
          }

          completionItems.push(completionItem);
        }
      }
    } catch (error) {
      // ディレクトリアクセスエラーは無視
    }

    return completionItems;
  }

  /**
   * ソート用のテキストを生成（推奨拡張子を優先）
   * @param filePathType ファイルパスタイプ
   * @param extension ファイル拡張子
   * @param fileName ファイル名
   * @returns ソート用文字列
   */
  private getSortText(filePathType: FilePathType, extension: string, fileName: string): string {
    const allowedExtensions = getExtensionsForFilePathType(filePathType);
    const index = allowedExtensions.indexOf(extension);

    if (index >= 0) {
      // 推奨拡張子の場合、インデックスに基づいて優先順位を設定
      return `0${index.toString().padStart(2, "0")}_${fileName}`;
    } else {
      // 非推奨拡張子の場合、拡張子別にグループ化して後ろに配置
      return `1${extension}_${fileName}`;
    }
  }
}

/**
 * コマンドパラメーターの補完
 */
export class CommandParameterCompletionItemProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    const snippets: vscode.CompletionItem[] = [];

    // 現在行のテキストを取得
    const line = document.lineAt(position).text;

    // コメント内の場合は補完を無効化
    if (isInComment(line, position)) {
      return snippets;
    }

    const _isTmg = isTmg(document);

    // コマンド情報を検出
    const commandDetection = detectCommandInfo(line, position, _isTmg);
    if (!commandDetection || !commandDetection.isInParameterArea) {
      return snippets;
    }

    const { commandName, commandInfo } = commandDetection;

    // パラメーター位置を計算
    const parameterPosition = calculateCommandParameterPosition(
      line,
      position,
      commandInfo,
      _isTmg
    );
    if (!parameterPosition) {
      return snippets;
    }

    const { currentParam, parameterIndex: currentParamIndex } = parameterPosition;

    // snippet の型によって処理を分ける
    if (Array.isArray(currentParam.snippet)) {
      // 選択肢系（SnippetParameter[]）の処理
      const snippetArray = currentParam.snippet;
      if (snippetArray.length === 0) {
        return snippets;
      }
      // 補完アイテムを作成（parameter.snippetの順番を保持）
      for (let i = 0; i < snippetArray.length; i++) {
        const item = snippetArray[i];

        // 数値と文字列でアイコンを分ける
        const isNumeric = /^\d+$/.test(item.value);
        const kind = isNumeric
          ? vscode.CompletionItemKind.Value
          : vscode.CompletionItemKind.EnumMember;

        const snippet = new vscode.CompletionItem(item.value, kind);
        snippet.insertText = item.value;
        snippet.detail = item.detail;
        snippet.documentation = new vscode.MarkdownString(currentParam.description);
        snippet.sortText = i.toString().padStart(3, "0");
        snippets.push(snippet);
      }
    } else if (currentParam.snippet && !Array.isArray(currentParam.snippet)) {
      // ファイルパス系（FilePathType）の処理
      const filePathType = currentParam.snippet as FilePathType;
      const filePathCompletions = await this.getCommandFilePathCompletions(
        document,
        position,
        filePathType,
        line,
        commandInfo,
        currentParamIndex
      );
      return filePathCompletions;
    }
    return snippets;
  }

  /**
   * コマンド用ファイルパス補完を取得
   * @param document テキストドキュメント
   * @param position カーソル位置
   * @param filePathType ファイルパスタイプ
   * @param line 現在行のテキスト
   * @param commandInfo コマンド情報
   * @param currentParamIndex 現在のパラメータインデックス
   * @returns ファイルパス補完アイテムの配列
   */
  private async getCommandFilePathCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
    filePathType: FilePathType,
    line: string,
    commandInfo: ICommand,
    currentParamIndex: number
  ): Promise<vscode.CompletionItem[]> {
    try {
      // ドキュメントパスの検証
      if (!document.uri.fsPath) {
        return [];
      }

      const documentDir = path.dirname(document.uri.fsPath);
      const currentFileName = path.basename(document.uri.fsPath);

      // 現在のパラメータ値を取得
      const sharpPos = line.indexOf("#");
      const commandEndPos = sharpPos + 1 + commandInfo.name.length;
      const parameterPart = line.substring(commandEndPos).trim();
      const separatorChar = getSeparatorChar(commandInfo.separator);

      let currentParameterValue = "";
      if (parameterPart) {
        let params: string[];
        if (
          separatorChar === "" ||
          separatorChar === "None" ||
          commandInfo.separator === "None" ||
          commandInfo.separator === "Space"
        ) {
          // スペース区切り
          params = parameterPart.split(/\s+/).filter((p) => p.length > 0);
        } else {
          // 他の区切り文字（カンマなど）
          const separatorRegex = new RegExp(
            separatorChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "g"
          );
          params = parameterPart.split(separatorRegex);
        }

        if (currentParamIndex < params.length) {
          currentParameterValue = params[currentParamIndex].trim();
        }
      }

      return await this.getCommandFileCompletions(
        documentDir,
        filePathType,
        currentFileName,
        currentParameterValue,
        position,
        document,
        commandInfo,
        currentParamIndex
      );
    } catch (error) {
      // エラーが発生した場合は空の配列を返す
      console.warn("Failed to get command file path completions:", error);
      return [];
    }
  }

  /**
   * コマンド用指定ディレクトリからファイル補完候補を取得
   * @param directoryPath 検索対象ディレクトリパス
   * @param filePathType ファイルパスタイプ
   * @param currentFileName 現在のファイル名（除外対象）
   * @param currentParameterValue 現在のパラメータ値
   * @param position カーソル位置
   * @param document テキストドキュメント
   * @param commandInfo コマンド情報
   * @param currentParamIndex 現在のパラメータインデックス
   * @returns ファイル補完アイテムの配列
   */
  private async getCommandFileCompletions(
    directoryPath: string,
    filePathType: FilePathType,
    currentFileName?: string,
    currentParameterValue?: string,
    position?: vscode.Position,
    document?: vscode.TextDocument,
    commandInfo?: ICommand,
    currentParamIndex?: number
  ): Promise<vscode.CompletionItem[]> {
    const completionItems: vscode.CompletionItem[] = [];

    try {
      const files = await fs.promises.readdir(directoryPath, { withFileTypes: true });
      const allowedExtensions = getExtensionsForFilePathType(filePathType);

      for (const file of files) {
        if (file.isFile()) {
          const fileName = file.name;

          // 隠しファイルを除外
          if (fileName.startsWith(".")) {
            continue;
          }

          // 自身のファイルを除外
          if (currentFileName && fileName === currentFileName) {
            continue;
          }

          const fileExt = path.extname(fileName).toLowerCase();

          const completionItem = new vscode.CompletionItem(
            fileName,
            vscode.CompletionItemKind.File
          );

          // ソート用の優先度を設定（推奨拡張子ほど上位に）
          completionItem.sortText = this.getCommandSortText(filePathType, fileExt, fileName);

          // 既存のパラメータ値を置換する範囲を設定
          if (
            position &&
            document &&
            commandInfo &&
            currentParamIndex !== undefined &&
            currentParameterValue !== undefined
          ) {
            const replaceRange = calculateCommandParameterReplaceRange(
              document,
              position,
              commandInfo,
              currentParamIndex
            );
            if (replaceRange) {
              completionItem.range = replaceRange;
            }
          }

          completionItems.push(completionItem);
        } else if (file.isDirectory()) {
          // サブディレクトリも候補に追加
          const completionItem = new vscode.CompletionItem(
            file.name + "/",
            vscode.CompletionItemKind.Folder
          );
          completionItem.detail = "フォルダ";
          completionItem.insertText = file.name + "/";
          completionItem.command = {
            command: "editor.action.triggerSuggest",
            title: "Re-trigger completions",
          };

          // フォルダにも同じ置換範囲を設定
          if (
            position &&
            document &&
            commandInfo &&
            currentParamIndex !== undefined &&
            currentParameterValue !== undefined
          ) {
            const replaceRange = calculateCommandParameterReplaceRange(
              document,
              position,
              commandInfo,
              currentParamIndex
            );
            if (replaceRange) {
              completionItem.range = replaceRange;
            }
          }

          completionItems.push(completionItem);
        }
      }
    } catch (error) {
      // ディレクトリアクセスエラーは無視
    }

    return completionItems;
  }

  /**
   * コマンド用ソート用のテキストを生成（推奨拡張子を優先）
   * @param filePathType ファイルパスタイプ
   * @param extension ファイル拡張子
   * @param fileName ファイル名
   * @returns ソート用文字列
   */
  private getCommandSortText(
    filePathType: FilePathType,
    extension: string,
    fileName: string
  ): string {
    const allowedExtensions = getExtensionsForFilePathType(filePathType);
    const index = allowedExtensions.indexOf(extension);

    if (index >= 0) {
      // 推奨拡張子の場合、インデックスに基づいて優先順位を設定
      return `0${index.toString().padStart(2, "0")}_${fileName}`;
    } else {
      // 非推奨拡張子の場合、拡張子別にグループ化して後ろに配置
      return `1${extension}_${fileName}`;
    }
  }
}

/**
 * 譜面の0埋め
 */
export class NotesPaddingItemProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    const snippets: vscode.CompletionItem[] = [];

    const wordRange = document.getWordRangeAtPosition(position, /[0-9A-Z]+/);
    const word = wordRange === undefined ? "" : document.getText(wordRange);
    if (wordRange !== undefined && wordRange.end.isAfter(position)) {
      return snippets;
    }
    const previewRange = new Range(new Position(position.line, 0), wordRange?.start ?? position);
    const previewText = document.getText(previewRange);
    if (/[^A-Z0-9\s]/.test(previewText)) {
      return snippets;
    }

    const root = documents.parse(document, token);
    const chartNode = root?.findDepth<ChartNode>(
      (x) => x instanceof ChartNode && x.range.contains(position),
      { token }
    );
    const branchNode = root?.findDepth(
      (x) => x instanceof BranchNode && x.range.contains(position),
      { token }
    );
    const branchSectionNode = root?.findDepth<BranchSectionNode>(
      (x) => x instanceof BranchSectionNode && x.range.contains(position),
      { token }
    );
    const commandNode = root?.findDepth<CommandNode>(
      (x) => x instanceof CommandNode && x.range.contains(position),
      { token }
    );
    if (
      root !== undefined &&
      (chartNode === undefined ||
        (branchNode !== undefined && branchSectionNode === undefined) ||
        commandNode !== undefined)
    ) {
      return snippets;
    }
    // 直前の行を取得する
    const previewLine = chartNode?.findLastRange<NoteNode>(
      (x) => x instanceof NoteNode && x.range.start.line < position.line,
      { token }
    )?.range.start.line;
    const previewLineNotes = chartNode?.filter<NoteNode>(
      (x) => x instanceof NoteNode && x.range.start.line === previewLine,
      { token }
    );
    if (previewLineNotes === undefined) {
      return snippets;
    }
    // 現在の行を取得する
    const currentLineNotes = chartNode?.filter<NoteNode>(
      (x) => x instanceof NoteNode && x.range.start.line === position.line,
      { token }
    );
    if (currentLineNotes === undefined) {
      return snippets;
    }

    const previewLineLength = previewLineNotes.length - currentLineNotes.length;
    if (previewLineLength < 1) {
      return snippets;
    }
    const label = "0".repeat(previewLineLength);
    const text = word + label;
    const snippet = new CompletionItem(label, CompletionItemKind.Snippet);
    snippet.filterText = text;
    snippet.insertText = text;
    snippet.detail = "直前の行と同じ長さで0埋め";
    snippets.push(snippet);
    return snippets;
  }
}

/**
 * 命令のスニペットをTMG形式に変換する
 * @param insertText
 * @returns
 */
function toTmgCommandSnippetText(insertText: SnippetString): SnippetString {
  const regex = /(#)?([A-Z0-9]+)(\s+)?(.+)?/;
  const match = insertText.value.match(regex);

  if (!match) {
    return insertText;
  }

  let [, sharp, name, spaces, parameter] = match;

  if (sharp === undefined) {
    sharp = "";
  }

  if (!spaces && !parameter) {
    return new SnippetString().appendText(sharp).appendText(name).appendText("()");
  }

  if (spaces && parameter) {
    return new SnippetString()
      .appendText(sharp)
      .appendText(name)
      .appendText("(")
      .appendText(parameter.replace(/\s+/g, ","))
      .appendText(")");
  }

  return new SnippetString()
    .appendText(sharp)
    .appendText(name)
    .appendText("(")
    .appendTabstop(1)
    .appendText(")")
    .appendTabstop(0);
}
