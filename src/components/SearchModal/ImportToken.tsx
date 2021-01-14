import React, { useState } from 'react'
import { Token, Currency } from '@uniswap/sdk'
import styled from 'styled-components'
import { TYPE, CloseIcon } from 'theme'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed, AutoRow } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import { ArrowLeft, AlertTriangle } from 'react-feather'
import { transparentize } from 'polished'
import useTheme from 'hooks/useTheme'
import { ButtonPrimary } from 'components/Button'
import { SectionBreak } from 'components/swap/styleds'
import { useAddUserToken } from 'state/user/hooks'
import { getEtherscanLink } from 'utils'
import { useActiveWeb3React } from 'hooks'
import { ExternalLink } from '../../theme/components'
import { useCombinedInactiveList } from 'state/lists/hooks'
import ListLogo from 'components/ListLogo'
import { PaddedColumn, Checkbox } from './styleds'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`

const WarningWrapper = styled(Card)<{ highWarning: boolean }>`
  background-color: ${({ theme, highWarning }) =>
    highWarning ? transparentize(0.8, theme.red1) : transparentize(0.8, theme.yellow2)};
  width: fit-content;
`

const AddressText = styled(TYPE.blue)`
  font-size: 12px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 10px;
`}
`

interface ImportProps {
  token: Token
  onBack: () => void
  onDismiss: () => void
  handleCurrencySelect: (currency: Currency) => void
}

export function ImportToken({ token, onBack, onDismiss, handleCurrencySelect }: ImportProps) {
  const theme = useTheme()

  const { chainId } = useActiveWeb3React()

  const [confirmed, setConfirmed] = useState(false)

  const addToken = useAddUserToken()

  // use for showing import source on inactive tokens
  const inactiveTokenList = useCombinedInactiveList()

  const list = chainId && inactiveTokenList?.[chainId]?.[token.address]?.list

  return (
    <Wrapper>
      <PaddedColumn gap="14px" style={{ width: '100%', flex: '1 1' }}>
        <RowBetween>
          <ArrowLeft style={{ cursor: 'pointer' }} onClick={onBack} />
          <TYPE.mediumHeader>Import Token</TYPE.mediumHeader>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </PaddedColumn>
      <SectionBreak />
      <PaddedColumn gap="md">
        <Card backgroundColor={theme.bg2}>
          <AutoColumn gap="10px">
            <AutoRow align="center">
              <CurrencyLogo currency={token} size={'24px'} />
              <TYPE.body ml="8px" mr="8px" fontWeight={500}>
                {token.symbol}
              </TYPE.body>
              <TYPE.darkGray fontWeight={300}>{token.name}</TYPE.darkGray>
            </AutoRow>
            {chainId && (
              <ExternalLink href={getEtherscanLink(chainId, token.address, 'address')}>
                <AddressText>{token.address}</AddressText>
              </ExternalLink>
            )}
            {list !== undefined ? (
              <RowFixed>
                {list.logoURI && <ListLogo logoURI={list.logoURI} size="12px" />}
                <TYPE.small ml="6px" color={theme.text3}>
                  via {list.name}
                </TYPE.small>
              </RowFixed>
            ) : (
              <WarningWrapper borderRadius="4px" padding="4px" highWarning={true}>
                <RowFixed>
                  <AlertTriangle stroke={theme.red1} size="10px" />
                  <TYPE.body color={theme.red1} ml="4px" fontSize="10px" fontWeight={500}>
                    Unkown Source
                  </TYPE.body>
                </RowFixed>
              </WarningWrapper>
            )}
          </AutoColumn>
        </Card>
        <Card style={{ backgroundColor: list ? transparentize(0.8, theme.yellow2) : transparentize(0.8, theme.red1) }}>
          <AutoColumn justify="center" style={{ textAlign: 'center', gap: '16px', marginBottom: '12px' }}>
            <AlertTriangle stroke={list ? theme.yellow2 : theme.red1} size={32} />
            <TYPE.body fontWeight={600} fontSize={20} color={list ? theme.yellow2 : theme.red1}>
              Trade at your own risk!
            </TYPE.body>
          </AutoColumn>

          <AutoColumn style={{ textAlign: 'center', gap: '16px', marginBottom: '12px' }}>
            <TYPE.body fontWeight={400} color={list ? theme.yellow2 : theme.red1}>
              Anyone can create a token, including creating fake versions of existing tokens that claim to represent
              projects.
            </TYPE.body>
            <TYPE.body fontWeight={600} color={list ? theme.yellow2 : theme.red1}>
              If you purchase this token, you may not be able to sell it back.
            </TYPE.body>
          </AutoColumn>
          <AutoRow justify="center" style={{ cursor: 'pointer' }} onClick={() => setConfirmed(!confirmed)}>
            <Checkbox name="confirmed" type="checkbox" checked={confirmed} onChange={() => setConfirmed(!confirmed)} />
            <TYPE.body ml="10px" fontSize="16px" color={list ? theme.yellow2 : theme.red1} fontWeight={500}>
              I understand
            </TYPE.body>
          </AutoRow>
        </Card>

        <ButtonPrimary
          disabled={!confirmed}
          altDisabledStyle={true}
          borderRadius="20px"
          padding="10px 1rem"
          onClick={() => {
            addToken(token)
            handleCurrencySelect(token)
          }}
        >
          Import
        </ButtonPrimary>
      </PaddedColumn>
    </Wrapper>
  )
}
