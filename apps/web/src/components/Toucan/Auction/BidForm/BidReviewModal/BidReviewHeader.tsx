import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { AuctionDetails } from '~/components/Toucan/Auction/store/types'

interface BidReviewHeaderProps {
  auctionDetails: AuctionDetails
  onClose: () => void
}

export function BidReviewHeader({ auctionDetails, onClose }: BidReviewHeaderProps): JSX.Element {
  const { t } = useTranslation()

  const tokenSymbol = auctionDetails.token?.currency.symbol ?? auctionDetails.tokenSymbol
  const tokenName = auctionDetails.token?.currency.name ?? ''
  const logoUrl = auctionDetails.token?.logoUrl ?? null

  const helpLink = uniswapUrls.helpArticleUrls.toucanBidHelp

  return (
    <Flex gap="$spacing16">
      <GetHelpHeader title={t('toucan.bidReview.headerTitle')} closeModal={onClose} link={helpLink} />
      <Flex row gap="$spacing16" alignItems="center" width="100%">
        <TokenLogo
          size={44}
          chainId={auctionDetails.chainId}
          symbol={tokenSymbol}
          name={tokenName}
          url={logoUrl}
          hideNetworkLogo={false}
        />
        <Flex gap="$spacing2" flex={1} minWidth={0}>
          <Text variant="heading3" color="$neutral1" numberOfLines={1} ellipsizeMode="tail">
            {tokenName}
          </Text>
          <Text variant="subheading1" color="$neutral2">
            {tokenSymbol}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
