# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension for TJA format support - providing syntax highlighting, editing tools, and language features for Taiko no Tatsujin chart files (.tja, .tjc, .tjf, .tmg).

## Development Commands

- `npm run compile` - Compile TypeScript to JavaScript output
- `npm run watch` - Watch mode compilation for development
- `npm run test` - Run tests (compiles and lints first)
- `npm run lint` - Run ESLint on TypeScript source files
- `npm run vscode:prepublish` - Prepare extension for publishing

## Architecture Overview

### Core Processing Pipeline
1. **Lexer** (`src/lexer.ts`) - Tokenizes TJA format into structured tokens
2. **Parser** (`src/parser.ts`) - Builds AST from tokens with validation
3. **Documents** (`src/providers/documents.ts`) - Caches parsed documents per file

### Language Feature Providers
The extension implements VS Code language features through provider classes in `src/providers/`:
- **semanticTokens.ts** - Syntax highlighting with custom token types for notes, gogo time, branches
- **hover.ts** - Context-sensitive hover information for headers/commands/balloon notes
- **snippet.ts** - Code completion including note padding and parameter suggestions
- **definition.ts** - Go-to-definition for balloon note parameters
- **symbol.ts** - Document outline showing chart structure
- **statusBar.ts** - Live combo/measure count display

### Chart Editing Commands
`src/commands/chartEdit.ts` implements chart manipulation:
- Zoom, truncate, constant scroll operations
- Note type conversions (big/small, don/ka, rest)
- Command deletion across selections

### Type System
The `src/types/` directory defines the domain model:
- **node.ts** - AST node hierarchy for parsed TJA structure
- **note.ts** - Note types and musical notation
- **command.ts** - TJA command definitions and parameters
- **state.ts** - Chart state tracking during parsing

### Extension Configuration
Three main settings control behavior:
- `gogotimeHighlight` - Highlight gogo time sections
- `branchHighlight` - Color-code chart branches (normal/expert/master)
- `liteMode` - Skip parsing for performance (disables language features)

### File Format Support
Handles multiple Taiko chart formats with format-specific parsing logic. TMG format uses different command syntax with parentheses instead of spaces.