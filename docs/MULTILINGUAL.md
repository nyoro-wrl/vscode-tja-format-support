# TJA Format Support - 多语言功能

本扩展现在支持多语言界面，包括中文、日文和英文。

## 功能特性

### 语言选择
- 支持中文 (zh)
- 支持日文 (ja) - 默认
- 支持英文 (en)

### 如何切换语言

#### 方法1: 通过命令面板
1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS) 打开命令面板
2. 输入 "Change Language" 或 "更改语言" 或"言語変更"
3. 选择 "TJA: Change Language / 更改语言 / 言語変更"
4. 从列表中选择您想要的语言
5. 重启 VS Code 以完全应用语言设置

#### 方法2: 通过设置
1. 打开 VS Code 设置 (File > Preferences > Settings)
2. 搜索 "tjaFormatSupport.language"
3. 从下拉菜单中选择语言：
   - `zh` - 中文
   - `ja` - 日本語  
   - `en` - English
4. 重启 VS Code 以完全应用语言设置

### 已本地化的功能

以下功能已支持多语言：

#### 命令
- 谱面缩放/譜面の拡大/Chart Zoom
- 谱面裁剪/譜面の切り詰め/Chart Truncate
- 滚动速度固定化/スクロール速度の一定化/Constant Scroll Speed
- 滚动速度变换/スクロール速度の遷移/Transition Scroll Speed
- 批量删除命令/命令の一括削除/Batch Delete Commands
- 替换为大音符/大音符に置換/Replace with Big Notes
- 替换为小音符/小音符に置換/Replace with Small Notes
- 替换为休止符/休符に置換/Replace with Rests
- 反转咚咔/ドン/カッを反転/Reverse Don/Ka
- 随机咚咔/ドン/カッをランダム/Randomize Don/Ka

#### 配置项
- GoGo Time 高亮
- 谱面分岐颜色区分
- 轻量模式
- 命令补全设置
- 小节号提示

#### 状态栏
- 小节计数器
- 连击数显示
- 模式指示器

#### 语义令牌
- 连打、气球、定时炸弹等音符类型

### 开发者指南

如果您想为此扩展贡献翻译或添加新语言：

1. **添加新语言资源**：
   - 在 `src/i18n/` 文件夹中创建新的语言文件 (例如：`fr.ts` 用于法语)
   - 实现 `LanguageResources` 接口
   - 在 `src/i18n/index.ts` 中注册新语言

2. **添加包级本地化**：
   - 创建 `package.nls.[语言代码].json` 文件
   - 添加VS Code扩展元数据的翻译

3. **更新语言常量**：
   - 在 `SUPPORTED_LANGUAGES` 中添加新语言条目

### 示例代码

在您的代码中使用翻译：

```typescript
import { t } from "../i18n";

// 获取翻译文本
const translatedText = t("statusBar.measure"); // 根据当前语言返回相应文本

// 嵌套键访问
const configDescription = t("config.liteMode");
```

### 注意事项

- 某些VS Code UI元素（如包清单中定义的命令标题）需要重启VS Code才能完全更新
- 运行时的动态文本（如状态栏、提示信息等）会立即更新
- 默认语言是日语，以保持与现有用户的兼容性
- 语言设置会自动从VS Code的语言设置推断，但可以手动覆盖

### 技术实现

多语言功能通过以下方式实现：

1. **语言管理器**: `LanguageManager` 单例管理当前语言状态
2. **资源文件**: 每种语言有独立的资源文件
3. **翻译函数**: `t()` 函数提供键值翻译
4. **配置同步**: 自动同步用户配置变更
5. **包级本地化**: 使用VS Code的包本地化机制
