import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ElementName, Event, EventName } from 'components/AmplitudeAnalytics/constants'
import { TraceEvent } from 'components/AmplitudeAnalytics/TraceEvent'
import { LightGreyCard } from 'components/Card'
import QuestionHelper from 'components/QuestionHelper'
import TokenSafetyIcon from 'components/TokenSafety/TokenSafetyIcon'
import { checkWarning } from 'constants/tokenSafety'
import useTheme from 'hooks/useTheme'
import { CSSProperties, MutableRefObject, useCallback, useMemo } from 'react'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

import TokenListLogo from '../../../assets/svg/tokenlist.svg'
import { useIsUserAddedToken } from '../../../hooks/Tokens'
import { useCurrencyBalance } from '../../../state/connection/hooks'
import { useCombinedActiveList } from '../../../state/lists/hooks'
import { WrappedTokenInfo } from '../../../state/lists/wrappedTokenInfo'
import { ThemedText } from '../../../theme'
import { isTokenOnList } from '../../../utils'
import Column from '../../Column'
import CurrencyLogo from '../../CurrencyLogo'
import Loader from '../../Loader'
import { RowBetween, RowFixed } from '../../Row'
import { MouseoverTooltip } from '../../Tooltip'
import ImportRow from '../ImportRow'
import { LoadingRows, MenuItem } from '../styleds'

function currencyKey(currency: Currency): string {
  return currency.isToken ? currency.address : 'ETHER'
}

const StyledBalanceText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 5rem;
  text-overflow: ellipsis;
`

const CurrencyName = styled(Text)`
  max-width: 90%;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Tag = styled.div`
  background-color: ${({ theme }) => theme.deprecated_bg3};
  color: ${({ theme }) => theme.deprecated_text2};
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
function Balance({ balance }: { balance: CurrencyAmount<Currency> }) {
  return <StyledBalanceText title={balance.toExact()}>{balance.toSignificant(4)}</StyledBalanceText>
}

const TagContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`

const TokenListLogoWrapper = styled.img`
  height: 20px;
`

