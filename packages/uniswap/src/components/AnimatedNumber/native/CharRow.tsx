import { CharCell } from 'uniswap/src/components/AnimatedNumber/native/CharCell'
import type { ReanimatedNumberRenderProps } from 'uniswap/src/components/AnimatedNumber/native/types'
import { getAnimatedNumberCharKey } from 'uniswap/src/components/AnimatedNumber/utils/getAnimatedNumberCharKey'

export const CharRow = ({
  baseColor,
  chars,
  commonPrefixLength,
  currency,
  decimalPartColor,
  digitCellWidth,
  digitHeight,
  balanceChangeColor,
  shouldFadeDecimals,
  useHeadingTypography,
  variantFont,
  dir,
  charDelays,
  charShouldAnimate,
  animateGen,
  reduceMotion,
}: Pick<
  ReanimatedNumberRenderProps,
  | 'baseColor'
  | 'chars'
  | 'commonPrefixLength'
  | 'currency'
  | 'decimalPartColor'
  | 'digitCellWidth'
  | 'digitHeight'
  | 'balanceChangeColor'
  | 'shouldFadeDecimals'
  | 'useHeadingTypography'
  | 'variantFont'
  | 'dir'
  | 'charDelays'
  | 'charShouldAnimate'
  | 'animateGen'
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
          animateGen={animateGen}
          baseColor={baseColor}
          chars={chars}
          commonPrefixLength={commonPrefixLength}
          currency={currency}
          decimalPartColor={decimalPartColor}
          delay={charDelays[index] ?? 0}
          digitCellWidth={digitCellWidth}
          digitHeight={digitHeight}
          dir={dir}
          index={index}
          nextColor={balanceChangeColor}
          reduceMotion={reduceMotion}
          shouldFadeDecimals={shouldFadeDecimals}
          shouldForceAnimate={charShouldAnimate[index] ?? false}
          useHeadingTypography={useHeadingTypography}
          variantFont={variantFont}
        />
      ))}
    </>
  )
}
