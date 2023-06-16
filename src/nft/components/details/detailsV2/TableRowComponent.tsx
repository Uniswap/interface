import { Trans } from '@lingui/macro'
import { formatCurrencyAmount, NumberType } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import { OpacityHoverState } from 'components/Common'
import Row from 'components/Row'
import { OrderType } from 'graphql/data/__generated__/types-and-hooks'
import { useScreenSize } from 'hooks/useScreenSize'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { HomeSearchIcon } from 'nft/components/icons'
import { Offer, SellOrder } from 'nft/types'
import { formatEth, getMarketplaceIcon, timeUntil } from 'nft/utils'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ExternalLink, ThemedText } from 'theme'
import { shortenAddress } from 'utils'

import { TableTabsKeys } from './DataPageTable'

const TableCell = styled.div<{ $flex?: number; $justifyContent?: string; $color?: string; hideOnSmall?: boolean }>`
  display: flex;
  flex: ${({ $flex }) => $flex ?? 1};
  justify-content: ${({ $justifyContent }) => $justifyContent};
  color: ${({ $color }) => $color};
  flex-shrink: 0;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: ${({ hideOnSmall }) => (hideOnSmall ? 'none' : 'flex')};
  }
`

const ActionButton = styled.div`
  cursor: pointer;
  white-space: nowrap;
  ${OpacityHoverState}
`

const USDPrice = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.textSecondary};
  line-height: 20px;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: none;
  }

  @media screen and (min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px) {
    display: none;
  }
`

const Link = styled(ExternalLink)`
  height: 20px;
`

const PriceCell = ({ price }: { price: number }) => {
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency(chainId)
  const parsedAmount = tryParseCurrencyAmount(price.toString(), nativeCurrency)
  const usdValue = useStablecoinValue(parsedAmount)
  return (
    <Row gap="8px">
      <ThemedText.LabelSmall color="textPrimary" lineHeight="16px">
        {formatEth(price)}
      </ThemedText.LabelSmall>
      <USDPrice>{formatCurrencyAmount(usdValue, NumberType.FiatTokenPrice)}</USDPrice>
    </Row>
  )
}

export const HeaderRow = ({ type, is1155 }: { type: TableTabsKeys; is1155?: boolean }) => {
  const screenSize = useScreenSize()
  const isMobile = !screenSize['sm']
  const isLargeScreen = screenSize['lg'] && !screenSize['xl']
  const reducedPriceWidth = isMobile || isLargeScreen

  return (
    <Row gap="12px" padding="6px 6px 6px 0px">
      <HomeSearchIcon />
      <TableCell $flex={reducedPriceWidth ? 1 : 1.75}>
        <ThemedText.SubHeaderSmall color="textSecondary">
          <Trans>Price</Trans>
        </ThemedText.SubHeaderSmall>
      </TableCell>
      {is1155 && (
        <TableCell $flex={0.5}>
          <ThemedText.SubHeaderSmall color="textSecondary">
            <Trans>Quantity</Trans>
          </ThemedText.SubHeaderSmall>
        </TableCell>
      )}
      {(type === TableTabsKeys.Offers || is1155) && (
        <TableCell hideOnSmall={true}>
          <ThemedText.SubHeaderSmall color="textSecondary">
            {type === TableTabsKeys.Offers ? <Trans>From</Trans> : <Trans>Seller</Trans>}
          </ThemedText.SubHeaderSmall>
        </TableCell>
      )}
      <TableCell $justifyContent="flex-end">
        <ThemedText.SubHeaderSmall color="textSecondary">
          <Trans>Expires in</Trans>
        </ThemedText.SubHeaderSmall>
      </TableCell>
      {/* An empty cell is needed in the headers for proper vertical alignment with the action buttons */}
      <TableCell $flex={isMobile ? 0.25 : 1}>&nbsp;</TableCell>
    </Row>
  )
}

export const ContentRow = ({
  content,
  buttonCTA,
  is1155,
}: {
  content: Offer | SellOrder
  buttonCTA: React.ReactNode
  is1155?: boolean
}) => {
  const screenSize = useScreenSize()
  const isMobile = !screenSize['sm']
  const date = content.endAt && new Date(content.endAt)
  const isSellOrder = 'type' in content && content.type === OrderType.Listing
  const reducedPriceWidth = isMobile || (screenSize['lg'] && !screenSize['xl'])

  return (
    <Row gap="12px" padding="16px 6px 16px 0px">
      <Link href={content.marketplaceUrl}>{getMarketplaceIcon(content.marketplace, '20')}</Link>
      {content.price && (
        <TableCell $flex={reducedPriceWidth ? 1 : 1.75}>
          <PriceCell price={content.price.value} />
        </TableCell>
      )}
      {is1155 && (
        <TableCell $flex={0.5} $justifyContent="center">
          <ThemedText.SubHeaderSmall color="textPrimary">{content.quantity}</ThemedText.SubHeaderSmall>
        </TableCell>
      )}
      {(!isSellOrder || is1155) && (
        <TableCell hideOnSmall={true}>
          <Link href={`https://etherscan.io/address/${content.maker}`}>
            <ThemedText.LabelSmall color="textPrimary">{shortenAddress(content.maker)}</ThemedText.LabelSmall>
          </Link>
        </TableCell>
      )}
      <TableCell $justifyContent="flex-end">
        <ThemedText.LabelSmall color="textPrimary">
          {date ? timeUntil(date) : <Trans>Never</Trans>}
        </ThemedText.LabelSmall>
      </TableCell>
      <TableCell $flex={isMobile ? 0.25 : 1} $justifyContent="center">
        <ActionButton>
          <ThemedText.LabelSmall color="textSecondary">{buttonCTA}</ThemedText.LabelSmall>
        </ActionButton>
      </TableCell>
    </Row>
  )
}
