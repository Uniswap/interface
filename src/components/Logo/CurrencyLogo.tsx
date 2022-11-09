import { Currency } from '@uniswap/sdk-core'

import { AssetLogo, AssetLogoBaseProps } from './AssetLogo'

export function CurrencyLogo(
  props: AssetLogoBaseProps & {
    currency?: Currency | null
  }
) {
  return (
    <AssetLogo
      isNative={props.currency?.isNative}
      chainId={props.currency?.chainId}
      address={props.currency?.wrapped.address}
      {...props}
    />
  )
}
