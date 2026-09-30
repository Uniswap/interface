import { DigitCell } from 'uniswap/src/components/AnimatedNumber/native/DigitCell'
import { NonDigitCell } from 'uniswap/src/components/AnimatedNumber/native/NonDigitCell'
import type {
  CellFlash,
  CellRoll,
  ReanimatedNumberRenderProps,
} from 'uniswap/src/components/AnimatedNumber/native/types'
import { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
import { isDigitChar } from 'uniswap/src/components/AnimatedNumber/utils/computeCharsSizes'
import { getAnimatedNumberCharKey } from 'uniswap/src/components/AnimatedNumber/utils/getAnimatedNumberCharKey'
import { getCharBaseColor } from 'uniswap/src/components/AnimatedNumber/utils/getCharDisplayColor'

// Stable identities: cells a tick doesn't touch receive these, so their props are unchanged and memo skips them.
const NO_ROLL: CellRoll = { gen: 0, dir: AnimatedNumberDirection.NONE, flashColor: undefined, delay: 0 }
const NO_FLASH: CellFlash = { gen: 0, color: undefined }

/** Derives each cell's roll/flash request from the tick and hands it to the memoized cells. */
export const CharRow = ({
  baseColor,
  chars,
  currency,
  decimalPartColor,
  digitCellWidth,
  digitHeight,
  shouldFadeDecimals,
  useHeadingTypography,
  variantFont,
  tick,
  charDelays,
  charShouldAnimate,
  reduceMotion,
  suspendAnimations,
}: Pick<
  ReanimatedNumberRenderProps,
  | 'baseColor'
  | 'chars'
  | 'currency'
  | 'decimalPartColor'
  | 'digitCellWidth'
  | 'digitHeight'
  | 'shouldFadeDecimals'
  | 'useHeadingTypography'
  | 'variantFont'
  | 'tick'
  | 'charDelays'
  | 'charShouldAnimate'
  | 'reduceMotion'
  | 'suspendAnimations'
>): JSX.Element => {
  return (
    <>
      {chars.map((char, index) => {
        const key = getAnimatedNumberCharKey({ index, charsLength: chars.length, signColor: baseColor })
        const charBaseColor = getCharBaseColor({
          index,
          chars,
          decimalSeparator: currency.decimalSeparator,
          shouldFadeDecimals,
          neutral1Color: baseColor,
          fadedDecimalColor: decimalPartColor,
        })
        const isInChangedSuffix = index >= tick.commonPrefixLength
        const cellFlashColor = isInChangedSuffix ? tick.flashColor : undefined

        if (!isDigitChar(char)) {
          const flash: CellFlash =
            cellFlashColor != null && !reduceMotion ? { gen: tick.gen, color: cellFlashColor } : NO_FLASH
          return (
            <NonDigitCell
              key={key}
              char={char}
              charBaseColor={charBaseColor}
              digitHeight={digitHeight}
              flash={flash}
              suspendAnimations={suspendAnimations}
              useHeadingTypography={useHeadingTypography}
              variantFont={variantFont}
            />
          )
        }

        // Cells keep identity by position from the END of the value, so the outgoing glyph for
        // this cell lives at the same end-relative position in the previous value's chars.
        const prevChar = tick.prevChars[tick.prevChars.length - (chars.length - index)]
        // Same-digit cells in the changed suffix roll too (shipped design).
        const digitChanged = prevChar !== undefined && prevChar !== char
        const shouldRoll = digitChanged || (charShouldAnimate[index] ?? false)
        const roll: CellRoll =
          shouldRoll && !reduceMotion && tick.dir !== AnimatedNumberDirection.NONE
            ? { gen: tick.gen, dir: tick.dir, flashColor: cellFlashColor, delay: charDelays[index] ?? 0 }
            : NO_ROLL

        return (
          <DigitCell
            key={key}
            charBaseColor={charBaseColor}
            digit={char}
            digitCellWidth={digitCellWidth}
            digitHeight={digitHeight}
            prevChar={prevChar}
            roll={roll}
            suspendAnimations={suspendAnimations}
            useHeadingTypography={useHeadingTypography}
            variantFont={variantFont}
          />
        )
      })}
    </>
  )
}
