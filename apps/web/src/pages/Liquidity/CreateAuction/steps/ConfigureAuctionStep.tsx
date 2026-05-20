import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { AuctionAdvancedSettings } from '~/pages/Liquidity/CreateAuction/components/AuctionAdvancedSettings'
import { AuctionDistributionSection } from '~/pages/Liquidity/CreateAuction/components/AuctionDistributionSection'
import { AuctionSupplySection } from '~/pages/Liquidity/CreateAuction/components/AuctionSupplySection'
import { DurationSection } from '~/pages/Liquidity/CreateAuction/components/DurationSection'
import { PostAuctionLiquiditySection } from '~/pages/Liquidity/CreateAuction/components/PostAuctionLiquiditySection'
import { PriceSettingsSection } from '~/pages/Liquidity/CreateAuction/components/PriceSettingsSection'
import { TokenSummaryCard, useTokenSummaryCardProps } from '~/pages/Liquidity/CreateAuction/components/TokenSummaryCard'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useCreateAuctionTokenColor } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionTokenColor'
import { useCreateAuctionTokenLogoNode } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionTokenLogoNode'
import { useIsStepValid } from '~/pages/Liquidity/CreateAuction/hooks/useIsStepValid'
import { useStableRaiseUsdPrice } from '~/pages/Liquidity/CreateAuction/hooks/useStableRaiseUsdPrice'
import {
  type ConfigureAuctionFormState,
  CreateAuctionStep,
  type InputCurrency,
  PostAuctionLiquidityAllocationType,
} from '~/pages/Liquidity/CreateAuction/types'
import {
  percentOfSoldToLiquidityFromDepositAndLiquidityAmount,
  percentOfAmount,
} from '~/pages/Liquidity/CreateAuction/utils'

const AUCTION_DISTRIBUTION_TOKEN_LOGO_SIZE = 24

export function ConfigureAuctionStep() {
  const { t } = useTranslation()
  const tokenColor = useCreateAuctionTokenColor()
  const tokenSummaryCardProps = useTokenSummaryCardProps()
  const auctionDistributionTokenLogo = useCreateAuctionTokenLogoNode(AUCTION_DISTRIBUTION_TOKEN_LOGO_SIZE, {
    hideNetworkLogo: true,
  })
  const configureAuction: ConfigureAuctionFormState = useCreateAuctionStore((state) => state.configureAuction)

  const {
    goToPreviousStep,
    goToNextStep,
    addPostAuctionLiquidityTier,
    removePostAuctionLiquidityTier,
    setAuctionConfig,
    setSinglePostAuctionLiquidityPercent,
    setStartTime,
    setEndTime,
    setPostAuctionLiquidityAllocationType,
    setRaiseCurrency,
    setFloorPrice,
    updatePostAuctionLiquidityTier,
  } = useCreateAuctionStoreActions()

  const { startTime, endTime, committed, postAuctionLiquidityAllocation, raiseCurrency, floorPrice } = configureAuction
  const isNextStepDisabled = !useIsStepValid(CreateAuctionStep.CONFIGURE_AUCTION)

  // Active currency for price/milestone inputs. UI-only — not part of submitted config.
  // Defaults to USD for both ETH and USDC: raise-token amounts are either too small (ETH) or
  // numerically identical to USD (USDC) to make the raise-currency view useful as a default.
  // Resets when raiseCurrency changes so the toggle starts fresh after a swap.
  const [inputCurrency, setInputCurrency] = useState<InputCurrency>('usd')
  useEffect(() => {
    setInputCurrency('usd')
  }, [raiseCurrency])

  // Snapshot the raise-token USD price once per raise-currency selection. Holding it stable
  // keeps every USD↔raise conversion in the flow agreeing on one anchor, so the user's "$100k"
  // doesn't drift to "$99,990" on the next oracle tick. Re-snapshots only on raise-currency
  // change. Single source of truth — children receive this instead of calling useUSDCPrice themselves.
  const usdPriceNum = useStableRaiseUsdPrice({ raiseCurrency, chainId: committed?.totalSupply.currency.chainId ?? 1 })

  const handleDurationChange = useCallback(
    ({ startTime: nextStart, endTime: nextEnd }: { startTime: Date | undefined; endTime: Date | undefined }) => {
      setStartTime(nextStart)
      setEndTime(nextEnd)
    },
    [setStartTime, setEndTime],
  )

  const handleAuctionSupplyPercentChange = useCallback(
    (percent: number) => {
      if (!committed) {
        return
      }
      const newAuctionSupply = percentOfAmount(committed.totalSupply, percent)
      setAuctionConfig({ auctionSupplyAmount: newAuctionSupply })
    },
    [committed, setAuctionConfig],
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
          <DurationSection startTime={startTime} endTime={endTime} onChange={handleDurationChange} />

          <AuctionSupplySection
            auctionSupplyAmount={auctionSupplyAmount}
            tokenTotalSupply={totalSupply}
            tokenSymbol={tokenSymbol}
            onSelectAuctionSupplyPercent={handleAuctionSupplyPercentChange}
            onAuctionSupplyAmountChange={handleAuctionSupplyAmountChange}
          />

          <PriceSettingsSection
            chainId={totalSupply.currency.chainId}
            raiseCurrency={raiseCurrency}
            onSelect={setRaiseCurrency}
            floorPrice={floorPrice}
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
        </Flex>
        <AuctionAdvancedSettings />
      </Flex>

      <Flex row>
        <Button
          size="medium"
          emphasis="primary"
          onPress={goToNextStep}
          isDisabled={isNextStepDisabled}
          fill
          backgroundColor={tokenColor}
        >
          {t('common.button.continue')}
        </Button>
      </Flex>
    </Flex>
  )
}
