# 🔧 语言切换问题解决方案

如果您切换到中文后界面仍然显示日文，请按照以下步骤进行排查：

## 📋 快速诊断

### 第一步：使用调试命令
1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入并选择：`TJA: Debug Language Settings`
3. 查看弹出的诊断信息，确认以下内容：
   - 当前使用语言是否为 `zh`
   - 配置文件语言是否正确保存
   - 测试翻译结果是否为中文

### 第二步：检查配置文件
1. 打开VS Code设置 (`Ctrl+,`)
2. 搜索 `tjaFormatSupport.language`
3. 确认值设置为 `zh`
4. 如果没有这个设置项，手动添加：
   ```json
   {
     "tjaFormatSupport.language": "zh"
   }
   ```

## 🔍 具体问题解决

### 问题1：命令面板中的命令仍为日文
**原因**：VS Code的命令标题来自package.json，需要重启才能更新

**解决方案**：
1. 完全关闭VS Code
2. 重新启动VS Code
3. 再次检查命令面板

### 问题2：右键菜单仍为日文
**原因**：右键菜单项也需要重启VS Code更新

**解决方案**：
1. 重启VS Code
2. 或使用快捷键 `Ctrl+R` 重新加载窗口

### 问题3：状态栏仍显示日文
**原因**：语言管理器可能没有正确加载配置

**解决方案**：
1. 打开开发者控制台 (`Ctrl+Shift+I`)
2. 查看控制台日志，寻找 `[TJA Language]` 相关信息
3. 运行调试命令查看详细信息

### 问题4：配置没有正确保存
**原因**：权限问题或配置文件损坏

**解决方案**：
1. 手动编辑settings.json：
   - `Ctrl+Shift+P` → "Preferences: Open Settings (JSON)"
   - 添加：`"tjaFormatSupport.language": "zh"`
2. 重启VS Code

## ⚡ 强制重置方法

如果上述方法都不行，尝试强制重置：

### 方法1：清除配置重新设置
1. 在settings.json中删除 `tjaFormatSupport.language` 行
2. 保存文件
3. 重启VS Code
4. 重新运行 `TJA: Change Language` 命令

### 方法2：重新安装扩展
1. 卸载 TJA Format Support 扩展
2. 重启VS Code
3. 重新安装扩展
4. 设置语言为中文

### 方法3：检查扩展版本
确保您使用的是包含多语言功能的版本（1.6.0+）

## 📝 手动验证

运行以下检查来验证语言设置：

1. **配置检查**：
   ```
   设置 → 搜索"tjaFormatSupport.language" → 应显示"zh"
   ```

2. **功能检查**：
   - 打开一个.tja文件
   - 查看状态栏：应显示"小节"而不是"小節"
   - 右键选择文本：菜单应为中文

3. **调试输出**：
   - 打开开发者工具（F12）
   - 切换到Console标签
   - 查找包含 `[TJA Language]` 的日志

## 🆘 仍然无法解决？

如果问题仍然存在，请：

1. 运行 `TJA: Debug Language Settings` 命令
2. 复制调试信息
3. 查看开发者控制台的完整日志
4. 确认VS Code版本和扩展版本

**常见的日志信息：**
- `[TJA Language] 配置的语言: zh` ✅ 正常
- `[TJA Language] 最终使用语言: zh` ✅ 正常  
- `[TJA Language] 翻译键未找到` ❌ 需要检查资源文件

记住：某些界面元素（如命令标题）需要重启VS Code才能完全更新！
