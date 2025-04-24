import { Currency } from '@taraswap/sdk-core'
import { TokenInfo } from '@uniswap/token-lists'
import AssetLogo from './AssetLogo'
import type { AssetLogoBaseProps } from './AssetLogo'

export default function CurrencyLogo(
  props: AssetLogoBaseProps & {
    currency?: Currency | null
    logoURI?: string
  }
) {
  return (
    <AssetLogo
      currency={props.currency}
      isNative={props.currency?.isNative}
      chainId={props.currency?.chainId}
      address={props.currency?.wrapped.address}
      symbol={props.symbol ?? props.currency?.symbol}
      primaryImg={props.logoURI || (props.currency as TokenInfo)?.logoURI}
      {...props}
    />
  )
}
