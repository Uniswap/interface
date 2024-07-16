import React from 'react'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { DappHeaderIcon } from 'src/components/Requests/DappHeaderIcon'
import { HeaderText } from 'src/components/Requests/RequestModal/HeaderText'
import { WalletConnectRequest } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { formatDappURL } from 'utilities/src/format/urls'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'

export interface PermitInfo {
  currencyId: string
  amount: number | undefined
}

export function ClientDetails({
  request,
  permitInfo,
}: {
  request: WalletConnectRequest
  permitInfo?: PermitInfo
}): JSX.Element {
  const { dapp } = request
  const colors = useSporeColors()

  const permitCurrencyInfo = useCurrencyInfo(permitInfo?.currencyId)

  return (
    <Flex centered gap="$spacing12">
      <DappHeaderIcon dapp={dapp} permitCurrencyInfo={permitCurrencyInfo} />
      <HeaderText permitAmount={permitInfo?.amount} permitCurrency={permitCurrencyInfo?.currency} request={request} />
      <LinkButton
        color={colors.accent1.val}
        iconColor={colors.accent1.val}
        label={formatDappURL(dapp.url)}
        mb="$spacing12"
        px="$spacing8"
        py="$spacing4"
        showIcon={false}
        size={iconSizes.icon12}
        textVariant="buttonLabel4"
        url={dapp.url}
      />
    </Flex>
  )
}
