import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import { HideScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { OrderDirection } from 'graphql/thegraph/__generated__/types-and-hooks'
import { ArrowDown, CornerLeftUp } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { ClickableStyle, ExternalLink } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'

export const SHOW_RETURN_TO_TOP_OFFSET = 500
export const LOAD_MORE_BOTTOM_OFFSET = 50

export const TableContainer = styled(Column)<{ $maxHeight?: number }>`
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
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
  height: 72px;
  position: relative;
  ${({ $isSticky }) => ($isSticky ? StickyStyles : '')}
  // Place header at bottom of container (top of container used to add distance from nav / hide rows)
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  // Solid background that matches surface, in order to hide rows as they scroll behind header
  background: ${({ theme }) => theme.surface1};
`
export const TableBody = styled(Column)`
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
  :hover {
    background: ${({ theme }) => theme.surface3};
  }
`
export const HeaderRow = styled(TableRow)`
  border: 1px solid ${({ theme }) => theme.surface3};
  border-top-right-radius: 20px;
  border-top-left-radius: 20px;
  overflow: auto;
  width: unset;
  min-height: 52px;
  background: ${({ theme }) => theme.surface2};
  ${HideScrollBarStyles}
  overscroll-behavior: none;
`
export const CellContainer = styled.div`
  display: flex;
  flex-grow: 1;

  &:last-child {
    justify-content: flex-end;
  }
`
export const StyledExternalLink = styled(ExternalLink)`
  text-decoration: none;
  ${ClickableStyle}
  color: ${({ theme }) => theme.neutral1}
`
export const StyledInternalLink = styled(Link)`
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
export const HeaderArrow = styled(ArrowDown)<{ direction: OrderDirection }>`
  height: 16px;
  width: 16px;
  color: ${({ theme }) => theme.neutral2};
  transform: ${({ direction }) => (direction === OrderDirection.Asc ? 'rotate(180deg)' : 'rotate(0deg)')};
`
export const FilterHeaderRow = styled(Row)<{ modalOpen?: boolean }>`
  ${({ modalOpen }) => !modalOpen && ClickableStyle}
  cursor: pointer;
  user-select: none;
  gap: 4px;
`
