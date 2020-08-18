import { Currency, CurrencyAmount, currencyEquals, ETHER, Token } from '@uniswap/sdk'
import React, { CSSProperties, memo, useEffect, useMemo, useRef } from 'react'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens } from '../../hooks/Tokens'
import useLast from '../../hooks/useLast'
import { useSelectedTokenList, WrappedTokenInfo } from '../../state/lists/hooks'
import { useAddUserToken, useRemoveUserAddedToken } from '../../state/user/hooks'
import { useETHBalances } from '../../state/wallet/hooks'
import { LinkStyledButton, TYPE } from '../../theme'
import Column from '../Column'
import { RowFixed } from '../Row'
import CurrencyLogo from '../CurrencyLogo'
import { FadedSpan, MenuItem } from './styleds'
import Loader from '../Loader'
import { isTokenOnList } from '../../utils'

function currencyKey(currency: Currency): string {
  return currency instanceof Token ? currency.address : currency === ETHER ? 'ETHER' : ''
}

const StyledBalanceText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 5rem;
  text-overflow: ellipsis;
`

const Tag = styled.div`
  background-color: ${({ theme }) => theme.bg3};
  color: ${({ theme }) => theme.text2};
  padding: 0.25rem;
  border-radius: 0.1rem;
  margin-right: 0.5rem;
  max-width: 6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

function Balance({ balance }: { balance: CurrencyAmount }) {
  return <StyledBalanceText title={balance.toExact()}>{balance.toSignificant(4)}</StyledBalanceText>
}

function TokenTags({ currency }: { currency: Currency }) {
  if (!(currency instanceof WrappedTokenInfo)) {
    return null
  }
  const tags = currency.tags
  if (!tags || tags.length === 0) return null

  return (
    <div>
      {tags.map(tag => (
        <Tag title={`${tag.name}: ${tag.description}`}>{tag.name}</Tag>
      ))}
    </div>
  )
}

export default function CurrencyList({
  currencies,
  allBalances,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency
}: {
  currencies: Currency[]
  selectedCurrency: Currency | undefined
  allBalances: { [tokenAddress: string]: CurrencyAmount | undefined }
  onCurrencySelect: (currency: Currency) => void
  otherCurrency: Currency | undefined
}) {
  const { account, chainId } = useActiveWeb3React()
  const allTokens = useAllTokens()
  const selectedListTokens = useSelectedTokenList()
  const addToken = useAddUserToken()
  const removeToken = useRemoveUserAddedToken()
  const ETHBalances = useETHBalances([account ?? undefined])
  const ETHBalance = account ? ETHBalances[account] : undefined
  const lastCurrenciesLength = useLast(currencies)?.length
  const currenciesLength = currencies.length
  const fixedList = useRef<FixedSizeList>()
  useEffect(() => {
    if (lastCurrenciesLength !== currenciesLength) {
      fixedList.current?.scrollTo(0)
    }
  }, [currenciesLength, lastCurrenciesLength])

  const CurrencyRow = useMemo(() => {
    return memo(function CurrencyRow({ index, style }: { index: number; style: CSSProperties }) {
      const currency = index === 0 ? Currency.ETHER : currencies[index - 1]
      const key = currencyKey(currency)
      const isOnList = isTokenOnList(selectedListTokens, currency)
      const customAdded = Boolean(!isOnList && currency instanceof Token && allTokens[currency.address])
      const balance = currency === ETHER ? ETHBalance : allBalances[key]

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
                        if (chainId && currency instanceof Token) removeToken(chainId, currency.address)
                      }}
                    >
                      (Remove)
                    </LinkStyledButton>
                  </TYPE.main>
                ) : null}
                {!isOnList && !customAdded ? (
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
          <RowFixed>
            <TokenTags currency={currency} />
            {balance ? <Balance balance={balance} /> : account ? <Loader /> : null}
          </RowFixed>
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
    selectedListTokens,
    onCurrencySelect,
    otherCurrency,
    removeToken,
    selectedCurrency
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
