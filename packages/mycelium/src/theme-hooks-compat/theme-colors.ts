/**
 * Every Spore theme colour token the legacy theme hooks expose: the palette colours
 * layered under each theme's values (theme wins on collision), as the Tamagui config did.
 */
import { colors, themes } from './palette'

const light = { ...colors, ...themes.light }

export type ThemeColorName = keyof typeof light

export const THEME_COLOR_NAMES: readonly ThemeColorName[] = (Object.keys(light) as ThemeColorName[]).sort()

export const LIGHT_THEME_COLORS: Readonly<Record<ThemeColorName, string>> = light

export const DARK_THEME_COLORS: Readonly<Record<ThemeColorName, string>> = { ...colors, ...themes.dark }
