import { DynamicConfigs, useDynamicConfigValue, VerifiedAuctionsConfigKey } from '@universe/gating'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Flex, Text, useIsDarkMode, useMedia } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from '~/components/BreadcrumbNav'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

// TODO | Toucan - Investigate why BreadcrumbNavLink doesn't re-render on theme change in this component tree.
// The same component works correctly in PoolDetailsHeader.tsx. This memo + useIsDarkMode is a workaround
// to force re-renders when theme changes
const AuctionBreadcrumbs = memo(function AuctionBreadcrumbs({ symbol, address }: { symbol: string; address: string }) {
  const { t } = useTranslation()
  useIsDarkMode()

  return (
    <BreadcrumbNavContainer aria-label="breadcrumb-nav">
      <BreadcrumbNavLink to="/explore">
        {t('common.explore')} <RotatableChevron direction="right" size="$icon.16" />
      </BreadcrumbNavLink>
      <BreadcrumbNavLink to="/explore/auctions">
        {t('toucan.auctions')} <RotatableChevron direction="right" size="$icon.16" />
      </BreadcrumbNavLink>
      <CurrentPageBreadcrumb address={address} poolName={symbol} />
    </BreadcrumbNavContainer>
  )
})

const AuctionTokenInfo = ({
  name,
  symbol,
  logoUrl,
  chainId,
  verified,
  tokenDetailsUrl,
}: {
  name: string
  symbol: string
  logoUrl: string
  chainId: number
  verified: boolean
  tokenDetailsUrl?: string
}) => {
  const media = useMedia()

  const content = (
    <Flex row alignItems="center" gap="$gap16">
      <TokenLogo
        size={media.lg ? iconSizes.icon48 : iconSizes.icon64}
        chainId={chainId}
        name={name}
        symbol={symbol}
        url={logoUrl}
      />
      <Flex gap={4} justifyContent="center">
        <Flex row gap="$gap4">
          <Text variant="heading3" $lg={{ variant: 'subheading1' }} minWidth={40} {...EllipsisTamaguiStyle}>
            {name}
          </Text>
          {verified && <CheckmarkCircle size="$icon.16" color="$accent1" />}
        </Flex>
        <Text variant="heading3" $lg={{ variant: 'subheading1' }} textTransform="uppercase" color="$neutral2">
          {symbol}
        </Text>
      </Flex>
    </Flex>
  )

  if (tokenDetailsUrl) {
    return (
      <Link to={tokenDetailsUrl} style={{ textDecoration: 'none', width: 'fit-content' }}>
        {content}
      </Link>
    )
  }

  return content
}

export const AuctionHeader = () => {
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)

  const verifiedAuctionIds: string[] = useDynamicConfigValue({
    config: DynamicConfigs.VerifiedAuctions,
    key: VerifiedAuctionsConfigKey.VerifiedAuctionIds,
    defaultValue: [],
  })

  const verified = useMemo(() => {
    if (!auctionDetails?.auctionId) {
      return false
    }
    return verifiedAuctionIds.includes(auctionDetails.auctionId)
  }, [auctionDetails?.auctionId, verifiedAuctionIds])

  // Get the token details URL
  const tokenDetailsUrl = useMemo(() => {
    if (!auctionDetails) {
      return undefined
    }
    const chainInfo = getChainInfo(auctionDetails.chainId)
    return getTokenDetailsURL({
      address: auctionDetails.tokenAddress,
      chainUrlParam: chainInfo.urlParam,
    })
  }, [auctionDetails])

  if (!auctionDetails) {
    return null
  }

  const tokenSymbol = auctionDetails.token?.currency.symbol ?? auctionDetails.tokenSymbol
  const tokenName = auctionDetails.token?.currency.name ?? ''
  const logoUrl = auctionDetails.token?.logoUrl ?? ''

  return (
    <Flex>
      <AuctionBreadcrumbs symbol={tokenSymbol} address={auctionDetails.tokenAddress} />
      <AuctionTokenInfo
        name={tokenName}
        symbol={tokenSymbol}
        logoUrl={logoUrl}
        chainId={auctionDetails.chainId}
        verified={verified}
        tokenDetailsUrl={tokenDetailsUrl}
      />
    </Flex>
  )
}
