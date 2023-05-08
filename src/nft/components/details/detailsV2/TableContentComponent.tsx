import { Trans } from '@lingui/macro'
import { formatCurrencyAmount, NumberType } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import { OpacityHoverState, ScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
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
  max-height: 224px;

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

const TableCell = styled.div<{ $flex?: number; $justifyContent?: string; $color?: string }>`
  flex: ${({ $flex }) => $flex ?? 0};
  justify-content: ${({ $justifyContent }) => $justifyContent};
  color: ${({ $color }) => $color};
  flex-wrap: nowrap;
`

const ButtonCell = styled(TableCell)`
  cursor: pointer;
  padding: 8px 12px;
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
      <ThemedText.BodySmall color="textSecondary" lineHeight="20px">
        {formatCurrencyAmount(usdValue, NumberType.FiatTokenPrice)}
      </ThemedText.BodySmall>
    </Row>
  )
}

export const HeaderRow = ({ type, is1155 }: { type: TableTabsKeys; is1155?: boolean }) => {
  return (
    <Row gap="12px">
      <HomeSearchIcon />
      <TableCell $flex={1}>
        <ThemedText.SubHeaderSmall color="textSecondary">
          <Trans>Price</Trans>
        </ThemedText.SubHeaderSmall>
      </TableCell>
      {is1155 && (
        <TableCell $flex={1}>
          <ThemedText.SubHeaderSmall color="textSecondary">
            <Trans>Quantity</Trans>
          </ThemedText.SubHeaderSmall>
        </TableCell>
      )}
      <TableCell $flex={1}>
        <ThemedText.SubHeaderSmall color="textSecondary">
          {type === TableTabsKeys.Offers ? <Trans>From</Trans> : is1155 && <Trans>Seller</Trans>}
        </ThemedText.SubHeaderSmall>
      </TableCell>
      <TableCell $flex={1}>
        <ThemedText.SubHeaderSmall color="textSecondary">
          <Trans>Expires in</Trans>
        </ThemedText.SubHeaderSmall>
      </TableCell>
      {/* An empty cell is needed in the headers for proper vertical alignment with the action buttons */}
      <TableCell $flex={1} />
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
  return (
    <Row gap="12px" padding="16px 0px">
      {getMarketplaceIcon(content.marketplace, '20')}
      {content.price && (
        <TableCell $flex={1}>
          <PriceCell price={content.price.value} />
        </TableCell>
      )}
      {is1155 && (
        <TableCell $flex={1}>
          <ThemedText.SubHeaderSmall color="textSecondary">
            <Trans>Quantity</Trans>
          </ThemedText.SubHeaderSmall>
        </TableCell>
      )}
      <TableCell $flex={1}>
        <ThemedText.LabelSmall>{shortenAddress(content.maker)}</ThemedText.LabelSmall>
      </TableCell>
      <TableCell $flex={1}>
        <ThemedText.LabelSmall>{date ? timeUntil(date) : <Trans>Never</Trans>}</ThemedText.LabelSmall>
      </TableCell>
      <ButtonCell>
        <ThemedText.LabelSmall color="textSecondary">{buttonCTA}</ThemedText.LabelSmall>
      </ButtonCell>
    </Row>
  )
}
