import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { Edit } from 'ui/src/components/icons/Edit'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useCurrencyInfo, useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { isAddress } from '~/chains/utilities'
import { BIPS_BASE } from '~/constants/misc'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { TokenDistributionBar } from '~/pages/Liquidity/CreateAuction/components/TokenDistributionBar'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useCreateAuctionTokenColor } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionTokenColor'
import {
  CreateAuctionStep,
  PriceRangeStrategy,
  RaiseCurrency,
  TimeLockPreset,
  TokenMode,
} from '~/pages/Liquidity/CreateAuction/types'
import { amountToPercent } from '~/pages/Liquidity/CreateAuction/utils'
import { formatReviewAuctionDuration } from '~/pages/Liquidity/CreateAuction/utils/duration'

const TOKEN_LOGO_SIZE = 60
const CURRENCY_LOGO_SIZE = iconSizes.icon20

function EditButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  return (
    <TouchableArea
      backgroundColor="$surface3"
      borderRadius="$rounded12"
      px="$spacing12"
      py="$spacing8"
      flexDirection="row"
      alignItems="center"
      gap="$spacing8"
      onPress={onPress}
    >
      <Edit size="$icon.20" color="$neutral1" />
      <Text variant="buttonLabel3" color="$neutral1">
        {t('common.button.edit')}
      </Text>
    </TouchableArea>
  )
}

function SectionHeader({ title, onEdit }: { title: string; onEdit?: () => void }) {
  return (
    <Flex
      row
      justifyContent="space-between"
      alignItems="center"
      borderBottomWidth={1}
      borderBottomColor="$surface3"
      pb="$spacing12"
    >
      <Text variant="heading3" color="$neutral1">
        {title}
      </Text>
      {onEdit && <EditButton onPress={onEdit} />}
    </Flex>
  )
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Flex row justifyContent="space-between" alignItems="center">
      <Text variant="body1" color="$neutral2">
        {label}
      </Text>
      {children}
    </Flex>
  )
}

