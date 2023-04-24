import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Flex } from 'src/components/layout'
import { DappHeaderIcon } from 'src/components/WalletConnect/DappHeaderIcon'
import { HeaderText } from 'src/components/WalletConnect/RequestModal/HeaderText'
import { useCurrencyInfo } from 'src/features/tokens/useCurrencyInfo'
import { WalletConnectRequest } from 'src/features/walletConnect/walletConnectSlice'

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
  const theme = useAppTheme()

  const permitCurrencyInfo = useCurrencyInfo(permitInfo?.currencyId)

  return (
    <Flex centered gap="spacing16">
      <DappHeaderIcon dapp={dapp} permitCurrencyInfo={permitCurrencyInfo} />
      <Flex centered gap="spacing16">
        <HeaderText
          permitAmount={permitInfo?.amount}
          permitCurrency={permitCurrencyInfo?.currency}
          request={request}
        />
        <LinkButton
          backgroundColor="background2"
          borderRadius="rounded16"
          color={theme.colors.accentActive}
          iconColor={theme.colors.accentActive}
          label={dapp.url}
          mb="spacing12"
          px="spacing8"
          py="spacing4"
          size={theme.iconSizes.icon12}
          textVariant="buttonLabelMicro"
          url={dapp.url}
        />
      </Flex>
    </Flex>
  )
}
