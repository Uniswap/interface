import { UniverseChainId, chainIdToPlatform } from '@universe/chains'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import type { IconProps } from '@universe/mycelium/icons'
import { ChartBar } from '@universe/mycelium/icons/ChartBar'
import { ChartPie } from '@universe/mycelium/icons/ChartPie'
import { ChartPyramid } from '@universe/mycelium/icons/ChartPyramid'
import { GlobeFilled } from '@universe/mycelium/icons/GlobeFilled'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import { Pools } from '@universe/mycelium/icons/Pools'
import { TrendDown } from '@universe/mycelium/icons/TrendDown'
import { TrendUp } from '@universe/mycelium/icons/TrendUp'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { StatsRow } from 'src/components/TokenDetails/TokenDetailsStats/StatsRow'
import { StatValue } from 'src/components/TokenDetails/TokenDetailsStats/StatValue'
import { TvlBreakdownModal } from 'src/components/TokenDetails/TokenDetailsStats/TvlBreakdownModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { NetworkPile } from 'uniswap/src/components/network/NetworkPile/NetworkPile'
import { selectHasViewedContractAddressExplainer } from 'uniswap/src/features/behaviorHistory/selectors'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { getTokenTvlBreakdown } from 'uniswap/src/features/dataApi/tokenDetails/tokenMarketStatsUtils'
import { useTokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isDefaultNativeAddress } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

