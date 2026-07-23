import { SharedEventName } from '@uniswap/analytics-events'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type Currency, Token } from '@uniswap/sdk-core'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, SpinningLoader, Text } from 'ui/src'
import { Search } from 'ui/src/components/icons/Search'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { AuctionEventName, ElementName, LiquidityEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { FeePoolSelectAction } from 'uniswap/src/features/telemetry/types'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { AdvancedButton } from '~/features/Liquidity/Create/AdvancedButton'
import { getSortedCurrenciesForProtocol } from '~/features/Liquidity/Create/hooks/useDerivedPositionInfo'
import { FeeTierSearchModal } from '~/features/Liquidity/FeeTierSearchModal'
import { FeeTierSelector } from '~/features/Liquidity/FeeTierSelector'
import { useAllFeeTierPoolData } from '~/features/Liquidity/hooks/useAllFeeTierPoolData'
import { getCommonFeeTiersWithData, getFeeTierKey } from '~/features/Liquidity/utils/feeTiers'
import {
  getAuctionCustomPriceRangeAddedProperties,
  getAuctionFeeTierCreatedProperties,
  getAuctionPoolDetailsInfoEnteredProperties,
} from '~/pages/Liquidity/CreateAuction/analytics'
import { AdvancedSettingsSeparator } from '~/pages/Liquidity/CreateAuction/components/AdvancedSettingsSeparator'
import { BuybackAndBurnSection } from '~/pages/Liquidity/CreateAuction/components/BuybackAndBurnSection'
import { PoolOwnerSection } from '~/pages/Liquidity/CreateAuction/components/PoolOwnerSection'
import { PriceRangeStrategySelector } from '~/pages/Liquidity/CreateAuction/components/PriceRangeStrategySelector'
import { SendFeesToAddressSection } from '~/pages/Liquidity/CreateAuction/components/SendFeesToAddressSection'
import { MIN_LOCK_DURATION_DAYS, TimeLockSection } from '~/pages/Liquidity/CreateAuction/components/TimeLockSection'
import { TokenSummaryCard, useTokenSummaryCardProps } from '~/pages/Liquidity/CreateAuction/components/TokenSummaryCard'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useCreateAuctionTokenColor } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionTokenColor'
import { useIsStepValid } from '~/pages/Liquidity/CreateAuction/hooks/useIsStepValid'
import {
  CreateAuctionStep,
  type CustomPriceRangePreset,
  NEW_TOKEN_DECIMALS,
  NEW_TOKEN_PLACEHOLDER_ADDRESS,
  PriceRangeStrategy,
  TokenMode,
} from '~/pages/Liquidity/CreateAuction/types'
import { getRaiseCurrencyAsCurrency } from '~/pages/Liquidity/CreateAuction/utils'
import {
  MS_PER_DAY,
  defaultEndTimeFor,
  formatReviewAuctionDuration,
} from '~/pages/Liquidity/CreateAuction/utils/duration'

/** Wide-layout width for the address field / control column in advanced settings rows (must match across sections). */
const ADVANCED_SETTINGS_CONTROL_COLUMN_WIDTH_PX = 280

