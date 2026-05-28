import { fonts, padding } from 'ui/src/theme'

export const ITEM_PADDING = padding.padding12
export const TEXT_VARIANT: keyof typeof fonts = 'body4'
export const SEPARATOR_HEIGHT = 1

export const ROW_HEIGHT = 2 * ITEM_PADDING + fonts[TEXT_VARIANT].lineHeight + SEPARATOR_HEIGHT

export const INITIAL_VISIBLE_ITEMS_MOBILE = 5 // Load these first for smooth initial expansion
export const MAX_VISIBLE_HEIGHT_MOBILE = ROW_HEIGHT * (INITIAL_VISIBLE_ITEMS_MOBILE - 0.5) // Clamp to 4.5 rows so it's clear there's more
