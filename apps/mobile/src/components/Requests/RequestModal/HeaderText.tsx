import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Trans } from 'react-i18next'
import { WalletConnectRequest } from 'src/features/walletConnect/walletConnectSlice'
import { Text } from 'ui/src'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { EthMethod, UwULinkMethod } from 'uniswap/src/types/walletConnect'

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

  const getReadableMethodName = (ethMethod: EthMethod | UwULinkMethod, dappNameOrUrl: string): JSX.Element => {
    switch (ethMethod) {
      case EthMethod.PersonalSign:
      case EthMethod.EthSign:
      case EthMethod.SignTypedData:
        return <Trans i18nKey="qrScanner.request.method.signature" values={{ dappNameOrUrl }} />
      case EthMethod.EthSendTransaction:
      case UwULinkMethod.Erc20Send:
        return <Trans i18nKey="qrScanner.request.method.transaction" values={{ dappNameOrUrl }} />
    }

    return <Trans i18nKey="qrScanner.request.method.default" values={{ dappNameOrUrl }} />
  }

  return (
    <Text textAlign="center" variant="heading3">
      {getReadableMethodName(method, dapp.name || dapp.url)}
    </Text>
  )
}
