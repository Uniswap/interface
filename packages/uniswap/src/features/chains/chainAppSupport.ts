import { AppId } from '@universe/config'

/** Chains available on all apps (web, mobile, extension). */
export const ALL_APPS_CHAIN_SUPPORTED_APPS: readonly AppId[] = [AppId.Web, AppId.Mobile, AppId.Extension]

/** Chains limited to the web app only (e.g. SVM before mobile/extension wallet support). */
export const WEB_ONLY_CHAIN_SUPPORTED_APPS: readonly AppId[] = [AppId.Web]
