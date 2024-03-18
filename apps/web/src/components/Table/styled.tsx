import { Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import { HideScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { getAbbreviatedTimeString } from 'components/Table/utils'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { Token } from 'graphql/data/__generated__/types-and-hooks'
import { OrderDirection, getTokenDetailsURL, supportedChainIdFromGQLChain, unwrapToken } from 'graphql/data/util'
import { OrderDirection as TheGraphOrderDirection } from 'graphql/thegraph/__generated__/types-and-hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { ArrowDown, CornerLeftUp, ExternalLink as ExternalLinkIcon } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { ClickableStyle, EllipsisStyle, ExternalLink, ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'

export const SHOW_RETURN_TO_TOP_OFFSET = 500
export const LOAD_MORE_BOTTOM_OFFSET = 50

export const TableContainer = styled(Column)<{ $maxWidth?: number; $maxHeight?: number }>`
  max-width: ${({ $maxWidth }) => $maxWidth}px;
  max-height: ${({ $maxHeight }) => $maxHeight}px;
  // Center layout
  justify-content: center;
  align-items: center;
  margin: 0px auto 24px auto;
`
const StickyStyles = css`
  top: 73px;
  position: sticky;
  position: -webkit-sticky;
  z-index: ${Z_INDEX.under_dropdown};
`
export const TableHead = styled.div<{ $isSticky?: boolean }>`
  width: 100%;
  position: relative;
  ${({ $isSticky }) => ($isSticky ? StickyStyles : '')}
  // Place header at bottom of container (top of container used to add distance from nav / hide rows)
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  // Solid background that matches surface, in order to hide rows as they scroll behind header
  background: ${({ theme }) => theme.surface1};
`
export const TableBodyContainer = styled(Column)`
  width: 100%;
  position: relative;
  overflow-x: auto;
  overscroll-behavior-x: none;
  border-right: 1px solid ${({ theme }) => theme.surface3};
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
  border-left: 1px solid ${({ theme }) => theme.surface3};
  border-bottom-right-radius: 20px;
  border-bottom-left-radius: 20px;
  ${HideScrollBarStyles}
`
export const ReturnButton = styled(ButtonLight)`
  font-size: 16px;
  border-radius: 900px;
  width: fit-content;
  margin-top: 8px;
`
export const ReturnIcon = styled(CornerLeftUp)`
  width: 16px;
  height: 16px;
  margin-right: 8px;
`
export const ReturnButtonContainer = styled(Row)<{ $top?: number }>`
  position: absolute;
  justify-content: center;
  top: ${({ $top }) => $top}px;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
`
export const LoadingIndicatorContainer = styled(Row)<{ show: boolean }>`
  position: sticky;
  justify-content: center;
  margin-top: -48px;
  visibility: ${({ show }) => (show ? 'visible' : 'hidden')};
`
export const LoadingIndicator = styled(Row)`
  background: ${({ theme }) => theme.accent2};
  border-radius: 8px;
  width: fit-content;
  padding: 8px;
  color: ${({ theme }) => theme.accent1};
  font-size: 16px;
  font-weight: 535;
  gap: 8px;
  height: 34px;
  z-index: ${Z_INDEX.under_dropdown};
`

const TableRow = styled(Row)`
  padding: 0px 12px;
  width: fit-content;
  min-width: 100%;
  display: flex;
  min-height: 64px;
`
export const DataRow = styled(TableRow)`
  @media not all and (hover: none) {
    :hover {
      background: ${({ theme }) => theme.surface3};
    }
  }
`
export const NoDataFoundTableRow = styled(TableRow)`
  justify-content: center;
`

export const HeaderRow = styled(TableRow)<{ $dimmed?: boolean }>`
  border: 1px solid ${({ theme }) => theme.surface3};
  border-top-right-radius: 20px;
  border-top-left-radius: 20px;
  overflow: auto;
  width: unset;
  min-height: 52px;
  background: ${({ theme }) => theme.surface2};
  ${HideScrollBarStyles}
  overscroll-behavior: none;

  ${({ $dimmed }) => $dimmed && 'opacity: 0.4;'}
`
export const CellContainer = styled.div`
  display: flex;
  flex-grow: 1;

  &:last-child {
    justify-content: flex-end;
  }

  &:first-child {
    flex-grow: 0;
  }
`
export const StyledExternalLink = styled(ExternalLink)`
  text-decoration: none;
  ${ClickableStyle}
  color: ${({ theme }) => theme.neutral1}
`
const StyledInternalLink = styled(Link)`
  text-decoration: none;
  ${ClickableStyle}
  color: ${({ theme }) => theme.neutral1}
`

export const TableRowLink = styled(Link)`
  color: none;
  text-decoration: none;
  cursor: pointer;
`

export const ClickableHeaderRow = styled(Row)<{ $justify?: string }>`
  justify-content: ${({ $justify }) => $justify ?? 'flex-end'};
  cursor: pointer;
  width: 100%;
  gap: 4px;
  ${ClickableStyle}
`
export const HeaderArrow = styled(ArrowDown)<{ direction: OrderDirection | TheGraphOrderDirection }>`
  height: 16px;
  width: 16px;
  color: ${({ theme }) => theme.neutral1};
  transform: ${({ direction }) => (direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)')};
`
export const HeaderSortText = styled(ThemedText.BodySecondary)<{ $active?: boolean }>`
  ${({ $active, theme }) => $active && `color: ${theme.neutral1};`}
`

export const FilterHeaderRow = styled(Row)<{ modalOpen?: boolean }>`
  ${({ modalOpen }) => !modalOpen && ClickableStyle}
  cursor: pointer;
  user-select: none;
  gap: 4px;
`
const StyledTimestampRow = styled(StyledExternalLink)`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  width: 100%;
`
const StyledExternalLinkIcon = styled(ExternalLinkIcon)`
  display: none;
  height: 16px;
  width: 16px;
  color: ${({ theme }) => theme.neutral2};
  ${StyledTimestampRow}:hover & {
    display: block;
  }
`

/**
 * Converts the given timestamp to an abbreviated format (s,m,h) for timestamps younger than 1 day
 * and a full discreet format for timestamps older than 1 day (e.g. DD/MM HH:MMam/pm).
 * Hovering on the timestamp will display the full discreet format. (e.g. DD/MM/YYYY HH:MMam/pm)
 * Clicking on the timestamp will open the given link in a new tab
 * @param timestamp: unix timestamp in SECONDS
 * @param link: link to open on click
 * @returns JSX.Element containing the formatted timestamp
 */
export const TimestampCell = ({ timestamp, link }: { timestamp: number; link: string }) => {
  const locale = useActiveLocale()
  const options: Intl.DateTimeFormatOptions = {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }
  const fullDate = new Date(timestamp * 1000)
    .toLocaleString(locale, options)
    .toLocaleLowerCase(locale)
    .replace(/\s(am|pm)/, '$1')
  return (
    <StyledTimestampRow href={link}>
      <MouseoverTooltip text={fullDate} placement="top" size={TooltipSize.Max}>
        <ThemedText.BodySecondary>{getAbbreviatedTimeString(timestamp * 1000)}</ThemedText.BodySecondary>
      </MouseoverTooltip>
      <StyledExternalLinkIcon />
    </StyledTimestampRow>
  )
}

const TokenSymbolText = styled(ThemedText.BodyPrimary)`
  ${EllipsisStyle}
`
/**
 * Given a token displays the Token's Logo and Symbol with a link to its TDP
 * @param token
 * @returns JSX.Element showing the Token's Logo, Chain logo if non-mainnet, and Token Symbol
 */
export const TokenLinkCell = ({ token }: { token: Token }) => {
  const chainId = supportedChainIdFromGQLChain(token.chain) ?? ChainId.MAINNET
  const unwrappedToken = unwrapToken(chainId, token)
  const isNative = unwrappedToken.address === NATIVE_CHAIN_ID
  const nativeCurrency = nativeOnChain(chainId)
  return (
    <StyledInternalLink
      to={getTokenDetailsURL({
        address: unwrappedToken.address,
        chain: token.chain,
      })}
    >
      <Row gap="4px" maxWidth="68px">
        <PortfolioLogo
          chainId={chainId}
          size="16px"
          images={isNative ? undefined : [token.project?.logo?.url]}
          currencies={isNative ? [nativeCurrency] : undefined}
        />
        <TokenSymbolText>{unwrappedToken?.symbol ?? <Trans>UNKNOWN</Trans>}</TokenSymbolText>
      </Row>
    </StyledInternalLink>
  )
}
