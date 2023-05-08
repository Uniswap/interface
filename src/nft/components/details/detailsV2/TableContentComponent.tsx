import { Trans } from '@lingui/macro'
import { formatCurrencyAmount, NumberType } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import { OpacityHoverState, ScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { OrderType } from 'graphql/data/__generated__/types-and-hooks'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { HomeSearchIcon } from 'nft/components/icons'
import { useSubscribeScrollState } from 'nft/hooks'
import { Offer, SellOrder } from 'nft/types'
import { formatEth, getMarketplaceIcon, timeUntil } from 'nft/utils'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
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

interface TableContentComponentProps {
  headerRow: React.ReactNode
  contentRows: React.ReactNode[]
  type: TableTabsKeys
}

export const TableContentComponent = ({ headerRow, contentRows, type }: TableContentComponentProps) => {
  const { userCanScroll, scrollRef, scrollProgress, scrollHandler } = useSubscribeScrollState()

  return (
    <>
      {headerRow}
      <TableRowsContainer>
        {scrollProgress > 0 && <Scrim />}
        <TableRowScrollableContainer ref={scrollRef} onScroll={scrollHandler}>
          {contentRows.map((row, index) => (
            <div key={type + '_row_' + index}>{row}</div>
          ))}
        </TableRowScrollableContainer>
        {userCanScroll && scrollProgress !== 100 && <Scrim isBottom={true} />}
      </TableRowsContainer>
    </>
  )
}

const TableCell = styled.div<{ $flex?: number; $textAlign?: string; $color?: string }>`
  flex: ${({ $flex }) => $flex ?? 1};
  text-align: ${({ $textAlign }) => $textAlign};
  color: ${({ $color }) => $color};
  flex-shrink: 0;
`

const ButtonCell = styled.div`
  cursor: pointer;
  padding: 8px 12px;
  ${OpacityHoverState}
  text-align: center;
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
      <ThemedText.BodySmall color="textSecondary" lineHeight="20px">
        {formatCurrencyAmount(usdValue, NumberType.FiatTokenPrice)}
      </ThemedText.BodySmall>
    </Row>
  )
}

export const HeaderRow = ({ type, is1155 }: { type: TableTabsKeys; is1155?: boolean }) => {
  return (
    <Row gap="12px" padding="6px 0px">
      <HomeSearchIcon />
      <TableCell $flex={1.75}>
        <ThemedText.SubHeaderSmall color="textSecondary">
          <Trans>Price</Trans>
        </ThemedText.SubHeaderSmall>
      </TableCell>
      {is1155 && (
        <TableCell>
          <ThemedText.SubHeaderSmall color="textSecondary">
            <Trans>Quantity</Trans>
          </ThemedText.SubHeaderSmall>
        </TableCell>
      )}
      {(type === TableTabsKeys.Offers || is1155) && (
        <TableCell>
          <ThemedText.SubHeaderSmall color="textSecondary">
            {type === TableTabsKeys.Offers ? <Trans>From</Trans> : <Trans>Seller</Trans>}
          </ThemedText.SubHeaderSmall>
        </TableCell>
      )}
      <TableCell $textAlign="right">
        <ThemedText.SubHeaderSmall color="textSecondary">
          <Trans>Expires in</Trans>
        </ThemedText.SubHeaderSmall>
      </TableCell>
      {/* An empty cell is needed in the headers for proper vertical alignment with the action buttons */}
      <TableCell>&nbsp;</TableCell>
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
  const date = content.endAt && new Date(content.endAt)
  const isSellOrder = (content as SellOrder).type === OrderType.Listing
  return (
    <Row gap="12px" padding="16px 0px">
      {getMarketplaceIcon(content.marketplace, '20')}
      {content.price && (
        <TableCell $flex={1.75}>
          <PriceCell price={content.price.value} />
        </TableCell>
      )}
      {is1155 && (
        <TableCell>
          <ThemedText.SubHeaderSmall color="textSecondary">{content.quantity}</ThemedText.SubHeaderSmall>
        </TableCell>
      )}
      {(!isSellOrder || is1155) && (
        <TableCell>
          <ThemedText.LabelSmall>{shortenAddress(content.maker)}</ThemedText.LabelSmall>
        </TableCell>
      )}
      <TableCell $textAlign="right">
        <ThemedText.LabelSmall>{date ? timeUntil(date) : <Trans>Never</Trans>}</ThemedText.LabelSmall>
      </TableCell>
      <TableCell>
        <ButtonCell>
          <ThemedText.LabelSmall color="textSecondary">{buttonCTA}</ThemedText.LabelSmall>
        </ButtonCell>
      </TableCell>
    </Row>
  )
}
