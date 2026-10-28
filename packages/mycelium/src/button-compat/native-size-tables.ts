/**
 * ButtonCompat's NATIVE buttonFont scale — the label text/leading classes and
 * the icon/spinner box, per size, TWO columns (INFRA-3297) picked once at
 * module init by `needsSmallFont` (../text-compat/needs-small-font):
 *
 *   DEFAULT (non-CJK): fontSize f + 1, box (l + 1) * 1.15
 *   CJK (zh/ja):       fontSize f,     box  l      * 1.15
 *
 * See native-font-environment.native.ts for why the gate resolves once at
 * module scope rather than per-render.
 *
 * The CJK column is byte-identical to compile.ts's WEB tables by construction
 * (web's `needsSmallFont` is constant true, so web IS the no-bump column),
 * restated here as its own literals so the native scale stays independently
 * pinned and uniwind's static scan of this source keeps seeing every class
 * the native leg can emit.
 *
 * Off-native resolutions read the constant-true web/base stubs and land on
 * the CJK (= web-ramp) column; nothing rendered off-native consumes these
 * tables. The native parity harness's shared `expo-localization` stub
 * (vitest.native.config.ts) pins device locale to en-US for every case, so
 * that suite deterministically measures the DEFAULT column.
 */
import { needsSmallFont } from '../text-compat/needs-small-font'
import type { ButtonSize } from './compile'

const SMALL_FONT = needsSmallFont()

const NATIVE_TEXT_SIZE_DEFAULT: Record<ButtonSize, string> = {
  xxsmall: 'text-[13px] leading-[14.95px]',
  xsmall: 'text-[13px] leading-[17.25px]',
  small: 'text-[15px] leading-[17.25px]',
  medium: 'text-[17px] leading-[21.85px]',
  large: 'text-[19px] leading-[21.85px]',
}

const NATIVE_TEXT_SIZE_CJK: Record<ButtonSize, string> = {
  xxsmall: 'text-[12px] leading-[13.8px]',
  xsmall: 'text-[12px] leading-[16.1px]',
  small: 'text-[14px] leading-[16.1px]',
  medium: 'text-[16px] leading-[20.7px]',
  large: 'text-[18px] leading-[20.7px]',
}

export const NATIVE_TEXT_SIZE: Record<ButtonSize, string> = SMALL_FONT ? NATIVE_TEXT_SIZE_CJK : NATIVE_TEXT_SIZE_DEFAULT

const NATIVE_TEXT_SIZE_NO_LEADING_DEFAULT: Record<ButtonSize, string> = {
  xxsmall: 'text-[13px]',
  xsmall: 'text-[13px]',
  small: 'text-[15px]',
  medium: 'text-[17px]',
  large: 'text-[19px]',
}

const NATIVE_TEXT_SIZE_NO_LEADING_CJK: Record<ButtonSize, string> = {
  xxsmall: 'text-[12px]',
  xsmall: 'text-[12px]',
  small: 'text-[14px]',
  medium: 'text-[16px]',
  large: 'text-[18px]',
}

export const NATIVE_TEXT_SIZE_NO_LEADING: Record<ButtonSize, string> = SMALL_FONT
  ? NATIVE_TEXT_SIZE_NO_LEADING_CJK
  : NATIVE_TEXT_SIZE_NO_LEADING_DEFAULT

const NATIVE_ICON_SIZE_PX_DEFAULT: Record<ButtonSize, number> = {
  xxsmall: 14.95,
  xsmall: 17.25,
  small: 17.25,
  medium: 21.85,
  large: 21.85,
}

const NATIVE_ICON_SIZE_PX_CJK: Record<ButtonSize, number> = {
  xxsmall: 13.8,
  xsmall: 16.1,
  small: 16.1,
  medium: 20.7,
  large: 20.7,
}

/**
 * `useIconSizes('button')` in numbers as NATIVE resolves it — the explicit
 * width/height the leg clones onto the glyph (`[&_svg]:` has no native
 * meaning). See the header for why these differ from the web `ICON_SIZE`
 * values in ./compile.
 */
export const NATIVE_ICON_SIZE_PX: Record<ButtonSize, number> = SMALL_FONT
  ? NATIVE_ICON_SIZE_PX_CJK
  : NATIVE_ICON_SIZE_PX_DEFAULT

/** The native spinner box — same `useIconSizes` derivation as the icon box. */
export const NATIVE_SPINNER_SIZE: Record<ButtonSize, number> = NATIVE_ICON_SIZE_PX
