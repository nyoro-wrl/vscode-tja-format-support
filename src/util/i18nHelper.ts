import { t } from "../i18n";

/**
 * ローカライズされたコマンド情報を取得
 */
export function getLocalizedCommandInfo(commandKey: string) {
  return {
    detail: t(`tjaCommands.${commandKey}.detail`),
    documentation: t(`tjaCommands.${commandKey}.documentation`)
  };
}

/**
 * ローカライズされたコマンドパラメータ説明を取得
 */
export function getLocalizedCommandParamDescription(commandKey: string, paramKey: string) {
  return t(`tjaCommands.${commandKey}.${paramKey}`);
}

/**
 * ローカライズされたヘッダー情報を取得
 */
export function getLocalizedHeaderInfo(headerKey: string) {
  return {
    detail: t(`tjaHeaders.${headerKey}.detail`),
    documentation: t(`tjaHeaders.${headerKey}.documentation`)
  };
}

/**
 * ローカライズされたヘッダーパラメータ説明を取得
 */
export function getLocalizedHeaderParamDescription(headerKey: string, paramKey: string = "paramDescription") {
  return t(`tjaHeaders.${headerKey}.${paramKey}`);
}
