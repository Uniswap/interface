import { Trans } from '@lingui/macro'
import { showFavoritesAtom } from 'components/Tokens/state'
import { PAGE_SIZE, useTopTokens } from 'graphql/data/TopTokens'
import { validateUrlChainParam } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { ReactNode, useCallback, useRef } from 'react'
import { AlertTriangle } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled from 'styled-components/macro'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import { HeaderRow, LoadedRow, LoadingRow } from './TokenRow'

const LOADING_ROWS_COUNT = 3

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  background-color: ${({ theme }) => theme.backgroundSurface};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  margin-left: auto;
  margin-right: auto;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`

const TokenDataContainer = styled.div`
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

const LoadingMoreRows = Array(LOADING_ROWS_COUNT).fill(<LoadingRow />)
const LoadingRows = (rowCount?: number) => Array(rowCount ?? PAGE_SIZE).fill(<LoadingRow />)

export function LoadingTokenTable({ rowCount }: { rowCount?: number }) {
  return (
    <GridContainer>
      <HeaderRow />
      <TokenDataContainer>{LoadingRows(rowCount)}</TokenDataContainer>
    </GridContainer>
  )
}

export default function TokenTable() {
  const showFavorites = useAtomValue<boolean>(showFavoritesAtom)

  // TODO: consider moving prefetched call into app.tsx and passing it here, use a preloaded call & updated on interval every 60s
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const { loading, tokens, tokensWithoutPriceHistoryCount, hasMore, loadMoreTokens, maxFetchable } =
    useTopTokens(chainName)
  const showMoreLoadingRows = Boolean(loading && hasMore)

  const observer = useRef<IntersectionObserver>()
  const lastTokenRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreTokens()
        }
      })
      if (node) observer.current.observe(node)
    },
    [loading, hasMore, loadMoreTokens]
  )

  /* loading and error state */
  if (loading && (!tokens || tokens?.length === 0)) {
    return <LoadingTokenTable rowCount={Math.min(tokensWithoutPriceHistoryCount, PAGE_SIZE)} />
  } else {
    if (!tokens) {
      return (
        <NoTokensState
          message={
            <>
              <AlertTriangle size={16} />
              <Trans>An error occured loading tokens. Please try again.</Trans>
            </>
          }
        />
      )
    } else if (tokens?.length === 0) {
      return showFavorites ? (
        <NoTokensState message={<Trans>You have no favorited tokens</Trans>} />
      ) : (
        <NoTokensState message={<Trans>No tokens found</Trans>} />
      )
    } else {
      return (
        <>
          <GridContainer>
            <HeaderRow />
            <TokenDataContainer>
              {tokens.map(
                (token, index) =>
                  token && (
                    <LoadedRow
                      key={token?.address}
                      tokenListIndex={index}
                      tokenListLength={maxFetchable}
                      token={token}
                      ref={index + 1 === tokens.length ? lastTokenRef : undefined}
                    />
                  )
              )}
              {showMoreLoadingRows && LoadingMoreRows}
            </TokenDataContainer>
          </GridContainer>
        </>
      )
    }
  }
}
