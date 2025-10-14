import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from 'components/BreadcrumbNav'
import { useAuctionStore } from 'components/Toucan/Auction/store/useAuctionStore'
import { ChevronRight } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'

const AuctionBreadcrumbs = ({ symbol, address }: { symbol: string; address: string }) => {
  const { t } = useTranslation()

  return (
    <BreadcrumbNavContainer aria-label="breadcrumb-nav">
      <BreadcrumbNavLink to="/explore">
        {t('common.explore')} <ChevronRight size={14} />
      </BreadcrumbNavLink>
      <BreadcrumbNavLink to="/explore/auctions">
        {t('toucan.auctions')} <ChevronRight size={14} />
      </BreadcrumbNavLink>
      <CurrentPageBreadcrumb address={address} poolName={symbol} />
    </BreadcrumbNavContainer>
  )
}

const AuctionTokenInfo = ({
  name,
  symbol,
  logoUrl,
  chainId,
}: {
  name: string
  symbol: string
  logoUrl: string
  chainId: number
}) => {
  return (
    <Flex row alignItems="center" gap="$gap16">
      <TokenLogo size={iconSizes.icon64} chainId={chainId} name={name} symbol={symbol} url={logoUrl} />
      <Flex gap={4} justifyContent="center">
        <Text variant="heading3" minWidth={40} {...EllipsisTamaguiStyle}>
          {name}
        </Text>
        <Text variant="heading3" textTransform="uppercase" color="$neutral2">
          {symbol}
        </Text>
      </Flex>
    </Flex>
  )
}

export const AuctionHeader = () => {
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)

  if (!auctionDetails) {
    return null
  }

  const { tokenSymbol, tokenAddress, logoUrl, chainId, tokenName } = auctionDetails

  return (
    <Flex>
      <AuctionBreadcrumbs symbol={tokenSymbol} address={tokenAddress} />
      <AuctionTokenInfo name={tokenName} symbol={tokenSymbol} logoUrl={logoUrl} chainId={chainId} />
    </Flex>
  )
}
