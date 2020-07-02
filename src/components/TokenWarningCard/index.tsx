import { Token } from '@uniswap/sdk'
import { transparentize } from 'polished'
import React, { useMemo } from 'react'
import styled from 'styled-components'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens } from '../../hooks/Tokens'
import { Field } from '../../state/swap/actions'
import { useTokenWarningDismissal } from '../../state/user/hooks'
import { ExternalLink, TYPE } from '../../theme'
import { getEtherscanLink, isDefaultToken } from '../../utils'
import PropsOfExcluding from '../../utils/props-of-excluding'
import QuestionHelper from '../QuestionHelper'
import TokenLogo from '../TokenLogo'

const Wrapper = styled.div<{ error: boolean }>`
  background: ${({ theme, error }) => transparentize(0.9, error ? theme.red1 : theme.yellow1)};
  position: relative;
  padding: 1rem;
  /* border: 0.5px solid ${({ theme, error }) => transparentize(0.4, error ? theme.red1 : theme.yellow1)}; */
  border-radius: 10px;
  margin-bottom: 20px;
  display: grid;
  grid-template-rows: 14px auto auto;
  grid-row-gap: 14px;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-items: flex-start;
  & > * {
    margin-right: 6px;
  }
`

const CloseColor = styled(Close)`
  color: #aeaeae;
`

const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 12px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }

  & > * {
    height: 16px;
    width: 16px;
  }
`

const HELP_TEXT = `
The Uniswap V2 smart contracts are designed to support any ERC20 token on Ethereum. Any token can be
loaded into the interface by entering its Ethereum address into the search field or passing it as a URL
parameter.
`

const DUPLICATE_NAME_HELP_TEXT = `${HELP_TEXT} This token has the same name or symbol as another token in your list.`

interface TokenWarningCardProps extends PropsOfExcluding<typeof Wrapper, 'error'> {
  token?: Token
}

export default function TokenWarningCard({ token, ...rest }: TokenWarningCardProps) {
  const { chainId } = useActiveWeb3React()

  const isDefault = isDefaultToken(token)

  const tokenSymbol = token?.symbol?.toLowerCase() ?? ''
  const tokenName = token?.name?.toLowerCase() ?? ''

  const [dismissed, dismissTokenWarning] = useTokenWarningDismissal(chainId, token)

  const allTokens = useAllTokens()

  const duplicateNameOrSymbol = useMemo(() => {
    if (isDefault || !token || !chainId) return false

    return Object.keys(allTokens).some(tokenAddress => {
      const userToken = allTokens[tokenAddress]
      if (userToken.equals(token)) {
        return false
      }
      return userToken.symbol.toLowerCase() === tokenSymbol || userToken.name.toLowerCase() === tokenName
    })
  }, [isDefault, token, chainId, allTokens, tokenSymbol, tokenName])

  if (isDefault || !token || dismissed) return null

  return (
    <Wrapper error={duplicateNameOrSymbol} {...rest}>
      {duplicateNameOrSymbol ? null : (
        <CloseIcon onClick={dismissTokenWarning}>
          <CloseColor />
        </CloseIcon>
      )}
      <Row>
        <TYPE.subHeader>{duplicateNameOrSymbol ? 'Duplicate token name or symbol' : 'Imported token'}</TYPE.subHeader>
        <QuestionHelper text={duplicateNameOrSymbol ? DUPLICATE_NAME_HELP_TEXT : HELP_TEXT} />
      </Row>
      <Row>
        <TokenLogo address={token.address} />
        <div style={{ fontWeight: 500 }}>
          {token && token.name && token.symbol && token.name !== token.symbol
            ? `${token.name} (${token.symbol})`
            : token.name || token.symbol}
        </div>
        <ExternalLink style={{ fontWeight: 400 }} href={getEtherscanLink(chainId, token.address, 'token')}>
          (View on Etherscan)
        </ExternalLink>
      </Row>
      <Row>
        <TYPE.italic>Verify this is the correct token before making any transactions.</TYPE.italic>
      </Row>
    </Wrapper>
  )
}

const WarningContainer = styled.div`
  max-width: 420px;
  width: 100%;
  padding-left: 1rem;
  padding-right: 1rem;
`

export function TokenWarningCards({ tokens }: { tokens: { [field in Field]?: Token } }) {
  return (
    <WarningContainer>
      {Object.keys(tokens).map(field =>
        tokens[field] ? <TokenWarningCard style={{ marginBottom: 14 }} key={field} token={tokens[field]} /> : null
      )}
    </WarningContainer>
  )
}
