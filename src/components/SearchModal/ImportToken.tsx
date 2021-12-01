import { Plural, Trans } from '@lingui/macro'
import { Currency, Token } from '@uniswap/sdk-core'
import { TokenList } from '@uniswap/token-lists'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { RowBetween } from 'components/Row'
import { SectionBreak } from 'components/swap/styleds'
import { useUnsupportedTokens } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { AlertCircle, ArrowLeft } from 'react-feather'
import { useAddUserToken } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'

import BlockedToken from './BlockedToken'
import { PaddedColumn } from './styleds'
import TokenImportCard from './TokenImportCard'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  overflow: auto;
`

interface ImportProps {
  tokens: Token[]
  list?: TokenList
  onBack?: () => void
  onDismiss?: () => void
  handleCurrencySelect?: (currency: Currency) => void
}

export function ImportToken(props: ImportProps) {
  const { tokens, list, onBack, onDismiss, handleCurrencySelect } = props
  const theme = useTheme()

  const addToken = useAddUserToken()

  const unsupportedTokens = useUnsupportedTokens()
  const unsupportedSet = new Set(Object.keys(unsupportedTokens))
  const intersection = new Set(tokens.filter((token) => unsupportedSet.has(token.address)))
  if (intersection.size > 0) {
    return <BlockedToken onBack={onBack} onDismiss={onDismiss} blockedTokens={Array.from(intersection)} />
  }
  return (
    <Wrapper>
      <PaddedColumn gap="14px" style={{ width: '100%', flex: '1 1' }}>
        <RowBetween>
          {onBack ? <ArrowLeft style={{ cursor: 'pointer' }} onClick={onBack} /> : <div />}
          <ThemedText.MediumHeader>
            <Plural value={tokens.length} one="Import token" other="Import tokens" />
          </ThemedText.MediumHeader>
          {onDismiss ? <CloseIcon onClick={onDismiss} /> : <div />}
        </RowBetween>
      </PaddedColumn>
      <SectionBreak />
      <AutoColumn gap="md" style={{ marginBottom: '32px', padding: '1rem' }}>
        <AutoColumn justify="center" style={{ textAlign: 'center', gap: '16px', padding: '1rem' }}>
          <AlertCircle size={48} stroke={theme.text2} strokeWidth={1} />
          <ThemedText.Body fontWeight={400} fontSize={16}>
            <Trans>
              This token doesn&apos;t appear on the active token list(s). Make sure this is the token that you want to
              trade.
            </Trans>
          </ThemedText.Body>
        </AutoColumn>
        {tokens.map((token) => (
          <TokenImportCard token={token} list={list} key={'import' + token.address} />
        ))}
        <ButtonPrimary
          altDisabledStyle={true}
          $borderRadius="20px"
          padding="10px 1rem"
          onClick={() => {
            tokens.map((token) => addToken(token))
            handleCurrencySelect && handleCurrencySelect(tokens[0])
          }}
          className=".token-dismiss-button"
        >
          <Trans>Import</Trans>
        </ButtonPrimary>
      </AutoColumn>
    </Wrapper>
  )
}