// oxlint-disable-next-line complexity
export function ReviewLaunchStep() {
  const { t } = useTranslation()
  const tokenColor = useCreateAuctionTokenColor()
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const tokenForm = useCreateAuctionStore((state) => state.tokenForm)
  const configureAuction = useCreateAuctionStore((state) => state.configureAuction)
  const customizePool = useCreateAuctionStore((state) => state.customizePool)
  const { setStep } = useCreateAuctionStoreActions()
  const activeAddress = useActiveAddress(Platform.EVM)

  const handleEditTokenInfo = () => setStep(CreateAuctionStep.ADD_TOKEN_INFO)
  const handleEditAuctionConfig = () => setStep(CreateAuctionStep.CONFIGURE_AUCTION)
  const handleEditCustomizePool = () => setStep(CreateAuctionStep.CUSTOMIZE_POOL)

  const dayjsInstance = useLocalizedDayjs()
  const formattedStartDate = configureAuction.startTime
    ? dayjsInstance(configureAuction.startTime).format('MM/DD/YY')
    : undefined

  const tokenName =
    tokenForm.mode === TokenMode.CREATE_NEW
      ? tokenForm.name || t('toucan.createAuction.step.tokenInfo.namePlaceholder')
      : (tokenForm.existingTokenCurrencyInfo?.currency.name ?? '')

  const tokenSymbol =
    tokenForm.mode === TokenMode.CREATE_NEW
      ? tokenForm.symbol
      : (tokenForm.existingTokenCurrencyInfo?.currency.symbol ?? '')

  const description = tokenForm.description

  const xProfile = tokenForm.xProfile

  const chainId =
    tokenForm.mode === TokenMode.CREATE_NEW
      ? tokenForm.network
      : (tokenForm.existingTokenCurrencyInfo?.currency.chainId ?? UniverseChainId.Mainnet)

  const { committed } = configureAuction
  const formattedAuctionAmount = committed
    ? formatNumberOrString({ value: committed.auctionSupplyAmount.toExact(), type: NumberType.TokenNonTx })
    : '0'

  const fdv = useMemo(() => {
    if (!configureAuction.floorPrice || !committed) {
      return undefined
    }
    return parseFloat(configureAuction.floorPrice) * parseFloat(committed.totalSupply.toExact())
  }, [configureAuction.floorPrice, committed])
  const formattedFdv =
    fdv !== undefined ? formatNumberOrString({ value: fdv.toString(), type: NumberType.TokenNonTx }) : undefined

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
      return t('common.customRange')
    }
    return t('toucan.createAuction.step.customizePool.priceRange.fullRange')
  })()

  if (!committed || !raiseCurrencyInfo) {
    return null
  }

  const postAuctionLiquidityPercentDisplay = Math.round(
    amountToPercent(committed.auctionSupplyAmount, committed.postAuctionLiquidityAmount),
  )

  return (
    <Flex gap="$spacing12">
      <Flex backgroundColor="$surface1" p="$spacing24" gap="$spacing32">
        {/* Token info */}
        <Flex gap="$spacing20">
          <SectionHeader title={t('toucan.createAuction.step.tokenInfo.title')} />

          <Flex row alignItems="center" gap="$spacing16">
            {tokenForm.mode === TokenMode.CREATE_NEW ? (
              <TokenLogo
                url={tokenForm.imageUrl || null}
                symbol={tokenForm.symbol}
                name={tokenForm.name}
                chainId={tokenForm.network}
                size={TOKEN_LOGO_SIZE}
              />
            ) : (
              <CurrencyLogo currencyInfo={tokenForm.existingTokenCurrencyInfo ?? null} size={TOKEN_LOGO_SIZE} />
            )}
            <Flex flex={1} gap="$spacing4">
              <Text variant="heading3" color="$neutral1">
                {tokenName}
              </Text>
              <Text variant="body2" color="$neutral2">
                {tokenSymbol}
              </Text>
            </Flex>
            <EditButton onPress={handleEditTokenInfo} />
          </Flex>

          {description ? (
            <Text variant="body2" color="$neutral1">
              {description}
            </Text>
          ) : null}

          {xProfile ? (
            <Flex row>
              <Flex
                backgroundColor="$surface3"
                borderRadius="$roundedFull"
                flexDirection="row"
                alignItems="center"
                gap="$spacing8"
                pl="$spacing8"
                pr="$spacing12"
                py="$spacing6"
              >
                <XTwitter size="$icon.16" color="$neutral1" />
                <Text variant="buttonLabel3" color="$neutral1">
                  @{xProfile}
                </Text>
              </Flex>
            </Flex>
          ) : null}
        </Flex>

        {/* Auction details */}
        <Flex gap="$spacing16">
          <SectionHeader
            title={t('toucan.createAuction.step.configureAuction.title')}
            onEdit={handleEditAuctionConfig}
          />

          {configureAuction.startTime ? (
            <ReviewRow label={t('toucan.createAuction.step.reviewLaunch.startDate')}>
              <Text variant="body1" color="$neutral1">
                {formattedStartDate}
              </Text>
            </ReviewRow>
          ) : null}

          <ReviewRow label={t('toucan.createAuction.step.configureAuction.duration')}>
            <Text variant="body1" color="$neutral1">
              {configureAuction.startTime && configureAuction.endTime
                ? formatReviewAuctionDuration(
                    {
                      startTime: configureAuction.startTime,
                      endTime: configureAuction.endTime,
                    },
                    t,
                  )
                : t('common.day.count', { count: 0 })}
            </Text>
          </ReviewRow>

          <ReviewRow label={t('toucan.details.raiseCurrency')}>
            <Flex row alignItems="center" gap="$spacing6">
              <CurrencyLogo hideNetworkLogo currencyInfo={raiseCurrencyInfo} size={CURRENCY_LOGO_SIZE} />
              <Text variant="body1" color="$neutral1">
                {configureAuction.raiseCurrency}
              </Text>
            </Flex>
          </ReviewRow>

          {configureAuction.floorPrice ? (
            <ReviewRow label={t('toucan.createAuction.step.configureAuction.floorPrice')}>
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="body1" color="$neutral1">
                  {configureAuction.floorPrice} {configureAuction.raiseCurrency}
                </Text>
                {formattedFdv !== undefined ? (
                  <Text variant="body1" color="$neutral2">
                    ({formattedFdv} {configureAuction.raiseCurrency} FDV)
                  </Text>
                ) : null}
              </Flex>
            </ReviewRow>
          ) : null}

          <ReviewRow label={t('toucan.createAuction.step.reviewLaunch.auctionAmount')}>
            <Text variant="body1" color="$neutral1">
              {formattedAuctionAmount} {tokenSymbol}
            </Text>
          </ReviewRow>

          <ReviewRow label={t('toucan.createAuction.step.configureAuction.postAuctionLiquidity')}>
            <Text variant="body1" color="$neutral1">
              {formatPercent(postAuctionLiquidityPercentDisplay)}
            </Text>
          </ReviewRow>

          <TokenDistributionBar
            auctionSupplyAmount={committed.auctionSupplyAmount}
            postAuctionLiquidityAmount={committed.postAuctionLiquidityAmount}
            tokenSymbol={tokenSymbol}
            chainId={chainId}
            raiseCurrency={configureAuction.raiseCurrency}
            tokenColor={tokenColor}
          />

          <ReviewRow label={t('toucan.details.kyc')}>
            <Text variant="body1" color="$neutral1">
              {t('toucan.createAuction.step.reviewLaunch.kycDisabled')}
            </Text>
          </ReviewRow>
        </Flex>

        {/* Pool details */}
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

          <ReviewRow label={t('toucan.createAuction.step.customizePool.priceRange.title')}>
            <Text variant="body1" color="$neutral1">
              {priceRangeDisplay}
            </Text>
          </ReviewRow>

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

          {customizePool.timeLockEnabled && customizePool.autocompoundFeesEnabled ? (
            <ReviewRow label={t('toucan.createAuction.step.customizePool.autocompoundFees')}>
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
