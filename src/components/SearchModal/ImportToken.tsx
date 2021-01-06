import React, { useState } from 'react'
import { Token, Currency } from '@uniswap/sdk'
import styled from 'styled-components'
import { TYPE, CloseIcon } from 'theme'
import Card, { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Row, { RowBetween, RowFixed, AutoRow } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import { ArrowLeft, AlertTriangle } from 'react-feather'
import { lighten } from 'polished'
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
    highWarning ? lighten(0.2, theme.red1) : lighten(0.35, theme.yellow2)};
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
          <TYPE.mediumHeader>Confirm Token</TYPE.mediumHeader>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </PaddedColumn>
      <SectionBreak />
      <PaddedColumn gap="md">
        <Card bg={theme.bg3}>
          <AutoColumn gap="md" justify="center">
            <AlertTriangle stroke={list ? theme.yellow2 : theme.red1} size="32px" />
            <TYPE.largeHeader color={list ? theme.text1 : theme.red1}>
              {list ? 'Custom Token' : 'Unknown Token'}
            </TYPE.largeHeader>
            {list ? (
              <TYPE.body>
                You are importing a token from the <ExternalLink href={''}>{list.name}</ExternalLink> list.
              </TYPE.body>
            ) : (
              <TYPE.body>This interface can load arbitrary tokens by token addresses.</TYPE.body>
            )}
            <TYPE.body>
              Anyone can create these tokens. Please take extra caution and do your research when interacting with
              imported ERC20 tokens.
            </TYPE.body>
            <TYPE.body fontWeight={600} color={list ? theme.text1 : theme.red1}>
              If you purchase an imported token, you may be unable to sell it back. You are trading at your own risk.
            </TYPE.body>
            <Row>
              <RowFixed style={{ cursor: 'pointer' }} onClick={() => setConfirmed(!confirmed)}>
                <Checkbox
                  name="confirmed"
                  type="checkbox"
                  checked={confirmed}
                  onChange={() => setConfirmed(!confirmed)}
                />
                <TYPE.body ml="10px" fontSize="16px" fontWeight={500}>
                  I understand
                </TYPE.body>
              </RowFixed>
            </Row>
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
          </AutoColumn>
        </Card>
        <OutlineCard>
          <AutoColumn gap="10px">
            <AutoRow gap="5px" align="center">
              <CurrencyLogo currency={token} size={'24px'} />
              <TYPE.body fontWeight={500}>{token.symbol}</TYPE.body>
              {list !== undefined ? (
                <RowFixed>
                  {list.logoURI && <ListLogo logoURI={list.logoURI} size="12px" />}
                  <TYPE.small ml="10px" color={theme.text3}>
                    Found via {list.name}
                  </TYPE.small>
                </RowFixed>
              ) : (
                <WarningWrapper borderRadius="4px" padding="4px" highWarning={true}>
                  <RowFixed>
                    <AlertTriangle stroke={theme.red3} size="10px" />
                    <TYPE.body color={theme.red3} ml="4px" fontSize="10px" fontWeight={500}>
                      Unkown Source
                    </TYPE.body>
                  </RowFixed>
                </WarningWrapper>
              )}
            </AutoRow>
            {chainId && (
              <ExternalLink href={getEtherscanLink(chainId, token.address, 'address')}>
                <AddressText>{token.address}</AddressText>
              </ExternalLink>
            )}
          </AutoColumn>
        </OutlineCard>
      </PaddedColumn>
    </Wrapper>
  )
}
