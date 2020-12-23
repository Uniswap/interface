import React, { useState } from 'react'
import { Token, Currency } from '@uniswap/sdk'
import styled from 'styled-components'
import { TYPE, CloseIcon } from 'theme'
import Card, { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed, AutoRow } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import { ArrowLeft, AlertTriangle } from 'react-feather'
import { LinkIcon } from './styleds'
import { lighten } from 'polished'
import useTheme from 'hooks/useTheme'
import { ButtonPrimary } from 'components/Button'
import { SectionBreak } from 'components/swap/styleds'
import { useAddUserToken } from 'state/user/hooks'
import { getEtherscanLink } from 'utils'
import { useActiveWeb3React } from 'hooks'
import { ExternalLink as Link } from '../../theme/components'
import { useCombinedInactiveList } from 'state/lists/hooks'
import ListLogo from 'components/ListLogo'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`

const PaddedColumn = styled(AutoColumn)`
  padding: 20px;
`

const WarningWrapper = styled(Card)<{ highWarning: boolean }>`
  background-color: ${({ theme, highWarning }) =>
    highWarning ? lighten(0.2, theme.red1) : lighten(0.35, theme.yellow2)};
  width: fit-content;
`

const Checkbox = styled.input`
  border: 1px solid ${({ theme }) => theme.red3};
  height: 20px;
`

interface ImportProps {
  onBack: () => void
  handleCurrencySelect: (currency: Currency) => void
  token: Token
}

export function Import({ onBack, handleCurrencySelect, token }: ImportProps) {
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
          <CloseIcon onClick={onBack} />
        </RowBetween>
      </PaddedColumn>
      <SectionBreak />
      <PaddedColumn gap="md">
        <OutlineCard>
          <AutoColumn gap="10px">
            <AutoRow gap="5px" align="center">
              <CurrencyLogo currency={token} size={'24px'} />
              <TYPE.body fontWeight={500}>{token.symbol}</TYPE.body>
              <Link href={getEtherscanLink(chainId ?? 1, token.address, 'address')}>
                <LinkIcon style={{ cursor: 'pointer', marginLeft: '0' }} />
              </Link>
            </AutoRow>
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
          </AutoColumn>
        </OutlineCard>
        <WarningWrapper borderRadius="20px" width="100%" highWarning={!list}>
          <AutoColumn gap="sm">
            <TYPE.body color={!list ? theme.red3 : theme.yellow2} ml="4px" fontSize="16px" fontWeight={500}>
              This interface can load arbitrary tokens by token addresses. Please take extra caution and do your
              research when interacting with arbitrary ERC20 tokens.
            </TYPE.body>
            <TYPE.body color={!list ? theme.red3 : theme.yellow2} ml="4px" fontSize="16px" fontWeight={500}>
              If you purchase an arbitrary token, you may be unable to sell it back.
            </TYPE.body>
            <RowFixed style={{ cursor: 'pointer' }} onClick={() => setConfirmed(!confirmed)}>
              <Checkbox
                name="confirmed"
                type="checkbox"
                checked={confirmed}
                onChange={() => setConfirmed(!confirmed)}
              />
              <TYPE.body color={!list ? theme.red3 : theme.yellow2} ml="4px" fontSize="16px" fontWeight={500}>
                I understand
              </TYPE.body>
            </RowFixed>
            <ButtonPrimary
              disabled={!confirmed}
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
        </WarningWrapper>
      </PaddedColumn>
    </Wrapper>
  )
}
