import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Flex } from 'src/components/layout'
import { HeaderIcon } from 'src/components/WalletConnect/RequestModal/HeaderIcon'
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
    <Flex centered gap="md">
      <HeaderIcon dapp={dapp} permitCurrencyInfo={permitCurrencyInfo} />
      <Flex centered gap="sm">
        <HeaderText
          permitAmount={permitInfo?.amount}
          permitCurrency={permitCurrencyInfo?.currency}
          request={request}
        />
        <LinkButton
          backgroundColor="accentActiveSoft"
          borderRadius="sm"
          color={theme.colors.accentActive}
          iconColor={theme.colors.textSecondary}
          label={dapp.url}
          mt="xs"
          px="xs"
          py="xxs"
          textVariant="bodyMicro"
          url={dapp.url}
        />
      </Flex>
    </Flex>
  )
}
