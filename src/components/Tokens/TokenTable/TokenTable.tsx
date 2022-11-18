import { Trans } from '@lingui/macro'
import { PAGE_SIZE, useTopTokens } from 'graphql/data/TopTokens'
import { chainBackendNameToId, validateUrlChainParam } from 'graphql/data/util'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled from 'styled-components/macro'
import { glowEffect } from 'theme/styles/glow'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import { HeaderRow, LoadedRow, LoadingRow } from './TokenRow'

const GridContainer = styled.div`
  ${glowEffect}

  display: flex;
  flex-direction: column;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  background-color: ${({ theme }) => theme.backgroundSurface};
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

function NoTokensState({ chainId, message }: { chainId: number; message: ReactNode }) {
  return (
    <GridContainer chainId={chainId}>
      <HeaderRow />
      <NoTokenDisplay>{message}</NoTokenDisplay>
    </GridContainer>
  )
}

const LoadingRows = ({ rowCount }: { rowCount: number }) => (
  <>
    {Array(rowCount)
      .fill(null)
      .map((_, index) => {
        return <LoadingRow key={index} first={index === 0} last={index === rowCount - 1} />
      })}
  </>
)

export function LoadingTokenTable({ chainId, rowCount = PAGE_SIZE }: { chainId: number; rowCount?: number }) {
  return (
    <GridContainer chainId={chainId}>
      <HeaderRow />
      <TokenDataContainer>
        <LoadingRows rowCount={rowCount} />
      </TokenDataContainer>
    </GridContainer>
  )
}

export default function TokenTable({ setRowCount }: { setRowCount: (c: number) => void }) {
  // TODO: consider moving prefetched call into app.tsx and passing it here, use a preloaded call & updated on interval every 60s
  // TODO: consider passing `chainId` and `chainName` from parent, where we already have it resolved
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const { tokens, sparklines } = useTopTokens(chainName)
  setRowCount(tokens?.length ?? PAGE_SIZE)

  const chainId = chainBackendNameToId(chainName)

  /* loading and error state */
  if (!tokens) {
    return (
      <NoTokensState
        chainId={chainId}
        message={
          <>
            <AlertTriangle size={16} />
            <Trans>An error occurred loading tokens. Please try again.</Trans>
          </>
        }
      />
    )
  } else if (tokens?.length === 0) {
    return <NoTokensState chainId={chainId} message={<Trans>No tokens found</Trans>} />
  } else {
    return (
      <GridContainer chainId={chainId}>
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
