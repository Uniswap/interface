import type { ResolvedFontStyle } from '@universe/mycelium'
import { memo } from 'react'
import { Text, View } from 'react-native'
import { DigitSlot } from 'uniswap/src/components/AnimatedNumber/native/DigitSlot'
import { DigitGlyphStyles } from 'uniswap/src/components/AnimatedNumber/native/styles'
import type { CellRoll } from 'uniswap/src/components/AnimatedNumber/native/types'
import { useCapturedGen } from 'uniswap/src/components/AnimatedNumber/native/useCapturedGen'
import { useDigitTextStyle } from 'uniswap/src/components/AnimatedNumber/native/useDigitTextStyle'
import { AnimatedCharStyles } from 'uniswap/src/components/AnimatedNumber/styles'
import { isDigitChar } from 'uniswap/src/components/AnimatedNumber/utils/computeCharsSizes'

type CapturedRoll = CellRoll & { prevDigit: string }

/**
 * Renders a plain Text (zero Reanimated objects) until a tick first needs it to roll, then mounts
 * a DigitSlot that stays until the cell is suspended or remounted. Eager per-digit animation
 * machinery across dozens of list rows exhausted native memory.
 *
 * Memoized: CharRow passes a stable no-op `roll` to cells a tick doesn't touch, so only rolling cells re-render.
 */
export const DigitCell = memo(function DigitCell({
  digit,
  prevChar,
  roll,
  charBaseColor,
  digitHeight,
  digitCellWidth,
  variantFont,
  useHeadingTypography,
  suspendAnimations,
}: {
  digit: string
  /** This cell's glyph in the previous value (same end-relative position), if any. */
  prevChar: string | undefined
  roll: CellRoll
  charBaseColor: string
  digitHeight: number
  digitCellWidth: number
  variantFont: ResolvedFontStyle
  useHeadingTypography: boolean
  suspendAnimations: boolean
}): JSX.Element {
  const digitTextStyle = useDigitTextStyle({ variantFont, digitHeight, useHeadingTypography })

  const captured = useCapturedGen({
    gen: roll.gen,
    suspendAnimations,
    capture: (): CapturedRoll => ({
      ...roll,
      prevDigit: prevChar !== undefined && isDigitChar(prevChar) ? prevChar : digit,
    }),
  })

  return (
    <View
      style={[{ height: digitHeight, width: digitCellWidth, alignItems: 'center' }, AnimatedCharStyles.wrapperStyle]}
    >
      {captured === null ? (
        <Text
          accessible={false}
          allowFontScaling={false}
          style={[digitTextStyle, { color: charBaseColor }, DigitGlyphStyles.absolute]}
        >
          {digit}
        </Text>
      ) : (
        <DigitSlot
          baseColor={charBaseColor}
          delay={captured.delay}
          digit={digit}
          digitHeight={digitHeight}
          dir={captured.dir}
          flashColor={captured.flashColor}
          gen={captured.gen}
          prevDigit={captured.prevDigit}
          useHeadingTypography={useHeadingTypography}
          variantFont={variantFont}
        />
      )}
    </View>
  )
})
