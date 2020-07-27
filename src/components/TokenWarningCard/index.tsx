import { Currency, Token } from '@uniswap/sdk'
import { transparentize } from 'polished'
import React, { useMemo } from 'react'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens } from '../../hooks/Tokens'
import { useDefaultTokenList } from '../../state/lists/hooks'
import { Field } from '../../state/swap/actions'
import { ExternalLink, TYPE } from '../../theme'
import { getEtherscanLink, isDefaultToken } from '../../utils'
import PropsOfExcluding from '../../utils/props-of-excluding'
import CurrencyLogo from '../CurrencyLogo'
import { AutoRow, RowBetween } from '../Row'
import { AutoColumn } from '../Column'
import { AlertTriangle } from 'react-feather'
import { ButtonError } from '../Button'

const Wrapper = styled.div<{ error: boolean }>`
  background: ${({ theme }) => transparentize(0.6, theme.white)};
  padding: 0.75rem;
  border-radius: 20px;
`

const WarningContainer = styled.div`
  max-width: 420px;
  width: 100%;
  padding: 1rem;
  background: rgba(242, 150, 2, 0.05);
  border: 1px solid #f3841e;
  box-sizing: border-box;
  border-radius: 20px;
  margin-bottom: 2rem;
`

interface TokenWarningCardProps extends PropsOfExcluding<typeof Wrapper, 'error'> {
  token?: Token
  dismissed: boolean
}

export default function TokenWarningCard({ token, dismissed, ...rest }: TokenWarningCardProps) {
  const { chainId } = useActiveWeb3React()
  const defaultTokens = useDefaultTokenList()
  const isDefault = isDefaultToken(defaultTokens, token)

  const tokenSymbol = token?.symbol?.toLowerCase() ?? ''
  const tokenName = token?.name?.toLowerCase() ?? ''

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
      <AutoRow gap="6px">
        <AutoColumn gap="24px">
          <CurrencyLogo currency={token} size={'16px'} />
          <div> </div>
        </AutoColumn>
        <AutoColumn gap="10px" justify="flex-start">
          <TYPE.main>
            {token && token.name && token.symbol && token.name !== token.symbol
              ? `${token.name} (${token.symbol})`
              : token.name || token.symbol}
          </TYPE.main>
          <ExternalLink style={{ fontWeight: 400 }} href={getEtherscanLink(chainId, token.address, 'token')}>
            <TYPE.blue> (View on Etherscan)</TYPE.blue>
          </ExternalLink>
        </AutoColumn>
      </AutoRow>
    </Wrapper>
  )
}

export function TokenWarningCards({
  currencies,
  dismissedToken0,
  dismissedToken1,
  dismissToken0,
  dismissToken1
}: {
  currencies: { [field in Field]?: Currency }
  dismissedToken0: boolean
  dismissedToken1: boolean
  dismissToken0: (() => void) | null
  dismissToken1: (() => void) | null
}) {
  return (
    <WarningContainer>
      <AutoColumn gap="lg">
        <AutoRow gap="6px">
          <AlertTriangle stroke="#F82D3A" />
          <TYPE.main color={'#F82D3A'}>Token imported</TYPE.main>
        </AutoRow>
        <TYPE.body color={'#F82D3A'}>
          Anyone can create and name any ERC20 token on Ethereum, including creating fake versions of existing tokens
          and tokens that claim to represent projects that do not have a token.
        </TYPE.body>
        <TYPE.body color={'#F82D3A'}>
          Similar to Etherscan, this site can load arbitrary tokens via token addresses. Please do your own research
          before interacting with any ERC20 token.
        </TYPE.body>
        {Object.keys(currencies).map(field => {
          return currencies[field] instanceof Token ? (
            <TokenWarningCard
              key={field}
              token={currencies[field]}
              dismissed={field === Field.INPUT ? dismissedToken0 : dismissedToken1}
            />
          ) : null
        })}
        <RowBetween>
          <div />
          <ButtonError
            error={true}
            width={'140px'}
            padding="0.5rem 1rem"
            style={{
              borderRadius: '10px',
              boxShadow:
                '0px 0px 1px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04), 0px 24px 32px rgba(0, 0, 0, 0.04);'
            }}
            onClick={() => {
              dismissToken0 && dismissToken0()
              dismissToken1 && dismissToken1()
            }}
          >
            <TYPE.body color="white">I understand</TYPE.body>
          </ButtonError>
          <div />
        </RowBetween>
      </AutoColumn>
    </WarningContainer>
  )
}
