import { CharCell } from 'uniswap/src/components/AnimatedNumber/native/CharCell'
import type { ReanimatedNumberRenderProps } from 'uniswap/src/components/AnimatedNumber/native/types'
import { getAnimatedNumberCharKey } from 'uniswap/src/components/AnimatedNumber/utils/getAnimatedNumberCharKey'

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
>): JSX.Element => {
  return (
    <>
      {chars.map((_, index) => (
        <CharCell
          key={getAnimatedNumberCharKey({
            index,
            charsLength: chars.length,
            signColor: baseColor,
          })}
          baseColor={baseColor}
          chars={chars}
          currency={currency}
          decimalPartColor={decimalPartColor}
          delay={charDelays[index] ?? 0}
          digitCellWidth={digitCellWidth}
          digitHeight={digitHeight}
          index={index}
          reduceMotion={reduceMotion}
          shouldFadeDecimals={shouldFadeDecimals}
          shouldForceAnimate={charShouldAnimate[index] ?? false}
          tick={tick}
          useHeadingTypography={useHeadingTypography}
          variantFont={variantFont}
        />
      ))}
    </>
  )
}
