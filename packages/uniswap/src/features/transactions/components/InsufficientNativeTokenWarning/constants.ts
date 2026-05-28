import { isWebPlatform } from '@universe/environment'

export const INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT = isWebPlatform ? 'body4' : 'body3'
