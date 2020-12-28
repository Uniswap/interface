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
import { useIsUserAddedToken, useIsTokenActive } from 'hooks/Tokens'
import { CheckCircle } from 'react-feather'

const TokenSection = styled.div`
  background-color: ${({ theme }) => theme.bg1};
  padding: 4px 0px;
  height: 56px;
`

const CheckIcon = styled(CheckCircle)`
  height: 16px;
  width: 16px;
  margin-right: 6px;
  stroke: ${({ theme }) => theme.green1};
`

export default function ImportRow({
  token,
  style,
  showImportView,
  setImportToken
}: {
  token: Token
  style?: CSSProperties
  showImportView: () => void
  setImportToken: (token: Token) => void
}) {
  // gloabls
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  // check if token comes from list
  const inactiveTokenList = useCombinedInactiveList()
  const list = chainId && inactiveTokenList?.[chainId]?.[token.address]?.list

  // check if already active on list or local storage tokens
  const isAdded = useIsUserAddedToken(token)
  const isActive = useIsTokenActive(token)

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
        {!isActive && !isAdded ? (
          <ButtonPrimary
            width="fit-content"
            padding="6px 8px"
            fontWeight={500}
            fontSize="12px"
            onClick={() => {
              setImportToken && setImportToken(token)
              showImportView()
            }}
          >
            + Import
          </ButtonPrimary>
        ) : (
          <RowFixed>
            <CheckIcon />
            <TYPE.main color={theme.green1}>Active</TYPE.main>
          </RowFixed>
        )}
      </RowBetween>
    </TokenSection>
  )
}
