import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { AuctionCreateFailedStep } from 'uniswap/src/features/telemetry/types'
import { useCurrencyInfo, useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { isAddress } from '~/chains'
import { BIPS_BASE } from '~/constants/misc'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import {
  getAuctionCreateAnalyticsProperties,
  getAuctionCreateFailedDiagnostics,
  getAuctionCreateFailedProperties,
} from '~/pages/Liquidity/CreateAuction/analytics'
import { LaunchAuctionErrorModal } from '~/pages/Liquidity/CreateAuction/components/LaunchAuctionErrorModal'
import { LaunchAuctionReviewModal } from '~/pages/Liquidity/CreateAuction/components/LaunchAuctionReviewModal'
import { LaunchAuctionSuccessModal } from '~/pages/Liquidity/CreateAuction/components/LaunchAuctionSuccessModal'
import { ReviewCustomPriceRangeExpandable } from '~/pages/Liquidity/CreateAuction/components/ReviewCustomPriceRangeExpandable'
import { ReviewLaunchAuctionDetailsSection } from '~/pages/Liquidity/CreateAuction/components/reviewLaunch/ReviewLaunchAuctionDetailsSection'
import {
  ReviewRow,
  SectionHeader,
} from '~/pages/Liquidity/CreateAuction/components/reviewLaunch/ReviewLaunchStepPrimitives'
import { ReviewLaunchTokenInfoSection } from '~/pages/Liquidity/CreateAuction/components/reviewLaunch/ReviewLaunchTokenInfoSection'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useCreateAuctionSubmit } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionSubmit'
import { useCreateAuctionTokenColor } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionTokenColor'
import { useExistingTokenWalletBalance } from '~/pages/Liquidity/CreateAuction/hooks/useExistingTokenWalletBalance'
import { useIsQuickLaunchMode } from '~/pages/Liquidity/CreateAuction/hooks/useIsQuickLaunchMode'
import { useLaunchAuctionFlow } from '~/pages/Liquidity/CreateAuction/hooks/useLaunchAuctionFlow'
import { useStableRaiseUsdPrice } from '~/pages/Liquidity/CreateAuction/hooks/useStableRaiseUsdPrice'
import { getLaunchThreshold } from '~/pages/Liquidity/CreateAuction/launchThreshold'
import { applyQuickLaunchAuctionWindow } from '~/pages/Liquidity/CreateAuction/quickLaunch/quickLaunchPreset'
import {
  CreateAuctionStep,
  PriceRangeStrategy,
  RaiseCurrency,
  TimeLockPreset,
  TokenMode,
} from '~/pages/Liquidity/CreateAuction/types'
import { getPrimaryStablecoin, getRaiseCurrencyAddress } from '~/pages/Liquidity/CreateAuction/utils'
import { resolveTokenImageSrc } from '~/pages/Liquidity/CreateAuction/utils/resolveTokenImageSrc'

