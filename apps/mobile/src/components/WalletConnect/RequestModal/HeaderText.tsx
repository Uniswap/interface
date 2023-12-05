import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { truncateDappName } from 'src/components/WalletConnect/ScanSheet/util'
import { WalletConnectRequest } from 'src/features/walletConnect/walletConnectSlice'
import { Text } from 'ui/src'
import { EthMethod } from 'wallet/src/features/walletConnect/types'
import { getCurrencyAmount, ValueType } from 'wallet/src/utils/getCurrencyAmount'

export function HeaderText({
  request,
  permitAmount,
  permitCurrency,
}: {
  request: WalletConnectRequest
  permitAmount?: number
  permitCurrency?: Currency | null
}): JSX.Element {
  const { t } = useTranslation()
  const { dapp, type: method } = request

  if (permitCurrency) {
    const readablePermitAmount = getCurrencyAmount({
      value: permitAmount?.toString(),
      valueType: ValueType.Raw,
      currency: permitCurrency,
    })?.toExact()

    return readablePermitAmount ? (
      <Trans t={t}>
        <Text textAlign="center" variant="heading3">
          Allow {dapp.name} to use up to
          <Text fontWeight="bold"> {readablePermitAmount} </Text>
          {permitCurrency?.symbol}?
        </Text>
      </Trans>
    ) : (
      <Trans t={t}>
        <Text textAlign="center" variant="heading3">
          Allow <Text fontWeight="bold">{dapp.name}</Text> to use your {permitCurrency?.symbol}?
        </Text>
      </Trans>
    )
  }

  const getReadableMethodName = (ethMethod: EthMethod): string => {
    switch (ethMethod) {
      case EthMethod.PersonalSign:
      case EthMethod.EthSign:
      case EthMethod.SignTypedData:
        return t('Signature request from')
      case EthMethod.EthSendTransaction:
        return t('Transaction request from')
    }

    return t('Request from')
  }

  return (
    <Text textAlign="center" variant="heading3">
      <Text>{getReadableMethodName(method)}</Text>
      <Text fontWeight="bold"> {truncateDappName(dapp.name || dapp.url)}</Text>
    </Text>
  )
}
