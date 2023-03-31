import * as vscode from "vscode";
import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { activeTjaFile, documents } from "../extension";
import {
  ChartNode,
  CourseNode,
  HeaderNode,
  Node,
  ParentNode,
  SongNode,
  StyleHeadersNode,
  StyleNode,
} from "../types/node";
import { Note } from "../types/note";
import { toPercent } from "../util/util";

export class InfoTreeDataProvider implements vscode.TreeDataProvider<TreeItem>, vscode.Disposable {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private readonly disposables: vscode.Disposable[] = [
    activeTjaFile.onDidOpen.event(async () => {
      this.refresh();
    }),
    documents.onDidParsedTextDocument.event(async () => {
      this.refresh();
    }),
  ];

  getTreeItem(element: TreeItem): Thenable<TreeItem> {
    return Promise.resolve(element);
  }

  getChildren(element?: TreeItem): Thenable<TreeItem[]> {
    if (!element) {
      // ルートノードの作成
      const editor = vscode.window.activeTextEditor;
      if (editor === undefined) {
        return Promise.resolve([]);
      }
      const root = documents.parse(editor.document);
      const results = this.toTreeItem(root);
      return Promise.resolve(results);
    } else {
      // 子の表示
      return Promise.resolve([...element.children]);
    }
  }

  private toTreeItem(node: Node, parent?: TreeItem): TreeItem[] {
    const items: TreeItem[] = [];
    let item: TreeItem | undefined;

    if (node instanceof CourseNode) {
      item = this.newTree("COURSE:", node.properties.course, "symbol-class");
    } else if (node instanceof StyleNode) {
      if (node.properties.style !== "") {
        item = this.newTree("STYLE:", node.properties.style, "symbol-class");
      }
    } else if (node instanceof ChartNode || node instanceof SongNode) {
      let measure: number;
      if (node instanceof ChartNode) {
        measure = node.properties.info.measure;
      } else {
        measure = node.properties.measureCount;
      }
      const notes = node.properties.info.notes.filter((x) => x.isDummyNote === false);
      if (node.properties.info.isBranch) {
        if (node.properties.info.hasNormal) {
          const branchNotes = node.properties.info.normalNotes.filter(
            (x) => x.isDummyNote === false
          );
          items.push(this.toNotesTree("Notes:Normal", ...notes, ...branchNotes));
        }
        if (node.properties.info.hasExpert) {
          const branchNotes = node.properties.info.expertNotes.filter(
            (x) => x.isDummyNote === false
          );
          items.push(this.toNotesTree("Notes:Expert", ...notes, ...branchNotes));
        }
        if (node.properties.info.hasMaster) {
          const branchNotes = node.properties.info.masterNotes.filter(
            (x) => x.isDummyNote === false
          );
          items.push(this.toNotesTree("Notes:Master", ...notes, ...branchNotes));
        }
      } else {
        items.push(this.toNotesTree("Notes", ...notes));
      }
      if (node instanceof ChartNode) {
        if (node.properties.start?.parameter ?? "" !== "") {
          item = this.newTree("PlaySide", node.properties.start?.parameter, "symbol-function");
        }
      } else if (node instanceof SongNode) {
        item = this.newTree("Song", node.properties.nextsong?.parameters[0], "symbol-function");
      }
      items.push(this.newTree("Measure", measure.toString(), "note"));
    } else if (
      node instanceof HeaderNode &&
      node.parent instanceof StyleHeadersNode &&
      node.properties.parameter !== ""
    ) {
      item = this.newTree(node.properties.name, node.properties.parameter, "symbol-constant");
    }

    if (item !== undefined) {
      item.addChild(...items);
      while (items.pop() !== undefined) {}
    } else if (parent !== undefined) {
      parent.addChild(...items);
      while (items.pop() !== undefined) {}
    }
    if (node instanceof ParentNode) {
      for (const child of node.children) {
        const childItems = this.toTreeItem(child, item);
        if (item !== undefined) {
          item.addChild(...childItems);
        } else if (parent !== undefined) {
          parent.addChild(...childItems);
        } else {
          items.push(...childItems);
        }
      }
    }
    if (item !== undefined) {
      if (parent === undefined) {
        items.push(item);
      } else {
        parent.addChild(item);
      }
    }
    return items;
  }