// oxlint-disable-next-line complexity
export function ReviewLaunchStep(): JSX.Element | null {
  const { t } = useTranslation()
  const tokenColor = useCreateAuctionTokenColor()
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const tokenForm = useCreateAuctionStore((state) => state.tokenForm)
  // QuickLaunch: quick launch skips the Configure/Customize steps, so their edit buttons are hidden.
  // Effective mode (flag + new-token + switch), NOT the raw store flag, which defaults to on.
  const quickLaunch = useIsQuickLaunchMode()
  const quickLaunchDuration = useCreateAuctionStore((state) => state.quickLaunchDuration)
  const [pendingQuickLaunchRetry, setPendingQuickLaunchRetry] = useState(false)
  const configureAuction = useCreateAuctionStore((state) => state.configureAuction)
  const customizePool = useCreateAuctionStore((state) => state.customizePool)
  const xVerification = useCreateAuctionStore((state) => state.xVerification)
  const { setStep, setStartTime, setEndTime } = useCreateAuctionStoreActions()
  const activeAddress = useActiveAddress(Platform.EVM)
  const { evmAccount } = useWallet()
  const trace = useTrace()

  const handleEditTokenInfo = useCallback(() => setStep(CreateAuctionStep.ADD_TOKEN_INFO), [setStep])
  const handleEditAuctionConfig = useCallback(() => setStep(CreateAuctionStep.CONFIGURE_AUCTION), [setStep])
  const handleEditCustomizePool = useCallback(() => setStep(CreateAuctionStep.CUSTOMIZE_POOL), [setStep])

  const tokenName =
    tokenForm.mode === TokenMode.CREATE_NEW
      ? tokenForm.name || t('toucan.createAuction.step.tokenInfo.namePlaceholder')
      : (tokenForm.existingTokenCurrencyInfo?.currency.name ?? '')

  const tokenSymbol =
    tokenForm.mode === TokenMode.CREATE_NEW
      ? tokenForm.symbol
      : (tokenForm.existingTokenCurrencyInfo?.currency.symbol ?? '')

  const chainId =
    tokenForm.mode === TokenMode.CREATE_NEW
      ? tokenForm.network
      : (tokenForm.existingTokenCurrencyInfo?.currency.chainId ?? UniverseChainId.Mainnet)

  const handleOpenKycHookExplorer = useCallback(() => {
    if (!configureAuction.kycValidationHookAddress) {
      return
    }
    const explorerLink = getExplorerLink({
      chainId,
      data: configureAuction.kycValidationHookAddress,
      type: ExplorerDataType.ADDRESS,
    })
    if (explorerLink) {
      openUri({ uri: explorerLink }).catch((e) => {
        logger.error(e, { tags: { file: 'ReviewLaunchStep', function: 'handleOpenKycHookExplorer' } })
      })
    }
  }, [chainId, configureAuction.kycValidationHookAddress])

  const { committed } = configureAuction

  const fdv = useMemo(() => {
    if (!configureAuction.floorPrice || !committed) {
      return undefined
    }
    return parseFloat(configureAuction.floorPrice) * parseFloat(committed.totalSupply.toExact())
  }, [configureAuction.floorPrice, committed])

  const stableRaiseUsdPrice = useStableRaiseUsdPrice({ raiseCurrency: configureAuction.raiseCurrency, chainId })
  const floorPriceNum = configureAuction.floorPrice ? parseFloat(configureAuction.floorPrice) : undefined

  const launchThreshold = committed
    ? getLaunchThreshold({
        floorPrice: configureAuction.floorPrice,
        raiseCurrency: configureAuction.raiseCurrency,
        chainId,
        auctionSupplyAmount: committed.auctionSupplyAmount,
        postAuctionLiquidityAmount: committed.postAuctionLiquidityAmount,
      })
    : undefined
  const launchThresholdAmount = launchThreshold
    ? formatNumberOrString({ value: launchThreshold.toExact(), type: NumberType.TokenQuantityStats })
    : undefined

  const nativeCurrencyInfo = useNativeCurrencyInfo(chainId)
  const stablecoinCurrencyId = useMemo(() => buildCurrencyId(chainId, getPrimaryStablecoin(chainId).address), [chainId])
  const stablecoinCurrencyInfo = useCurrencyInfo(stablecoinCurrencyId)
  const raiseCurrencyInfo =
    configureAuction.raiseCurrency === RaiseCurrency.NATIVE ? nativeCurrencyInfo : stablecoinCurrencyInfo

  const feeTierDisplay = formatPercent(customizePool.fee.feeAmount / BIPS_BASE, 4)

  const resolvedPoolOwner = isAddress(customizePool.poolOwner) ? customizePool.poolOwner : (activeAddress ?? '')
  const showPoolOwner =
    !!resolvedPoolOwner &&
    !!activeAddress &&
    !areAddressesEqual({
      addressInput1: { address: resolvedPoolOwner, platform: Platform.EVM },
      addressInput2: { address: activeAddress, platform: Platform.EVM },
    })

  const resolvedFeesRecipient = customizePool.feesRecipientAddress || resolvedPoolOwner
  const showFeesRecipient =
    !!resolvedFeesRecipient &&
    !!activeAddress &&
    !areAddressesEqual({
      addressInput1: { address: resolvedFeesRecipient, platform: Platform.EVM },
      addressInput2: { address: activeAddress, platform: Platform.EVM },
    })

  const poolOwnerDisplay = shortenAddress({ address: resolvedPoolOwner, chars: 6 })
  const feesRecipientDisplay = shortenAddress({ address: resolvedFeesRecipient, chars: 6 })

  const priceRangeDisplay = (() => {
    if (customizePool.priceRangeStrategy === PriceRangeStrategy.CONCENTRATED_FULL_RANGE) {
      return t('toucan.createAuction.step.customizePool.priceRange.concentratedFullRange')
    }
    if (customizePool.priceRangeStrategy === PriceRangeStrategy.CUSTOM_RANGE) {
      return t('common.custom')
    }
    return t('toucan.createAuction.step.customizePool.priceRange.fullRange')
  })()

  const currencyAddress = getRaiseCurrencyAddress(configureAuction.raiseCurrency, chainId)

  const getCreateFailedProperties = useEvent(
    (args: { failedStep: AuctionCreateFailedStep; errorCode?: string | number }) =>
      getAuctionCreateFailedProperties({ trace, chainId, tokenMode: tokenForm.mode, ...args }),
  )

  const getFailedDiagnostics = useEvent(() => getAuctionCreateFailedDiagnostics({ configureAuction, customizePool }))

  // Final guard against an existing-token deposit that exceeds the wallet's held balance at launch
  // time (e.g. tokens moved out after the Configure step). The request builder clamps to this.
  const existingTokenCurrency =
    tokenForm.mode === TokenMode.EXISTING ? tokenForm.existingTokenCurrencyInfo?.currency : undefined
  const { balance: existingTokenWalletBalance } = useExistingTokenWalletBalance(existingTokenCurrency)
  const existingTokenWalletBalanceRaw =
    tokenForm.mode === TokenMode.EXISTING && existingTokenWalletBalance
      ? BigInt(existingTokenWalletBalance.quotient.toString())
      : undefined

  const launchSubmit = useCreateAuctionSubmit({
    tokenForm,
    configureAuction,
    customizePool,
    walletAddress: activeAddress ?? undefined,
    currencyAddress,
    xVerification,
    existingTokenWalletBalanceRaw,
    getCreateFailedProperties,
  })

  const getLaunchAnalyticsProperties = useEvent(
    (addresses: { predictedAuctionAddress: string; predictedTokenAddress: string }) =>
      getAuctionCreateAnalyticsProperties({
        trace,
        chainId,
        tokenMode: tokenForm.mode,
        tokenSymbol,
        configureAuction,
        customizePool,
        raiseCurrencyAddress: currencyAddress,
        raiseUsdPrice: stableRaiseUsdPrice,
        maxFdv: fdv,
        ...addresses,
      }),
  )

  // Raw form name (no display placeholder) and a persistence-safe logo URL: the gateway URL
  // outlives the session and survives a reload, unlike the `blob:` preview the review section uses.
  const launchTokenName =
    (tokenForm.mode === TokenMode.CREATE_NEW ? tokenForm.name : tokenForm.existingTokenCurrencyInfo?.currency.name) ||
    undefined
  const launchTokenLogoUrl =
    tokenForm.mode === TokenMode.CREATE_NEW
      ? resolveTokenImageSrc(tokenForm.imageUrl)
      : (tokenForm.existingTokenCurrencyInfo?.logoUrl ?? undefined)

  // Quick launch has no editable start time, so a stale start is fixed by refreshing the preset
  // window and retrying once the store update has rendered (handleRetry reads this render's props).
  const handleQuickLaunchRetry = useEvent(() => {
    applyQuickLaunchAuctionWindow({ setStartTime, setEndTime }, quickLaunchDuration)
    setPendingQuickLaunchRetry(true)
  })

  const launchFlow = useLaunchAuctionFlow({
    evmAccount,
    chainId,
    getLaunchAnalyticsProperties,
    getCreateFailedProperties,
    getFailedDiagnostics,
    launchSubmit,
    tokenName: launchTokenName,
    tokenSymbol: tokenSymbol || undefined,
    tokenLogoUrl: launchTokenLogoUrl,
  })

  const launchFlowHandleRetry = launchFlow.handleRetry
  useEffect(() => {
    if (pendingQuickLaunchRetry && configureAuction.startTime && configureAuction.startTime.getTime() > Date.now()) {
      setPendingQuickLaunchRetry(false)
      launchFlowHandleRetry()
    }
  }, [pendingQuickLaunchRetry, configureAuction.startTime, launchFlowHandleRetry])

  if (!committed || !raiseCurrencyInfo) {
    return null
  }

  return (
    <Flex gap="$spacing12">
      <Flex backgroundColor="$surface1" p="$spacing24" gap="$spacing32" $md={{ p: '$none' }}>
        <ReviewLaunchTokenInfoSection
          tokenForm={tokenForm}
          tokenName={tokenName}
          tokenSymbol={tokenSymbol}
          description={tokenForm.description}
          xProfile={tokenForm.xProfile}
          websiteLink={tokenForm.mode === TokenMode.EXISTING ? tokenForm.websiteLink : undefined}
          onEditTokenInfo={handleEditTokenInfo}
        />

        <ReviewLaunchAuctionDetailsSection
          configureAuction={configureAuction}
          committed={committed}
          raiseCurrencyInfo={raiseCurrencyInfo}
          chainId={chainId}
          tokenSymbol={tokenSymbol}
          isNewToken={tokenForm.mode === TokenMode.CREATE_NEW}
          tokenColor={tokenColor}
          stableRaiseUsdPrice={stableRaiseUsdPrice}
          floorPriceNum={floorPriceNum}
          fdv={fdv}
          onEditAuctionConfig={quickLaunch ? undefined : handleEditAuctionConfig}
          onOpenKycHookExplorer={handleOpenKycHookExplorer}
        />

        <Flex gap="$spacing16">
          <SectionHeader
            title={t('toucan.createAuction.step.reviewLaunch.poolDetails')}
            onEdit={quickLaunch ? undefined : handleEditCustomizePool}
          />

          <ReviewRow label={t('fee.tier')}>
            <Text variant="body1" color="$neutral1">
              {feeTierDisplay}
            </Text>
          </ReviewRow>

          {customizePool.priceRangeStrategy === PriceRangeStrategy.CUSTOM_RANGE ? (
            <ReviewCustomPriceRangeExpandable
              label={t('toucan.createAuction.step.customizePool.priceRange.title')}
              summaryLabel={priceRangeDisplay}
              entries={customizePool.customPriceRanges}
            />
          ) : (
            <ReviewRow label={t('toucan.createAuction.step.customizePool.priceRange.title')}>
              <Text variant="body1" color="$neutral1">
                {priceRangeDisplay}
              </Text>
            </ReviewRow>
          )}

          {showPoolOwner ? (
            <ReviewRow label={t('toucan.createAuction.step.reviewLaunch.poolOwner')}>
              <Text variant="body1" color="$neutral1">
                {poolOwnerDisplay}
              </Text>
            </ReviewRow>
          ) : null}

          {customizePool.timeLockEnabled ? (
            <ReviewRow label={t('toucan.createAuction.step.reviewLaunch.timeLock')}>
              <Text variant="body1" color="$neutral1">
                {customizePool.timeLockPreset === TimeLockPreset.Permanent
                  ? t('toucan.createAuction.step.customizePool.timeLock.preset.permanent')
                  : t('common.day.count', { count: customizePool.timeLockDurationDays })}
              </Text>
            </ReviewRow>
          ) : null}

          {customizePool.timeLockEnabled && customizePool.sendFeesEnabled && showFeesRecipient ? (
            <ReviewRow label={t('toucan.createAuction.step.reviewLaunch.sendFees')}>
              <Text variant="body1" color="$neutral1">
                {feesRecipientDisplay}
              </Text>
            </ReviewRow>
          ) : null}

          {customizePool.timeLockEnabled && customizePool.buybackAndBurnEnabled ? (
            <ReviewRow label={t('toucan.createAuction.step.reviewLaunch.buybackAndBurn')}>
              <Text variant="body1" color="$neutral1">
                {t('toucan.createAuction.step.reviewLaunch.enabled')}
              </Text>
            </ReviewRow>
          ) : null}
        </Flex>
      </Flex>

      <Flex gap="$spacing8">
        <Flex row>
          <Button
            size="large"
            emphasis="primary"
            isDisabled={launchSubmit.isDisabled}
            fill
            backgroundColor={launchSubmit.isDisabled ? undefined : tokenColor}
            onPress={launchFlow.openReviewModal}
          >
            {t('toucan.createAuction.launchAuction')}
          </Button>
        </Flex>
      </Flex>

      <LaunchAuctionReviewModal
        isOpen={launchFlow.isReviewModalVisible}
        onClose={launchFlow.closeReviewModal}
        tokenName={tokenName}
        tokenSymbol={tokenSymbol}
        description={tokenForm.description}
        isNewToken={tokenForm.mode === TokenMode.CREATE_NEW}
        committed={committed}
        startTime={configureAuction.startTime}
        endTime={configureAuction.endTime}
        feeTierDisplay={feeTierDisplay}
        raiseCurrencySymbol={raiseCurrencyInfo.currency.symbol ?? ''}
        launchThresholdAmount={launchThresholdAmount}
        tokenColor={tokenColor}
        progressSteps={launchFlow.progressSteps}
        currentProgressStepIndex={launchFlow.currentProgressStepIndex}
        currentStepPending={launchFlow.currentStepPending}
        isLaunching={launchFlow.isLaunching}
        isPreparing={launchFlow.isPreparing}
        onLaunchToken={launchFlow.handleLaunchToken}
      />

      <LaunchAuctionErrorModal
        isOpen={launchFlow.isErrorModalOpen}
        tokenSymbol={tokenSymbol}
        error={launchFlow.launchError}
        onClose={launchFlow.handleCloseErrorModal}
        onRetry={quickLaunch ? handleQuickLaunchRetry : launchFlow.handleRetry}
        onEditTokenInfo={handleEditTokenInfo}
      />

      <LaunchAuctionSuccessModal
        isOpen={launchFlow.isSuccessModalOpen}
        tokenSymbol={tokenSymbol}
        chainId={chainId}
        launchHash={launchFlow.launchSuccess?.hash}
        onClose={launchFlow.handleCloseSuccessModal}
        onViewAuction={launchFlow.handleViewAuction}
      />
    </Flex>
  )
}
