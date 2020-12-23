import { Token } from 'dxswap-sdk'
import { transparentize } from 'polished'
import React, { useCallback } from 'react'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { ExternalLink, TYPE } from '../../theme'
import { getEtherscanLink, shortenAddress } from '../../utils'
import CurrencyLogo from '../CurrencyLogo'
import Modal from '../Modal'
import { AutoRow, RowBetween } from '../Row'
import { AutoColumn } from '../Column'
import { AlertTriangle } from 'react-feather'
import { ButtonError } from '../Button'

const WarningContainer = styled.div`
  width: 100%;
  overflow: auto;
`

const OuterContainer = styled.div`
  background: ${({ theme }) => transparentize(0.45, theme.bg2)};
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

interface TokenWarningCardProps {
  token?: Token
}

function TokenWarningCard({ token }: TokenWarningCardProps) {
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
            href={getEtherscanLink(chainId, token.address, 'token')}
          >
            <TYPE.main color="purple4" fontSize="14px" lineHeight="17px" title={token.address}>
              {shortenAddress(token.address)} (View on Etherscan)
            </TYPE.main>
          </ExternalLink>
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
                <TYPE.main fontSize="16px" lineHeight="20px" color={'text3'}>
                  Token imported
                </TYPE.main>
              </AutoRow>
              <TYPE.body
                marginY="20px"
                fontSize="14px"
                fontWeight="700"
                lineHeight="20px"
                letterSpacing="-0.02em"
                color="text4"
              >
                Anyone can create an ERC20 token on Ethereum with <em>any</em> name, including creating fake versions of
                existing tokens and tokens that claim to represent projects that do not have a token.
              </TYPE.body>
              <TYPE.body
                marginBottom="20px"
                fontSize="14px"
                fontWeight="700"
                lineHeight="20px"
                letterSpacing="-0.02em"
                color="text4"
              >
                This interface can load arbitrary tokens by token addresses. Please take extra caution and do your
                research when interacting with arbitrary ERC20 tokens.
              </TYPE.body>
              <TYPE.body fontSize="14px" fontWeight="700" lineHeight="20px" letterSpacing="-0.02em" color="text4">
                If you purchase an arbitrary token, <strong>you may be unable to sell it back.</strong>
              </TYPE.body>
            </UpperSectionContainer>
            <BottomSectionContainer>
              {tokens.map(token => {
                return <TokenWarningCard key={token.address} token={token} />
              })}
              <RowBetween marginTop="24px">
                <ButtonError
                  error={true}
                  padding="0.5rem 1rem"
                  height={58}
                  className="token-dismiss-button"
                  onClick={() => {
                    onConfirm()
                  }}
                >
                  <TYPE.body color="white">I understand</TYPE.body>
                </ButtonError>
              </RowBetween>
            </BottomSectionContainer>
          </AutoColumn>
        </WarningContainer>
      </OuterContainer>
    </Modal>
  )
}
