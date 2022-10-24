import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent } from 'analytics'
import { EventName } from 'analytics/constants'
import { filterStringAtom, filterTimeAtom, sortAscendingAtom } from 'components/Tokens/state'
import { getChainInfo } from 'constants/chainInfo'
import { PAGE_SIZE, TopToken, useTopTokens } from 'graphql/data/TopTokens'
import { CHAIN_NAME_TO_CHAIN_ID, getTokenDetailsURL, validateUrlChainParam } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { PropsWithChildren, ReactNode, useCallback } from 'react'
import { AlertTriangle } from 'react-feather'
import { Link, useParams } from 'react-router-dom'
import styled, { css } from 'styled-components/macro'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import TokenRow, { LoadingRow } from './TokenRow'
import { HeaderRow } from './TokenRow/HeaderRow'

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  background-color: ${({ theme }) => theme.backgroundSurface};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  margin-left: auto;
  margin-right: auto;
  border-radius: 12px;
  justify-content: center;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`

const TokenDataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  width: 100%;
`

const NoTokenDisplay = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  height: 60px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 16px;
  font-weight: 500;
  align-items: center;
  padding: 0px 28px;
  gap: 8px;
`

function NoTokensState({ message }: { message: ReactNode }) {
  return (
    <GridContainer>
      <HeaderRow />
      <NoTokenDisplay>{message}</NoTokenDisplay>
    </GridContainer>
  )
}

const LoadingRowsWrapper = styled.div`
  padding-top: 8px;
  padding-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const LoadingRows = ({ rowCount }: { rowCount: number }) => (
  <LoadingRowsWrapper>
    {Array(rowCount)
      .fill(null)
      .map((_, index) => {
        return <LoadingRow key={index} first={index === 0} last={index === rowCount - 1} />
      })}
  </LoadingRowsWrapper>
)

export function LoadingTokenTable({ rowCount = PAGE_SIZE }: { rowCount?: number }) {
  return (
    <GridContainer>
      <HeaderRow />
      <TokenDataContainer>
        <LoadingRows rowCount={rowCount} />
      </TokenDataContainer>
    </GridContainer>
  )
}

const StyledTokenLink = styled(Link)<{ first?: boolean; last?: boolean }>`
  text-decoration: none;
  ${({ first, last }) => css`
    padding-top: ${first ? '8px' : '0px'};
    padding-bottom: ${last ? '8px' : '0px'};
  `}

  &:hover {
    ${({ theme }) =>
      css`
        background-color: ${theme.hoverDefault};
      `}
    ${({ last }) =>
      last &&
      css`
        border-radius: 0px 0px 8px 8px;
      `}
  }
`
type TokenDetailsLinkProps = PropsWithChildren<{
  token: NonNullable<TopToken>
  sendAnalytics: () => void
  isFirst?: boolean
  isLast?: boolean
}>
function TokenDetailsLink({ token, sendAnalytics, isFirst, isLast, children }: TokenDetailsLinkProps) {
  return (
    <StyledTokenLink
      first={isFirst}
      last={isLast}
      to={getTokenDetailsURL(token.address, token.chain)}
      onClick={sendAnalytics}
    >
      {children}
    </StyledTokenLink>
  )
}

export default function TokenTable({ setRowCount }: { setRowCount: (c: number) => void }) {
  const filterNetwork = validateUrlChainParam(useParams().chainName ?? 'ethereum')
  const filterString = useAtomValue(filterStringAtom)
  const timePeriod = useAtomValue(filterTimeAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  // TODO: consider moving prefetched call into app.tsx and passing it here, use a preloaded call & updated on interval every 60s
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const { tokens, sparklines } = useTopTokens(chainName)
  setRowCount(tokens?.length ?? PAGE_SIZE)
  const l2CircleLogo = getChainInfo(CHAIN_NAME_TO_CHAIN_ID[filterNetwork]).circleLogoUrl

  const sendRowAnalytics = useCallback(
    (token: NonNullable<TopToken>, index: number, rank: number) => {
      sendAnalyticsEvent(EventName.EXPLORE_TOKEN_ROW_CLICKED, {
        chain_id: filterNetwork,
        token_address: token.address,
        token_symbol: token.symbol,
        token_list_index: index,
        token_list_rank: rank,
        token_list_length: tokens?.length,
        time_frame: timePeriod,
        search_token_address_input: filterString,
      })
    },
    [filterNetwork, filterString, timePeriod, tokens?.length]
  )

  /* loading and error state */
  if (!tokens) {
    return (
      <NoTokensState
        message={
          <>
            <AlertTriangle size={16} />
            <Trans>An error occurred loading tokens. Please try again.</Trans>
          </>
        }
      />
    )
  } else if (tokens?.length === 0) {
    return <NoTokensState message={<Trans>No tokens found</Trans>} />
  } else {
    return (
      <GridContainer>
        <HeaderRow />
        <TokenDataContainer>
          {tokens.map((token, index) => {
            const rank = sortAscending ? tokens.length - index : index + 1
            return token ? (
              <TokenDetailsLink
                key={token.address}
                token={token}
                sendAnalytics={() => sendRowAnalytics(token, index, rank)}
                isFirst={index === 0}
                isLast={index === tokens.length - 1}
              >
                <TokenRow tokenListRank={rank} token={token} sparklineMap={sparklines} l2CircleLogo={l2CircleLogo} />
              </TokenDetailsLink>
            ) : null
          })}
        </TokenDataContainer>
      </GridContainer>
    )
  }
}
