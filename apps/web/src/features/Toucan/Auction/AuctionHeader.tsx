import { DynamicConfigs, useDynamicConfigValue, VerifiedAuctionsConfigKey } from '@universe/gating'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Flex, Text, useIsDarkMode, useMedia } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getTokenWarningSeverity, useTokenWarningCardText } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from '~/components/BreadcrumbNav'
import { HEADER_TRANSITION } from '~/components/StickyCollapsibleHeader/constants'
import { getHeaderLogoSize, getHeaderTitleVariant } from '~/components/StickyCollapsibleHeader/getHeaderLogoSize'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
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
  token,
  isCompact,
}: {
  name: string
  symbol: string
  logoUrl: string
  chainId: number
  verified: boolean
  tokenDetailsUrl?: string
  token?: CurrencyInfo
  isCompact: boolean
}) => {
  const media = useMedia()
  const severity = token ? getTokenWarningSeverity(token) : WarningSeverity.None
  const { heading: warningHeading, description: warningDescription } = useTokenWarningCardText(token)
  const logoSize = getHeaderLogoSize({ isCompact, media })
  const titleVariant = getHeaderTitleVariant({ isCompact, media })

  const content = (
    <Flex row alignItems="center" gap="$gap16">
      <TokenLogo
        size={logoSize}
        chainId={chainId}
        name={name}
        symbol={symbol}
        url={logoUrl}
        transition={HEADER_TRANSITION}
      />
      <Flex gap={isCompact ? '$gap4' : '$gap8'} justifyContent="center" transition={HEADER_TRANSITION}>
        <Flex row gap="$gap4">
          <Text variant={titleVariant} minWidth={40} transition={HEADER_TRANSITION} {...EllipsisTamaguiStyle}>
            {name}
          </Text>
          {severity > WarningSeverity.Low && (
            <MouseoverTooltip
              placement="top"
              size={TooltipSize.Small}
              disabled={!warningHeading && !warningDescription}
              text={
                <Flex gap="$gap4">
                  {warningHeading && (
                    <Text variant="body4" color="$neutral1">
                      {warningHeading}
                    </Text>
                  )}
                  {warningDescription && (
                    <Text variant="body4" color="$neutral2" lineHeight={16}>
                      {warningDescription}
                    </Text>
                  )}
                </Flex>
              }
            >
              <WarningIcon size="$icon.16" severity={severity} />
            </MouseoverTooltip>
          )}
          {verified && <CheckmarkCircle size="$icon.16" color="$accent1" />}
        </Flex>
        {!isCompact && (
          <Text variant={titleVariant} textTransform="uppercase" color="$neutral2" transition={HEADER_TRANSITION}>
            {symbol}
          </Text>
        )}
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

export const AuctionHeader = ({ isCompact = false }: { isCompact?: boolean }) => {
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
  // token.logoUrl already falls back to the API-provided token image (see
  // useLoadAuctionDetails); reading tokenImageUrl here too covers the case where
  // token info couldn't be constructed at all.
  const logoUrl = auctionDetails.token?.logoUrl ?? auctionDetails.tokenImageUrl ?? ''

  return (
    <Flex gap="$gap8">
      {!isCompact && <AuctionBreadcrumbs symbol={tokenSymbol} address={auctionDetails.tokenAddress} />}
      <AuctionTokenInfo
        name={tokenName}
        symbol={tokenSymbol}
        logoUrl={logoUrl}
        chainId={auctionDetails.chainId}
        verified={verified}
        tokenDetailsUrl={tokenDetailsUrl}
        token={auctionDetails.token}
        isCompact={isCompact}
      />
    </Flex>
  )
}
