import React, { useRef, CSSProperties, useCallback } from 'react'
import { useFoundOnInactiveList } from 'hooks/Tokens'
import { AutoColumn } from 'components/Column'
import Card from 'components/Card'
import { TYPE } from 'theme'
import useTheme from 'hooks/useTheme'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import ImportRow from './ImportRow'
import { Token } from '@uniswap/sdk'
import styled from 'styled-components'

const Wrapper = styled.div`
  height: 100%;
  width: 100%;
  flex: 1 1;
  position: relative;
`

export default function ExpandedSearch({
  searchQuery,
  showImportView,
  setImportToken
}: {
  searchQuery: string
  showImportView: () => void
  setImportToken: (token: Token) => void
}) {
  const inactiveTokens = useFoundOnInactiveList(searchQuery)

  const theme = useTheme()

  const fixedImportList = useRef<FixedSizeList>()

  const ImportDataRow = useCallback(
    ({ data, index, style }: { data: Token[]; index: number; style: CSSProperties }) => {
      const token: Token = data[index]
      return <ImportRow token={token} style={style} showImportView={showImportView} setImportToken={setImportToken} />
    },
    [setImportToken, showImportView]
  )

  return (
    <Wrapper>
      <AutoColumn>
        <Card borderRadius="8px" mb="10px" backgroundColor={theme.bg2} padding="6px 8px">
          <TYPE.main fontWeight={500}>Showing inactive results</TYPE.main>
        </Card>
      </AutoColumn>
      {inactiveTokens && (
        <div style={{ flex: '1', height: '100%' }}>
          <AutoSizer disableWidth>
            {({ height }) => (
              <FixedSizeList
                height={height}
                ref={fixedImportList as any}
                width="100%"
                itemData={inactiveTokens}
                itemCount={inactiveTokens.length}
                itemSize={56}
              >
                {ImportDataRow}
              </FixedSizeList>
            )}
          </AutoSizer>
        </div>
      )}
    </Wrapper>
  )
}
