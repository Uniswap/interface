import { ChainId, JSBI, Token, TokenAmount } from '@uniswap/sdk'
import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ALL_TOKENS } from '../../constants/tokens'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens } from '../../hooks/Tokens'
import { useAddUserToken, useRemoveUserAddedToken } from '../../state/user/hooks'
import { LinkStyledButton, TYPE } from '../../theme'
import { ButtonSecondary } from '../Button'
import Column, { AutoColumn } from '../Column'
import { RowFixed } from '../Row'
import TokenLogo from '../TokenLogo'
import { FadedSpan, GreySpan, MenuItem, ModalInfo } from './styleds'
import Loader from '../Loader'

function isDefaultToken(tokenAddress: string, chainId?: number): boolean {
  return Boolean(chainId && ALL_TOKENS[chainId as ChainId]?.[tokenAddress])
}

export default function TokenList({
  tokens,
  allTokenBalances,
  selectedToken,
  onTokenSelect,
  otherToken,
  showSendWithSwap,
  otherSelectedText
}: {
  tokens: Token[]
  selectedToken: string
  allTokenBalances: { [tokenAddress: string]: TokenAmount }
  onTokenSelect: (tokenAddress: string) => void
  otherToken: string
  showSendWithSwap?: boolean
  otherSelectedText: string
}) {
  const { t } = useTranslation()
  const { account, chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const allTokens = useAllTokens()
  const addToken = useAddUserToken()
  const removeToken = useRemoveUserAddedToken()

  if (tokens.length === 0) {
    return <ModalInfo>{t('noToken')}</ModalInfo>
  }

  return (
    <FixedSizeList
      width="100%"
      height={500}
      itemCount={tokens.length}
      itemSize={56}
      style={{ flex: '1' }}
      itemKey={index => tokens[index].address}
    >
      {({ index, style }) => {
        const token = tokens[index]
        const { address, symbol } = token

        const isDefault = isDefaultToken(address, chainId)
        const customAdded = Boolean(!isDefault && allTokens[address])
        const balance = allTokenBalances[address]

        const zeroBalance = balance && JSBI.equal(JSBI.BigInt(0), balance.raw)

        return (
          <MenuItem
            style={style}
            key={address}
            className={`token-item-${address}`}
            onClick={() => (selectedToken && selectedToken === address ? null : onTokenSelect(address))}
            disabled={selectedToken && selectedToken === address}
            selected={otherToken === address}
          >
            <RowFixed>
              <TokenLogo address={address} size={'24px'} style={{ marginRight: '14px' }} />
              <Column>
                <Text fontWeight={500}>
                  {symbol}
                  {otherToken === address && <GreySpan> ({otherSelectedText})</GreySpan>}
                </Text>
                <FadedSpan>
                  {customAdded ? (
                    <TYPE.main fontWeight={500}>
                      Added by user
                      <LinkStyledButton
                        onClick={event => {
                          event.stopPropagation()
                          removeToken(chainId, address)
                        }}
                      >
                        (Remove)
                      </LinkStyledButton>
                    </TYPE.main>
                  ) : null}
                  {!isDefault && !customAdded ? (
                    <TYPE.main fontWeight={500}>
                      Found by address
                      <LinkStyledButton
                        onClick={event => {
                          event.stopPropagation()
                          addToken(token)
                        }}
                      >
                        (Add)
                      </LinkStyledButton>
                    </TYPE.main>
                  ) : null}
                </FadedSpan>
              </Column>
            </RowFixed>
            <AutoColumn>
              {balance ? (
                <Text>
                  {zeroBalance && showSendWithSwap ? (
                    <ButtonSecondary padding={'4px 8px'}>
                      <Text textAlign="center" fontWeight={500} fontSize={14} color={theme.primary1}>
                        Send With Swap
                      </Text>
                    </ButtonSecondary>
                  ) : balance ? (
                    balance.toSignificant(6)
                  ) : (
                    '-'
                  )}
                </Text>
              ) : account ? (
                <Loader />
              ) : (
                '-'
              )}
            </AutoColumn>
          </MenuItem>
        )
      }}
    </FixedSizeList>
  )
}
