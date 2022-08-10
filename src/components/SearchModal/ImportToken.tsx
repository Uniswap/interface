import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba, transparentize } from 'polished'
import { useCallback, useEffect } from 'react'
import { AlertCircle, ArrowLeft, CornerDownLeft } from 'react-feather'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import ListLogo from 'components/ListLogo'
import { RowBetween, RowFixed } from 'components/Row'
import { SectionBreak } from 'components/swap/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { LiteTokenList } from 'state/lists/wrappedTokenInfo'
import { useAddUserToken } from 'state/user/hooks'
import { CloseIcon, TYPE } from 'theme'
import { getEtherscanLink } from 'utils'

import { ExternalLink } from '../../theme/components'
import { PaddedColumn } from './styleds'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  overflow: auto;
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

const IconEnterWrapper = styled.div`
  position: absolute;
  background-color: ${({ theme }) => rgba(theme.background, 0.45)};
  border-radius: 20px;
  padding: 6px 15px 4px 15px;
  right: 13px;
`

interface ImportProps {
  enterToImport?: boolean
  tokens: Token[]
  onBack?: () => void
  list?: LiteTokenList
  onDismiss?: () => void
  handleCurrencySelect?: (currency: Currency) => void
}

export function ImportToken({
  enterToImport = false,
  tokens,
  onBack,
  onDismiss,
  handleCurrencySelect,
  list,
}: ImportProps) {
  const theme = useTheme()

  const { chainId } = useActiveWeb3React()

  const addToken = useAddUserToken()
  const onClickImport = useCallback(() => {
    tokens.forEach(addToken)
    handleCurrencySelect?.(tokens[0])
  }, [tokens, addToken, handleCurrencySelect])
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter' && enterToImport) {
        e.preventDefault()
        onClickImport()
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('keydown', onKeydown)
    }
  }, [onClickImport, enterToImport])

  return (
    <Wrapper>
      <PaddedColumn gap="14px" style={{ width: '100%', flex: '1 1' }}>
        <RowBetween>
          {onBack ? <ArrowLeft style={{ cursor: 'pointer' }} onClick={onBack} /> : <div></div>}
          <TYPE.mediumHeader>{tokens.length > 1 ? t`Import Tokens` : t`Import Token`}</TYPE.mediumHeader>
          {onDismiss ? <CloseIcon onClick={onDismiss} /> : <div></div>}
        </RowBetween>
      </PaddedColumn>
      <SectionBreak />
      <AutoColumn gap="md" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <AutoColumn justify="center" style={{ textAlign: 'center', gap: '16px', padding: '1rem' }}>
          <AlertCircle size={48} stroke={theme.text2} strokeWidth={1} />
          <TYPE.body fontWeight={400} fontSize={16}>
            {tokens.length > 1 ? (
              <Trans>
                These tokens don&apos;t appear on the active token list(s). Make sure these are the tokens that you want
                to trade.
              </Trans>
            ) : (
              <Trans>
                This token doesn&apos;t appear on the active token list(s). Make sure this is the token that you want to
                trade.
              </Trans>
            )}
          </TYPE.body>
        </AutoColumn>
        {tokens.map(token => {
          return (
            <Card
              backgroundColor={theme.buttonBlack}
              key={'import' + token.address}
              className=".token-warning-container"
              padding="2rem"
            >
              <AutoColumn gap="10px" justify="center">
                <CurrencyLogo currency={token} size={'32px'} />

                <AutoColumn gap="4px" justify="center">
                  <TYPE.body ml="8px" mr="8px" fontWeight={500} fontSize={20}>
                    {token.symbol}
                  </TYPE.body>
                  <TYPE.darkGray fontWeight={400} fontSize={14}>
                    {token.name}
                  </TYPE.darkGray>
                </AutoColumn>
                {chainId && (
                  <ExternalLink href={getEtherscanLink(chainId, token.address, 'address')}>
                    <AddressText fontSize={12}>{token.address}</AddressText>
                  </ExternalLink>
                )}
                {list !== undefined ? (
                  <RowFixed>
                    {list.logoURI && <ListLogo logoURI={list.logoURI} size="16px" />}
                    <TYPE.small ml="6px" fontSize={14} color={theme.text3}>
                      <Trans>via {list.name} token list</Trans>
                    </TYPE.small>
                  </RowFixed>
                ) : (
                  <WarningWrapper borderRadius="4px" padding="4px" highWarning={true}>
                    <RowFixed>
                      <AlertCircle stroke={theme.red1} size="10px" />
                      <TYPE.body color={theme.red1} ml="4px" fontSize="10px" fontWeight={500}>
                        <Trans>Unknown Source</Trans>
                      </TYPE.body>
                    </RowFixed>
                  </WarningWrapper>
                )}
              </AutoColumn>
            </Card>
          )
        })}

        <ButtonPrimary
          altDisabledStyle={true}
          borderRadius="20px"
          padding="10px 1rem"
          margin="16px 0 0"
          onClick={onClickImport}
          className=".token-dismiss-button"
          style={{ position: 'relative' }}
        >
          <Trans>Import</Trans>
          {enterToImport && (
            <IconEnterWrapper>
              <CornerDownLeft size={14} color={theme.primary} />
            </IconEnterWrapper>
          )}
        </ButtonPrimary>
      </AutoColumn>
    </Wrapper>
  )
}
