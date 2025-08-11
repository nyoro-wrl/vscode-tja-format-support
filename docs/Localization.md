# Localization Developer Guide

## Technical Implementation

1. **Language Manager**: `LanguageManager` singleton manages language state
2. **Resource Files**: Independent resources for each language (`src/i18n/*.ts`)
3. **Translation Function**: `t()` function for key-value translation
4. **Settings Sync**: Automatic synchronization of user setting changes
5. **Package Localization**: Uses VS Code standard mechanism

## Adding New Languages

1. **Create Resource File**: `src/i18n/[language-code].ts`
2. **Implement Interface**: Implement the `LanguageResources` interface
3. **Register Language**: Add to `SUPPORTED_LANGUAGES` in `src/i18n/index.ts`
4. **Package Localization**: Create `package.nls.[language-code].json`

## Usage Example

```typescript
import { t } from "../i18n";

// Get translated text
const translatedText = t("statusBar.measure");

// Access nested keys  
const configDescription = t("config.liteMode");
```

### Logging and Debug

**Debug Log Verification:**
- Search for `[TJA Language]` in Developer Tools (`Ctrl+Shift+I`) Console
- Debug Command: `TJA: Debug Language Settings` for detailed information