import { Currency, CurrencyAmount, currencyEquals, ETHER, Token } from 'dxswap-sdk'
import React, { useCallback, useMemo } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { useAddUserToken, useRemoveUserAddedToken } from '../../state/user/hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { useIsUserAddedToken } from '../../hooks/Tokens'
import CurrencyLogo from '../CurrencyLogo'
import Loader from '../Loader'
import { isTokenOnList } from '../../utils'
import { useTokenList } from '../../state/lists/hooks'
import Badge from '../Badge'
import { TokenListContainer, TokenPickerItem } from './styleds'
import { Plus, X } from 'react-feather'

function currencyKey(currency: Currency): string {
  return currency instanceof Token ? currency.address : currency === ETHER ? 'ETHER' : ''
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
  onSelect,
  isSelected,
  otherSelected
}: {
  currency: Currency
  onSelect: () => void
  isSelected: boolean
  otherSelected: boolean
}) {
  const { account, chainId } = useActiveWeb3React()
  const key = currencyKey(currency)
  const selectedTokenList = useTokenList()
  const isOnSelectedList = isTokenOnList(selectedTokenList, currency)
  const customAdded = useIsUserAddedToken(currency)
  const balance = useCurrencyBalance(account ?? undefined, currency)

  const removeToken = useRemoveUserAddedToken()
  const addToken = useAddUserToken()

  // only show add or remove buttons if not on selected list
  return (
    <TokenPickerItem
      className={`token-item-${key}`}
      onClick={() => (isSelected ? null : onSelect())}
      disabled={isSelected}
      selected={otherSelected}
      alignItems="center"
      px="20px"
    >
      <Box mr="8px">
        <CurrencyLogo currency={currency} size={'20px'} />
      </Box>
      <Box>
        <Text title={currency.name} fontWeight={500}>
          {currency.symbol}
        </Text>
      </Box>
      <Flex flex="1" px="20px">
        {!isOnSelectedList && (
          <Box>
            <Badge
              label={customAdded ? 'Added by user' : 'Found by address'}
              icon={customAdded ? X : Plus}
              onIconClick={event => {
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
  showETH
}: {
  currencies: Currency[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherCurrency?: Currency | null
  showETH: boolean
}) {
  const itemData = useMemo(() => (showETH ? [Currency.ETHER, ...currencies] : currencies), [currencies, showETH])

  const Row = useCallback(
    (currency: Currency) => {
      const isSelected = Boolean(selectedCurrency && currencyEquals(selectedCurrency, currency))
      const otherSelected = Boolean(otherCurrency && currencyEquals(otherCurrency, currency))
      const handleSelect = () => onCurrencySelect(currency)
      return (
        <CurrencyRow
          currency={currency}
          isSelected={isSelected}
          onSelect={handleSelect}
          otherSelected={otherSelected}
        />
      )
    },
    [onCurrencySelect, otherCurrency, selectedCurrency]
  )

  return (
    <TokenListContainer flexDirection="column" width="100%" overflowY="auto">
      {itemData.map(currency => (
        <Box width="100%" height="56px" key={currencyKey(currency)}>
          {Row(currency)}
        </Box>
      ))}
    </TokenListContainer>
  )
}
