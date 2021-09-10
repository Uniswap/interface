import { Token } from '@swapr/sdk'
import React, { useCallback, useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { ExternalLink, TYPE } from '../../theme'
import { getExplorerLink, shortenAddress } from '../../utils'
import CurrencyLogo from '../CurrencyLogo'
import Modal from '../Modal'
import { AutoRow, RowFixed } from '../Row'
import { AutoColumn } from '../Column'
import { AlertCircle, AlertTriangle } from 'react-feather'
import { ButtonError } from '../Button'
import { TokenList } from '@uniswap/token-lists'
import ListLogo from '../ListLogo'
import { transparentize } from 'polished'

const WarningContainer = styled.div`
  width: 100%;
  overflow: auto;
`

const OuterContainer = styled.div`
  background: ${({ theme }) => theme.bg1And2};
`

const UpperSectionContainer = styled.div`
  padding: 20px;
`

const BottomSectionContainer = styled.div`
  background: ${({ theme }) => theme.bg1};
  padding: 20px;
`

const StyledWarningIcon = styled(AlertTriangle)`
  stroke: ${({ theme }) => theme.text3};
`

const WarningWrapper = styled.div`
  border-radius: 4px;
  padding: 4px;
  background-color: ${({ theme }) => transparentize(0.8, theme.red1)};
`

const SpacedButtonError = styled(ButtonError)`
  margin-top: 24px;
`

interface TokenWarningCardProps {
  token?: Token
  list?: TokenList
}

export function TokenWarningCard({ token, list }: TokenWarningCardProps) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()

  if (!token) return null

  return (
    <AutoRow gap="6px">
      <AutoColumn gap="24px">
        <CurrencyLogo currency={token} size={'16px'} />
        <div> </div>
      </AutoColumn>
      <AutoColumn gap="11px" justify="flex-start">
        <TYPE.main fontSize="16px" lineHeight="20px">
          {token && token.name && token.symbol && token.name !== token.symbol
            ? `${token.name} (${token.symbol})`
            : token.name || token.symbol}{' '}
        </TYPE.main>
        {chainId && (
          <ExternalLink
            color="purple4"
            style={{ fontWeight: 400 }}
            href={getExplorerLink(chainId, token.address, 'token')}
          >
            <TYPE.main color="purple4" fontSize="14px" lineHeight="17px" title={token.address}>
              {shortenAddress(token.address)} (View on block explorer)
            </TYPE.main>
          </ExternalLink>
        )}
        {list !== undefined ? (
          <RowFixed>
            {list.logoURI && <ListLogo logoURI={list.logoURI} defaultText={list.name} size="16px" />}
            <TYPE.small ml="6px" fontSize={14} color={theme.text3}>
              via {list.name} token list
            </TYPE.small>
          </RowFixed>
        ) : (
          <WarningWrapper>
            <RowFixed>
              <AlertCircle stroke={theme.red1} size="10px" />
              <TYPE.body color={theme.red1} ml="4px" fontSize="10px" fontWeight={500}>
                Unknown Source
              </TYPE.body>
            </RowFixed>
          </WarningWrapper>
        )}
      </AutoColumn>
    </AutoRow>
  )
}

export default function TokenWarningModal({
  isOpen,
  tokens,
  onConfirm
}: {
  isOpen: boolean
  tokens: Token[]
  onConfirm: () => void
}) {
  const handleDismiss = useCallback(() => null, [])
  return (
    <Modal isOpen={isOpen} onDismiss={handleDismiss} maxHeight={90}>
      <OuterContainer>
        <WarningContainer className="token-warning-container">
          <AutoColumn>
            <UpperSectionContainer>
              <AutoRow gap="6px">
                <StyledWarningIcon size="20px" />
                <TYPE.main fontSize="16px" lineHeight="22px" color={'text3'}>
                  Token imported
                </TYPE.main>
              </AutoRow>
              <TYPE.body
                marginY="20px"
                fontSize="14px"
                fontWeight="400"
                lineHeight="22px"
                letterSpacing="-0.02em"
                color="text4"
              >
                Anyone can create an ERC20 token on Ethereum with <em>any</em> name, including creating fake versions of
                existing tokens and tokens that claim to represent projects that do not have a token.
              </TYPE.body>
              <TYPE.body
                marginBottom="20px"
                fontSize="14px"
                fontWeight="400"
                lineHeight="22px"
                letterSpacing="-0.02em"
                color="text4"
              >
                This interface can load arbitrary tokens by token addresses. Please take extra caution and do your
                research when interacting with arbitrary ERC20 tokens.
              </TYPE.body>
              <TYPE.body fontSize="14px" fontWeight="400" lineHeight="22px" letterSpacing="-0.02em" color="text4">
                If you purchase an arbitrary token, <strong>you may be unable to sell it back.</strong>
              </TYPE.body>
            </UpperSectionContainer>
            <BottomSectionContainer>
              {tokens.map(token => {
                return <TokenWarningCard key={token.address} token={token} />
              })}
              <SpacedButtonError
                error
                className="token-dismiss-button"
                onClick={() => {
                  onConfirm()
                }}
              >
                <TYPE.body color="white">I understand</TYPE.body>
              </SpacedButtonError>
            </BottomSectionContainer>
          </AutoColumn>
        </WarningContainer>
      </OuterContainer>
    </Modal>
  )
}
