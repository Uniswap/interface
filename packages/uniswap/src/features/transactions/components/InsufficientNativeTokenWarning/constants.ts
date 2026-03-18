import { isWebPlatform } from 'utilities/src/platform'

export const INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT = isWebPlatform ? 'body4' : 'body3'
