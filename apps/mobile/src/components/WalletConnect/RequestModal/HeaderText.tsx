import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Trans } from 'react-i18next'
import { truncateDappName } from 'src/components/WalletConnect/ScanSheet/util'
import { WalletConnectRequest } from 'src/features/walletConnect/walletConnectSlice'
import { Text } from 'ui/src'
import { EthMethod } from 'wallet/src/features/walletConnect/types'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

export function HeaderText({
  request,
  permitAmount,
  permitCurrency,
}: {
  request: WalletConnectRequest
  permitAmount?: number
  permitCurrency?: Currency | null
}): JSX.Element {
  const { dapp, type: method } = request

  if (permitCurrency) {
    const readablePermitAmount = getCurrencyAmount({
      value: permitAmount?.toString(),
      valueType: ValueType.Raw,
      currency: permitCurrency,
    })?.toExact()

    return readablePermitAmount ? (
      <Text textAlign="center" variant="heading3">
        <Trans i18nKey="qrScanner.request.withAmount">
          Allow {{ dappName: dapp.name }} to use up to
          <Text fontWeight="bold"> {{ amount: readablePermitAmount }} </Text>
          {{ currencySymbol: permitCurrency?.symbol }}?
        </Trans>
      </Text>
    ) : (
      <Text textAlign="center" variant="heading3">
        <Trans i18nKey="qrScanner.request.withoutAmount">
          Allow <Text fontWeight="bold">{{ dappName: dapp.name }}</Text> to use your
          {{ currencySymbol: permitCurrency?.symbol }}?
        </Trans>
      </Text>
    )
  }

  const getReadableMethodName = (ethMethod: EthMethod, dappNameOrUrl: string): JSX.Element => {
    switch (ethMethod) {
      case EthMethod.PersonalSign:
      case EthMethod.EthSign:
      case EthMethod.SignTypedData:
        return (
          <Trans i18nKey="qrScanner.request.method.signature">
            Signature request from
            <Text fontWeight="bold">{{ dappNameOrUrl }}</Text>
          </Trans>
        )
      case EthMethod.EthSendTransaction:
        return (
          <Trans i18nKey="qrScanner.request.method.transaction">
            Transaction request from
            <Text fontWeight="bold">{{ dappNameOrUrl }}</Text>
          </Trans>
        )
    }

    return (
      <Trans i18nKey="qrScanner.request.method.default">
        Request from
        <Text fontWeight="bold">{{ dappNameOrUrl }}</Text>
      </Trans>
    )
  }

  return (
    <Text textAlign="center" variant="heading3">
      {getReadableMethodName(method, truncateDappName(dapp.name || dapp.url))}
    </Text>
  )
}
