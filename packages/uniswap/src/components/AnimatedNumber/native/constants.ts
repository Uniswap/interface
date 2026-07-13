import type { TextVariantKey } from 'ui/src/theme'

export const DIGIT_HEIGHT = 40
export const DIGIT_MAX_WIDTH = 29
export const ADDITIONAL_WIDTH_FOR_ANIMATIONS = 8

export const CHAR_SPACE_SIZE = 2

// Extra breathing room added to each tabular digit cell so glyphs are not visually cramped.
// Mirrors the web implementation (CharCell) so both platforms size digits identically.
export const DIGIT_CELL_PADDING_RATIO = 1 / 10

export const SCREEN_WIDTH_BUFFER = 50

export const HEADING_TEXT_VARIANT_KEYS = new Set<TextVariantKey>(['heading1', 'heading2'])
