import { Currency } from '@pollum-io/sdk-core'
import { TokenInfo } from '@uniswap/token-lists'
import { useMemo } from 'react'

import AssetLogo, { AssetLogoBaseProps } from './AssetLogo'

export default function CurrencyLogo(
  props: AssetLogoBaseProps & {
    currency?: Currency | null
  }
) {
  const address = useMemo(() => {
    if (props.currency && 'address' in props.currency) {
      return props.currency.address
    } else {
      return props.currency?.wrapped.address
    }
  }, [props.currency])

  return (
    <AssetLogo
      isNative={props.currency?.isNative}
      chainId={props.currency?.chainId}
      address={address}
      symbol={props.symbol ?? props.currency?.symbol}
      backupImg={(props.currency as TokenInfo)?.logoURI}
      hideL2Icon={props.hideL2Icon ?? true}
      {...props}
    />
  )
}
