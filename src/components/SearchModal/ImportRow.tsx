import React, { CSSProperties } from 'react'
import { Token } from '@uniswap/sdk'
import { RowBetween, RowFixed } from 'components/Row'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { TYPE } from 'theme'
import ListLogo from 'components/ListLogo'
import { useActiveWeb3React } from 'hooks'
import { useCombinedInactiveList } from 'state/lists/hooks'
import useTheme from 'hooks/useTheme'
import { ButtonPrimary } from 'components/Button'
import styled from 'styled-components'

const TokenSection = styled.div`
  background-color: ${({ theme }) => theme.bg1};
  padding: 4px 0px;
  height: 56px;
`

export default function ImportRow({
  token,
  style,
  setShowImport,
  setImportToken
}: {
  token: Token
  style?: CSSProperties
  setShowImport: (val: boolean) => void
  setImportToken: (token: Token) => void
}) {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  const inactiveTokenList = useCombinedInactiveList()

  const list = chainId && inactiveTokenList?.[chainId]?.[token.address]?.list

  return (
    <TokenSection style={style}>
      <RowBetween>
        <AutoColumn gap="sm">
          <RowFixed>
            <CurrencyLogo currency={token} size={'24px'} />
            <TYPE.body ml="10px" fontWeight={500}>
              {token.symbol}
            </TYPE.body>
            {list && list.logoURI && (
              <RowFixed style={{ marginLeft: '16px' }}>
                <ListLogo logoURI={list.logoURI} size="12px" />
                <TYPE.small ml="4px" color={theme.text3}>
                  via {list.name}
                </TYPE.small>
              </RowFixed>
            )}
          </RowFixed>
        </AutoColumn>
        <ButtonPrimary
          width="fit-content"
          padding="6px 8px"
          fontWeight={500}
          fontSize="12px"
          onClick={() => {
            setImportToken(token)
            setShowImport(true)
          }}
        >
          + Import
        </ButtonPrimary>
      </RowBetween>
    </TokenSection>
  )
}
