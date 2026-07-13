import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ExternalLink as ExternalLinkIcon } from 'ui/src/components/icons/ExternalLink'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import {
  ReviewAuctionDateTime,
  ReviewRow,
  SectionHeader,
} from '~/pages/Liquidity/CreateAuction/components/reviewLaunch/ReviewLaunchStepPrimitives'
import { ReviewPostAuctionLiquidityExpandable } from '~/pages/Liquidity/CreateAuction/components/ReviewPostAuctionLiquidityExpandable'
import { TokenDistributionBar } from '~/pages/Liquidity/CreateAuction/components/TokenDistributionBar'
import { getLaunchThreshold } from '~/pages/Liquidity/CreateAuction/launchThreshold'
import type { TokenAccentHex } from '~/pages/Liquidity/CreateAuction/tokenAccentHex'
import {
  PostAuctionLiquidityAllocationType,
  type AuctionTokenAmounts,
  type ConfigureAuctionFormState,
} from '~/pages/Liquidity/CreateAuction/types'
import { amountToPercent } from '~/pages/Liquidity/CreateAuction/utils'

const CURRENCY_LOGO_SIZE = iconSizes.icon20

/** Same as Toucan `AuctionStatsBanner` for bid-token / fiat subscript display. */
const SUBSCRIPT_THRESHOLD = 4

interface ReviewLaunchAuctionDetailsSectionProps {
  configureAuction: ConfigureAuctionFormState
  committed: AuctionTokenAmounts
  raiseCurrencyInfo: CurrencyInfo
  chainId: UniverseChainId
  tokenSymbol: string
  /** New tokens show their (customizable) total supply; existing tokens omit it here. LP-960. */
  isNewToken: boolean
  tokenColor: TokenAccentHex | undefined
  stableRaiseUsdPrice: number | null
  floorPriceNum: number | undefined
  fdv: number | undefined
  onEditAuctionConfig: () => void
  onOpenKycHookExplorer: () => void
}

