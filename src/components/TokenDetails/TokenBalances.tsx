import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useSingleBalance } from 'src/features/dataApi/balances'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { WrappedTokenInfo } from 'src/features/tokenLists/wrappedTokenInfo'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { useTokenInfoFromAddress } from 'src/features/tokens/useTokenInfoFromAddress'
import { buildCurrencyId, CurrencyId } from 'src/utils/currencyId'
import { formatCurrencyAmount, formatPrice, formatUSDPrice } from 'src/utils/format'
import { getKeys } from 'src/utils/objects'

export function TokenBalances({ balance }: { balance: PortfolioBalance }) {
  const { t } = useTranslation()
  const currency = balance.amount.currency
  const nativeWrappedCurrency = useTokenInfoFromAddress(
    currency.chainId,
    currency.isNative ? buildCurrencyId(currency.chainId, currency.wrapped.address) : undefined
  )

  const bridgeInfo = useMemo(
    () =>
      currency instanceof WrappedTokenInfo
        ? currency.bridgeInfo
        : nativeWrappedCurrency instanceof WrappedTokenInfo
        ? nativeWrappedCurrency.bridgeInfo
        : null,
    [currency, nativeWrappedCurrency]
  )

  return (
    <Flex bg="backgroundContainer" borderRadius="sm" gap="lg" mx="md" p="md">
      <Flex>
        <Text color="textSecondary" variant="subheadSmall">
          {t('Your balance')}
        </Text>

        <Flex row alignItems="center" justifyContent="space-between">
          <Text variant="headlineSmall">
            {`${formatCurrencyAmount(balance.amount)}`} {currency.symbol}
          </Text>
          <Text variant="body">{formatUSDPrice(balance.balanceUSD)}</Text>
        </Flex>
      </Flex>

      <Flex>
        <Text color="textSecondary" variant="subheadSmall">
          {t('Your balance on other chains')}
        </Text>
        {bridgeInfo &&
          getKeys(bridgeInfo).map((chainId) => {
            const bridgedTokenAddress = bridgeInfo[chainId]?.tokenAddress
            if (!bridgedTokenAddress) return null
            return <OtherChainBalance currencyId={buildCurrencyId(chainId, bridgedTokenAddress)} />
          })}
      </Flex>
    </Flex>
  )
}

function OtherChainBalance({ currencyId: _currencyId }: { currencyId: CurrencyId }) {
  const currency = useCurrency(_currencyId)
  const balance = useSingleBalance(currency)

  if (!currency || !balance) return null

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex row alignItems="center">
        <CurrencyLogo currency={currency} />
        <Flex alignItems="center">
          <Text variant="body">
            {formatCurrencyAmount(balance.amount)} {currency.symbol}
          </Text>
        </Flex>
      </Flex>
      <Text variant="body">{formatPrice(balance.balanceUSD)}</Text>
    </Flex>
  )
}
