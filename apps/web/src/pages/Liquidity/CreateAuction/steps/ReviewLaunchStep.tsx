import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useCurrencyInfo, useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { isAddress } from '~/chains'
import { BIPS_BASE } from '~/constants/misc'
import { useActiveAddress } from '~/features/accounts/store/hooks'
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
import { useCreateAuctionTokenColor } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionTokenColor'
import { useStableRaiseUsdPrice } from '~/pages/Liquidity/CreateAuction/hooks/useStableRaiseUsdPrice'
import {
  CreateAuctionStep,
  PriceRangeStrategy,
  RaiseCurrency,
  TimeLockPreset,
  TokenMode,
} from '~/pages/Liquidity/CreateAuction/types'

// oxlint-disable-next-line complexity
export function ReviewLaunchStep(): JSX.Element | null {
  const { t } = useTranslation()
  const tokenColor = useCreateAuctionTokenColor()
  const { formatPercent } = useLocalizationContext()
  const tokenForm = useCreateAuctionStore((state) => state.tokenForm)
  const configureAuction = useCreateAuctionStore((state) => state.configureAuction)
  const customizePool = useCreateAuctionStore((state) => state.customizePool)
  const { setStep } = useCreateAuctionStoreActions()
  const activeAddress = useActiveAddress(Platform.EVM)

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

  const nativeCurrencyInfo = useNativeCurrencyInfo(chainId)
  const usdcCurrencyId = useMemo(() => {
    const usdc = getChainInfo(chainId).tokens.USDC
    return usdc ? buildCurrencyId(chainId, usdc.address) : undefined
  }, [chainId])
  const usdcCurrencyInfo = useCurrencyInfo(usdcCurrencyId, { skip: !usdcCurrencyId })
  const raiseCurrencyInfo = configureAuction.raiseCurrency === RaiseCurrency.ETH ? nativeCurrencyInfo : usdcCurrencyInfo

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

  if (!committed || !raiseCurrencyInfo) {
    return null
  }

  return (
    <Flex gap="$spacing12">
      <Flex backgroundColor="$surface1" p="$spacing24" gap="$spacing32">
        <ReviewLaunchTokenInfoSection
          tokenForm={tokenForm}
          tokenName={tokenName}
          tokenSymbol={tokenSymbol}
          description={tokenForm.description}
          xProfile={tokenForm.xProfile}
          websiteLink={tokenForm.websiteLink}
          onEditTokenInfo={handleEditTokenInfo}
        />

        <ReviewLaunchAuctionDetailsSection
          configureAuction={configureAuction}
          committed={committed}
          raiseCurrencyInfo={raiseCurrencyInfo}
          chainId={chainId}
          tokenSymbol={tokenSymbol}
          tokenColor={tokenColor}
          stableRaiseUsdPrice={stableRaiseUsdPrice}
          floorPriceNum={floorPriceNum}
          fdv={fdv}
          onEditAuctionConfig={handleEditAuctionConfig}
          onOpenKycHookExplorer={handleOpenKycHookExplorer}
        />

        <Flex gap="$spacing16">
          <SectionHeader
            title={t('toucan.createAuction.step.reviewLaunch.poolDetails')}
            onEdit={handleEditCustomizePool}
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

      <Flex row>
        <Button size="large" emphasis="primary" isDisabled fill backgroundColor={tokenColor}>
          {t('toucan.createAuction.launchAuction')}
        </Button>
      </Flex>
    </Flex>
  )
}
