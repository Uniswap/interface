import { Trans } from '@lingui/macro'
import { formatCurrencyAmount, NumberType } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import { OpacityHoverState, ScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { OrderType } from 'graphql/data/__generated__/types-and-hooks'
import { useScreenSize } from 'hooks/useScreenSize'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { AddToBagIcon, HomeSearchIcon } from 'nft/components/icons'
import { useSubscribeScrollState } from 'nft/hooks'
import { Offer, SellOrder } from 'nft/types'
import { formatEth, getMarketplaceIcon, timeUntil } from 'nft/utils'
import { Check } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'
import { shortenAddress } from 'utils'

import { TableTabsKeys } from './DataPageTable'
import { Scrim } from './shared'

const TableRowsContainer = styled.div`
  position: relative;
`

const TableRowScrollableContainer = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 264px;

  ${ScrollBarStyles}
`

const TableHeaderRowContainer = styled.div<{ userCanScroll: boolean }>`
  margin-right: ${({ userCanScroll }) => (userCanScroll ? '11px' : '0')};
`

const TableRowContainer = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};

  &:last-child {
    border-bottom: none;
  }
`

interface TableContentComponentProps {
  headerRow: React.ReactNode
  contentRows: React.ReactNode[]
  type: TableTabsKeys
}

export const TableContentComponent = ({ headerRow, contentRows, type }: TableContentComponentProps) => {
  const { userCanScroll, scrollRef, scrollProgress, scrollHandler } = useSubscribeScrollState()

  return (
    <>
      <TableHeaderRowContainer userCanScroll={userCanScroll}>{headerRow}</TableHeaderRowContainer>
      <TableRowsContainer>
        {scrollProgress > 0 && <Scrim />}
        <TableRowScrollableContainer ref={scrollRef} onScroll={scrollHandler}>
          {contentRows.map((row, index) => (
            <TableRowContainer key={type + '_row_' + index}>{row}</TableRowContainer>
          ))}
        </TableRowScrollableContainer>
        {userCanScroll && scrollProgress !== 100 && <Scrim isBottom={true} />}
      </TableRowsContainer>
    </>
  )
}

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

  @media screen and (min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl}px) {
    display: none;
  }
`

const Link = styled.a`
  text-decoration: none;
  display: block;
  height: 20px;
  width: min-content;

  ${OpacityHoverState}
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
  const reducedPriceWidth = isMobile || (screenSize['lg'] && !screenSize['xl'])

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
  const theme = useTheme()
  const date = content.endAt && new Date(content.endAt)
  const isSellOrder = (content as SellOrder).type === OrderType.Listing
  const reducedPriceWidth = isMobile || (screenSize['lg'] && !screenSize['xl'])

  return (
    <Row gap="12px" padding="16px 6px 16px 0px">
      <Link href={content.marketplaceUrl} target="_blank" rel="noopener noreferrer">
        {getMarketplaceIcon(content.marketplace, '20')}
      </Link>
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
          <Link href={`https://etherscan.io/address/${content.maker}`} target="_blank" rel="noopener noreferrer">
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
          {isMobile ? (
            isSellOrder ? (
              <AddToBagIcon color={theme.textSecondary} />
            ) : (
              <Check color={theme.textSecondary} height="20px" width="20px" />
            )
          ) : (
            <ThemedText.LabelSmall color="textSecondary">{buttonCTA}</ThemedText.LabelSmall>
          )}
        </ActionButton>
      </TableCell>
    </Row>
  )
}
