import { fonts, padding } from 'ui/src/theme'

export const ITEM_PADDING = padding.padding12
export const TEXT_VARIANT: keyof typeof fonts = 'body4'
export const ROW_HEIGHT = 2 * ITEM_PADDING + fonts[TEXT_VARIANT].lineHeight
