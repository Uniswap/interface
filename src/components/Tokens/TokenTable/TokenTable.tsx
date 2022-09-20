import { Trans } from '@lingui/macro'
import { showFavoritesAtom } from 'components/Tokens/state'
import { usePrefetchTopTokens, useTopTokens } from 'graphql/data/TopTokens'
import { useAtomValue } from 'jotai/utils'
import { CSSProperties, ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList, ListOnItemsRenderedProps } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import styled from 'styled-components/macro'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import LoadedRow, { HeaderRow, LoadingRow } from './TokenRow'

const MAX_TOKENS_TO_LOAD = 100

const GridContainer = styled.div<{ fixedHeight?: boolean }>`
  display: flex;
  flex-direction: column;
  height: ${({ fixedHeight }) => fixedHeight && '70vh'};
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

export function LoadingTokenTable() {
  return (
    <GridContainer fixedHeight={true}>
      <HeaderRow />
      <TokenDataContainer>
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList className="List" height={height} width={width} itemCount={MAX_TOKENS_TO_LOAD} itemSize={70}>
              {({ index, style }) => <LoadingRow style={style} key={index} />}
            </FixedSizeList>
          )}
        </AutoSizer>
      </TokenDataContainer>
    </GridContainer>
  )
}

interface TokenRowProps {
  index: number
  style: CSSProperties
}

export default function TokenTable() {
  const showFavorites = useAtomValue<boolean>(showFavoritesAtom)

  // TODO: consider moving prefetched call into app.tsx and passing it here, use a preloaded call & updated on interval every 60s
  const prefetchedTokens = usePrefetchTopTokens()
  const { loading, tokens, loadMoreTokens } = useTopTokens(prefetchedTokens)

  const isItemLoaded = (index: number) => !loading && !!tokens && index < tokens.length

  const Row = function TokenRow({ index, style }: TokenRowProps) {
    const token = !!tokens && tokens[index]
    if (!token || loading) {
      return <LoadingRow style={style} key={index} />
    }
    return (
      <LoadedRow
        style={style}
        key={token?.name}
        tokenListIndex={index}
        tokenListLength={tokens?.length ?? 0}
        token={token}
      />
    )
  }

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
          <GridContainer fixedHeight={true}>
            <HeaderRow />
            <TokenDataContainer>
              <AutoSizer>
                {({ height, width }) => (
                  <InfiniteLoader
                    isItemLoaded={isItemLoaded}
                    itemCount={MAX_TOKENS_TO_LOAD}
                    loadMoreItems={loadMoreTokens}
                  >
                    {({
                      onItemsRendered,
                      ref,
                    }: {
                      onItemsRendered: (props: ListOnItemsRenderedProps) => any
                      ref: any
                    }) => (
                      <FixedSizeList
                        height={height}
                        width={width}
                        itemCount={MAX_TOKENS_TO_LOAD}
                        itemSize={70}
                        onItemsRendered={onItemsRendered}
                        ref={ref}
                      >
                        {Row}
                      </FixedSizeList>
                    )}
                  </InfiniteLoader>
                )}
              </AutoSizer>
            </TokenDataContainer>
          </GridContainer>
        </>
      )
    }
  }
}
