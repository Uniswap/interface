import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { transparentize } from 'polished'
import { useCallback, useEffect } from 'react'
import { AlertTriangle, ArrowLeft } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useAddUserToken } from 'state/user/hooks'
import { CloseIcon, TYPE } from 'theme'
import { ExternalLinkIcon } from 'theme/components'
import { getEtherscanLink, shortenAddress } from 'utils'

import { PaddedColumn } from './styleds'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  overflow: auto;
`

const WarningWrapper = styled(Card)`
  background-color: ${({ theme }) => transparentize(0.8, theme.warning)};
  width: fit-content;
`

const SectionBreak = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${({ theme }) => theme.bg3};
`

const AddressText = styled.div`
  font-size: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 10px;
`}
`

const DescText = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.warning};
  font-weight: 500;
  margin-left: 8px;
`

interface ImportProps {
  enterToImport?: boolean
  tokens: Token[]
  onBack?: () => void
  onDismiss?: () => void
  handleCurrencySelect?: (currency: Currency[]) => void
}

export function ImportToken({ enterToImport = false, tokens, onBack, onDismiss, handleCurrencySelect }: ImportProps) {
  const theme = useTheme()

  const { chainId } = useActiveWeb3React()

  const addToken = useAddUserToken()

  const onClickImport = useCallback(() => {
    tokens.forEach(addToken)
    handleCurrencySelect?.(tokens)
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
          {onDismiss ? <CloseIcon onClick={onDismiss} /> : <div />}
        </RowBetween>
      </PaddedColumn>
      <SectionBreak />
      <Flex flexDirection={'column'} style={{ padding: '1rem', gap: '1rem' }}>
        <WarningWrapper borderRadius="20px" padding="15px">
          <Flex alignItems={'flex-start'}>
            <div>
              <AlertTriangle stroke={theme.warning} size="17px" />
            </div>
            <DescText>
              <Trans>This token isn’t frequently swapped. Please do your own research before trading.</Trans>
            </DescText>
          </Flex>
        </WarningWrapper>
        {tokens.map(token => {
          return (
            <Card backgroundColor={theme.buttonBlack} key={token.address} padding="2rem">
              <Flex style={{ gap: 10 }}>
                <CurrencyLogo currency={token} size={'44px'} />
                <AutoColumn gap="4px">
                  <TYPE.body fontWeight={500} fontSize={20}>
                    {token.symbol}
                  </TYPE.body>
                  <Text color={theme.subText} fontWeight={400} fontSize={14}>
                    {token.name}
                  </Text>
                  <Flex alignItems={'center'} color={theme.text} style={{ gap: 5 }}>
                    <AddressText>
                      <Trans>Address</Trans>: {shortenAddress(chainId, token.address, 7)}
                    </AddressText>
                    <CopyHelper toCopy={token.address} style={{ color: theme.subText }} />
                    <ExternalLinkIcon
                      color={theme.subText}
                      size={16}
                      href={getEtherscanLink(chainId, token.address, 'address')}
                    />
                  </Flex>
                </AutoColumn>
              </Flex>
            </Card>
          )
        })}

        <ButtonPrimary borderRadius="20px" padding="10px 1rem" onClick={onClickImport}>
          <Trans>I understand</Trans>
        </ButtonPrimary>
      </Flex>
    </Wrapper>
  )
}
