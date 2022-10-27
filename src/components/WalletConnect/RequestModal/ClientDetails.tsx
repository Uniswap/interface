import React from 'react'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { Flex } from 'src/components/layout'
import { HeaderIcon } from 'src/components/WalletConnect/RequestModal/HeaderIcon'
import { HeaderText } from 'src/components/WalletConnect/RequestModal/HeaderText'
import { useCurrency } from 'src/features/tokens/useCurrency'
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
}) {
  const { dapp } = request

  const permitCurrency = useCurrency(permitInfo?.currencyId)

  return (
    <Flex centered gap="md">
      <Flex row alignItems="center" gap="md">
        <HeaderIcon dapp={dapp} permitCurrency={permitCurrency} />
      </Flex>
      <Flex centered gap="sm">
        <HeaderText
          permitAmount={permitInfo?.amount}
          permitCurrency={permitCurrency}
          request={request}
        />
        <LinkButton
          backgroundColor="accentActiveSoft"
          borderRadius="sm"
          color="blue300"
          iconColor="textSecondary"
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