export function CustomizePoolStep() {
  const { t } = useTranslation()
  const tokenColor = useCreateAuctionTokenColor()
  const colors = useSporeColors()
  const { formatNumberOrString } = useLocalizationContext()
  const {
    goToNextStep,
    setStep,
    setFee,
    setPriceRangeStrategy,
    addCustomPriceRangePreset,
    updateCustomPriceRangeLiquidityPercent,
    updateCustomPriceRangeBounds,
    removeCustomPriceRange,
    setPoolOwner,
    setTimeLockEnabled,
    setTimeLockPreset,
    setTimeLockDurationDays,
    setFeesRecipientAddress,
    setBuybackAndBurnEnabled,
  } = useCreateAuctionStoreActions()
  const locale = useCurrentLocale()
  const [feeTierSearchModalOpen, setFeeTierSearchModalOpen] = useState(false)
  const [feeTierModalCreateMode, setFeeTierModalCreateMode] = useState(false)
  const tokenSummaryCardProps = useTokenSummaryCardProps()
  const activeAddress = useActiveAddress(Platform.EVM)
  const configureAuction = useCreateAuctionStore((state) => state.configureAuction)
  const customizePool = useCreateAuctionStore((state) => state.customizePool)
  const [advancedSettingsExpanded, setAdvancedSettingsExpanded] = useState(
    customizePool.sendFeesEnabled || customizePool.buybackAndBurnEnabled,
  )
  const tokenForm = useCreateAuctionStore((state) => state.tokenForm)
  const isNextStepDisabled = !useIsStepValid(CreateAuctionStep.CUSTOMIZE_POOL)

  const handleEditToken = useCallback(() => setStep(CreateAuctionStep.ADD_TOKEN_INFO), [setStep])
  const handleEditAuction = useCallback(() => setStep(CreateAuctionStep.CONFIGURE_AUCTION), [setStep])

  const chainId: UniverseChainId =
    tokenForm.mode === TokenMode.CREATE_NEW
      ? tokenForm.network
      : (tokenForm.existingTokenCurrencyInfo?.currency.chainId ?? UniverseChainId.Unichain)

  const token0: Currency | undefined = useMemo(() => {
    if (tokenForm.mode === TokenMode.CREATE_NEW) {
      return new Token(
        tokenForm.network,
        NEW_TOKEN_PLACEHOLDER_ADDRESS,
        NEW_TOKEN_DECIMALS,
        tokenForm.symbol,
        tokenForm.name,
      )
    }
    return tokenForm.existingTokenCurrencyInfo?.currency
  }, [tokenForm])

  const token1 = useMemo(
    () => getRaiseCurrencyAsCurrency(configureAuction.raiseCurrency, chainId),
    [configureAuction.raiseCurrency, chainId],
  )

  const sortedCurrencies = useMemo(
    () => getSortedCurrenciesForProtocol({ a: token0, b: token1, protocolVersion: ProtocolVersion.V4 }),
    [token0, token1],
  )

  // Include the currently selected tier in the on-chain check in case it's a custom one not in the default set.
  const customizePoolFeeTiersToCheck = useMemo(() => [customizePool.fee], [customizePool.fee])

  const { feeTierData, isLoading: isFeeTierDataLoading } = useAllFeeTierPoolData({
    chainId,
    protocolVersion: ProtocolVersion.V4,
    sdkCurrencies: sortedCurrencies,
    hook: ZERO_ADDRESS,
    // CCA requires a brand-new pool: verify existence on-chain so abandoned/zero-liquidity pools
    // (which the indexed data omits) are still treated as existing.
    checkOnChainPoolExistence: true,
    additionalFeeTiersToCheck: customizePoolFeeTiersToCheck,
  })

  // Auctions require a brand-new pool, so we always show the common fee tiers and disable any that
  // already have a pool (rather than the regular flow's top-N-by-TVL selection).
  const existingPoolWarning = t('toucan.createAuction.step.customizePool.feeTier.existingPoolWarning')
  const existingPoolWarningLearnMoreUrl = UniswapHelpUrls.articles.toucanLaunchAuctionCustomizePoolHelp

  const commonFeeTiers = useMemo(
    () => getCommonFeeTiersWithData({ chainId, feeTierData, protocolVersion: ProtocolVersion.V4 }),
    [chainId, feeTierData],
  )

  const feeTierOptions = useMemo(
    () =>
      commonFeeTiers.map((tier) => ({
        value: tier.value,
        title: tier.title,
        tvl: undefined,
        disabledReason: tier.created ? existingPoolWarning : undefined,
        disabledReasonLearnMoreUrl: tier.created ? existingPoolWarningLearnMoreUrl : undefined,
      })),
    [commonFeeTiers, existingPoolWarning, existingPoolWarningLearnMoreUrl],
  )

  const allCommonTiersExist = commonFeeTiers.length > 0 && commonFeeTiers.every((tier) => tier.created)

  // A pool already exists for the selected tier — treat as no selection so the user must pick a free tier
  const selectedFeeHasExistingPool = useMemo(() => {
    const key = getFeeTierKey({
      feeTier: customizePool.fee.feeAmount,
      tickSpacing: customizePool.fee.tickSpacing,
      isDynamicFee: customizePool.fee.isDynamic,
    })
    return key ? Boolean(feeTierData[key]?.created) : false
  }, [customizePool.fee, feeTierData])

  const selectedFee = selectedFeeHasExistingPool ? undefined : customizePool.fee

  // Block continuing until a fee tier with no existing pool is selected (and until existence is verified)
  const isContinueDisabled = isNextStepDisabled || !selectedFee || isFeeTierDataLoading

  const { committed, startTime, endTime } = configureAuction
  const { timeLockEnabled, timeLockPreset, timeLockDurationDays, feesRecipientAddress, buybackAndBurnEnabled } =
    customizePool

  const handleFeesRecipientAddressChange = useCallback(
    (address: string) => {
      setFeesRecipientAddress(address)
    },
    [setFeesRecipientAddress],
  )

  const auctionEndDate = useMemo(() => {
    if (endTime) {
      return endTime
    }
    return defaultEndTimeFor(startTime ?? new Date())
  }, [startTime, endTime])

  const minUnlockDate = useMemo(() => new Date(auctionEndDate.getTime() + MS_PER_DAY), [auctionEndDate])

  const unlockDate = useMemo(
    () => new Date(auctionEndDate.getTime() + timeLockDurationDays * MS_PER_DAY),
    [auctionEndDate, timeLockDurationDays],
  )

  const handleUnlockDateChange = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        return
      }
      const days = Math.ceil((date.getTime() - auctionEndDate.getTime()) / MS_PER_DAY)
      setTimeLockDurationDays(Math.max(MIN_LOCK_DURATION_DAYS, days))
    },
    [auctionEndDate, setTimeLockDurationDays],
  )

  const trace = useTrace()
  const handleContinue = useEvent(() => {
    sendAnalyticsEvent(
      AuctionEventName.PoolDetailsInfoEntered,
      getAuctionPoolDetailsInfoEnteredProperties({ trace, customizePool, timelockUnlockDate: unlockDate }),
    )
    goToNextStep()
  })

  // Fee-tier grid selection reuses the shared `Select Liquidity Pool Fee Tier` event, tagged with
  // origin so CCA-flow selections are distinguishable. The fee-tier search modal fires its own copy
  // of this event (without origin) and is intentionally left unchanged.
  const handleFeeSelect = useEvent((fee: FeeData) => {
    sendAnalyticsEvent(LiquidityEventName.SelectLiquidityPoolFeeTier, {
      ...trace,
      action: FeePoolSelectAction.Manual,
      fee_tier: fee.feeAmount,
      origin: 'cca-supply',
    })
    setFee(fee)
  })

  const handleFeeTierMorePress = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { ...trace, element: ElementName.AuctionFeeTierMore })
    setFeeTierModalCreateMode(false)
    setFeeTierSearchModalOpen(true)
  })

  // The create-fee-tier popup lives inside the shared FeeTierSearchModal; these CCA-only callbacks fire
  // the launch-auction analytics without changing the modal's behavior for other flows.
  const handleCreateFeeTierClick = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { ...trace, element: ElementName.AuctionCreateFeeTier })
  })

  // When every common tier already has a pool, the header CTA opens the modal straight into create mode
  const handleCreateFeeTierDirect = useEvent(() => {
    handleCreateFeeTierClick()
    setFeeTierModalCreateMode(true)
    setFeeTierSearchModalOpen(true)
  })

  const handleFeeTierCreated = useEvent((feeAmount: number) => {
    sendAnalyticsEvent(AuctionEventName.FeeTierCreated, getAuctionFeeTierCreatedProperties({ trace, feeAmount }))
  })

  const handlePriceRangeStrategySelect = useEvent((strategy: PriceRangeStrategy) => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.AuctionPriceRangeStrategy,
      range_type: strategy,
    })
    setPriceRangeStrategy(strategy)
  })

  const handleAddCustomPriceRangePreset = useEvent((preset: CustomPriceRangePreset) => {
    sendAnalyticsEvent(
      AuctionEventName.AuctionCustomPriceRangeAdded,
      getAuctionCustomPriceRangeAddedProperties({
        trace,
        preset,
        rangeCountBeforeAdd: customizePool.customPriceRanges.length,
      }),
    )
    addCustomPriceRangePreset(preset)
  })

  const handleTimeLockEnabledChange = useEvent((nextEnabled: boolean) => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.AuctionTimelockToggle,
      timelock_enabled: nextEnabled,
    })
    setTimeLockEnabled(nextEnabled)
  })

  if (!committed || !startTime) {
    return null
  }

  const auctionSupplyText = t('toucan.createAuction.tokenSummaryCard.auctioning', {
    amount: formatNumberOrString({
      value: committed.auctionSupplyAmount.toExact(),
      type: NumberType.TokenNonTx,
      placeholder: '0',
    }),
  })
  const launchText = t('toucan.createAuction.tokenSummaryCard.launchingWithDuration', {
    date: startTime.toLocaleDateString(locale, { month: '2-digit', day: '2-digit', year: '2-digit' }),
    duration: formatReviewAuctionDuration({ startTime, endTime: auctionEndDate }, t),
  })

  const auctionSummary = { auctionSupplyText, launchText, onEdit: handleEditAuction }

  return (
    <Flex gap="$spacing16">
      <TokenSummaryCard {...tokenSummaryCardProps} onEdit={handleEditToken} auctionSummary={auctionSummary} />

      <Flex
        backgroundColor="$surface1"
        borderWidth="$spacing1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        p="$spacing24"
        gap="$spacing24"
        $md={{ borderWidth: 0, borderRadius: '$none', p: '$none' }}
      >
        <Flex>
          <Text variant="heading3" color="$neutral1" py="$spacing12">
            {t('toucan.createAuction.step.customizePool.title')}
          </Text>
          <Separator />
        </Flex>
        <Flex>
          <Flex pb="$spacing16">
            <Text variant="subheading1" color="$neutral1">
              {t('fee.tier')}
            </Text>
            <Text variant="body3" color="$neutral2">
              {t('fee.tier.description')}
            </Text>
          </Flex>
          {isFeeTierDataLoading ? (
            <Flex centered minHeight={92} borderRadius="$rounded12" borderWidth="$spacing1" borderColor="$surface3">
              <SpinningLoader color="$neutral2" />
            </Flex>
          ) : (
            <FeeTierSelector
              selectedFee={selectedFee}
              onFeeSelect={handleFeeSelect}
              feeTiers={allCommonTiersExist ? [] : feeTierOptions}
              headerAction={
                allCommonTiersExist ? (
                  <Button
                    fill={false}
                    size="xsmall"
                    maxWidth="fit-content"
                    emphasis="secondary"
                    onPress={handleCreateFeeTierDirect}
                  >
                    {t('fee.tier.create')}
                  </Button>
                ) : undefined
              }
              expandedFooterContent={
                allCommonTiersExist ? undefined : (
                  <AdvancedButton title={t('fee.tier.search')} Icon={Search} onPress={handleFeeTierMorePress} />
                )
              }
            />
          )}
          <FeeTierSearchModal
            isOpen={feeTierSearchModalOpen}
            onClose={() => setFeeTierSearchModalOpen(false)}
            chainId={chainId}
            protocolVersion={ProtocolVersion.V4}
            hook={ZERO_ADDRESS}
            sdkCurrencies={sortedCurrencies}
            selectedFee={selectedFee}
            onSelectFee={setFee}
            createDescription={t('toucan.createAuction.step.customizePool.feeTier.createDescription')}
            onCreateFeeTierClick={handleCreateFeeTierClick}
            onFeeTierCreated={handleFeeTierCreated}
            initialCreateModeEnabled={feeTierModalCreateMode}
            blockExistingPools
            existingPoolWarning={existingPoolWarning}
            existingPoolWarningLearnMoreUrl={existingPoolWarningLearnMoreUrl}
          />
        </Flex>

        <Flex>
          <Flex pb="$spacing16">
            <Text variant="subheading1" color="$neutral1">
              {t('toucan.createAuction.step.customizePool.priceRange.title')}
            </Text>
            <Text variant="body3" color="$neutral2">
              {t('toucan.createAuction.step.customizePool.priceRange.description')}
            </Text>
          </Flex>
          <PriceRangeStrategySelector
            selectedStrategy={customizePool.priceRangeStrategy}
            onStrategySelect={handlePriceRangeStrategySelect}
            histogramBarColor={tokenColor ?? colors.statusSuccess.val}
            customPriceRanges={customizePool.customPriceRanges}
            onAddCustomPriceRangePreset={handleAddCustomPriceRangePreset}
            onUpdateCustomPriceRangeLiquidityPercent={updateCustomPriceRangeLiquidityPercent}
            onUpdateCustomPriceRangeBounds={updateCustomPriceRangeBounds}
            onRemoveCustomPriceRange={removeCustomPriceRange}
          />
        </Flex>

        <PoolOwnerSection
          value={customizePool.poolOwner}
          onValueChange={setPoolOwner}
          activeAddress={activeAddress ?? null}
        />

        <TimeLockSection
          enabled={timeLockEnabled}
          onEnabledChange={handleTimeLockEnabledChange}
          timeLockPreset={timeLockPreset}
          onTimeLockPresetChange={setTimeLockPreset}
          unlockDate={unlockDate}
          onUnlockDateChange={handleUnlockDateChange}
          minUnlockDate={minUnlockDate}
        />

        {timeLockEnabled && (
          <>
            <AdvancedSettingsSeparator
              isExpanded={advancedSettingsExpanded}
              onToggle={() => setAdvancedSettingsExpanded(!advancedSettingsExpanded)}
            />

            {advancedSettingsExpanded && (
              <>
                <SendFeesToAddressSection
                  controlColumnWidthPx={ADVANCED_SETTINGS_CONTROL_COLUMN_WIDTH_PX}
                  value={feesRecipientAddress}
                  onValueChange={handleFeesRecipientAddressChange}
                  poolOwnerAddress={customizePool.poolOwner || activeAddress || null}
                />
                <BuybackAndBurnSection
                  controlColumnWidthPx={ADVANCED_SETTINGS_CONTROL_COLUMN_WIDTH_PX}
                  enabled={buybackAndBurnEnabled}
                  onEnabledChange={setBuybackAndBurnEnabled}
                />
              </>
            )}
          </>
        )}
      </Flex>
      <Flex row>
        <Trace logPress element={ElementName.Continue}>
          <Button
            fill
            size="medium"
            emphasis="primary"
            onPress={handleContinue}
            isDisabled={isContinueDisabled}
            backgroundColor={isContinueDisabled ? undefined : tokenColor}
          >
            {t('toucan.createAuction.reviewLaunch')}
          </Button>
        </Trace>
      </Flex>
    </Flex>
  )
}
