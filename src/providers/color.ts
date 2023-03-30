import * as vscode from "vscode";
import { ColorInformation } from "vscode";
import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { documents } from "../extension";
import { ChartNode, CommandNode, HeaderNode, HeadersNode, ParametersNode } from "../types/node";
import { rgb, hex } from "color-convert";

/**
 * DANTICKCOLOR:ヘッダのカラーピッカー機能
 */
export class DantickColorDocumentColorProvider implements vscode.DocumentColorProvider {
  async provideDocumentColors(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<ColorInformation[]> {
    const results: ColorInformation[] = [];
    const root = documents.parse(document, token);

    const dantickcolorHeaders = root.filter<HeaderNode>(
      (x) => x instanceof HeaderNode && headers.items.dantickcolor.regexp.test(x.properties.name),
      false,
      (x) => x instanceof ChartNode
    );
    for (const dantickcolorHeader of dantickcolorHeaders) {
      if (token.isCancellationRequested) {
        return results;
      }

      const parameters = dantickcolorHeader.children.find((x) => x instanceof ParametersNode);
      if (parameters === undefined) {
        continue;
      }
      const colorCode = dantickcolorHeader.properties.parameter;
      if (!/^#[0-9A-Fa-f]{6}$/.test(colorCode)) {
        continue;
      }
      const color = hex.rgb(colorCode.slice(1));
      const vscodeColor = new vscode.Color(color[0] / 255, color[1] / 255, color[2] / 255, 1);
      const colorInfo = new ColorInformation(parameters.range, vscodeColor);
      results.push(colorInfo);
    }
    return results;
  }

  async provideColorPresentations(
    color: vscode.Color,
    context: { readonly document: vscode.TextDocument; readonly range: vscode.Range },
    token: vscode.CancellationToken
  ): Promise<vscode.ColorPresentation[]> {
    const results: vscode.ColorPresentation[] = [];
    const hexText =
      "#" +
      rgb.hex(
        Math.round(color.red * 255),
        Math.round(color.green * 255),
        Math.round(color.blue * 255)
      );
    const result = new vscode.ColorPresentation(hexText);
    result.textEdit = new vscode.TextEdit(context.range, hexText);
    results.push(result);
    return results;
  }
}

/**
 * #COLOR命令のカラーピッカー機能
 */
export class ColorCommandDocumentColorProvider implements vscode.DocumentColorProvider {
  async provideDocumentColors(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<ColorInformation[]> {
    const results: ColorInformation[] = [];
    const root = documents.parse(document, token);

    const colorHeaders = root.filter<CommandNode>(
      (x) => x instanceof CommandNode && commands.items.color.regexp.test(x.properties.name),
      false,
      (x) => x instanceof HeadersNode
    );
    for (const colorHeader of colorHeaders) {
      if (token.isCancellationRequested) {
        return results;
      }
      const parameters = colorHeader.children.find((x) => x instanceof ParametersNode);
      if (parameters === undefined) {
        continue;
      }
      const colorCodes = colorHeader.properties.parameters;
      if (colorCodes.length < 3) {
        continue;
      }
      const red = Number(colorCodes[0]) / 255;
      const green = Number(colorCodes[1]) / 255;
      const blue = Number(colorCodes[2]) / 255;
      const alpha = (colorCodes.length >= 4 ? Number(colorCodes[3]) : 255) / 255;
      const vscodeColor = new vscode.Color(red, green, blue, alpha);
      const colorInfo = new ColorInformation(parameters.range, vscodeColor);
      results.push(colorInfo);
    }
    return results;
  }

  async provideColorPresentations(
    color: vscode.Color,
    context: { readonly document: vscode.TextDocument; readonly range: vscode.Range },
    token: vscode.CancellationToken
  ): Promise<vscode.ColorPresentation[]> {
    const results: vscode.ColorPresentation[] = [];
    const red = Math.round(color.red * 255).toString();
    const green = Math.round(color.green * 255).toString();
    const blue = Math.round(color.blue * 255).toString();
    const alpha = Math.round(color.alpha * 255).toString();
    const text = `${red} ${green} ${blue} ${alpha}`;
    const result = new vscode.ColorPresentation(text);
    result.textEdit = new vscode.TextEdit(context.range, text);
    results.push(result);
    return results;
  }
}
