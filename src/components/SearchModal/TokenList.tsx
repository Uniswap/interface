import { JSBI, Token, TokenAmount } from '@uniswap/sdk'
import React, { CSSProperties, memo, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
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
import { isDefaultToken, isCustomAddedToken } from '../../utils'

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

  const TokenRow = useMemo(() => {
    return memo(function TokenRow({ index, style }: { index: number; style: CSSProperties }) {
      const token = tokens[index]
      const { address, symbol } = token

      const isDefault = isDefaultToken(token)
      const customAdded = isCustomAddedToken(allTokens, token)
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
    })
  }, [
    account,
    addToken,
    allTokenBalances,
    allTokens,
    chainId,
    onTokenSelect,
    otherSelectedText,
    otherToken,
    removeToken,
    selectedToken,
    showSendWithSwap,
    theme.primary1,
    tokens
  ])

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
      {TokenRow}
    </FixedSizeList>
  )
}
