import { t } from "../i18n";

/**
 * 获取本地化的命令信息
 */
export function getLocalizedCommandInfo(commandKey: string) {
  return {
    detail: t(`tjaCommands.${commandKey}.detail`),
    documentation: t(`tjaCommands.${commandKey}.documentation`)
  };
}

/**
 * 获取本地化的命令参数描述
 */
export function getLocalizedCommandParamDescription(commandKey: string, paramKey: string) {
  return t(`tjaCommands.${commandKey}.${paramKey}`);
}

/**
 * 获取本地化的头部信息
 */
export function getLocalizedHeaderInfo(headerKey: string) {
  return {
    detail: t(`tjaHeaders.${headerKey}.detail`),
    documentation: t(`tjaHeaders.${headerKey}.documentation`)
  };
}

/**
 * 获取本地化的头部参数描述
 */
export function getLocalizedHeaderParamDescription(headerKey: string, paramKey: string = "paramDescription") {
  return t(`tjaHeaders.${headerKey}.${paramKey}`);
}
