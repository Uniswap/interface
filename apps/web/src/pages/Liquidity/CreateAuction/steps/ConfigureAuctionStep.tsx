import { type Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { AuctionEventName, ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { zeroAddress } from '~/chains'
import {
  getAuctionCreateTokenSource,
  getAuctionDetailsInfoEnteredProperties,
} from '~/pages/Liquidity/CreateAuction/analytics'
import { AuctionAdvancedSettings } from '~/pages/Liquidity/CreateAuction/components/AuctionAdvancedSettings'
import { AuctionDistributionSection } from '~/pages/Liquidity/CreateAuction/components/AuctionDistributionSection'
import { AuctionSupplySection } from '~/pages/Liquidity/CreateAuction/components/AuctionSupplySection'
import { DurationSection, type DurationSectionHandle } from '~/pages/Liquidity/CreateAuction/components/DurationSection'
import { LaunchThresholdSection } from '~/pages/Liquidity/CreateAuction/components/LaunchThresholdSection'
import { PostAuctionLiquiditySection } from '~/pages/Liquidity/CreateAuction/components/PostAuctionLiquiditySection'
import {
  PriceSettingsSection,
  type PriceSettingsSectionHandle,
} from '~/pages/Liquidity/CreateAuction/components/PriceSettingsSection'
import { TokenSummaryCard, useTokenSummaryCardProps } from '~/pages/Liquidity/CreateAuction/components/TokenSummaryCard'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useCreateAuctionTokenColor } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionTokenColor'
import { useCreateAuctionTokenLogoNode } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionTokenLogoNode'
import { useExistingTokenWalletBalance } from '~/pages/Liquidity/CreateAuction/hooks/useExistingTokenWalletBalance'
import { useIsStepValid } from '~/pages/Liquidity/CreateAuction/hooks/useIsStepValid'
import { useStableRaiseUsdPrice } from '~/pages/Liquidity/CreateAuction/hooks/useStableRaiseUsdPrice'
import {
  getInitialConfigureAuctionInputCurrency,
  getNextConfigureAuctionInputCurrency,
} from '~/pages/Liquidity/CreateAuction/steps/configureAuctionInputCurrency'
import { minimumAuctionSupplyDeposit } from '~/pages/Liquidity/CreateAuction/store/postAuctionLiquidityAllocationState'
import {
  type ConfigureAuctionFormState,
  CreateAuctionStep,
  type InputCurrency,
  PostAuctionLiquidityAllocationType,
  RaiseCurrency,
  TokenMode,
} from '~/pages/Liquidity/CreateAuction/types'
import {
  percentOfSoldToLiquidityFromDepositAndLiquidityAmount,
  percentOfAmount,
} from '~/pages/Liquidity/CreateAuction/utils'
import { getMinAuctionStartTimeToProceed } from '~/pages/Liquidity/CreateAuction/utils/duration'
import {
  EmissionScheduleError,
  getAuctionEmissionScheduleError,
} from '~/pages/Liquidity/CreateAuction/utils/emissionSchedule'

const AUCTION_DISTRIBUTION_TOKEN_LOGO_SIZE = 24

export function ConfigureAuctionStep() {
  const { t } = useTranslation()
  const tokenColor = useCreateAuctionTokenColor()
  const tokenSummaryCardProps = useTokenSummaryCardProps()
  const auctionDistributionTokenLogo = useCreateAuctionTokenLogoNode(AUCTION_DISTRIBUTION_TOKEN_LOGO_SIZE, {
    hideNetworkLogo: true,
  })
  const configureAuction: ConfigureAuctionFormState = useCreateAuctionStore((state) => state.configureAuction)
  const tokenMode = useCreateAuctionStore((state) => state.tokenForm.mode)
  const existingTokenCurrency = useCreateAuctionStore((state) =>
    state.tokenForm.mode === TokenMode.EXISTING ? state.tokenForm.existingTokenCurrencyInfo?.currency : undefined,
  )

  const {
    goToPreviousStep,
    goToNextStep,
    addPostAuctionLiquidityTier,
    removePostAuctionLiquidityTier,
    setAuctionConfig,
    setNewTokenTotalSupply,
    setSinglePostAuctionLiquidityPercent,
    setStartTime,
    setEndTime,
    setPostAuctionLiquidityAllocationType,
    setRaiseCurrency,
    setFloorPrice,
    updatePostAuctionLiquidityTier,
  } = useCreateAuctionStoreActions()

  const { startTime, endTime, committed, postAuctionLiquidityAllocation, raiseCurrency, floorPrice, floorPriceInput } =
    configureAuction
  const isNextStepDisabled = !useIsStepValid(CreateAuctionStep.CONFIGURE_AUCTION)

  const durationSectionRef = useRef<DurationSectionHandle>(null)
  const priceSettingsSectionRef = useRef<PriceSettingsSectionHandle>(null)

  const handleDisabledContinue = useCallback(() => {
    const minStartTimeMs = getMinAuctionStartTimeToProceed().getTime()
    const isStartTimeValid = !!startTime && startTime.getTime() >= minStartTimeMs
    const isEndTimeValid = !!endTime && !!startTime && endTime.getTime() > startTime.getTime()

    if (!isStartTimeValid) {
      durationSectionRef.current?.openCalendar('start')
      return
    }
    if (!isEndTimeValid) {
      durationSectionRef.current?.openCalendar('end')
      return
    }
    if (!floorPrice) {
      priceSettingsSectionRef.current?.focusFloorPrice()
    }
  }, [startTime, endTime, floorPrice])

  // Snapshot the raise-token USD price once per raise-currency selection. Holding it stable
  // keeps every USD↔raise conversion in the flow agreeing on one anchor, so the user's "$100k"
  // doesn't drift to "$99,990" on the next oracle tick. Re-snapshots only on raise-currency
  // change. Single source of truth — children receive this instead of calling useUSDCPrice themselves.
  const usdPriceNum = useStableRaiseUsdPrice({ raiseCurrency, chainId: committed?.totalSupply.currency.chainId ?? 1 })

  // Analytics snapshot inputs for `Auction Details Info Entered`, mirroring the Review step's
  // FDV math and raise-currency resolution so the step-level event agrees with Submitted/Completed.
  const trace = useTrace()
  const detailsChainId = committed?.totalSupply.currency.chainId
  const maxFdv = useMemo(() => {
    if (!configureAuction.floorPrice || !committed) {
      return undefined
    }
    return parseFloat(configureAuction.floorPrice) * parseFloat(committed.totalSupply.toExact())
  }, [configureAuction.floorPrice, committed])
  const raiseCurrencyAddress =
    detailsChainId === undefined
      ? undefined
      : raiseCurrency === RaiseCurrency.ETH
        ? zeroAddress
        : getChainInfo(detailsChainId).tokens.USDC?.address
  const handleContinue = useEvent(() => {
    sendAnalyticsEvent(
      AuctionEventName.AuctionDetailsInfoEntered,
      getAuctionDetailsInfoEnteredProperties({
        trace,
        tokenMode,
        configureAuction,
        raiseCurrencyAddress,
        raiseUsdPrice: usdPriceNum,
        maxFdv,
      }),
    )
    goToNextStep()
  })

  // Active currency for price/milestone inputs. UI-only — not part of submitted config.
  // Defaults to USD when a price oracle is available; falls back to raise-token on testnets
  // where no USD price exists (otherwise commitDraftToFloorPrice silently returns '' and the
  // floor price can never be set). Resets when raiseCurrency changes or oracle availability changes.
  const hasUsdOracle = usdPriceNum !== null
  const prevRaiseCurrencyRef = useRef(raiseCurrency)
  const [inputCurrency, setInputCurrency] = useState<InputCurrency>(
    getInitialConfigureAuctionInputCurrency({ floorPriceInput, hasUsdOracle }),
  )
  useEffect(() => {
    const raiseCurrencyChanged = prevRaiseCurrencyRef.current !== raiseCurrency
    if (raiseCurrencyChanged) {
      prevRaiseCurrencyRef.current = raiseCurrency
    }
    setInputCurrency((current) =>
      getNextConfigureAuctionInputCurrency({ current, floorPriceInput, hasUsdOracle, raiseCurrencyChanged }),
    )
  }, [floorPriceInput, raiseCurrency, hasUsdOracle])

  const handleDurationChange = useCallback(
    ({ startTime: nextStart, endTime: nextEnd }: { startTime: Date | undefined; endTime: Date | undefined }) => {
      setStartTime(nextStart)
      setEndTime(nextEnd)
    },
    [setStartTime, setEndTime],
  )

  // Existing tokens deposit tokens pulled from the wallet, so the auction can only be funded up to
  // the connected wallet's held balance — not the token's total supply. (New tokens mint their own
  // supply at launch, so the wallet balance is irrelevant.) Cap the deposit input ceiling to the
  // held balance; the build-time check enforces it at launch.
  const isExistingToken = tokenMode === TokenMode.EXISTING
  const { balance: heldBalance } = useExistingTokenWalletBalance(existingTokenCurrency)
  const committedTotalSupply = committed?.totalSupply
  // Rebase the balance onto the committed currency so CurrencyAmount comparisons share an identity.
  const walletBalance = useMemo(
    () =>
      isExistingToken && heldBalance && committedTotalSupply
        ? CurrencyAmount.fromRawAmount(committedTotalSupply.currency, heldBalance.quotient)
        : undefined,
    [isExistingToken, heldBalance, committedTotalSupply],
  )
  // Defensive cap to total supply (balanceOf should never exceed totalSupply, but a malformed token
  // could report otherwise). New tokens keep the full minted supply as the ceiling.
  const maxAuctionSupplyAmount = useMemo(() => {
    if (!committedTotalSupply) {
      return undefined
    }
    if (!isExistingToken || !walletBalance) {
      return committedTotalSupply
    }
    return walletBalance.greaterThan(committedTotalSupply) ? committedTotalSupply : walletBalance
  }, [isExistingToken, walletBalance, committedTotalSupply])

  // Clamp a stale deposit (e.g. the existing-token default of 100% of total supply) down to the held
  // balance once it resolves, so the input never starts above what the wallet can fund.
  useEffect(() => {
    if (!committed || !maxAuctionSupplyAmount) {
      return
    }
    if (committed.auctionSupplyAmount.greaterThan(maxAuctionSupplyAmount)) {
      setAuctionConfig({ auctionSupplyAmount: maxAuctionSupplyAmount })
    }
  }, [committed, maxAuctionSupplyAmount, setAuctionConfig])

  const handleAuctionSupplyPercentChange = useCallback(
    (percent: number) => {
      if (!committed || !maxAuctionSupplyAmount) {
        return
      }
      const newAuctionSupply = percentOfAmount(maxAuctionSupplyAmount, percent)
      setAuctionConfig({ auctionSupplyAmount: newAuctionSupply })
    },
    [committed, maxAuctionSupplyAmount, setAuctionConfig],
  )

  const handleAuctionSupplyAmountChange = useCallback(
    (newAuctionSupply: CurrencyAmount<Currency>) => {
      if (!committed) {
        return
      }
      setAuctionConfig({ auctionSupplyAmount: newAuctionSupply })
    },
    [committed, setAuctionConfig],
  )

  const handlePostAuctionLiquidityPercentChange = useCallback(
    (percent: number) => {
      setSinglePostAuctionLiquidityPercent(percent)
    },
    [setSinglePostAuctionLiquidityPercent],
  )

  const postAuctionLiquidityPercent = useMemo(() => {
    if (!committed) {
      return 0
    }
    return percentOfSoldToLiquidityFromDepositAndLiquidityAmount(
      committed.auctionSupplyAmount,
      committed.postAuctionLiquidityAmount,
    )
  }, [committed])

  if (!committed) {
    return null
  }

  const { totalSupply, auctionSupplyAmount } = committed
  const tokenSymbol = totalSupply.currency.symbol ?? ''
  // Floor for the deposit: below this the sold/LP split rounds a leg to zero base units.
  const minAuctionSupplyAmount = minimumAuctionSupplyDeposit(totalSupply.currency, postAuctionLiquidityAllocation)

  // Mirror the backend's emission-schedule derivation: the chosen window is converted to a block span
  // using the chain's block time, and a too-short window (or one whose per-block rounding overshoots
  // the supply budget) is rejected with "Emission schedule overshot the supply target" /
  // "Auction window is too short". Catch both before submit and surface them on the duration picker.
  const emissionScheduleError = getAuctionEmissionScheduleError({
    startTime,
    endTime,
    chainId: totalSupply.currency.chainId,
  })
  const emissionScheduleErrorMessage =
    emissionScheduleError === EmissionScheduleError.Overshoot
      ? t('toucan.createAuction.step.configureAuction.duration.emissionOvershoot.error')
      : emissionScheduleError === EmissionScheduleError.WindowTooShort
        ? t('toucan.createAuction.step.configureAuction.duration.windowTooShort.error')
        : undefined

  // Block advancing when the chosen window can't produce a valid emission schedule.
  const continueDisabled = isNextStepDisabled || emissionScheduleError !== undefined

  return (
    <Flex gap="$spacing16">
      <TokenSummaryCard {...tokenSummaryCardProps} onEdit={goToPreviousStep} />

      <Flex
        backgroundColor="$surface1"
        borderWidth="$spacing1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        p="$spacing24"
        gap="$spacing24"
      >
        <Text variant="heading3" color="$neutral1" pb="$spacing12">
          {t('toucan.createAuction.step.configureAuction.title')}
        </Text>

        <Flex gap="$spacing40">
          <DurationSection
            ref={durationSectionRef}
            startTime={startTime}
            endTime={endTime}
            scheduleError={emissionScheduleErrorMessage}
            onChange={handleDurationChange}
          />

          <AuctionSupplySection
            auctionSupplyAmount={auctionSupplyAmount}
            tokenTotalSupply={totalSupply}
            maxAuctionSupplyAmount={maxAuctionSupplyAmount ?? totalSupply}
            minAuctionSupplyAmount={minAuctionSupplyAmount}
            tokenSymbol={tokenSymbol}
            isNewToken={!isExistingToken}
            onSelectAuctionSupplyPercent={handleAuctionSupplyPercentChange}
            onAuctionSupplyAmountChange={handleAuctionSupplyAmountChange}
            onTotalSupplyChange={setNewTokenTotalSupply}
          />

          <PriceSettingsSection
            ref={priceSettingsSectionRef}
            chainId={totalSupply.currency.chainId}
            raiseCurrency={raiseCurrency}
            onSelect={setRaiseCurrency}
            floorPrice={floorPrice}
            floorPriceInput={floorPriceInput}
            tokenTotalSupply={totalSupply}
            inputCurrency={inputCurrency}
            usdPriceNum={usdPriceNum}
            onInputCurrencyChange={setInputCurrency}
            onFloorPriceChange={setFloorPrice}
          />

          <PostAuctionLiquiditySection
            allocation={postAuctionLiquidityAllocation}
            postAuctionLiquidityPercent={postAuctionLiquidityPercent}
            auctionSupplyAmount={auctionSupplyAmount}
            postAuctionLiquidityAmount={committed.postAuctionLiquidityAmount}
            floorPrice={floorPrice}
            raiseCurrency={raiseCurrency}
            chainId={totalSupply.currency.chainId}
            tokenSymbol={tokenSymbol}
            inputCurrency={inputCurrency}
            usdPriceNum={usdPriceNum}
            onAllocationTypeSelect={setPostAuctionLiquidityAllocationType}
            onSelectPercent={handlePostAuctionLiquidityPercentChange}
            onAddTier={addPostAuctionLiquidityTier}
            onUpdateTier={updatePostAuctionLiquidityTier}
            onRemoveTier={removePostAuctionLiquidityTier}
          />

          {postAuctionLiquidityAllocation.type === PostAuctionLiquidityAllocationType.SINGLE && (
            <AuctionDistributionSection
              auctionSupplyAmount={auctionSupplyAmount}
              postAuctionLiquidityAmount={committed.postAuctionLiquidityAmount}
              tokenSymbol={tokenSymbol}
              raiseCurrency={raiseCurrency}
              chainId={totalSupply.currency.chainId}
              tokenColor={tokenColor}
              tokenLogoNode={auctionDistributionTokenLogo}
            />
          )}

          {postAuctionLiquidityAllocation.type === PostAuctionLiquidityAllocationType.SINGLE && (
            <LaunchThresholdSection
              floorPrice={floorPrice}
              raiseCurrency={raiseCurrency}
              chainId={totalSupply.currency.chainId}
              auctionSupplyAmount={auctionSupplyAmount}
              postAuctionLiquidityAmount={committed.postAuctionLiquidityAmount}
            />
          )}
        </Flex>
        <AuctionAdvancedSettings />
      </Flex>

      <Flex row>
        <Trace
          logPress
          element={ElementName.Continue}
          properties={{ token_source: getAuctionCreateTokenSource(tokenMode) }}
        >
          <Button
            size="medium"
            emphasis="primary"
            onPress={handleContinue}
            isDisabled={continueDisabled}
            onDisabledPress={isNextStepDisabled ? handleDisabledContinue : undefined}
            fill
            backgroundColor={continueDisabled ? undefined : tokenColor}
          >
            {t('common.button.continue')}
          </Button>
        </Trace>
      </Flex>
    </Flex>
  )
}
