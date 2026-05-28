import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { TokenBalanceHeader } from 'src/components/TokenDetails/TokenBalanceHeader'
import { Flex, Separator, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { InlineNetworkPill } from 'uniswap/src/components/network/NetworkPill'
import { sortBalancesByValue } from 'uniswap/src/components/tokenDetails/utils'
import { AccountType } from 'uniswap/src/features/accounts/types'
import type { DataApiOutageProps } from 'uniswap/src/features/dataApi/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { CurrencyId } from 'uniswap/src/types/currency'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { useActiveAccount, useDisplayName } from 'wallet/src/features/wallet/hooks'

export function LegacyTokenBalances({
  currentChainBalance,
  otherChainBalances,
  isOutage,
  dataUpdatedAt,
}: {
  currentChainBalance: PortfolioBalance | null
  otherChainBalances: PortfolioBalance[] | null
} & DataApiOutageProps): JSX.Element {
  const { t } = useTranslation()
  const activeAccount = useActiveAccount()
  const displayName = useDisplayName(activeAccount?.address, { includeUnitagSuffix: true })?.name
  const isReadonly = activeAccount?.type === AccountType.Readonly

  const { preload, navigateWithPop } = useTokenDetailsNavigation()
  const navigateToCurrency = useCallback(
    (currencyId: CurrencyId) => {
      preload(currencyId)
      navigateWithPop(currencyId)
    },
    [navigateWithPop, preload],
  )

  const hasOtherChainBalances = Boolean(otherChainBalances && otherChainBalances.length > 0)
  const sortedOtherChainBalances = useMemo(
    () => (otherChainBalances ? sortBalancesByValue(otherChainBalances) : []),
    [otherChainBalances],
  )

  return (
    <Flex borderRadius="$rounded8" gap="$spacing24">
      {currentChainBalance && (
        <Flex gap="$spacing24">
          <Separator />
          <TokenBalanceHeader
            balance={currentChainBalance}
            displayName={displayName}
            isReadonly={isReadonly}
            isOutage={isOutage}
            dataUpdatedAt={dataUpdatedAt}
          />
        </Flex>
      )}
      {hasOtherChainBalances && otherChainBalances ? (
        <Flex gap="$spacing8">
          <Text color="$neutral2" variant="subheading2">
            {t('token.balances.other')}
          </Text>
          <Flex gap="$spacing12">
            {sortedOtherChainBalances.map((balance) => (
              <OtherChainBalance
                key={balance.currencyInfo.currency.chainId}
                balance={balance}
                navigate={navigateToCurrency}
              />
            ))}
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}

function OtherChainBalance({
  balance,
  navigate,
}: {
  balance: PortfolioBalance
  navigate: (currencyId: CurrencyId) => void
}): JSX.Element {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  return (
    <Trace logPress eventOnTrigger={MobileEventName.TokenDetailsOtherChainButtonPressed}>
      <TouchableArea onPress={(): void => navigate(balance.currencyInfo.currencyId)}>
        <Flex row alignItems="center" justifyContent="space-between">
          <Flex row alignItems="center" gap="$spacing4">
            <TokenLogo
              chainId={balance.currencyInfo.currency.chainId}
              name={balance.currencyInfo.currency.name}
              size={iconSizes.icon36}
              symbol={balance.currencyInfo.currency.symbol}
              url={balance.currencyInfo.logoUrl ?? undefined}
            />
            <Flex alignItems="flex-start">
              <Text px="$spacing4" variant="body1">
                {convertFiatAmountFormatted(balance.balanceUSD, NumberType.FiatTokenDetails)}
              </Text>
              <InlineNetworkPill
                chainId={balance.currencyInfo.currency.chainId}
                showBackgroundColor={false}
                textVariant="buttonLabel2"
                testID={`TokenDetailsChainPill_${balance.currencyInfo.currency.chainId}`}
              />
            </Flex>
          </Flex>
          <Text color="$neutral2" variant="body1">
            {formatNumberOrString({
              value: balance.quantity,
              type: NumberType.TokenNonTx,
            })}{' '}
            {getSymbolDisplayText(balance.currencyInfo.currency.symbol)}
          </Text>
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
