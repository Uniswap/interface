import { Currency, CurrencyAmount, currencyEquals, Token } from '@swapr/sdk'
import React, { CSSProperties, MutableRefObject, useCallback, useContext, useMemo, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { useAddUserToken, useRemoveUserAddedToken } from '../../state/user/hooks'
import { useCurrencyBalances } from '../../state/wallet/hooks'
import { useIsUserAddedToken } from '../../hooks/Tokens'
import CurrencyLogo from '../CurrencyLogo'
import Loader from '../Loader'
import Badge from '../Badge'
import { TokenPickerItem } from './styleds'
import { Plus, X } from 'react-feather'
import { FixedSizeList } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { TokenAddressMap, useCombinedActiveList } from '../../state/lists/hooks'
import { isTokenOnList } from '../../utils'

import { TYPE } from '../../theme'
import { WrappedTokenInfo } from '../../state/lists/wrapped-token-info'
import ImportRow from './ImportRow'
import { DarkCard } from '../Card'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import TokenListLogo from '../../assets/svg/tokenlist.svg'
import QuestionHelper from '../QuestionHelper'

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

const FixedContentRow = styled.div`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-gap: 16px;
  align-items: center;
`

const TokenListLogoWrapper = styled.img`
  height: 20px;
`

const StyledFixedSizeList=styled(FixedSizeList)`
    &&::-webkit-scrollbar {
       width: 10px;
    }

   &&::-webkit-scrollbar-thumb { 
      background: ${({ theme }) => theme.bg3};
      border-radius: 8px;
      border:2px solid ${({ theme }) => theme.bg2};
   }
   //firefox support
  scrollbar-color: ${({ theme }) => theme.bg3+' '+theme.bg2};
  scrollbar-width: thin;

`

function Balance({ balance }: { balance: CurrencyAmount }) {
  return <StyledBalanceText  title={balance.toExact()}>{balance.toSignificant(4)}</StyledBalanceText>
}

function CurrencyRow({
  currency,
  balance,
  selectedTokenList,
  onSelect,
  isSelected,
  otherSelected,
  style
}: {
  currency: Currency
  balance: CurrencyAmount | undefined
  selectedTokenList: TokenAddressMap
  onSelect: () => void
  isSelected: boolean
  otherSelected: boolean
  style: CSSProperties
}) {
  const { account, chainId } = useActiveWeb3React()
  const isOnSelectedList = isTokenOnList(selectedTokenList, currency)
  const customAdded = useIsUserAddedToken(currency)

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
      <Box>
        <AutoRow >
          <CurrencyLogo currency={currency} size={'20px'} />
          <Text  marginLeft={'6px'} fontWeight={500}>{currency.symbol}</Text>
        </AutoRow>
        <AutoRow>
          <TYPE.body marginTop={'4px'} fontSize="9px" color="text4" fontWeight={600}>
            {currency.name?.toUpperCase()}
          </TYPE.body>
        </AutoRow>
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
      <Box  style={{ justifySelf: 'flex-end' }}>
        {balance ? <Balance balance={balance} /> : account ? <Loader /> : null}
      </Box>
    </TokenPickerItem>
  )
}

const BREAK_LINE = 'BREAK'
type BreakLine = typeof BREAK_LINE
function isBreakLine(x: unknown): x is BreakLine {
  return x === BREAK_LINE
}

function BreakLineComponent({ style }: { style: CSSProperties }) {
  const theme = useContext(ThemeContext)
  return (
    <FixedContentRow style={style}>
      <DarkCard padding="8px 12px" borderRadius="8px">
        <RowBetween>
          <RowFixed>
            <TokenListLogoWrapper src={TokenListLogo} />
            <TYPE.main ml="6px" fontSize="12px" color={theme.text1}>
              Expanded results from inactive token lists
            </TYPE.main>
          </RowFixed>
          <QuestionHelper text="Tokens from inactive lists. Import specific tokens below or click 'Manage' to activate more lists." />
        </RowBetween>
      </DarkCard>
    </FixedContentRow>
  )
}

export default function CurrencyList({
  currencies,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  otherListTokens,
  fixedListRef,
  showImportView,
  setImportToken
}: {
  currencies: Currency[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherCurrency?: Currency | null
  otherListTokens: Token[]
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showImportView: () => void
  setImportToken: (token: Token) => void
}) {
  const { account } = useActiveWeb3React()
  const [hasBreakLine, setHasBreakLine] = useState(false)
  const selectedTokenList = useCombinedActiveList()
  const itemData = useMemo(() => {
    if (otherListTokens && otherListTokens?.length > 0) {
      const foundByAddressAndNotInAnyList =
        otherListTokens.length === 1 && !(otherListTokens[0] instanceof WrappedTokenInfo)
      if (foundByAddressAndNotInAnyList) {
        setHasBreakLine(false)
        return otherListTokens
      }
      setHasBreakLine(true)
      return [BREAK_LINE, ...otherListTokens]
    }
    setHasBreakLine(false)
    return currencies
  }, [currencies, otherListTokens])
  const balances = useCurrencyBalances(
    account || undefined,
    (hasBreakLine ? itemData.slice(1) : itemData) as Currency[]
  )

  const Row = useCallback(
    ({ data, index, style }) => {
      console.log(style)
      const currency: Currency = data[index]
      if (isBreakLine(currency)) return <BreakLineComponent style={style} />
      const isSelected = Boolean(selectedCurrency && currencyEquals(selectedCurrency, currency))
      const otherSelected = Boolean(otherCurrency && currencyEquals(otherCurrency, currency))
      const showImport = index >= currencies.length
      const handleSelect = () => onCurrencySelect(currency)
      if (showImport && currency && currency instanceof Token) {
        return (
          <ImportRow
            style={style}
            token={currency}
            showImportView={showImportView}
            setImportToken={setImportToken}
            dim
          />
        )
      } else if (currency) {
        return (
          <CurrencyRow
            selectedTokenList={selectedTokenList}
            currency={currency}
            balance={balances[hasBreakLine ? index - 1 : index]}
            isSelected={isSelected}
            onSelect={handleSelect}
            otherSelected={otherSelected}
            style={style}
          />
        )
      }
      return null
    },
    [
      balances,
      currencies.length,
      hasBreakLine,
      onCurrencySelect,
      otherCurrency,
      selectedCurrency,
      selectedTokenList,
      setImportToken,
      showImportView
    ]
  )

  return (
    <Flex  overflowY="auto" flex="1">
      <AutoSizer style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
        {({ width, height }) => (
          <StyledFixedSizeList
            ref={fixedListRef as any}
            width={width}
            height={height}
            itemData={itemData}
            itemCount={itemData.length}
            itemSize={56}
            itemKey={currencyKey}

          >
            {Row}
          </StyledFixedSizeList>
        )}
      </AutoSizer>
    </Flex>
  )
}