  private toNotesTree(label: string, ...notes: Note[]): TreeItem {
    // TODO 連打の長さと風船の打数を表示できるようにする
    const comboNotes = notes.filter((x) => x.isLong === false);
    const combo = comboNotes.length;
    const notesIcon = "activate-breakpoints";
    const smallDonIcon = "circle-filled";
    const smallKaIcon = "circle-outline";
    const bigDonIcon = "circle-large-filled";
    const bigKaIcon = "circle-large-outline";
    const rollIcon = "record-small";
    const bigRollIcon = "record";
    const balloonIcon = "record-small";
    const bigBalloonIcon = "record";

    const notesTree = this.newTree(label, combo.toString(), "note");

    const don = comboNotes.filter((x) => x.type === "Don").length;
    const ka = comboNotes.filter((x) => x.type === "Ka").length;
    const small = comboNotes.filter((x) => x.size === "Small").length;
    const big = comboNotes.filter((x) => x.size === "Big").length;
    const donSmall = comboNotes.filter((x) => x.type === "Don" && x.size === "Small").length;
    const donBig = comboNotes.filter((x) => x.type === "Don" && x.size === "Big").length;
    const kaSmall = comboNotes.filter((x) => x.type === "Ka" && x.size === "Small").length;
    const kaBig = comboNotes.filter((x) => x.type === "Ka" && x.size === "Big").length;
    const roll = notes.filter((x) => x.type === "Roll").length;
    const smallRoll = notes.filter((x) => x.type === "Roll" && x.size === "Small").length;
    const bigRoll = notes.filter((x) => x.type === "Roll" && x.size === "Big").length;
    const balloon = notes.filter((x) => x.type === "Balloon").length;
    const smallBalloon = notes.filter((x) => x.type === "Balloon" && x.size === "Small").length;
    const bigBalloon = notes.filter((x) => x.type === "Balloon" && x.size === "Big").length;

    const donTree = this.newTree("Don", `${don} (${toPercent(don / combo)})`, smallDonIcon);
    const kaTree = this.newTree("Ka", `${ka} (${toPercent(ka / combo)})`, smallKaIcon);
    const smallTree = this.newTree("Small", `${small} (${toPercent(small / combo)})`, notesIcon);
    const bigTree = this.newTree("Big", `${big} (${toPercent(big / combo)})`, notesIcon);
    const smallDonTree = this.newTree(
      "Small",
      `${donSmall} (${toPercent(donSmall / combo)})`,
      smallDonIcon
    );
    const bigDonTree = this.newTree("Big", `${donBig} (${toPercent(donBig / combo)})`, bigDonIcon);
    const smallKaTree = this.newTree(
      "Small",
      `${kaSmall} (${toPercent(kaSmall / combo)})`,
      smallKaIcon
    );
    const bigKaTree = this.newTree("Big", `${kaBig} (${toPercent(kaBig / combo)})`, bigKaIcon);
    const donSmallTree = this.newTree(
      "Don",
      `${donSmall} (${toPercent(donSmall / combo)})`,
      smallDonIcon
    );
    const kaSmallTree = this.newTree(
      "Ka",
      `${kaSmall} (${toPercent(kaSmall / combo)})`,
      smallKaIcon
    );
    const donBigTree = this.newTree("Don", `${donBig} (${toPercent(donBig / combo)})`, bigDonIcon);
    const kaBigTree = this.newTree("Ka", `${kaBig} (${toPercent(kaBig / combo)})`, bigKaIcon);
    const rollTree = this.newTree("Roll", `${roll}`, rollIcon);
    const smallRollTree = this.newTree("Small", `${smallRoll}`, rollIcon);
    const bigRollTree = this.newTree("Big", `${bigRoll}`, bigRollIcon);
    const balloonTree = this.newTree("Balloon", `${balloon}`, balloonIcon);
    const smallBalloonTree = this.newTree("Small", `${smallBalloon}`, balloonIcon);
    const bigBalloonTree = this.newTree("Big", `${bigBalloon}`, bigBalloonIcon);

    donTree.addChild(smallDonTree, bigDonTree);
    kaTree.addChild(smallKaTree, bigKaTree);
    smallTree.addChild(donSmallTree, kaSmallTree);
    bigTree.addChild(donBigTree, kaBigTree);
    rollTree.addChild(smallRollTree, bigRollTree);
    balloonTree.addChild(smallBalloonTree, bigBalloonTree);
    notesTree.addChild(donTree, kaTree, smallTree, bigTree);

    return notesTree;
  }

  private newTree(label: string, description?: string, themeIconId?: string): TreeItem {
    const tree = new TreeItem(label, description);
    if (themeIconId !== undefined) {
      tree.iconPath = new ThemeIcon(themeIconId);
    }
    return tree;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  dispose() {
    this.disposables.forEach((x) => x.dispose());
  }
}

export class TreeItem extends vscode.TreeItem {
  public readonly children: TreeItem[] = [];

  constructor(label: string, description?: string) {
    super(label);
    this.description = description;
  }

  addChild(...items: TreeItem[]) {
    this.children.push(...items);
    if (this.children.length > 0) {
      this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    }
  }
}
