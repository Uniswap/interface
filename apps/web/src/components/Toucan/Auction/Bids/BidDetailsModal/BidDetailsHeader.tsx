import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { StatusIndicator } from '~/components/Toucan/Auction/Bids/BidDetailsModal/StatusIndicator'
import { AuctionDetails } from '~/components/Toucan/Auction/store/types'
import { type BidDisplayState } from '~/components/Toucan/Auction/utils/bidDetails'

interface BidDetailsHeaderProps {
  auctionDetails: AuctionDetails
  displayState: BidDisplayState
  onClose: () => void
}

export function BidDetailsHeader({ auctionDetails, displayState, onClose }: BidDetailsHeaderProps): JSX.Element {
  const { t } = useTranslation()

  const tokenSymbol = auctionDetails.token?.currency.symbol ?? auctionDetails.tokenSymbol
  const tokenName = auctionDetails.token?.currency.name ?? ''
  const logoUrl = auctionDetails.token?.logoUrl ?? null

  const helpLink = uniswapUrls.helpArticleUrls.toucanBidDetailsHelp

  return (
    <Flex gap="$spacing16">
      <GetHelpHeader title={t('toucan.bidDetails.title')} closeModal={onClose} link={helpLink} />
      <Flex row gap="$spacing16" alignItems="center" width="100%">
        <TokenLogo
          size={40}
          chainId={auctionDetails.chainId}
          symbol={tokenSymbol}
          name={tokenName}
          url={logoUrl}
          hideNetworkLogo={false}
        />
        <Flex gap="$spacing1" flex={1} minWidth={0}>
          <Flex row gap="$spacing6" alignItems="center" flexWrap="wrap">
            <Text variant="subheading1" color="$neutral1">
              {tokenName}
            </Text>
            <Text variant="subheading1" color="$neutral2">
              {tokenSymbol}
            </Text>
          </Flex>
          <StatusIndicator displayState={displayState} />
        </Flex>
      </Flex>
    </Flex>
  )
}
