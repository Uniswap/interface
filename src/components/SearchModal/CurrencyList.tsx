import { Currency, CurrencyAmount, currencyEquals, ETHER, JSBI, Token } from '@uniswap/sdk'
import React, { CSSProperties, memo, useContext, useMemo } from 'react'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens } from '../../hooks/Tokens'
import { useAddUserToken, useRemoveUserAddedToken } from '../../state/user/hooks'
import { useETHBalances } from '../../state/wallet/hooks'
import { LinkStyledButton, TYPE } from '../../theme'
import { ButtonSecondary } from '../Button'
import Column, { AutoColumn } from '../Column'
import { RowFixed } from '../Row'
import CurrencyLogo from '../CurrencyLogo'
import { FadedSpan, MenuItem } from './styleds'
import Loader from '../Loader'
import { isDefaultToken, isCustomAddedToken } from '../../utils'

function currencyKey(currency: Currency): string {
  return currency instanceof Token ? currency.address : currency === ETHER ? 'ETHER' : ''
}

export default function CurrencyList({
  currencies,
  allBalances,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  showSendWithSwap
}: {
  currencies: Currency[]
  selectedCurrency: Currency
  allBalances: { [tokenAddress: string]: CurrencyAmount }
  onCurrencySelect: (currency: Currency) => void
  otherCurrency: Currency
  showSendWithSwap?: boolean
}) {
  const { account, chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const allTokens = useAllTokens()
  const addToken = useAddUserToken()
  const removeToken = useRemoveUserAddedToken()
  const ETHBalance = useETHBalances([account])[account]

  const CurrencyRow = useMemo(() => {
    return memo(function CurrencyRow({ index, style }: { index: number; style: CSSProperties }) {
      const currency = index === 0 ? Currency.ETHER : currencies[index - 1]
      const key = currencyKey(currency)
      const isDefault = isDefaultToken(currency)
      const customAdded = isCustomAddedToken(allTokens, currency)
      const balance = currency === ETHER ? ETHBalance : allBalances[key]

      const zeroBalance = balance && JSBI.equal(JSBI.BigInt(0), balance.raw)

      const isSelected = Boolean(selectedCurrency && currencyEquals(currency, selectedCurrency))
      const otherSelected = Boolean(otherCurrency && currencyEquals(otherCurrency, currency))

      return (
        <MenuItem
          style={style}
          className={`token-item-${key}`}
          onClick={() => (isSelected ? null : onCurrencySelect(currency))}
          disabled={isSelected}
          selected={otherSelected}
        >
          <RowFixed>
            <CurrencyLogo currency={currency} size={'24px'} style={{ marginRight: '14px' }} />
            <Column>
              <Text fontWeight={500}>{currency.symbol}</Text>
              <FadedSpan>
                {customAdded ? (
                  <TYPE.main fontWeight={500}>
                    Added by user
                    <LinkStyledButton
                      onClick={event => {
                        event.stopPropagation()
                        if (currency instanceof Token) removeToken(chainId, currency.address)
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
                        if (currency instanceof Token) addToken(currency)
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
    ETHBalance,
    account,
    addToken,
    allBalances,
    allTokens,
    chainId,
    currencies,
    onCurrencySelect,
    otherCurrency,
    removeToken,
    selectedCurrency,
    showSendWithSwap,
    theme.primary1
  ])

  return (
    <FixedSizeList
      width="100%"
      height={500}
      itemCount={currencies.length + 1}
      itemSize={56}
      style={{ flex: '1' }}
      itemKey={index => currencyKey(currencies[index])}
    >
      {CurrencyRow}
    </FixedSizeList>
  )
}
