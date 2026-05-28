import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AuctionSupplySelector } from '~/pages/Liquidity/CreateAuction/components/AuctionSupplySelector'

interface AuctionSupplySectionProps {
  auctionSupplyAmount: CurrencyAmount<Currency>
  tokenTotalSupply: CurrencyAmount<Currency>
  tokenSymbol: string
  onSelectAuctionSupplyPercent: (percent: number) => void
  onAuctionSupplyAmountChange: (amount: CurrencyAmount<Currency>) => void
}

export function AuctionSupplySection({
  auctionSupplyAmount,
  tokenTotalSupply,
  tokenSymbol,
  onSelectAuctionSupplyPercent,
  onAuctionSupplyAmountChange,
}: AuctionSupplySectionProps) {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing8">
      <Flex gap="$spacing4">
        <Text variant="subheading1" color="$neutral1">
          {t('toucan.createAuction.step.configureAuction.auctionSupply')}
        </Text>
        <Text variant="body3" color="$neutral2">
          {t('toucan.createAuction.step.configureAuction.auctionSupply.description')}
        </Text>
      </Flex>
      <AuctionSupplySelector
        auctionSupplyAmount={auctionSupplyAmount}
        tokenTotalSupply={tokenTotalSupply}
        tokenSymbol={tokenSymbol}
        onSelectPercent={onSelectAuctionSupplyPercent}
        onAmountChange={onAuctionSupplyAmountChange}
      />
    </Flex>
  )
}
