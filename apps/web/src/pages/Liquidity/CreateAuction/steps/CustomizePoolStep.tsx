import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type Currency, Token } from '@uniswap/sdk-core'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text } from 'ui/src'
import { Search } from 'ui/src/components/icons/Search'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { NumberType } from 'utilities/src/format/types'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { AdvancedButton } from '~/features/Liquidity/Create/AdvancedButton'
import { getSortedCurrenciesForProtocol } from '~/features/Liquidity/Create/hooks/useDerivedPositionInfo'
import { FeeTierSearchModal } from '~/features/Liquidity/FeeTierSearchModal'
import { FeeTierSelector } from '~/features/Liquidity/FeeTierSelector'
import { useAllFeeTierPoolData } from '~/features/Liquidity/hooks/useAllFeeTierPoolData'
import { getDefaultFeeTiersWithData } from '~/features/Liquidity/utils/feeTiers'
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
  NEW_TOKEN_DECIMALS,
  NEW_TOKEN_PLACEHOLDER_ADDRESS,
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

  const { feeTierData } = useAllFeeTierPoolData({
    chainId,
    protocolVersion: ProtocolVersion.V4,
    sdkCurrencies: sortedCurrencies,
    hook: ZERO_ADDRESS,
  })

  const defaultFeeTiers = useMemo(
    () => getDefaultFeeTiersWithData({ chainId, feeTierData, protocolVersion: ProtocolVersion.V4 }),
    [chainId, feeTierData],
  )

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
          <FeeTierSelector
            selectedFee={customizePool.fee}
            onFeeSelect={setFee}
            feeTiers={defaultFeeTiers}
            expandedFooterContent={
              <AdvancedButton
                title={t('fee.tier.search')}
                Icon={Search}
                onPress={() => setFeeTierSearchModalOpen(true)}
              />
            }
          />
          <FeeTierSearchModal
            isOpen={feeTierSearchModalOpen}
            onClose={() => setFeeTierSearchModalOpen(false)}
            chainId={chainId}
            protocolVersion={ProtocolVersion.V4}
            hook={ZERO_ADDRESS}
            sdkCurrencies={sortedCurrencies}
            selectedFee={customizePool.fee}
            onSelectFee={setFee}
            createDescription={t('toucan.createAuction.step.customizePool.feeTier.createDescription')}
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
            onStrategySelect={setPriceRangeStrategy}
            histogramBarColor={tokenColor ?? colors.statusSuccess.val}
            customPriceRanges={customizePool.customPriceRanges}
            onAddCustomPriceRangePreset={addCustomPriceRangePreset}
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
          onEnabledChange={setTimeLockEnabled}
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
        <Button
          fill
          size="medium"
          emphasis="primary"
          onPress={goToNextStep}
          isDisabled={isNextStepDisabled}
          backgroundColor={tokenColor}
        >
          {t('toucan.createAuction.reviewLaunch')}
        </Button>
      </Flex>
    </Flex>
  )
}
