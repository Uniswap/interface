import React from 'react'
import { HeaderText } from 'src/components/Requests/RequestModal/HeaderText'
import { WalletConnectSigningRequest } from 'src/features/walletConnect/walletConnectSlice'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { DappHeaderIcon } from 'wallet/src/components/dappRequests/DappHeaderIcon'
import { DappRequestHeader } from 'wallet/src/components/dappRequests/DappRequestHeader'

export interface PermitInfo {
  currencyId: string
  amount: number | undefined
}

export function ClientDetails({
  request,
  permitInfo,
}: {
  request: WalletConnectSigningRequest
  permitInfo?: PermitInfo
}): JSX.Element {
  const { dappRequestInfo } = request
  const permitCurrencyInfo = useCurrencyInfo(permitInfo?.currencyId)
  const headerIcon = <DappHeaderIcon dappInfo={dappRequestInfo} permitCurrencyInfo={permitCurrencyInfo} />
  const title = (
    <HeaderText permitAmount={permitInfo?.amount} permitCurrency={permitCurrencyInfo?.currency} request={request} />
  )

  return <DappRequestHeader dappInfo={dappRequestInfo} title={{ element: title }} headerIcon={headerIcon} />
}
