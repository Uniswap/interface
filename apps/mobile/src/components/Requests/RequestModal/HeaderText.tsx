import { Currency } from '@uniswap/sdk-core'
import { Text } from '@universe/mycelium'
import React from 'react'
import { Trans } from 'react-i18next'
import { WalletConnectSigningRequest } from 'src/features/walletConnect/walletConnectSlice'
import { EthMethod, WalletConnectEthMethod } from 'uniswap/src/features/dappRequests/types'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'

export function HeaderText({
  request,
  permitAmount,
  permitCurrency,
}: {
  request: WalletConnectSigningRequest
  permitAmount?: number
  permitCurrency?: Currency | null
}): JSX.Element {
  const { dappRequestInfo, type: method } = request

  if (permitCurrency) {
    const readablePermitAmount = getCurrencyAmount({
      value: permitAmount?.toString(),
      valueType: ValueType.Raw,
      currency: permitCurrency,
    })?.toExact()

    return readablePermitAmount ? (
      <Text variant="heading3">
        <Trans
          // `variant` prop must be first
          components={{ highlight: <Text variant="heading3" fontWeight="bold" /> }}
          i18nKey="qrScanner.request.withAmount"
          values={{
            dappName: dappRequestInfo.name,
            currencySymbol: permitCurrency.symbol,
            amount: readablePermitAmount,
          }}
        />
      </Text>
    ) : (
      <Text variant="heading3">
        <Trans
          // `variant` prop must be first
          components={{ highlight: <Text variant="heading3" fontWeight="bold" /> }}
          i18nKey="qrScanner.request.withoutAmount"
          values={{
            dappName: dappRequestInfo.name,
            currencySymbol: permitCurrency.symbol,
          }}
        />
      </Text>
    )
  }

  const getReadableMethodName = (ethMethod: WalletConnectEthMethod, dappNameOrUrl: string): JSX.Element => {
    switch (ethMethod) {
      case EthMethod.PersonalSign:
      case EthMethod.EthSign:
      case EthMethod.SignTypedData:
        return <Trans i18nKey="qrScanner.request.method.signature" values={{ dappNameOrUrl }} />
      case EthMethod.EthSendTransaction:
        return <Trans i18nKey="qrScanner.request.method.transaction" values={{ dappNameOrUrl }} />
    }

    return <Trans i18nKey="qrScanner.request.method.default" values={{ dappNameOrUrl }} />
  }

  return <Text variant="subheading1">{getReadableMethodName(method, dappRequestInfo.name || dappRequestInfo.url)}</Text>
}
