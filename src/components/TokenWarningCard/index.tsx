import { Currency, Token } from '@uniswap/sdk'
import { transparentize } from 'polished'
import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens } from '../../hooks/Tokens'
import { useSelectedTokenList } from '../../state/lists/hooks'
import { Field } from '../../state/swap/actions'
import { ExternalLink, TYPE } from '../../theme'
import { getEtherscanLink, isTokenOnList } from '../../utils'
import PropsOfExcluding from '../../utils/props-of-excluding'
import CurrencyLogo from '../CurrencyLogo'
import Modal from '../Modal'
import { AutoRow, RowBetween } from '../Row'
import { AutoColumn } from '../Column'
import { AlertTriangle } from 'react-feather'
import { ButtonError } from '../Button'
import { useTokenWarningDismissal } from '../../state/user/hooks'

const Wrapper = styled.div<{ error: boolean }>`
  background: ${({ theme }) => transparentize(0.6, theme.bg3)};
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
  overflow: auto;
`

const StyledWarningIcon = styled(AlertTriangle)`
  stroke: ${({ theme }) => theme.red2};
`

interface TokenWarningCardProps extends PropsOfExcluding<typeof Wrapper, 'error'> {
  token?: Token
}

export default function TokenWarningCard({ token, ...rest }: TokenWarningCardProps) {
  const { chainId } = useActiveWeb3React()
  const selectedTokenList = useSelectedTokenList()
  const isListed = isTokenOnList(selectedTokenList, token)

  const tokenSymbol = token?.symbol?.toLowerCase() ?? ''
  const tokenName = token?.name?.toLowerCase() ?? ''

  const allTokens = useAllTokens()

  const duplicateNameOrSymbol = useMemo(() => {
    if (isListed || !token || !chainId) return false

    return Object.keys(allTokens).some(tokenAddress => {
      const userToken = allTokens[tokenAddress]
      if (userToken.equals(token)) {
        return false
      }
      return userToken.symbol.toLowerCase() === tokenSymbol || userToken.name.toLowerCase() === tokenName
    })
  }, [isListed, token, chainId, allTokens, tokenSymbol, tokenName])

  if (isListed || !token) return null

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

export function TokenWarningModal({ currencies }: { currencies: { [field in Field]?: Currency } }) {
  const { chainId } = useActiveWeb3React()
  const [dismissedToken0, dismissToken0] = useTokenWarningDismissal(chainId, currencies[Field.INPUT])
  const [dismissedToken1, dismissToken1] = useTokenWarningDismissal(chainId, currencies[Field.OUTPUT])
  const showWarning =
    (!dismissedToken0 && !!currencies[Field.INPUT]) || (!dismissedToken1 && !!currencies[Field.OUTPUT])

  const [understandChecked, setUnderstandChecked] = useState(false)
  const toggleUnderstand = useCallback(() => setUnderstandChecked(uc => !uc), [])

  return (
    <Modal isOpen={showWarning} onDismiss={() => null} maxHeight={90}>
      <WarningContainer className="token-warning-container">
        <AutoColumn gap="lg">
          <AutoRow gap="6px">
            <StyledWarningIcon />
            <TYPE.main color={'red2'}>Token imported</TYPE.main>
          </AutoRow>
          <TYPE.body color={'red2'}>
            Anyone can create an ERC20 token on Ethereum with <em>any</em> name, including creating fake versions of
            existing tokens and tokens that claim to represent projects that do not have a token.
          </TYPE.body>
          <TYPE.body color={'red2'}>
            This interface can load arbitrary tokens by token addresses. Please take extra caution and do your research
            when interacting with arbitrary ERC20 tokens.
          </TYPE.body>
          <TYPE.body color={'red2'}>
            If you purchase an arbitrary token, <strong>you may be unable to sell it back.</strong>
          </TYPE.body>
          {Object.keys(currencies).map(field => {
            const dismissed = field === Field.INPUT ? dismissedToken0 : dismissedToken1
            return currencies[field] instanceof Token && !dismissed ? (
              <TokenWarningCard key={field} token={currencies[field]} />
            ) : null
          })}
          <RowBetween>
            <div>
              <label style={{ cursor: 'pointer' }}>
                <input type="checkbox" className="understand-checkbox" onChange={toggleUnderstand} /> I understand
              </label>
            </div>
            <ButtonError
              disabled={!understandChecked}
              error={true}
              width={'140px'}
              padding="0.5rem 1rem"
              className="token-dismiss-button"
              style={{
                borderRadius: '10px'
              }}
              onClick={() => {
                dismissToken0 && dismissToken0()
                dismissToken1 && dismissToken1()
              }}
            >
              <TYPE.body color="white">Continue</TYPE.body>
            </ButtonError>
          </RowBetween>
        </AutoColumn>
      </WarningContainer>
    </Modal>
  )
}
