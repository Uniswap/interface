import { Trans } from '@lingui/macro'
import { showFavoritesAtom } from 'components/Tokens/state'
import { usePrefetchTopTokens, useTopTokens } from 'graphql/data/TopTokens'
import { useAtomValue } from 'jotai/utils'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import LoadedRow, { HeaderRow, LoadingRow } from './TokenRow'

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
const TokenRowsContainer = styled.div`
  width: 100%;
`

function NoTokensState({ message }: { message: ReactNode }) {
  return (
    <GridContainer>
      <HeaderRow />
      <NoTokenDisplay>{message}</NoTokenDisplay>
    </GridContainer>
  )
}

const LOADING_ROWS = Array.from({ length: 100 })
  .fill(0)
  .map((_item, index) => <LoadingRow key={index} />)

export function LoadingTokenTable() {
  return (
    <GridContainer>
      <HeaderRow />
      <TokenRowsContainer>{LOADING_ROWS}</TokenRowsContainer>
    </GridContainer>
  )
}

export default function TokenTable() {
  const showFavorites = useAtomValue<boolean>(showFavoritesAtom)

  // TODO: consider moving prefetched call into app.tsx and passing it here, use a preloaded call & updated on interval every 60s
  const prefetchedTokens = usePrefetchTopTokens()
  const { loading, tokens, loadMoreTokens } = useTopTokens(prefetchedTokens)

  /* loading and error state */
  if (loading) {
    return <LoadingTokenTable />
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
            <TokenRowsContainer>
              {tokens?.map((token, index) => (
                <LoadedRow key={token?.name} tokenListIndex={index} tokenListLength={tokens.length} token={token} />
              ))}
            </TokenRowsContainer>
          </GridContainer>
          <button onClick={loadMoreTokens}>load more</button>
        </>
      )
    }
  }
}
