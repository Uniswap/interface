import type { AnimatedNumberProps } from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { ReanimatedNumber } from 'uniswap/src/components/AnimatedNumber/native/ReanimatedNumber'
import { StaticNumber } from 'uniswap/src/components/AnimatedNumber/native/StaticNumber'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'

const AnimatedNumber = (props: AnimatedNumberProps): JSX.Element => {
  const currency = useAppFiatCurrencyInfo()

  if (props.disableAnimations) {
    return (
      <StaticNumber
        color={props.color}
        containerTestID={props.containerTestID}
        currency={currency}
        shouldFadeDecimals={props.shouldFadeDecimals ?? false}
        textVariant={props.textVariant}
        value={props.value}
      />
    )
  }

  return <ReanimatedNumber {...props} currency={currency} />
}

export default AnimatedNumber
