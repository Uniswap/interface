import { TokenList } from '@uniswap/token-lists/dist/types'
import React from 'react'
import { Token, Currency } from 'dxswap-sdk'
import styled from 'styled-components/macro'
import { TYPE, CloseIcon } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import { ButtonError } from '../Button'
import { useAddUserToken } from '../../state/user/hooks'
import { GoBackIcon, PaddedColumn } from './styleds'
import { Text } from 'rebass'
import { TokenWarningCard } from '../TokenWarningModal'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  overflow: auto;
  background-color: ${({ theme }) => theme.bg1And2};
`

const BottomSectionContainer = styled.div`
  background-color: ${({ theme }) => theme.bg1};
  padding: 20px;
`

const SpacedButtonError = styled(ButtonError)`
  margin-top: 24px;
`

interface ImportProps {
  tokens: Token[]
  list?: TokenList
  onBack: () => void
  onDismiss: () => void
  handleCurrencySelect?: (currency: Currency) => void
}

export function ImportToken({ tokens, list, onBack, onDismiss, handleCurrencySelect }: ImportProps) {
  const addToken = useAddUserToken()

  return (
    <Wrapper>
      <PaddedColumn gap="14px" style={{ width: '100%', flex: '1 1' }}>
        <RowBetween>
          <GoBackIcon onClick={onBack} />
          <Text fontWeight={500} fontSize={16}>
            Import unknown {tokens.length > 1 ? 'tokens' : 'token'}
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </PaddedColumn>
      <AutoColumn>
        <AutoColumn gap="16px" style={{ padding: '20px', paddingTop: '12px' }}>
          <TYPE.body fontSize="14px" fontWeight="400" lineHeight="22px" letterSpacing="-0.02em" color="text4">
            Anyone can create an ERC20 token on Ethereum with <em>any</em> name, including creating fake versions of
            existing tokens and tokens that claim to represent projects that do not have a token.
          </TYPE.body>
          <TYPE.body fontSize="14px" fontWeight="400" lineHeight="22px" letterSpacing="-0.02em" color="text4">
            This interface can load arbitrary tokens by token addresses. Please take extra caution and do your research
            when interacting with arbitrary ERC20 tokens.
          </TYPE.body>
          <TYPE.body fontSize="14px" fontWeight="400" lineHeight="22px" letterSpacing="-0.02em" color="text4">
            If you purchase an arbitrary token, <strong>you may be unable to sell it back.</strong>
          </TYPE.body>
        </AutoColumn>
        <BottomSectionContainer>
          <AutoColumn gap="2px">
            {tokens.map(token => {
              return <TokenWarningCard key={token.address} token={token} list={list} />
            })}
            <SpacedButtonError
              error
              onClick={() => {
                tokens.map(token => addToken(token))
                handleCurrencySelect && handleCurrencySelect(tokens[0])
              }}
            >
              Import
            </SpacedButtonError>
          </AutoColumn>
        </BottomSectionContainer>
      </AutoColumn>
    </Wrapper>
  )
}
