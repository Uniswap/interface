import { Currency } from '@uniswap/sdk-core'
import { CurrencyLogo as UniverseCurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { AssetLogoBaseProps } from '~/components/Logo/AssetLogo'

export function CurrencyLogo(
  props: AssetLogoBaseProps & {
    currency?: Currency | null
  },
) {
  const { currency, ...rest } = props

  if (!currency) {
    return null
  }

  return <CurrencyLogoInner currency={currency} {...rest} />
}

const CurrencyLogoInner = (
  props: AssetLogoBaseProps & {
    currency: Currency
  },
) => {
  const currencyId = buildCurrencyId(props.currency.chainId, currencyAddress(props.currency))
  const currencyInfo = useCurrencyInfo(currencyId)
  return <UniverseCurrencyLogo currencyInfo={currencyInfo} {...props} />
}
