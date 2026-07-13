import { useQuery } from '@tanstack/react-query'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, SpaceTokens, Text, TouchableArea } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { getListEarnPositionsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/earn'
import { EARN_SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/earn/constants'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnPositionInfo, getEarnVaultInfo, hasEarnPosition } from 'uniswap/src/features/earn/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { NumberType } from 'utilities/src/format/types'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'

type EarningEntry = {
  vault: EarnVaultInfo
  position: EarnPositionInfo
  depositedUsd: number
  underlyingAmountRaw: string
}

export function HomeScreenEarningSection({
  evmAddress,
  mt,
  mx,
}: {
  evmAddress: Address
  /** Optional margin-top, applied only when the section renders content. */
  mt?: SpaceTokens
  /** Optional horizontal margin, applied only when the section renders content. */
  mx?: SpaceTokens
}): JSX.Element | null {
  const isEarnEnabled = useFeatureFlag(FeatureFlags.Earn)

  const positionsQuery = useQuery(
    getListEarnPositionsQueryOptions({
      params: isEarnEnabled ? { walletAddress: evmAddress, chainIds: EARN_SUPPORTED_CHAIN_IDS } : undefined,
      enabled: isEarnEnabled,
    }),
  )

  const entries = useMemo<EarningEntry[]>(() => {
    const acc: EarningEntry[] = []
    if (positionsQuery.isPlaceholderData) {
      return acc
    }
    positionsQuery.data?.positions.forEach((plainPosition) => {
      if (!plainPosition.vault) {
        return
      }
      const vault = getEarnVaultInfo(plainPosition.vault)
      const position = getEarnPositionInfo(plainPosition)
      if (!vault || !position || !hasEarnPosition(position)) {
        return
      }
      acc.push({ vault, position, depositedUsd: position.depositedUsd, underlyingAmountRaw: position.depositedRaw })
    })
    return acc
  }, [positionsQuery.data?.positions, positionsQuery.isPlaceholderData])

  if (!isEarnEnabled || entries.length === 0) {
    return null
  }

  return <EarningCard entries={entries} mt={mt} mx={mx} />
}

function EarningCard({
  entries,
  mt,
  mx,
}: {
  entries: EarningEntry[]
  mt?: SpaceTokens
  mx?: SpaceTokens
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent, convertFiatAmountFormatted } = useLocalizationContext()
  const { navigateToEarnVault } = useWalletNavigation()
  const [isExpanded, setIsExpanded] = useState(false)

  const { totalUsd, weightedApy } = useMemo(() => {
    let total = 0
    let weighted = 0
    entries.forEach(({ depositedUsd, vault }) => {
      total += depositedUsd
      weighted += depositedUsd * vault.apyPercent
    })
    return { totalUsd: total, weightedApy: total > 0 ? weighted / total : 0 }
  }, [entries])

  const toggleExpanded = (): void => setIsExpanded((prev) => !prev)

  return (
    <Flex
      mt={mt}
      mx={mx}
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded20"
      backgroundColor="$surface1"
      gap="$spacing12"
      px="$spacing16"
      py="$spacing12"
    >
      <TouchableArea onPress={toggleExpanded}>
        <Flex row alignItems="center" gap="$spacing8">
          <Text variant="body2" color="$neutral1">
            {t('home.earning.title')}
          </Text>
          <Flex fill row alignItems="center" justifyContent="flex-end" gap="$spacing8">
            {!isExpanded && (
              <Text variant="body2" color="$neutral1" numberOfLines={1}>
                {convertFiatAmountFormatted(totalUsd, NumberType.FiatTokenDetails)}
                {' • '}
                <Text variant="body2" color="$accent1">
                  {t('explore.earn.apy', { apy: formatPercent(weightedApy) })}
                </Text>
              </Text>
            )}
            {isExpanded ? (
              <ChevronsIn color="$neutral2" size={iconSizes.icon20} />
            ) : (
              <ChevronsOut color="$neutral2" size={iconSizes.icon20} />
            )}
          </Flex>
        </Flex>
      </TouchableArea>

      {isExpanded && (
        <Flex gap="$spacing12">
          {entries.map((entry) => (
            <EarningRow key={entry.vault.id} entry={entry} onSelect={navigateToEarnVault} />
          ))}
        </Flex>
      )}
    </Flex>
  )
}

const EarningRow = memo(function EarningRow({
  entry,
  onSelect,
}: {
  entry: EarningEntry
  onSelect: (args: { vault: EarnVaultInfo; position: EarnPositionInfo }) => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent, convertFiatAmountFormatted, formatCurrencyAmount } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(entry.vault.displayCurrencyId)
  const currency = currencyInfo?.currency

  const tokenAmount = useMemo(
    () => getCurrencyAmount({ value: entry.underlyingAmountRaw, valueType: ValueType.Raw, currency }),
    [entry.underlyingAmountRaw, currency],
  )

  const tokenAmountLabel = tokenAmount
    ? `${formatCurrencyAmount({ value: tokenAmount, type: NumberType.TokenNonTx })} ${currency?.symbol ?? ''}`.trim()
    : undefined

  const handlePress = useCallback(
    () => onSelect({ vault: entry.vault, position: entry.position }),
    [onSelect, entry.vault, entry.position],
  )

  return (
    <TouchableArea onPress={handlePress}>
      <Flex row alignItems="center" gap="$spacing12">
        <TokenLogo
          hideNetworkLogo
          url={currencyInfo?.logoUrl}
          chainId={currency?.chainId}
          symbol={currency?.symbol}
          name={currency?.name}
        />
        <Flex fill minWidth={0}>
          <Text variant="body2" color="$neutral1" numberOfLines={1}>
            {currency?.name ?? currency?.symbol ?? '-'}
          </Text>
          {tokenAmountLabel && (
            <Text variant="body3" color="$neutral2" numberOfLines={1}>
              {tokenAmountLabel}
            </Text>
          )}
        </Flex>
        <Flex alignItems="flex-end">
          <Text variant="body2" color="$neutral1">
            {convertFiatAmountFormatted(entry.depositedUsd, NumberType.FiatTokenDetails)}
          </Text>
          <Text variant="body3" color="$accent1">
            {t('explore.earn.apy', { apy: formatPercent(entry.vault.apyPercent) })}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
})
