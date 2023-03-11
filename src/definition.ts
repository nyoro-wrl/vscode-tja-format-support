import * as vscode from "vscode";
import { Location } from "vscode";
import { documents } from "./documents";
import { NoteNode, CourseNode, HeaderNode, ParameterNode } from "./types/node";

/**
 * 風船打数から風船音符にジャンプ（雑実装）
 */
export const balloonParameterDefinition = vscode.languages.registerDefinitionProvider("tja", {
  provideDefinition(document, position, token) {
    const wordRange = document.getWordRangeAtPosition(position, /[0-9]+/);
    if (wordRange === undefined) {
      return;
    }

    const root = documents.get(document).parse();
    const balloonHeader = root.find(
      (x) =>
        x instanceof HeaderNode &&
        x.range !== undefined &&
        x.range.contains(position) &&
        x.properties.name === "BALLOON"
    ) as HeaderNode | undefined;
    if (balloonHeader === undefined) {
      return;
    }
    const parameterNode = balloonHeader.find(
      (x) => x instanceof ParameterNode && x.range.contains(position)
    ) as ParameterNode | undefined;
    if (parameterNode === undefined) {
      return;
    }
    const balloonId = parameterNode.properties.index;
    const courseNode = balloonHeader.findParent((x) => x instanceof CourseNode) as
      | CourseNode
      | undefined;
    if (courseNode === undefined) {
      return;
    }
    const balloonNotes = courseNode.find(
      (x) => x instanceof NoteNode && x.properties.balloonId === balloonId
    ) as NoteNode | undefined;
    if (balloonNotes === undefined) {
      return;
    }
    const balloonRange = document.getWordRangeAtPosition(balloonNotes.range.end, /([79]0*8?)/);
    if (balloonRange === undefined) {
      return;
    }

    const location = new Location(document.uri, balloonRange);
    return Promise.resolve(location);
  },
});

/**
 * 風船音符から風船打数にジャンプ（雑実装）
 */
export const balloonNoteDefinition = vscode.languages.registerDefinitionProvider("tja", {
  provideDefinition(document, position, token) {
    const wordRange = document.getWordRangeAtPosition(position, /([79]0*8?|0*8|0+)/);
    if (wordRange === undefined) {
      return;
    }

    const root = documents.get(document).parse();
    const balloonNote = root.find(
      (x) =>
        x instanceof NoteNode && x.range.contains(position) && x.properties.balloonId !== undefined
    ) as NoteNode | undefined;
    const balloonId = balloonNote?.properties.balloonId;
    if (balloonNote === undefined || balloonId === undefined) {
      return;
    }
    const balloonHeader = (
      balloonNote.findParent((x) => x instanceof CourseNode) as CourseNode | undefined
    )?.find((x) => x instanceof HeaderNode && x.properties.name === "BALLOON") as
      | HeaderNode
      | undefined;
    if (balloonHeader === undefined) {
      return;
    }
    const balloonParameters = balloonHeader.findAll(
      (x) => x instanceof ParameterNode
    ) as ParameterNode[];
    if (balloonParameters.length <= balloonId) {
      if (balloonHeader.range !== undefined) {
        const location = new Location(document.uri, balloonHeader.range);
        return Promise.resolve(location);
      }
    }
    const balloonParameter = balloonParameters[balloonId];

    const location = new Location(document.uri, balloonParameter.range);
    return Promise.resolve(location);
  },
});
