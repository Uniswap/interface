import React from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useBridgeInfo } from 'src/components/TokenDetails/hooks'
import { useSingleBalance } from 'src/features/dataApi/balances'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { toSupportedChainId } from 'src/utils/chainId'
import { buildCurrencyId, CurrencyId } from 'src/utils/currencyId'
import { formatNumberBalance, formatPrice, formatUSDPrice } from 'src/utils/format'
import { getKeys } from 'src/utils/objects'

export function TokenBalances({ balance }: { balance: PortfolioBalance }) {
  const { t } = useTranslation()
  const { currency } = balance
  const bridgeInfo = useBridgeInfo(currency)

  return (
    <Flex bg="backgroundContainer" borderRadius="sm" gap="lg" mx="md" p="md">
      <TokenL1Balance balance={balance} />
      <Flex>
        <Text color="textSecondary" variant="subheadSmall">
          {t('Your balance on other chains')}
        </Text>
        {bridgeInfo &&
          getKeys(bridgeInfo).map((chainId) => {
            const bridgedTokenAddress = bridgeInfo[chainId]?.tokenAddress
            const supportedChainId = toSupportedChainId(String(chainId))
            if (!bridgedTokenAddress || !supportedChainId) return null
            return (
              <OtherChainBalance
                key={chainId}
                currencyId={buildCurrencyId(supportedChainId, bridgedTokenAddress)}
              />
            )
          })}
      </Flex>
    </Flex>
  )
}

export function TokenL1Balance({ balance }: { balance: PortfolioBalance }) {
  const { t } = useTranslation()
  const { currency } = balance

  return (
    <Flex gap="xs">
      <Text color="textSecondary" variant="subheadSmall">
        {t('Your balance')}
      </Text>
      <Flex row alignItems="center" justifyContent="space-between">
        <Text variant="headlineMedium">
          {`${formatNumberBalance(balance.quantity)}`} {currency.symbol}
        </Text>
        <Text variant="body">{formatUSDPrice(balance.balanceUSD)}</Text>
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
            {formatNumberBalance(balance.quantity)} {currency.symbol}
          </Text>
        </Flex>
      </Flex>
      <Text variant="body">{formatPrice(balance.balanceUSD)}</Text>
    </Flex>
  )
}
