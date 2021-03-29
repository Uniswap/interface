import { Currency, CurrencyAmount, currencyEquals, Token } from 'dxswap-sdk'
import React, { CSSProperties, useCallback, useMemo } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { useAddUserToken, useRemoveUserAddedToken } from '../../state/user/hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { useIsUserAddedToken } from '../../hooks/Tokens'
import CurrencyLogo from '../CurrencyLogo'
import Loader from '../Loader'
import Badge from '../Badge'
import { TokenListContainer, TokenPickerItem } from './styleds'
import { Plus, X } from 'react-feather'
import { useNativeCurrency } from '../../hooks/useNativeCurrency'
import { FixedSizeList } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { TokenAddressMap, useTokenList } from '../../state/lists/hooks'
import { isTokenOnList } from '../../utils'
import { AutoColumn } from '../Column'
import { TYPE } from '../../theme'

function currencyKey(index: number, data: any): string {
  const currency = data[index]
  if (currency instanceof Token) return currency.address
  return currency.symbol || ''
}

const StyledBalanceText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 5rem;
  text-overflow: ellipsis;
`

function Balance({ balance }: { balance: CurrencyAmount }) {
  return <StyledBalanceText title={balance.toExact()}>{balance.toSignificant(4)}</StyledBalanceText>
}

function CurrencyRow({
  currency,
  selectedTokenList,
  onSelect,
  isSelected,
  otherSelected,
  style
}: {
  currency: Currency
  selectedTokenList: TokenAddressMap
  onSelect: () => void
  isSelected: boolean
  otherSelected: boolean
  style: CSSProperties
}) {
  const { account, chainId } = useActiveWeb3React()
  const isOnSelectedList = isTokenOnList(selectedTokenList, currency)
  const customAdded = useIsUserAddedToken(currency)
  const balance = useCurrencyBalance(account ?? undefined, currency)

  const removeToken = useRemoveUserAddedToken()
  const addToken = useAddUserToken()

  // only show add or remove buttons if not on selected list
  return (
    <TokenPickerItem
      onClick={() => (isSelected ? null : onSelect())}
      disabled={isSelected}
      selected={otherSelected}
      alignItems="center"
      style={style}
    >
      <Box mr="12px">
        <CurrencyLogo currency={currency} size={'20px'} />
      </Box>
      <Box>
        <AutoColumn gap="2px">
          <Text fontWeight={500}>{currency.symbol}</Text>
          <TYPE.body fontSize="11px" color="text4" fontWeight={400}>
            {currency.name}
          </TYPE.body>
        </AutoColumn>
      </Box>
      <Flex flex="1" px="20px">
        {!isOnSelectedList && (
          <Box>
            <Badge
              label={customAdded ? 'Added by user' : 'Found by address'}
              icon={customAdded ? X : Plus}
              onClick={event => {
                event.stopPropagation()
                if (!chainId || !(currency instanceof Token)) {
                  return
                }
                if (customAdded) {
                  removeToken(chainId, currency.address)
                } else {
                  addToken(currency)
                }
              }}
            />
          </Box>
        )}
      </Flex>
      <Box style={{ justifySelf: 'flex-end' }}>
        {balance ? <Balance balance={balance} /> : account ? <Loader /> : null}
      </Box>
    </TokenPickerItem>
  )
}

export default function CurrencyList({
  currencies,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  showNativeCurrency
}: {
  currencies: Currency[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherCurrency?: Currency | null
  showNativeCurrency: boolean
}) {
  const nativeCurrency = useNativeCurrency()
  const selectedTokenList = useTokenList()
  const itemData = useMemo(() => (showNativeCurrency ? [nativeCurrency, ...currencies] : currencies), [
    currencies,
    nativeCurrency,
    showNativeCurrency
  ])

  const Row = useCallback(
    ({ data, index, style }) => {
      const currency: Currency = data[index]
      const isSelected = Boolean(selectedCurrency && currencyEquals(selectedCurrency, currency))
      const otherSelected = Boolean(otherCurrency && currencyEquals(otherCurrency, currency))
      const handleSelect = () => onCurrencySelect(currency)
      return (
        <CurrencyRow
          selectedTokenList={selectedTokenList}
          currency={currency}
          isSelected={isSelected}
          onSelect={handleSelect}
          otherSelected={otherSelected}
          style={style}
        />
      )
    },
    [onCurrencySelect, otherCurrency, selectedCurrency, selectedTokenList]
  )

  return (
    <TokenListContainer flexDirection="column" width="100%" overflowY="auto">
      <AutoSizer>
        {({ width, height }) => (
          <FixedSizeList
            width={width}
            height={height}
            itemData={itemData}
            itemCount={itemData.length}
            itemSize={56}
            itemKey={currencyKey}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </TokenListContainer>
  )
}
