// import * as vscode from "vscode";
// import { commands } from "../constants/commands";
// import { headers } from "../constants/headers";
// import { addSyntaxError, clearDiagnostics } from "../error";
// import { Lexer, Token } from "./lexer";
// import { Node, TextNode } from "./node";
// import { findLast } from "lodash";
// import { tokenizedRawParameter } from "../util/lexer";

// /**
//  * 構文解析
//  */
// export class Parser {
//   /**
//    * 字句解析から取得したトークン配列
//    */
//   private readonly tokens: Token[];
//   /**
//    * 処理中のトークン位置
//    */
//   private position: number = 0;
//   /**
//    * 直前まで譜面部分に入っていたかどうか
//    */
//   private chartIn: boolean = false;
//   /**
//    * 一度でも譜面部分に入ったかどうか
//    */
//   private chartInOnce: boolean = false;

//   constructor(document: vscode.TextDocument) {
//     const lexer = new Lexer(document);
//     const tokens = lexer.tokenized();
//     this.tokens = tokens;
//   }

//   private parseNode<T extends Node>(parent: T): T {
//     for (; this.position < this.tokens.length; this.position++) {
//       const token = this.tokens[this.position];
//       if (token.kind === "Header") {
//         if (parent.kind === "Global") {
//           const section = headers.get(token.value)?.section ?? "Unknown";
//           if (section === "Global" || section === "Unknown") {
//             if (this.chartIn) {
//               // Course単位の命令として解釈する
//               // 新しくCourseを作成
//               this.chartIn = false;
//               let node = new Node("Course");
//               node = this.parseNode(node);
//               parent.push(node);
//             } else {
//               // 最新のGlobalHeaderで取得させる
//               let node = findLast(parent.children, (x) => x.kind === "GlobalHeader");
//               if (node === undefined) {
//                 // Courseがない場合は作成
//                 node = new Node("GlobalHeader");
//                 parent.push(node);
//               }
//               node = this.parseNode(node);
//             }
//           } else if (section === "Course") {
//             if (this.chartIn) {
//               // 新しくCourseを作成
//               this.chartIn = false;
//               let node = new Node("Course");
//               node = this.parseNode(node);
//               parent.push(node);
//             } else {
//               // 最新のCourseで取得させる
//               let node = findLast(parent.children, (x) => x.kind === "Course");
//               if (node === undefined) {
//                 // Courseがない場合は作成
//                 node = new Node("Course");
//                 parent.push(node);
//               }
//               node = this.parseNode(node);
//             }
//           } else {
//             addSyntaxError(token.range, `No processing defined for HeaderSection = "${section}".`);
//           }
//         } else if (parent.kind === "Header") {
//           let node = new TextNode("Name", token);
//           parent.push(node);
//         } else if (parent.kind === "GlobalHeader") {
//           const section = headers.get(token.value)?.section ?? "Unknown";
//           if (section === "Global" || section === "Unknown") {
//             let node = new Node("Header");
//             node = this.parseNode(node);
//             parent.push(node);
//           } else if (section === "Course") {
//             // GlobalHeaderから出る
//             this.position--;
//             return parent;
//           } else {
//             addSyntaxError(token.range, `No processing defined for HeaderSection = "${section}".`);
//           }
//           // if (section === "Course" || section === "Unknown") {
//           //   if (this.chartIn) {
//           //     // Courseから出る
//           //     this.position--;
//           //     return parent;
//           //   } else {
//           //     let node = new Node("Header");
//           //     node = this.parseNode(node);
//           //     parent.push(node);
//           //   }
//           // } else if (section === "Global") {
//           //   if (this.chartIn) {
//           //     // Courseから出る
//           //     this.position--;
//           //     return parent;
//           //   } else if (this.chartInOnce) {
//           //     // Course単位の命令として解釈する
//           //     let node = new Node("Course");
//           //     node = this.parseNode(node);
//           //     parent.push(node);
//           //   } else {
//           //     // Courseから出てGlobalで取得させる
//           //     this.position--;
//           //     return parent;
//           //   }
//           // } else {
//           //   addSyntaxError(token.range, `No processing defined for HeaderSection = "${section}".`);
//           // }
//         } else if (parent.kind === "Course") {
//           const section = headers.get(token.value)?.section ?? "Unknown";
//           if (section === "Course" || section === "Unknown") {
//             if (this.chartIn) {
//               // Courseから出る
//               this.position--;
//               return parent;
//             } else {
//               let node = new Node("Header");
//               node = this.parseNode(node);
//               parent.push(node);
//             }
//           } else if (section === "Global") {
//             if (this.chartIn) {
//               // Courseから出る
//               this.position--;
//               return parent;
//             } else if (this.chartInOnce) {
//               // Course単位の命令として解釈する
//               let node = new Node("Header");
//               node = this.parseNode(node);
//               parent.push(node);
//             } else {
//               // Courseから出てGlobalで取得させる
//               this.position--;
//               return parent;
//             }
//           } else {
//             addSyntaxError(token.range, `No processing defined for HeaderSection = "${section}".`);
//           }
//         } else {
//           addSyntaxError(token.range, "Invalid header position.");
//         }
//       } else if (token.kind === "Command") {
//         if (parent.kind === "Global") {
//           // 最新のCourseで取得させる
//           let node = findLast(parent.children, (x) => x.kind === "Course");
//           if (node === undefined) {
//             // Courseがない場合は作成
//             node = new Node("Course");
//             parent.push(node);
//           }
//           node = this.parseNode(node);
//         } else if (parent.kind === "Course") {
//           const section = commands.get(token.value)?.section ?? "Unknown";
//           if (section === "Outer" || section === "Unknown") {
//             let node = new Node("Command");
//             node = this.parseNode(node);
//             parent.push(node);
//           } else if (section === "Start") {
//             let node = new Node("Chart");
//             node = this.parseNode(node);
//             parent.push(node);
//             this.chartIn = true;
//             this.chartInOnce = true;
//           } else if (section === "Inner") {
//             addSyntaxError(token.range, "Invalid command position.");
//           } else if (section === "End") {
//             addSyntaxError(token.range, "Invalid command position.");
//           } else {
//             addSyntaxError(token.range, `No processing defined for CommandSection = "${section}".`);
//           }
//         } else if (parent.kind === "Chart") {
//           const section = commands.get(token.value)?.section ?? "Unknown";
//           if (section === "Outer") {
//             addSyntaxError(token.range, "Invalid command position.");
//           } else if (section === "Start") {
//             let node = new Node("Command");
//             node = this.parseNode(node);
//             parent.push(node);
//           } else if (section === "Inner" || section === "Unknown") {
//             let node = new Node("Measure");
//             node = this.parseNode(node);
//             parent.push(node);
//           } else if (section === "End") {
//             let node = new Node("Command");
//             node = this.parseNode(node);
//             parent.push(node);
//             // Chartから出る
//             this.position--;
//             return parent;
//           } else {
//             addSyntaxError(token.range, `No processing defined for CommandSection = "${section}".`);
//           }
//         } else if (parent.kind === "Measure") {
//           const section = commands.get(token.value)?.section ?? "Unknown";
//           if (section === "Outer") {
//             addSyntaxError(token.range, "Invalid command position.");
//           } else if (section === "Start") {
//             addSyntaxError(token.range, "Invalid command position.");
//           } else if (section === "Inner" || section === "Unknown") {
//             let node = new Node("Command");
//             node = this.parseNode(node);
//             parent.push(node);
//           } else if (section === "End") {
//             if (parent.kind === "Measure" && parent.children.every((x) => x.kind === "Command")) {
//               // #END直前に配置された命令のみの小節対応
//               // Measureから出る
//               this.position--;
//               return parent;
//             } else {
//               let previewToken = this.tokens[this.position - 1];
//               addSyntaxError(previewToken.range, "Unclosed measure.");
//             }
//           } else {
//             addSyntaxError(token.range, `No processing defined for CommandSection = "${section}".`);
//           }
//         } else if (parent.kind === "Command") {
//           let node = new TextNode("Name", token);
//           parent.push(node);
//         } else {
//           addSyntaxError(token.range, "Invalid command position.");
//         }
//       } else if (token.kind === "RawParameter") {
//         if (parent.kind === "Header" || parent.kind === "Command") {
//           // TODO 置き換える
//           // Separatorはプロパティで設定する
//           // tokenizedRawParameter(token, );
//           let node = new TextNode("Parameter", token);
//           parent.push(node);
//         } else {
//           addSyntaxError(token.range, "Invalid parameter position.");
//         }
//       } else if (token.kind === "Parameter") {
//         if (parent.kind === "Header" || parent.kind === "Command") {
//           let node = new TextNode("Parameter", token);
//           parent.push(node);
//         } else {
//           addSyntaxError(token.range, "Invalid parameter position.");
//         }
//       } else if (token.kind === "Notes") {
//         if (parent.kind === "Chart") {
//           let node = new Node("Measure");
//           node = this.parseNode(node);
//           parent.push(node);
//         } else if (parent.kind === "Measure") {
//           let node = new TextNode("Note", token);
//           parent.push(node);
//         } else {
//           addSyntaxError(token.range, "Invalid note position.");
//         }
//       } else if (token.kind === "MeasureEnd") {
//         if (parent.kind === "Chart") {
//           let node = new Node("Measure");
//           node = this.parseNode(node);
//           parent.push(node);
//         } else if (parent.kind === "Measure") {
//           let node = new TextNode("MeasureEnd", token);
//           parent.push(node);
//           return parent;
//         } else {
//           addSyntaxError(token.range, "Invalid measure end position.");
//         }
//       } else if (token.kind === "EndOfLine") {
//         if (parent.kind === "Header" || parent.kind === "Command") {
//           return parent;
//         }
//       } else if (token.kind === "Unknown") {
//         addSyntaxError(token.range, "Invalid text.");
//       } else {
//         addSyntaxError(token.range, `No processing defined for TokenKind = "${token.kind}".`);
//       }
//     }
//     if (this.position <= this.tokens.length) {
//       const token = this.tokens[this.tokens.length - 1];
//       if (parent.kind === "Course") {
//         if (!this.chartIn) {
//           addSyntaxError(token.range, "No chart provided.");
//         }
//       } else if (parent.kind === "Chart") {
//         addSyntaxError(token.range, "Missing #END.");
//       } else if (parent.kind === "Measure") {
//         addSyntaxError(token.range, "Unclosed measure.");
//       }
//     }
//     return parent;
//   }

//   public parse(): Node {
//     clearDiagnostics();
//     const node = new Node("Global");
//     return this.parseNode(node);
//   }
// }
