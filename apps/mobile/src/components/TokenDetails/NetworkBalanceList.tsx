import { memo, useMemo } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

interface NetworkBalanceRowProps {
  balance: PortfolioBalance
  onSelectBalance: (balance: PortfolioBalance) => void
}

const NetworkBalanceRow = memo(function NetworkBalanceRow({
  balance,
  onSelectBalance,
}: NetworkBalanceRowProps): JSX.Element {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const { chainId } = balance.currencyInfo.currency
  const chainName = getChainInfo(chainId).label
  const fiatValue = convertFiatAmountFormatted(balance.balanceUSD, NumberType.FiatTokenDetails)
  const tokenAmount = `${formatNumberOrString({ value: balance.quantity, type: NumberType.TokenNonTx })} ${getSymbolDisplayText(balance.currencyInfo.currency.symbol)}`

  return (
    <TouchableArea testID={TestID.NetworkBalanceRow} onPress={() => onSelectBalance(balance)}>
      <Flex row alignItems="center" gap="$spacing12" py="$spacing8">
        <NetworkLogo borderRadius={borderRadii.rounded8} chainId={chainId} size={iconSizes.icon32} />
        <Text color="$neutral1" flex={1} numberOfLines={1} variant="body1">
          {chainName}
        </Text>
        <Flex alignItems="flex-end" gap="$spacing4">
          <Text color="$neutral1" variant="body1">
            {fiatValue}
          </Text>
          <Text color="$neutral2" variant="body2">
            {tokenAmount}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
})

interface NetworkBalanceListProps {
  balances: PortfolioBalance[]
  onSelectBalance: (balance: PortfolioBalance) => void
}

export function NetworkBalanceList({ balances, onSelectBalance }: NetworkBalanceListProps): JSX.Element {
  const sortedBalances = useMemo(
    () => [...balances].sort((a, b) => (b.balanceUSD ?? 0) - (a.balanceUSD ?? 0)),
    [balances],
  )

  return (
    <Flex gap="$spacing2">
      {sortedBalances.map((balance) => (
        <NetworkBalanceRow key={balance.id} balance={balance} onSelectBalance={onSelectBalance} />
      ))}
    </Flex>
  )
}
