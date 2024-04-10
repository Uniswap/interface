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
        <Trans
          // `variant` prop must be first
          // eslint-disable-next-line react/jsx-sort-props
          components={{ highlight: <Text variant="heading3" fontWeight="bold" /> }}
          i18nKey="qrScanner.request.withAmount"
          values={{
            dappName: dapp.name,
            currencySymbol: permitCurrency?.symbol,
            amount: readablePermitAmount,
          }}
        />
      </Text>
    ) : (
      <Text textAlign="center" variant="heading3">
        <Trans
          // `variant` prop must be first
          // eslint-disable-next-line react/jsx-sort-props
          components={{ highlight: <Text variant="heading3" fontWeight="bold" /> }}
          i18nKey="qrScanner.request.withoutAmount"
          values={{
            dappName: dapp.name,
            currencySymbol: permitCurrency?.symbol,
          }}
        />
      </Text>
    )
  }

  const getReadableMethodName = (ethMethod: EthMethod, dappNameOrUrl: string): JSX.Element => {
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

  return (
    <Text textAlign="center" variant="heading3">
      {getReadableMethodName(method, truncateDappName(dapp.name || dapp.url))}
    </Text>
  )
}
