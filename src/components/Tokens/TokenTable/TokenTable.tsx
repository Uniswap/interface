import { Trans } from '@lingui/macro'
import { showFavoritesAtom } from 'components/Tokens/state'
import { PAGE_SIZE, useTopTokens } from 'graphql/data/TopTokens'
import { validateUrlChainParam } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled from 'styled-components/macro'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import { HeaderRow, LoadedRow, LoadingRow } from './TokenRow'

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
  margin-top: 8px;
`

const LoadingRows = (rowCount?: number) => (
  <LoadingRowsWrapper>
    {Array(rowCount ?? PAGE_SIZE)
      .fill(null)
      .map((_, index) => {
        return <LoadingRow key={index} />
      })}
  </LoadingRowsWrapper>
)

export function LoadingTokenTable({ rowCount }: { rowCount?: number }) {
  return (
    <GridContainer>
      <HeaderRow />
      <TokenDataContainer>{LoadingRows(rowCount)}</TokenDataContainer>
    </GridContainer>
  )
}

export default function TokenTable({ setRowCount }: { setRowCount: (c: number) => void }) {
  const showFavorites = useAtomValue<boolean>(showFavoritesAtom)

  // TODO: consider moving prefetched call into app.tsx and passing it here, use a preloaded call & updated on interval every 60s
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const { tokens, sparklines } = useTopTokens(chainName)
  setRowCount(tokens?.length ?? PAGE_SIZE)

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
    return showFavorites ? (
      <NoTokensState message={<Trans>You have no favorited tokens</Trans>} />
    ) : (
      <NoTokensState message={<Trans>No tokens found</Trans>} />
    )
  } else {
    return (
      <GridContainer>
        <HeaderRow />
        <TokenDataContainer>
          {tokens.map(
            (token, index) =>
              token && (
                <LoadedRow
                  key={token?.address}
                  tokenListIndex={index}
                  tokenListLength={tokens.length}
                  token={token}
                  sparklineMap={sparklines}
                />
              )
          )}
        </TokenDataContainer>
      </GridContainer>
    )
  }
}
