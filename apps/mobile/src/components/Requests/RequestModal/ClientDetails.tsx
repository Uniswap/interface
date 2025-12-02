import React from 'react'
import { DappHeaderIcon } from 'src/components/Requests/DappHeaderIcon'
import { HeaderText } from 'src/components/Requests/RequestModal/HeaderText'
import { WalletConnectSigningRequest } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { formatDappURL } from 'utilities/src/format/urls'
import { LinkButton } from 'wallet/src/components/buttons/LinkButton'

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
  const colors = useSporeColors()

  const permitCurrencyInfo = useCurrencyInfo(permitInfo?.currencyId)

  return (
    <Flex centered gap="$spacing12">
      <DappHeaderIcon dappRequestInfo={dappRequestInfo} permitCurrencyInfo={permitCurrencyInfo} />
      <HeaderText permitAmount={permitInfo?.amount} permitCurrency={permitCurrencyInfo?.currency} request={request} />
      <LinkButton
        color={colors.accent1.val}
        iconColor="$accent1"
        label={formatDappURL(dappRequestInfo.url)}
        mb="$spacing12"
        px="$spacing8"
        py="$spacing4"
        showIcon={false}
        size={iconSizes.icon12}
        textVariant="buttonLabel2"
        url={dappRequestInfo.url}
      />
    </Flex>
  )
}
