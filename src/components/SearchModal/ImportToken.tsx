import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { transparentize } from 'polished'
import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Card from 'components/Card'
import Checkbox from 'components/CheckBox'
import { AutoColumn } from 'components/Column'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import { RowBetween, RowFixed } from 'components/Row'
import { SectionBreak } from 'components/swap/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useAddUserToken } from 'state/user/hooks'
import { CloseIcon, TYPE } from 'theme'
import { getEtherscanLink, shortenAddress } from 'utils'

import { ExternalLinkIcon } from '../../theme/components'
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

const AddressText = styled.div`
  font-size: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 10px;
`}
`

const DescText = styled.p`
  font-size: 14px;
`

interface ImportProps {
  enterToImport?: boolean
  tokens: Token[]
  onBack?: () => void
  onDismiss?: () => void
  handleCurrencySelect?: (currency: Currency) => void
}

export function ImportToken({ enterToImport = false, tokens, onBack, onDismiss, handleCurrencySelect }: ImportProps) {
  const theme = useTheme()

  const { chainId } = useActiveWeb3React()
  const [agree, setAgree] = useState(false)

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
                  {chainId && (
                    <Flex alignItems={'center'} color={theme.text} style={{ gap: 5 }}>
                      <AddressText>
                        <Trans>Address</Trans>: {shortenAddress(token.address, 7)}
                      </AddressText>
                      <CopyHelper toCopy={token.address} style={{ color: theme.subText }} />
                      <ExternalLinkIcon
                        color={theme.subText}
                        size={16}
                        href={getEtherscanLink(chainId, token.address, 'address')}
                      />
                    </Flex>
                  )}
                </AutoColumn>
              </Flex>
            </Card>
          )
        })}

        <WarningWrapper borderRadius="20px" padding="15px" highWarning={true}>
          <RowFixed>
            <AlertTriangle stroke={theme.red1} size="20px" />
            <TYPE.body color={theme.red1} ml="8px" fontSize="20px">
              <Trans>Trade at your own risk!</Trans>
            </TYPE.body>
          </RowFixed>
          <DescText>
            <Trans>
              Anyone can create a token, including creating fake versions of existing tokens that claim to represent
              projects
            </Trans>
          </DescText>
          <DescText>
            <Trans>If you purchase this token, you may not be able to sell it back</Trans>
          </DescText>

          <Flex fontSize={14} alignItems="center" style={{ gap: 10 }}>
            <Checkbox
              id="checkboxImported"
              type="checkbox"
              checked={agree}
              onChange={e => {
                setAgree(e.target.checked)
              }}
            />
            <label htmlFor="checkboxImported">
              <Trans>I understand</Trans>
            </label>
          </Flex>
        </WarningWrapper>
        <ButtonPrimary
          disabled={!agree}
          borderRadius="20px"
          padding="10px 1rem"
          margin="10px 0 0"
          onClick={onClickImport}
          style={{ position: 'relative' }}
        >
          <Trans>Import</Trans>
        </ButtonPrimary>
      </AutoColumn>
    </Wrapper>
  )
}
