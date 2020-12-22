import React, { useState } from 'react'
import { Token } from '@uniswap/sdk'
import styled from 'styled-components'
import { TYPE, CloseIcon } from 'theme'
import Card, { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed, AutoRow } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import { ArrowLeft, AlertTriangle } from 'react-feather'
import { Break } from 'components/earn/styled'
import { LinkIcon } from './styleds'
import { lighten } from 'polished'
import useTheme from 'hooks/useTheme'
import { ButtonPrimary } from 'components/Button'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`

const PaddedColumn = styled(AutoColumn)`
  padding: 20px;
`

const WarningWrapper = styled(Card)`
  background-color: ${({ theme }) => lighten(0.2, theme.red1)};
  color: ${({ theme }) => theme.red3};
  width: fit-content;
`

const Checkbox = styled.input`
  border: 1px solid ${({ theme }) => theme.red3};
  height: 20px;
`

interface ImportProps {
  onBack: () => void
  token: Token
  listUrl?: string | undefined
}

export function Import({ onBack, token, listUrl }: ImportProps) {
  const theme = useTheme()

  const [confirmed, setConfirmed] = useState(false)

  return (
    <Wrapper>
      <PaddedColumn gap="14px" style={{ width: '100%', flex: '1 1' }}>
        <RowBetween>
          <ArrowLeft style={{ cursor: 'pointer' }} onClick={onBack} />
          <TYPE.mediumHeader>Confirm Token</TYPE.mediumHeader>
          <CloseIcon onClick={onBack} />
        </RowBetween>
      </PaddedColumn>
      <Break />
      <PaddedColumn gap="md">
        <OutlineCard>
          <AutoColumn gap="10px">
            <AutoRow gap="5px">
              <CurrencyLogo currency={token} size={'24px'} />
              <TYPE.body fontWeight={500}>{token.symbol}</TYPE.body>
              <LinkIcon href={''} />
            </AutoRow>
            {!!listUrl ? (
              <TYPE.main fontSize="12px">Found via</TYPE.main>
            ) : (
              <WarningWrapper borderRadius="4px" padding="4px">
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
        <WarningWrapper borderRadius="20px" width="100%">
          <AutoColumn gap="sm">
            <TYPE.body color={theme.red3} ml="4px" fontSize="16px" fontWeight={500}>
              This interface can load arbitrary tokens by token addresses. Please take extra caution and do your
              research when interacting with arbitrary ERC20 tokens.
            </TYPE.body>
            <TYPE.body color={theme.red3} ml="4px" fontSize="16px" fontWeight={500}>
              If you purchase an arbitrary token, you may be unable to sell it back.
            </TYPE.body>
            <RowFixed style={{ cursor: 'pointer' }} onClick={() => setConfirmed(!confirmed)}>
              <Checkbox
                name="confirmed"
                type="checkbox"
                checked={confirmed}
                onChange={() => setConfirmed(!confirmed)}
              />
              <TYPE.body color={theme.red3} ml="4px" fontSize="16px" fontWeight={500}>
                I understand
              </TYPE.body>
            </RowFixed>
            <ButtonPrimary disabled={!confirmed} borderRadius="20px" padding="10px 1rem">
              Import
            </ButtonPrimary>
          </AutoColumn>
        </WarningWrapper>
      </PaddedColumn>
    </Wrapper>
  )
}
