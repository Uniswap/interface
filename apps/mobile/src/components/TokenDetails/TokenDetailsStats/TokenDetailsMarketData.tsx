import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { StatsRow } from 'src/components/TokenDetails/TokenDetailsStats/StatsRow'
import { useFeatureFlaggedProjectTokens } from 'src/components/TokenDetails/useFeatureFlaggedProjectTokens'
import { useTokenDetailsPreferProjectMarketData } from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import type { IconProps } from 'ui/src/components/factories/createIcon'
import { ChartBar, ChartPie, ChartPyramid, GlobeFilled, TrendDown, TrendUp } from 'ui/src/components/icons'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { NetworkPile } from 'uniswap/src/components/network/NetworkPile/NetworkPile'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { selectHasViewedContractAddressExplainer } from 'uniswap/src/features/behaviorHistory/selectors'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import {
  adaptLegacyMarketData,
  adaptLegacyProjectMarketData,
} from 'uniswap/src/features/dataApi/tokenDetails/legacyMarketDataAdapters'
import { useTokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { isMultichainProjectTokens } from 'uniswap/src/features/dataApi/tokenProjects/utils/isMultichainProjectTokens'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isDefaultNativeAddress } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

export const TokenDetailsMarketData = memo(function TokenDetailsMarketDataInner(): JSX.Element {
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)
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
  } = useTokenDetailsContext()
  const hasViewedContractAddressExplainer = useSelector(selectHasViewedContractAddressExplainer)
  const token = useTokenBasicInfoPartsFragment({ currencyId }).data
  const project = useTokenBasicProjectPartsFragment({ currencyId }).data.project
  const [showVolumeInfo, setShowVolumeInfo] = useState(false)
  const preferProjectMarketData = useTokenDetailsPreferProjectMarketData()

  const { data: screenData } = GraphQLApi.useTokenDetailsScreenQuery({
    variables: {
      ...currencyIdToContractInput(currencyId),
      multichain: true,
    },
    fetchPolicy: 'cache-only',
  })

  const aggregatedData = useMemo(() => {
    if (!screenData?.token?.multichainMarket) {
      return undefined
    }
    return {
      market: adaptLegacyMarketData(screenData.token.multichainMarket),
      projectMarket: adaptLegacyProjectMarketData(screenData.token.project?.markets?.[0]),
    }
  }, [screenData?.token?.multichainMarket, screenData?.token?.project?.markets])

  // Gate out unlaunched chains (e.g. Arc/Robinhood) so they don't appear in the Networks row or
  // make the token look multichain.
  const featureFlaggedScreenTokens = useFeatureFlaggedProjectTokens(screenData?.token?.project?.tokens)
  const featureFlaggedProjectTokens = useFeatureFlaggedProjectTokens(project?.tokens)

  const networkChainIds = useMemo((): UniverseChainId[] => {
    if (!featureFlaggedScreenTokens.length) {
      return [chainId]
    }
    const chainIds = new Set<UniverseChainId>()
    for (const projectToken of featureFlaggedScreenTokens) {
      const id = fromGraphQLChain(projectToken.chain)
      if (id !== null) {
        chainIds.add(id)
      }
    }
    if (chainIds.size === 0) {
      return [chainId]
    }
    return Array.from(chainIds)
  }, [chainId, featureFlaggedScreenTokens])

  const singleNetworkChainId = networkChainIds.length === 1 ? networkChainIds[0] : undefined

  const isMultichainToken = isMultichainProjectTokens(featureFlaggedProjectTokens)

  /** Native currency pages have no contract address to copy / multichain address sheet (see TokenDetailsLinks). */
  const hasCopyableContractAddress = useMemo(() => {
    if (isDefaultNativeAddress({ address, platform: chainIdToPlatform(chainId) })) {
      return false
    }
    return Boolean(token.address)
  }, [address, chainId, token.address])

  const onMultichainNetworksRowPress = useCallback((): void => {
    if (!token.address) {
      return
    }
    if (!hasViewedContractAddressExplainer) {
      openContractAddressExplainerModal()
      return
    }
    if (isMultichainToken) {
      openMultichainAddressSheet()
      return
    }
    void copyAddressToClipboard(token.address)
  }, [
    copyAddressToClipboard,
    hasViewedContractAddressExplainer,
    isMultichainToken,
    openContractAddressExplainerModal,
    openMultichainAddressSheet,
    token.address,
  ])

  const { marketCap, fdv, volume, high52w, low52w } = useTokenMarketStats(currencyId, {
    aggregatedData,
    preferProjectMarketData,
  })

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
      <StatsRow
        label={t('token.stats.marketCap')}
        statsIcon={<ChartPie color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <AnimatedNumber
          alignRight
          numericValue={marketCap ?? undefined}
          value={convertFiatAmountFormatted(marketCap, NumberType.FiatTokenStats)}
          textVariant="$body2"
          disableAnimations={!isDataLivelinessEnabled}
        />
      </StatsRow>

      <StatsRow
        label={t('token.stats.fullyDilutedValuation')}
        statsIcon={<ChartPyramid color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <AnimatedNumber
          alignRight
          numericValue={fdv ?? undefined}
          value={convertFiatAmountFormatted(fdv, NumberType.FiatTokenStats)}
          textVariant="$body2"
          disableAnimations={!isDataLivelinessEnabled}
        />
      </StatsRow>

      <StatsRow
        label={t('token.stats.volume')}
        statsIcon={<ChartBar color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
        labelAfter={maybeLimitedVolumeDataInfoIcon}
      >
        <AnimatedNumber
          alignRight
          numericValue={volume ?? undefined}
          value={convertFiatAmountFormatted(volume, NumberType.FiatTokenStats)}
          textVariant="$body2"
          disableAnimations={!isDataLivelinessEnabled}
        />
      </StatsRow>

      <StatsRow
        label={t('token.stats.priceHighYear')}
        statsIcon={<TrendUp color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <AnimatedNumber
          alignRight
          numericValue={high52w ?? undefined}
          value={convertFiatAmountFormatted(high52w, NumberType.FiatTokenDetails)}
          textVariant="$body2"
          disableAnimations={!isDataLivelinessEnabled}
        />
      </StatsRow>

      <StatsRow
        label={t('token.stats.priceLowYear')}
        statsIcon={<TrendDown color={tokenColor ?? defaultTokenColor} size="$icon.16" />}
      >
        <AnimatedNumber
          alignRight
          numericValue={low52w ?? undefined}
          value={convertFiatAmountFormatted(low52w, NumberType.FiatTokenDetails)}
          textVariant="$body2"
          disableAnimations={!isDataLivelinessEnabled}
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
