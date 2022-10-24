import { Trans } from '@lingui/macro'
import { SMALL_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { sortAscendingAtom, sortMethodAtom, TokenSortMethod, useSetSortMethod } from 'components/Tokens/state'
import InfoTip from 'components/Tokens/TokenDetails/InfoTip'
import { useAtomValue } from 'jotai/utils'
import { ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ClickableStyle } from 'theme'

import { StyledTokenRow, TokenRowCells } from '.'

const StyledHeaderRow = styled(StyledTokenRow)`
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px 8px 0px 0px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  height: 48px;
  line-height: 16px;
  padding: 0px 12px;
  width: 100%;
  justify-content: center;

  &:hover {
    background-color: transparent;
  }

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    justify-content: space-between;
  }
`
const HeaderCellWrapper = styled.span<{ onClick?: () => void }>`
  align-items: center;
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'unset')};
  display: flex;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
  width: 100%;
  user-select: none;
  &:hover {
    ${ClickableStyle}
  }
`

export const HEADER_DESCRIPTIONS: Record<TokenSortMethod, ReactNode | undefined> = {
  [TokenSortMethod.PRICE]: undefined,
  [TokenSortMethod.PERCENT_CHANGE]: undefined,
  [TokenSortMethod.TOTAL_VALUE_LOCKED]: (
    <Trans>Total value locked (TVL) is the amount of the asset that’s currently in a Uniswap v3 liquidity pool.</Trans>
  ),
  [TokenSortMethod.VOLUME]: (
    <Trans>Volume is the amount of the asset that has been traded on Uniswap v3 during the selected time frame.</Trans>
  ),
}

/* Get singular header cell for header row */
function HeaderCell({ category, title }: { category: TokenSortMethod; title: ReactNode }) {
  const theme = useTheme()
  const sortAscending = useAtomValue(sortAscendingAtom)
  const handleSortCategory = useSetSortMethod(category)
  const sortMethod = useAtomValue(sortMethodAtom)

  const description = HEADER_DESCRIPTIONS[category]

  return (
    <HeaderCellWrapper onClick={handleSortCategory}>
      {sortMethod === category && (
        <>
          {sortAscending ? (
            <ArrowUp size={20} strokeWidth={1.8} color={theme.accentActive} />
          ) : (
            <ArrowDown size={20} strokeWidth={1.8} color={theme.accentActive} />
          )}
        </>
      )}
      {title}
      {description && <InfoTip text={description}></InfoTip>}
    </HeaderCellWrapper>
  )
}

/* Header Row: top header row component for table */
export function HeaderRow() {
  return (
    <StyledHeaderRow>
      <TokenRowCells
        index="#"
        name={<Trans>Token name</Trans>}
        price={<HeaderCell category={TokenSortMethod.PRICE} title={<Trans>{TokenSortMethod.PRICE}</Trans>} />}
        percentChange={
          <HeaderCell
            category={TokenSortMethod.PERCENT_CHANGE}
            title={<Trans>{TokenSortMethod.PERCENT_CHANGE}</Trans>}
          />
        }
        tvl={
          <HeaderCell
            category={TokenSortMethod.TOTAL_VALUE_LOCKED}
            title={<Trans>{TokenSortMethod.TOTAL_VALUE_LOCKED}</Trans>}
          />
        }
        volume={<HeaderCell category={TokenSortMethod.VOLUME} title={<Trans>{TokenSortMethod.VOLUME}</Trans>} />}
      />
    </StyledHeaderRow>
  )
}
