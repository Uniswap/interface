import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Text } from 'src/components/Text'
import { EthMethod } from 'src/features/walletConnect/types'
import { WalletConnectRequest } from 'src/features/walletConnect/walletConnectSlice'
import { tryParseRawAmount } from 'src/utils/tryParseAmount'

export function HeaderText({
  request,
  permitAmount,
  permitCurrency,
}: {
  request: WalletConnectRequest
  permitAmount?: number
  permitCurrency?: Currency | null
}) {
  const { t } = useTranslation()
  const { dapp, type: method } = request

  if (permitCurrency) {
    const readablePermitAmount = tryParseRawAmount(
      permitAmount?.toString(),
      permitCurrency
    )?.toExact()

    return readablePermitAmount ? (
      <Trans t={t}>
        <Text textAlign="center" variant="h3">
          Allow {dapp.name} to use up to
          <Text fontWeight="bold"> {readablePermitAmount} </Text>
          {permitCurrency?.name}?
        </Text>
      </Trans>
    ) : (
      <Trans t={t}>
        <Text textAlign="center" variant="h3">
          Allow <Text fontWeight="bold">{dapp.name}</Text> to use your {permitCurrency?.name}?
        </Text>
      </Trans>
    )
  }

  const getReadableMethodName = (ethMethod: EthMethod) => {
    switch (ethMethod) {
      case EthMethod.PersonalSign:
      case EthMethod.EthSign:
      case EthMethod.SignTypedData:
        return t('Signature request from')
      case EthMethod.EthSendTransaction:
      case EthMethod.EthSignTransaction:
        return t('Transaction request from')
    }

    return t('Request from')
  }

  return (
    <>
      <Text variant="h3">{getReadableMethodName(method)}</Text>
      <Text fontWeight="bold" textAlign="center" variant="h3">
        {dapp.name}
      </Text>
    </>
  )
}