export function ReviewLaunchAuctionDetailsSection({
  configureAuction,
  committed,
  raiseCurrencyInfo,
  chainId,
  tokenSymbol,
  isNewToken,
  tokenColor,
  stableRaiseUsdPrice,
  floorPriceNum,
  fdv,
  onEditAuctionConfig,
  onOpenKycHookExplorer,
}: ReviewLaunchAuctionDetailsSectionProps): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const { symbol: fiatSymbol } = useAppFiatCurrencyInfo()

  const postAuctionLiquidityAllocation = configureAuction.postAuctionLiquidityAllocation
  const postAuctionLiquidityPercentDisplay = Math.round(
    amountToPercent(committed.auctionSupplyAmount, committed.postAuctionLiquidityAmount),
  )

  const formattedAuctionAmount = formatNumberOrString({
    value: committed.auctionSupplyAmount.toExact(),
    type: NumberType.TokenNonTx,
  })

  const launchThreshold = getLaunchThreshold({
    floorPrice: configureAuction.floorPrice,
    raiseCurrency: configureAuction.raiseCurrency,
    chainId,
    auctionSupplyAmount: committed.auctionSupplyAmount,
    postAuctionLiquidityAmount: committed.postAuctionLiquidityAmount,
  })
  const formattedLaunchThreshold = launchThreshold
    ? formatNumberOrString({ value: launchThreshold.toExact(), type: NumberType.TokenQuantityStats })
    : undefined

  const floorFiatAmount =
    stableRaiseUsdPrice !== null &&
    floorPriceNum !== undefined &&
    Number.isFinite(floorPriceNum) &&
    Number.isFinite(stableRaiseUsdPrice)
      ? floorPriceNum * stableRaiseUsdPrice
      : undefined

  const fdvFiatAmount =
    stableRaiseUsdPrice !== null && fdv !== undefined && Number.isFinite(fdv) && Number.isFinite(stableRaiseUsdPrice)
      ? fdv * stableRaiseUsdPrice
      : undefined

  return (
    <Flex gap="$spacing16">
      <SectionHeader title={t('toucan.createAuction.step.configureAuction.title')} onEdit={onEditAuctionConfig} />

      {configureAuction.startTime ? (
        <ReviewRow label={t('toucan.createAuction.step.reviewLaunch.startDate')}>
          <ReviewAuctionDateTime date={configureAuction.startTime} />
        </ReviewRow>
      ) : null}

      {configureAuction.endTime ? (
        <ReviewRow label={t('toucan.createAuction.step.configureAuction.duration.endDate')}>
          <ReviewAuctionDateTime date={configureAuction.endTime} />
        </ReviewRow>
      ) : null}

      {isNewToken ? (
        <ReviewRow label={t('toucan.auction.totalSupply')}>
          <Text variant="body1" color="$neutral1">
            {formatNumberOrString({ value: committed.totalSupply.toExact(), type: NumberType.TokenNonTx })}{' '}
            {tokenSymbol}
          </Text>
        </ReviewRow>
      ) : null}

      <ReviewRow label={t('toucan.createAuction.step.reviewLaunch.auctionAmount')}>
        <Text variant="body1" color="$neutral1">
          {formattedAuctionAmount} {tokenSymbol}
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
        <ReviewRow label={t('toucan.createAuction.step.configureAuction.floorPrice.token')}>
          <Flex row alignItems="center" gap="$spacing4" flexWrap="wrap" justifyContent="flex-end">
            {floorPriceNum !== undefined && Number.isFinite(floorPriceNum) ? (
              <SubscriptZeroPrice
                value={floorPriceNum}
                symbol={configureAuction.raiseCurrency}
                variant="body1"
                color="$neutral1"
                minSignificantDigits={1}
                maxSignificantDigits={3}
                subscriptThreshold={SUBSCRIPT_THRESHOLD}
              />
            ) : (
              <Text variant="body1" color="$neutral1">
                {configureAuction.floorPrice} {configureAuction.raiseCurrency}
              </Text>
            )}
            {floorFiatAmount !== undefined ? (
              <Flex row alignItems="baseline" gap="$spacing2">
                <Text variant="body1" color="$neutral2">
                  (
                </Text>
                <SubscriptZeroPrice
                  value={floorFiatAmount}
                  prefix={fiatSymbol}
                  variant="body1"
                  color="$neutral2"
                  minSignificantDigits={1}
                  maxSignificantDigits={4}
                  subscriptThreshold={SUBSCRIPT_THRESHOLD}
                  disableTooltip
                />
                <Text variant="body1" color="$neutral2">
                  )
                </Text>
              </Flex>
            ) : null}
          </Flex>
        </ReviewRow>
      ) : null}

      {fdv !== undefined ? (
        <ReviewRow label={t('toucan.createAuction.step.configureAuction.floorPrice.fdv')}>
          <Flex row alignItems="center" gap="$spacing4" flexWrap="wrap" justifyContent="flex-end">
            <SubscriptZeroPrice
              value={fdv}
              symbol={configureAuction.raiseCurrency}
              variant="body1"
              color="$neutral1"
              minSignificantDigits={1}
              maxSignificantDigits={3}
              subscriptThreshold={SUBSCRIPT_THRESHOLD}
            />
            {fdvFiatAmount !== undefined ? (
              <Flex row alignItems="baseline" gap="$spacing2">
                <Text variant="body1" color="$neutral2">
                  (
                </Text>
                <SubscriptZeroPrice
                  value={fdvFiatAmount}
                  prefix={fiatSymbol}
                  variant="body1"
                  color="$neutral2"
                  minSignificantDigits={1}
                  maxSignificantDigits={4}
                  subscriptThreshold={SUBSCRIPT_THRESHOLD}
                  disableTooltip
                />
                <Text variant="body1" color="$neutral2">
                  )
                </Text>
              </Flex>
            ) : null}
          </Flex>
        </ReviewRow>
      ) : null}

      {postAuctionLiquidityAllocation.type === PostAuctionLiquidityAllocationType.SINGLE ? (
        <>
          <ReviewRow label={t('toucan.details.postAuctionLiquidity')}>
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
          {formattedLaunchThreshold !== undefined ? (
            <ReviewRow label={t('toucan.createAuction.step.configureAuction.launchThreshold')}>
              <Flex row alignItems="center" gap="$spacing6">
                <CurrencyLogo hideNetworkLogo currencyInfo={raiseCurrencyInfo} size={CURRENCY_LOGO_SIZE} />
                <Text variant="body1" color="$neutral1">
                  {formattedLaunchThreshold} {configureAuction.raiseCurrency}
                </Text>
              </Flex>
            </ReviewRow>
          ) : null}
        </>
      ) : (
        <ReviewPostAuctionLiquidityExpandable
          label={t('toucan.details.postAuctionLiquidity')}
          summaryLabel={t('common.custom')}
          tiers={postAuctionLiquidityAllocation.tiers}
          raiseCurrencySymbol={configureAuction.raiseCurrency}
          raiseUsdPrice={stableRaiseUsdPrice}
        />
      )}

      <ReviewRow label={t('toucan.details.kyc')}>
        {configureAuction.kycValidationHookAddress ? (
          <TouchableArea onPress={onOpenKycHookExplorer}>
            <Flex row alignItems="center" gap="$spacing4">
              <Text variant="body1" color="$neutral1">
                {shortenAddress({ address: configureAuction.kycValidationHookAddress, chars: 6 })}
              </Text>
              <ExternalLinkIcon color="$neutral3" size="$icon.16" />
            </Flex>
          </TouchableArea>
        ) : (
          <Text variant="body1" color="$neutral1">
            {t('toucan.details.no')}
          </Text>
        )}
      </ReviewRow>
    </Flex>
  )
}