const NameContainer = styled.div`
  display: flex;
  align-items: center;
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
  onSelect,
  isSelected,
  otherSelected,
  style,
  showCurrencyAmount,
  eventProperties,
}: {
  currency: Currency
  onSelect: () => void
  isSelected: boolean
  otherSelected: boolean
  style: CSSProperties
  showCurrencyAmount?: boolean
  eventProperties: Record<string, unknown>
}) {
  const { account } = useWeb3React()
  const key = currencyKey(currency)
  const selectedTokenList = useCombinedActiveList()
  const isOnSelectedList = isTokenOnList(selectedTokenList, currency.isToken ? currency : undefined)
  const customAdded = useIsUserAddedToken(currency)
  const balance = useCurrencyBalance(account ?? undefined, currency)
  const warning = currency.isNative ? null : checkWarning(currency.address)

  // only show add or remove buttons if not on selected list
  return (
    <TraceEvent
      events={[Event.onClick, Event.onKeyPress]}
      name={EventName.TOKEN_SELECTED}
      properties={{ is_imported_by_user: customAdded, ...eventProperties }}
      element={ElementName.TOKEN_SELECTOR_ROW}
    >
      <MenuItem
        tabIndex={0}
        style={style}
        className={`token-item-${key}`}
        onKeyPress={(e) => (!isSelected && e.key === 'Enter' ? onSelect() : null)}
        onClick={() => (isSelected ? null : onSelect())}
        disabled={isSelected}
        selected={otherSelected}
      >
        <CurrencyLogo currency={currency} size={'24px'} />
        <Column>
          <NameContainer>
            <CurrencyName title={currency.name}>{currency.name}</CurrencyName>
            <TokenSafetyIcon warning={warning} />
          </NameContainer>
          <ThemedText.DeprecatedDarkGray ml="0px" fontSize={'12px'} fontWeight={300}>
            {!currency.isNative && !isOnSelectedList && customAdded ? (
              <Trans>{currency.symbol} • Added by user</Trans>
            ) : (
              currency.symbol
            )}
          </ThemedText.DeprecatedDarkGray>
        </Column>
        <TokenTags currency={currency} />
        {showCurrencyAmount && (
          <RowFixed style={{ justifySelf: 'flex-end' }}>
            {balance ? <Balance balance={balance} /> : account ? <Loader /> : null}
          </RowFixed>
        )}
      </MenuItem>
    </TraceEvent>
  )
}

const BREAK_LINE = 'BREAK'
type BreakLine = typeof BREAK_LINE
function isBreakLine(x: unknown): x is BreakLine {
  return x === BREAK_LINE
}

function BreakLineComponent({ style }: { style: CSSProperties }) {
  const theme = useTheme()
  return (
    <FixedContentRow style={style}>
      <LightGreyCard padding="8px 12px" $borderRadius="8px">
        <RowBetween>
          <RowFixed>
            <TokenListLogoWrapper src={TokenListLogo} />
            <ThemedText.DeprecatedMain ml="6px" fontSize="12px" color={theme.deprecated_text1}>
              <Trans>Expanded results from inactive Token Lists</Trans>
            </ThemedText.DeprecatedMain>
          </RowFixed>
          <QuestionHelper
            text={
              <Trans>
                Tokens from inactive lists. Import specific tokens below or click Manage to activate more lists.
              </Trans>
            }
          />
        </RowBetween>
      </LightGreyCard>
    </FixedContentRow>
  )
}

interface TokenRowProps {
  data: Array<Currency | BreakLine>
  index: number
  style: CSSProperties
}

const formatAnalyticsEventProperties = (
  token: Token,
  index: number,
  data: any[],
  searchQuery: string,
  isAddressSearch: string | false
) => ({
  token_symbol: token?.symbol,
  token_address: token?.address,
  is_suggested_token: false,
  is_selected_from_list: true,
  scroll_position: '',
  token_list_index: index,
  token_list_length: data.length,
  ...(isAddressSearch === false
    ? { search_token_symbol_input: searchQuery }
    : { search_token_address_input: isAddressSearch }),
})

export default function CurrencyList({
  height,
  currencies,
  otherListTokens,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  fixedListRef,
  showImportView,
  setImportToken,
  showCurrencyAmount,
  isLoading,
  searchQuery,
  isAddressSearch,
}: {
  height: number
  currencies: Currency[]
  otherListTokens?: WrappedTokenInfo[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showImportView: () => void
  setImportToken: (token: Token) => void
  showCurrencyAmount?: boolean
  isLoading: boolean
  searchQuery: string
  isAddressSearch: string | false
}) {
  const itemData: (Currency | BreakLine)[] = useMemo(() => {
    if (otherListTokens && otherListTokens?.length > 0) {
      return [...currencies, BREAK_LINE, ...otherListTokens]
    }
    return currencies
  }, [currencies, otherListTokens])

  const Row = useCallback(
    function TokenRow({ data, index, style }: TokenRowProps) {
      const row: Currency | BreakLine = data[index]

      if (isBreakLine(row)) {
        return <BreakLineComponent style={style} />
      }

      const currency = row

      const isSelected = Boolean(currency && selectedCurrency && selectedCurrency.equals(currency))
      const otherSelected = Boolean(currency && otherCurrency && otherCurrency.equals(currency))
      const handleSelect = () => currency && onCurrencySelect(currency)

      const token = currency?.wrapped

      const showImport = index > currencies.length

      if (isLoading) {
        return (
          <LoadingRows>
            <div />
            <div />
            <div />
          </LoadingRows>
        )
      } else if (showImport && token) {
        return (
          <ImportRow style={style} token={token} showImportView={showImportView} setImportToken={setImportToken} dim />
        )
      } else if (currency) {
        return (
          <CurrencyRow
            style={style}
            currency={currency}
            isSelected={isSelected}
            onSelect={handleSelect}
            otherSelected={otherSelected}
            showCurrencyAmount={showCurrencyAmount}
            eventProperties={formatAnalyticsEventProperties(token, index, data, searchQuery, isAddressSearch)}
          />
        )
      } else {
        return null
      }
    },
    [
      currencies.length,
      onCurrencySelect,
      otherCurrency,
      selectedCurrency,
      setImportToken,
      showImportView,
      showCurrencyAmount,
      isLoading,
      isAddressSearch,
      searchQuery,
    ]
  )

  const itemKey = useCallback((index: number, data: typeof itemData) => {
    const currency = data[index]
    if (isBreakLine(currency)) return BREAK_LINE
    return currencyKey(currency)
  }, [])

  return (
    <FixedSizeList
      height={height}
      ref={fixedListRef as any}
      width="100%"
      itemData={itemData}
      itemCount={itemData.length}
      itemSize={56}
      itemKey={itemKey}
    >
      {Row}
    </FixedSizeList>
  )
}
