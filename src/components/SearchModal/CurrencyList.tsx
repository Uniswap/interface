import React, { CSSProperties, MutableRefObject, useCallback, useMemo } from 'react'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'

import { Currency, CurrencyAmount, currencyEquals, ETHER, Token } from '@dynamic-amm/sdk'
import { useActiveWeb3React } from '../../hooks'
import { useCombinedActiveList } from '../../state/lists/hooks'
import { useCurrencyBalances } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { useIsUserAddedToken } from '../../hooks/Tokens'
import Column from '../Column'
import { RowFixed, RowBetween } from '../Row'
import CurrencyLogo from '../CurrencyLogo'
import { MouseoverTooltip } from '../Tooltip'
import { MenuItem } from './styleds'
import Loader from '../Loader'
import { isTokenOnList, isAddress } from '../../utils'
import ImportRow from './ImportRow'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { LightGreyCard } from 'components/Card'
import TokenListLogo from '../../assets/svg/tokenlist.svg'
import QuestionHelper from 'components/QuestionHelper'
import useTheme from 'hooks/useTheme'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

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
  font-size: 14px;
  border-radius: 4px;
  padding: 0.25rem 0.3rem 0.25rem 0.3rem;
  max-width: 6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  justify-self: flex-end;
  margin-right: 4px;
`

const FixedContentRow = styled.div`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-gap: 16px;
  align-items: center;
`

function Balance({ balance }: { balance: CurrencyAmount }) {
  return <StyledBalanceText title={balance.toExact()}>{balance.toSignificant(10)}</StyledBalanceText>
}

const TagContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`

const TokenListLogoWrapper = styled.img`
  height: 20px;
`

function TokenTags({ currency }: { currency: Currency }) {
  if (!(currency instanceof WrappedTokenInfo)) {
    return <span />
  }

  const tags = currency.tags
  if (!tags || tags.length === 0) return <span />

  const tag = tags[0]

  return (
    <TagContainer>
      <MouseoverTooltip text={tag.description}>
        <Tag key={tag.id}>{tag.name}</Tag>
      </MouseoverTooltip>
      {tags.length > 1 ? (
        <MouseoverTooltip
          text={tags
            .slice(1)
            .map(({ name, description }) => `${name}: ${description}`)
            .join('; \n')}
        >
          <Tag>...</Tag>
        </MouseoverTooltip>
      ) : null}
    </TagContainer>
  )
}

function CurrencyRow({
  currency,
  currencyBalance,
  onSelect,
  isSelected,
  otherSelected,
  style
}: {
  currency: Currency
  currencyBalance: CurrencyAmount
  onSelect: () => void
  isSelected: boolean
  otherSelected: boolean
  style: CSSProperties
}) {
  const { account } = useActiveWeb3React()
  const key = currencyKey(currency)
  const selectedTokenList = useCombinedActiveList()
  const isOnSelectedList = isTokenOnList(selectedTokenList, currency)
  const customAdded = useIsUserAddedToken(currency)
  // const balance = useCurrencyBalance(account ?? undefined, currency)
  const balance = currencyBalance

  // const showCurrency = currency === ETHER && !!chainId && [137, 800001].includes(chainId) ? WETH[chainId] : currency
  const nativeCurrency = useCurrencyConvertedToNative(currency || undefined)
  // only show add or remove buttons if not on selected list
  return (
    <MenuItem
      style={style}
      className={`token-item-${key}`}
      onClick={() => (isSelected ? null : onSelect())}
      disabled={isSelected}
      selected={otherSelected}
    >
      <CurrencyLogo currency={currency} size={'24px'} />
      <Column>
        <Text title={currency.name} fontWeight={500}>
          {nativeCurrency?.symbol}
        </Text>
        <TYPE.darkGray ml="0px" fontSize={'12px'} fontWeight={300}>
          {nativeCurrency?.name} {!isOnSelectedList && customAdded && t`• Added by user`}
        </TYPE.darkGray>
      </Column>
      <TokenTags currency={currency} />
      <RowFixed style={{ justifySelf: 'flex-end' }}>
        {balance ? <Balance balance={balance} /> : account ? <Loader /> : null}
      </RowFixed>
    </MenuItem>
  )
}

export default function CurrencyList({
  height,
  currencies,
  inactiveTokens,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  fixedListRef,
  showETH,
  showImportView,
  setImportToken,
  breakIndex
}: {
  height: number
  currencies: Currency[]
  inactiveTokens: Token[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showETH: boolean
  showImportView: () => void
  setImportToken: (token: Token) => void
  breakIndex: number | undefined
}) {
  const { chainId, account } = useActiveWeb3React()
  const itemCurrencies: (Currency | undefined)[] = useMemo(() => {
    let formatted: (Currency | undefined)[] = showETH ? [Currency.ETHER, ...currencies] : currencies
    if (breakIndex !== undefined) {
      formatted = [...formatted.slice(0, breakIndex), undefined, ...formatted.slice(breakIndex, formatted.length)]
    }
    return formatted
  }, [breakIndex, currencies, showETH])
  const itemCurrencyBalances = useCurrencyBalances(account || undefined, itemCurrencies)
  const itemData = { currencies: itemCurrencies, currencyBalances: itemCurrencyBalances }

  const theme = useTheme()

  const Row = useCallback(
    ({ data, index, style }) => {
      const currency: Currency = data.currencies[index]
      const currencyBalance: CurrencyAmount = data.currencyBalances[index]
      const isSelected = Boolean(selectedCurrency && currencyEquals(selectedCurrency, currency))
      const otherSelected = Boolean(otherCurrency && currencyEquals(otherCurrency, currency))
      const handleSelect = () => onCurrencySelect(currency)

      const token = wrappedCurrency(currency, chainId)

      const showImport =
        inactiveTokens.length &&
        token &&
        inactiveTokens.map(inactiveToken => inactiveToken.address).includes(isAddress(token.address) || token.address)

      if (index === breakIndex || !data) {
        return (
          <FixedContentRow style={style}>
            <LightGreyCard padding="8px 12px" borderRadius="8px">
              <RowBetween>
                <RowFixed>
                  <TokenListLogoWrapper src={TokenListLogo} />
                  <TYPE.main ml="6px" fontSize="12px" color={theme.text1}>
                    <Trans>Expanded results from inactive Token Lists</Trans>
                  </TYPE.main>
                </RowFixed>
                <QuestionHelper
                  text={t`Tokens from inactive lists. Import specific tokens below or click 'Manage' to activate more lists.`}
                />
              </RowBetween>
            </LightGreyCard>
          </FixedContentRow>
        )
      }

      if (showImport && token) {
        return (
          <ImportRow
            style={style}
            token={token}
            showImportView={showImportView}
            setImportToken={setImportToken}
            dim={true}
          />
        )
      } else {
        return (
          <CurrencyRow
            style={style}
            currency={currency}
            currencyBalance={currencyBalance}
            isSelected={isSelected}
            onSelect={handleSelect}
            otherSelected={otherSelected}
          />
        )
      }
    },
    [
      chainId,
      inactiveTokens,
      onCurrencySelect,
      otherCurrency,
      selectedCurrency,
      setImportToken,
      showImportView,
      breakIndex,
      theme.text1
    ]
  )

  const itemKey = useCallback((index: number, data: any) => currencyKey(data.currencies[index]), [])

  return (
    <FixedSizeList
      height={height}
      ref={fixedListRef as any}
      width="100%"
      itemData={itemData}
      itemCount={itemData.currencies.length}
      itemSize={56}
      itemKey={itemKey}
    >
      {Row}
    </FixedSizeList>
  )
}
