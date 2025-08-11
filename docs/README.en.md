# TJA Format Support

This extension provides support for the `.tja` format used in Taiko no Tatsujin simulators.
Also supports `.tjc`, `.tjf`, and `.tmg` formats to some extent.

[日本語](../README.md) | **English** | [中文](README.zh.md)

## Main Features

### Visual Enhancements
- Chart syntax highlighting
- GoGo Time highlighting
- Automatic measure number display

### Editing Features
- Header and command auto-completion
- Zero-padding with same length as previous line
- Balloon note count editing (place cursor on balloon note and press F2)
- Jump to balloon note count/chart position (cursor on note + F12 or right-click → Go to Definition)
- Balloon note count display (hover mouse over balloon note)
- Tooltip documentation for headers, commands, and parameters
- Convenient chart editing commands (select range → right-click)
  - Chart zoom
  - Chart truncate
  - Constant scroll speed
  - Batch delete commands
  - etc.

### Other Useful Features
- Code folding (charts, dan-i mode songs, branch charts)
- Rough symbol display (left sidebar → Explorer → Outline)
- Chart information display (left sidebar → Explorer → Chart Info)
- Breadcrumb display (top bar)
- Combo count display (bottom status bar)
- Measure count display (bottom status bar)
- Measure navigation (click measure count in status bar)

## Screenshots

![sample](images/sample.png)

![command](images/command.gif)

![balloon](images/balloon.gif)

## Language Settings

This extension supports multiple languages. You can change the interface language in two ways:

### Method 1: Command Palette
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
2. Search for and select "TJA: Change Language"
3. Choose your preferred language from the list
4. Restart VS Code to fully apply the changes

### Method 2: Settings
1. Open VS Code Settings (`Ctrl+,` or File > Preferences > Settings)
2. Search for `tjaFormatSupport.language`
3. Select language from dropdown:
   - `zh` - Chinese
   - `ja` - Japanese
   - `en` - English

## Installation

Install from the VS Code Extension Marketplace or search for "TJA Format Support" in the Extensions view.

## Issues & Feedback

If you encounter any problems or have suggestions, please report them on our [GitHub Issues](https://github.com/nyoro-wrl/vscode-tja-format-support/issues) page.