export const TokenDetailsMarketData = memo(function TokenDetailsMarketDataInner(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const defaultTokenColor = colors.neutral3.get()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const {
    address,
    currencyId,
    chainId,
    tokenColor,
    openContractAddressExplainerModal,
    openMultichainAddressSheet,
    copyAddressToClipboard,
    initialIsMultichainAsset,
    multichainTokens,
    hasMultichainAddresses,
    currencyInfo,
  } = useTokenDetailsContext()
  const hasViewedContractAddressExplainer = useSelector(selectHasViewedContractAddressExplainer)
  const [showVolumeInfo, setShowVolumeInfo] = useState(false)
  const [showTvlBreakdown, setShowTvlBreakdown] = useState(false)
  const openTvlBreakdown = useCallback((): void => setShowTvlBreakdown(true), [])
  const closeTvlBreakdown = useCallback((): void => setShowTvlBreakdown(false), [])

  const networkChainIds = useMemo((): UniverseChainId[] => {
    if (!hasMultichainAddresses) {
      return [chainId]
    }
    return multichainTokens.map((token) => token.chainId)
  }, [hasMultichainAddresses, multichainTokens, chainId])

  const singleNetworkChainId = networkChainIds.length === 1 ? networkChainIds[0] : undefined

  const hasCopyableContractAddress = useMemo(() => {
    if (isDefaultNativeAddress({ address, platform: chainIdToPlatform(chainId) })) {
      return false
    }
    return Boolean(address)
  }, [address, chainId])

  const onMultichainNetworksRowPress = useCallback((): void => {
    if (!address) {
      return
    }
    if (!hasViewedContractAddressExplainer) {
      openContractAddressExplainerModal()
      return
    }
    if (hasMultichainAddresses) {
      openMultichainAddressSheet()
      return
    }
    void copyAddressToClipboard(address)
  }, [
    copyAddressToClipboard,
    hasViewedContractAddressExplainer,
    openContractAddressExplainerModal,
    openMultichainAddressSheet,
    address,
    hasMultichainAddresses,
  ])

  const {
    marketCap,
    fdv,
    volume,
    high52w,
    low52w,
    tvl,
    poolsTvl,
    isLoading: isStatsLoading,
  } = useTokenMarketStats(currencyId, {
    isMultichainAggregateView: initialIsMultichainAsset || hasMultichainAddresses,
  })
  const tvlBreakdown = getTokenTvlBreakdown({ tvl, poolsTvl })

  const hasLimitedVolumeData = chainId === UniverseChainId.Tempo

  const maybeLimitedVolumeDataInfoIcon = useMemo(() => {
    return hasLimitedVolumeData ? (
      <TouchableArea hitSlop={8} onPress={(): void => setShowVolumeInfo(true)}>
        <InfoCircleFilled color="$neutral3" size="$icon.16" />
      </TouchableArea>
    ) : undefined
  }, [hasLimitedVolumeData])

  return (
    <Flex gap="$spacing8">
      <TouchableArea disabled={!tvlBreakdown} testID={TestID.TokenDetailsStatsTvl} onPress={openTvlBreakdown}>
        <StatsRow
          label={t('common.totalValueLocked')}
          statsIcon={<Pools color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
        >
          <StatValue
            isLoading={isStatsLoading}
            numericValue={tvl ?? undefined}
            formattedValue={convertFiatAmountFormatted(tvl, NumberType.FiatTokenStats)}
          />
        </StatsRow>
      </TouchableArea>

      <StatsRow
        label={t('token.stats.marketCap')}
        statsIcon={<ChartPie color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <StatValue
          isLoading={isStatsLoading}
          numericValue={marketCap ?? undefined}
          formattedValue={convertFiatAmountFormatted(marketCap, NumberType.FiatTokenStats)}
        />
      </StatsRow>

      <StatsRow
        label={t('token.stats.fullyDilutedValuation')}
        statsIcon={<ChartPyramid color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <StatValue
          isLoading={isStatsLoading}
          numericValue={fdv ?? undefined}
          formattedValue={convertFiatAmountFormatted(fdv, NumberType.FiatTokenStats)}
        />
      </StatsRow>

      <StatsRow
        label={t('token.stats.volume')}
        statsIcon={<ChartBar color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
        labelAfter={maybeLimitedVolumeDataInfoIcon}
      >
        <StatValue
          isLoading={isStatsLoading}
          numericValue={volume ?? undefined}
          formattedValue={convertFiatAmountFormatted(volume, NumberType.FiatTokenStats)}
        />
      </StatsRow>

      <StatsRow
        label={t('token.stats.priceHighYear')}
        statsIcon={<TrendUp color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <StatValue
          isLoading={isStatsLoading}
          numericValue={high52w ?? undefined}
          formattedValue={convertFiatAmountFormatted(high52w, NumberType.FiatTokenDetails)}
        />
      </StatsRow>

      <StatsRow
        label={t('token.stats.priceLowYear')}
        statsIcon={<TrendDown color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <StatValue
          isLoading={isStatsLoading}
          numericValue={low52w ?? undefined}
          formattedValue={convertFiatAmountFormatted(low52w, NumberType.FiatTokenDetails)}
        />
      </StatsRow>

      <NetworkStatsRow
        defaultTokenColor={defaultTokenColor}
        hasCopyableContractAddress={hasCopyableContractAddress}
        networkChainIds={networkChainIds}
        singleNetworkChainId={singleNetworkChainId}
        tokenColor={tokenColor}
        onMultichainNetworksRowPress={onMultichainNetworksRowPress}
      />

      {showTvlBreakdown && tvlBreakdown && (
        <TvlBreakdownModal
          breakdown={tvlBreakdown}
          symbol={currencyInfo?.currency.symbol ?? t('common.token')}
          onClose={closeTvlBreakdown}
        />
      )}

      {hasLimitedVolumeData && (
        <WarningModal
          isOpen={showVolumeInfo}
          captionComponent={
            <Text color="$neutral2" textAlign="center" variant="body2">
              {t('stats.volume.1d.description.tempo')}
            </Text>
          }
          icon={<ChartBar color="$neutral2" size="$icon.24" />}
          backgroundIconColor={colors.surface2.get()}
          modalName={ModalName.VolumeInfo}
          rejectText={t('common.button.close')}
          severity={WarningSeverity.None}
          title={t('stats.volume.1d')}
          onClose={(): void => setShowVolumeInfo(false)}
        />
      )}
    </Flex>
  )
})

interface NetworkStatsRowProps {
  singleNetworkChainId: UniverseChainId | undefined
  tokenColor: string | null
  defaultTokenColor: IconProps['color']
  hasCopyableContractAddress: boolean
  onMultichainNetworksRowPress: () => void
  networkChainIds: UniverseChainId[]
}

const NetworkStatsRow = memo(function NetworkStatsRowInner({
  singleNetworkChainId,
  tokenColor,
  defaultTokenColor,
  hasCopyableContractAddress,
  onMultichainNetworksRowPress,
  networkChainIds,
}: NetworkStatsRowProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <StatsRow
      label={t('extension.connection.networks')}
      statsIcon={<GlobeFilled color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
    >
      {singleNetworkChainId !== undefined ? (
        <Flex row alignItems="center" justifyContent="flex-end" gap="$spacing8">
          <NetworkPile chainIds={[singleNetworkChainId]} size="small" />
          <Text textAlign="right" variant="body2">
            {getChainInfo(singleNetworkChainId).name}
          </Text>
        </Flex>
      ) : hasCopyableContractAddress ? (
        <TouchableArea
          row
          alignItems="center"
          justifyContent="flex-end"
          gap="$spacing6"
          onPress={onMultichainNetworksRowPress}
        >
          <NetworkPile chainIds={networkChainIds} size="small" />
          <Text textAlign="right" variant="body2">
            {t('explore.tokens.table.networks', { count: networkChainIds.length })}
          </Text>
          <InfoCircleFilled color="$neutral3" size="$icon.16" />
        </TouchableArea>
      ) : (
        <Flex row alignItems="center" justifyContent="flex-end" gap="$spacing6">
          <NetworkPile chainIds={networkChainIds} size="small" />
          <Text textAlign="right" variant="body2">
            {t('explore.tokens.table.networks', { count: networkChainIds.length })}
          </Text>
        </Flex>
      )}
    </StatsRow>
  )
})
