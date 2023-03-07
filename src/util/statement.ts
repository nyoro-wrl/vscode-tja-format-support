import { Separator } from "../types/statement";

/**
 * Separatorから区切り用正規表現に変換
 * @param separator
 * @returns
 */
export function splitToRegExp(separator: Separator): RegExp {
  switch (separator) {
    case "Comma":
      return /\s*,\s*/g;
    case "Space":
      return /\s+/g;
    case "None":
    case "Unknown":
      return /(?!)/g;
    default:
      throw new ReferenceError("No action defined for Separator.");
  }
}
