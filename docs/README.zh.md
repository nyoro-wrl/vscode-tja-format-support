# TJA Format Support

支持太鼓之达人模拟器中使用的 `.tja` 格式。
也在一定程度上支持 `.tjc`、`.tjf`、`.tmg` 格式。

[日本語](../README.md) | [English](README.en.md) | **中文**

## 主要功能

### 视觉增强
- 谱面语法高亮
- GoGo Time 高亮显示
- 小节号自动显示

### 编辑功能
- 头部信息和命令自动补全
- 与上一行相同长度的0填充
- 气球音符打数编辑（将光标放在气球音符上按F2）
- 跳转到气球音符打数/谱面位置（光标在音符上按F12或右键→转到定义）
- 气球音符打数显示（鼠标悬停在气球音符上）
- 头部信息、命令和参数的工具提示文档
- 便捷的谱面编辑命令（选择范围→右键）
  - 谱面缩放
  - 谱面裁剪
  - 滚动速度固定化
  - 批量删除命令
  - 等等

### 其他实用功能
- 代码折叠（谱面、段位道场乐曲、分支谱面）
- 粗略符号显示（左侧边栏→资源管理器→大纲）
- 谱面信息显示（左侧边栏→资源管理器→谱面信息）
- 面包屑导航显示（顶部栏）
- 连击数显示（底部状态栏）
- 小节数显示（底部状态栏）
- 小节导航（点击状态栏中的小节数）

## 截图

![sample](images/sample.png)

![command](images/command.gif)

![balloon](images/balloon.gif)

## 语言设置

此扩展支持多种语言。您可以通过两种方式更改界面语言：

### 方法1：命令面板
1. 按 `Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（macOS）
2. 搜索并选择"TJA: Change Language"
3. 从列表中选择您喜欢的语言
4. 重启 VS Code 以完全应用更改

### 方法2：设置
1. 打开 VS Code 设置（`Ctrl+,` 或 文件 > 首选项 > 设置）
2. 搜索 `tjaFormatSupport.language`
3. 从下拉菜单选择语言：
   - `zh` - 中文
   - `ja` - 日语
   - `en` - 英语

## 安装

从 VS Code 扩展商店安装，或在扩展视图中搜索"TJA Format Support"。

## 问题与反馈

如果您遇到任何问题或有建议，请在我们的 [GitHub Issues](https://github.com/nyoro-wrl/vscode-tja-format-support/issues) 页面上报告。