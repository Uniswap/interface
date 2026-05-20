import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { TokenDistributionBar } from '~/pages/Liquidity/CreateAuction/components/TokenDistributionBar'
import type { TokenAccentHex } from '~/pages/Liquidity/CreateAuction/tokenAccentHex'
import { type RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'

export function AuctionDistributionSection({
  auctionSupplyAmount,
  postAuctionLiquidityAmount,
  tokenSymbol,
  raiseCurrency,
  chainId,
  tokenColor,
  tokenLogoNode,
}: {
  auctionSupplyAmount: CurrencyAmount<Currency>
  postAuctionLiquidityAmount: CurrencyAmount<Currency>
  tokenSymbol: string
  raiseCurrency: RaiseCurrency
  chainId: UniverseChainId
  tokenColor?: TokenAccentHex
  tokenLogoNode: ReactNode
}) {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const auctionSupplyFormatted = formatNumberOrString({
    value: auctionSupplyAmount.toExact(),
    type: NumberType.TokenQuantityStats,
    placeholder: '0',
  })

  return (
    <Flex gap="$spacing12">
      <Text variant="subheading1" color="$neutral1">
        {t('toucan.createAuction.step.configureAuction.distribution')}
      </Text>
      <Flex row alignItems="center" gap="$spacing8">
        {tokenLogoNode}
        <Text variant="heading3" color="$neutral1">
          {auctionSupplyFormatted} {tokenSymbol}
        </Text>
      </Flex>
      <TokenDistributionBar
        auctionSupplyAmount={auctionSupplyAmount}
        postAuctionLiquidityAmount={postAuctionLiquidityAmount}
        tokenSymbol={tokenSymbol}
        chainId={chainId}
        raiseCurrency={raiseCurrency}
        tokenColor={tokenColor}
      />
    </Flex>
  )
}
