import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AuctionSupplySelector } from '~/pages/Liquidity/CreateAuction/components/AuctionSupplySelector'
import { TotalSupplySelector } from '~/pages/Liquidity/CreateAuction/components/TotalSupplySelector'

interface AuctionSupplySectionProps {
  auctionSupplyAmount: CurrencyAmount<Currency>
  tokenTotalSupply: CurrencyAmount<Currency>
  maxAuctionSupplyAmount: CurrencyAmount<Currency>
  minAuctionSupplyAmount: CurrencyAmount<Currency>
  tokenSymbol: string
  /** New tokens can customize total supply; existing tokens read it on-chain (input hidden). LP-960. */
  isNewToken: boolean
  onSelectAuctionSupplyPercent: (percent: number) => void
  onAuctionSupplyAmountChange: (amount: CurrencyAmount<Currency>) => void
  onTotalSupplyChange: (totalSupply: CurrencyAmount<Currency>) => void
}

export function AuctionSupplySection({
  auctionSupplyAmount,
  tokenTotalSupply,
  maxAuctionSupplyAmount,
  minAuctionSupplyAmount,
  tokenSymbol,
  isNewToken,
  onSelectAuctionSupplyPercent,
  onAuctionSupplyAmountChange,
  onTotalSupplyChange,
}: AuctionSupplySectionProps) {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing8">
      <Flex gap="$spacing4">
        <Text variant="subheading1" color="$neutral1">
          {t('toucan.createAuction.step.configureAuction.auctionSupply')}
        </Text>
        <Text variant="body3" color="$neutral2">
          {isNewToken
            ? t('toucan.createAuction.step.configureAuction.auctionSupply.description.newToken')
            : t('toucan.createAuction.step.configureAuction.auctionSupply.description')}
        </Text>
      </Flex>
      {isNewToken ? (
        <TotalSupplySelector totalSupply={tokenTotalSupply} tokenSymbol={tokenSymbol} onChange={onTotalSupplyChange} />
      ) : null}
      <AuctionSupplySelector
        auctionSupplyAmount={auctionSupplyAmount}
        tokenTotalSupply={tokenTotalSupply}
        maxAuctionSupplyAmount={maxAuctionSupplyAmount}
        minAuctionSupplyAmount={minAuctionSupplyAmount}
        tokenSymbol={tokenSymbol}
        showTotalSupply={!isNewToken}
        onSelectPercent={onSelectAuctionSupplyPercent}
        onAmountChange={onAuctionSupplyAmountChange}
      />
    </Flex>
  )
}
