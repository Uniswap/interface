import { Currency } from '@kinetix/sdk-core'
import { TokenInfo } from '@kinetix/token-lists'

import AssetLogo, { AssetLogoBaseProps } from './AssetLogo'

export default function CurrencyLogo(
  props: AssetLogoBaseProps & {
    currency?: Currency | null
  }
) {
  return (
    <AssetLogo
      isNative={props.currency?.isNative}
      chainId={props.currency?.chainId}
      address={props.currency?.wrapped.address}
      symbol={props.symbol ?? props.currency?.symbol}
      backupImg={(props.currency as TokenInfo)?.logoURI}
      hideL2Icon={props.hideL2Icon ?? true}
      {...props}
    />
  )
}
