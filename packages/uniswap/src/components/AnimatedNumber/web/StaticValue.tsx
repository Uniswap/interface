import { type ResolvedFontStyle, Text, type TextVariantKey } from '@universe/mycelium'
import { isDigitChar } from 'uniswap/src/components/AnimatedNumber/utils/computeCharsSizes'
import { getAnimatedNumberCharKey } from 'uniswap/src/components/AnimatedNumber/utils/getAnimatedNumberCharKey'
import { getCharDisplayColor } from 'uniswap/src/components/AnimatedNumber/utils/getCharDisplayColor'
import { getDigitCellWidth, getDigitTextStyle } from 'uniswap/src/components/AnimatedNumber/web/digitTextStyle'
import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'

/**
 * Two native selections are wrong for a number: double-click stops at the `$` or the suffix, and triple-click
 * adds a trailing newline. Select exactly the value instead. Drags are left entirely native, so any part of the
 * value can still be selected.
 */
function selectWholeValue(event: React.MouseEvent<HTMLElement>): void {
  window.getSelection()?.selectAllChildren(event.currentTarget)
}

function selectWholeValueOnTripleClick(event: React.MouseEvent<HTMLElement>): void {
  if (event.detail === 3) {
    selectWholeValue(event)
  }
}

/**
 * The value as ordinary inline text, shown whenever the number is not rolling so selection, copy and
 * double-click are the browser's own. Digits and punctuation get the same widths, fonts and colors as the
 * rolling cells (`CharCell`), so swapping between the two never moves anything. While a roll plays it is only
 * made invisible, not removed, so a selection or a copy made mid-roll still gets the real value.
 */
export function StaticValue({
  chars,
  currency,
  commonPrefixLength,
  nextColor,
  baseColor,
  decimalPartColor,
  shouldFadeDecimals,
  reduceMotion,
  digitHeight,
  textVariantKey,
  variantFont,
  maxDigitWidthScaled,
  isInvisible,
}: {
  chars: string[]
  currency: FiatCurrencyInfo
  commonPrefixLength: number
  nextColor?: string
  baseColor: string
  decimalPartColor: string
  shouldFadeDecimals: boolean
  reduceMotion: boolean
  digitHeight: number
  textVariantKey: TextVariantKey
  variantFont: ResolvedFontStyle
  maxDigitWidthScaled: number
  isInvisible: boolean
}): JSX.Element {
  const digitWidth = getDigitCellWidth(maxDigitWidthScaled)
  const transition = reduceMotion ? 'none' : 'color 250ms ease'
  return (
    <span
      style={{ height: digitHeight, whiteSpace: 'pre', opacity: isInvisible ? 0 : 1 }}
      onClick={selectWholeValueOnTripleClick}
      onDoubleClick={selectWholeValue}
    >
      {chars.map((char, index) => {
        const key = getAnimatedNumberCharKey({ index, charsLength: chars.length, signColor: baseColor })
        const color = getCharDisplayColor({
          index,
          chars,
          decimalSeparator: currency.decimalSeparator,
          shouldFadeDecimals,
          commonPrefixLength,
          nextColor,
          neutral1Color: baseColor,
          fadedDecimalColor: decimalPartColor,
        })
        return isDigitChar(char) ? (
          <span
            key={key}
            style={{
              display: 'inline-block',
              verticalAlign: 'top',
              width: digitWidth,
              textAlign: 'center',
              ...getDigitTextStyle({ variantFont, digitHeight }),
              color,
              transition,
            }}
          >
            {char}
          </span>
        ) : (
          <Text
            key={key}
            allowFontScaling={false}
            variant={textVariantKey}
            style={{ color, height: digitHeight, display: 'inline-block', verticalAlign: 'top', transition }}
          >
            {char}
          </Text>
        )
      })}
    </span>
  )
}
