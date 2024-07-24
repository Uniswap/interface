import { InterfaceElementName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import Column, { AutoColumn } from 'components/Column'
import Loader from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row, { RowFixed } from 'components/Row'
import { scrollbarStyle } from 'components/SearchModal/CurrencyList/index.css'
import { LoadingRows, MenuItem } from 'components/SearchModal/styled'
import TokenSafetyIcon from 'components/TokenSafety/TokenSafetyIcon'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { useTokenWarning } from 'constants/tokenSafety'
import { useTotalBalancesUsdForAnalytics } from 'graphql/data/apollo/TokenBalancesProvider'
import { useIsUserAddedToken } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { TokenBalances } from 'lib/hooks/useTokenList/sorting'
import styled from 'lib/styled-components'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { CSSProperties, MutableRefObject, useCallback } from 'react'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { TokenFromList } from 'state/lists/tokenFromList'
import { ThemedText } from 'theme/components'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { shortenAddress } from 'utilities/src/addresses'
import { currencyKey } from 'utils/currencyKey'
import { NumberType, useFormatter } from 'utils/formatNumbers'

function currencyListRowKey(data: Currency | CurrencyListRow): string {
  if (data instanceof CurrencyListSectionTitle) {
    return data.label
  }

  if (data instanceof CurrencyListRow) {
    return currencyKey(data.currency!)
  }

  return currencyKey(data)
}

const ROW_ITEM_SIZE = 56

const StyledBalanceText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 5rem;
  text-overflow: ellipsis;
`

const CurrencyName = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Tag = styled.div`
  background-color: ${({ theme }) => theme.surface2};
  color: ${({ theme }) => theme.neutral2};
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

const WarningContainer = styled.div`
  margin-left: 0.3em;
`

const LabelContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0 20px;
`

function Balance({ balance }: { balance: CurrencyAmount<Currency> }) {
  const { formatNumberOrString } = useFormatter()

  return (
    <StyledBalanceText title={balance.toExact()}>
      {formatNumberOrString({
        input: balance.toExact(),
        type: NumberType.TokenNonTx,
      })}
    </StyledBalanceText>
  )
}

const TagContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`

function TokenTags({ currency }: { currency: Currency }) {
  if (!(currency instanceof TokenFromList)) {
    return null
  }

  const tags = currency.tags
  if (!tags || tags.length === 0) {
    return <span />
  }

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

const getDisplayName = (name: string | undefined) => {
  if (name === 'USD//C') {
    return 'USD Coin'
  }
  return name
}

const RowWrapper = styled(Row)`
  height: 60px;
`

export function CurrencyRow({
  currency,
  onSelect,
  isSelected,
  otherSelected,
  style,
  showCurrencyAmount,
  eventProperties,
  balance,
  disabled,
  tooltip,
  showAddress,
}: {
  currency: Currency
  onSelect: (hasWarning: boolean) => void
  isSelected: boolean
  otherSelected: boolean
  style?: CSSProperties
  showCurrencyAmount?: boolean
  eventProperties: Record<string, unknown>
  balance?: CurrencyAmount<Currency>
  disabled?: boolean
  tooltip?: string
  showAddress?: boolean
}) {
  const account = useAccount()
  const key = currencyListRowKey(currency)
  const customAdded = useIsUserAddedToken(currency)
  const warning = useTokenWarning(currency?.isNative ? undefined : currency?.address, currency.chainId)
  const isBlockedToken = !!warning && !warning.canProceed
  const blockedTokenOpacity = '0.6'
  const portfolioBalanceUsd = useTotalBalancesUsdForAnalytics()

  const Wrapper = tooltip ? MouseoverTooltip : RowWrapper
  const currencyName = getDisplayName(currency.name)

  // only show add or remove buttons if not on selected list
  return (
    <Trace
      logPress
      logKeyPress
      eventOnTrigger={WalletEventName.TokenSelected}
      properties={{ is_imported_by_user: customAdded, ...eventProperties, total_balances_usd: portfolioBalanceUsd }}
      element={InterfaceElementName.TOKEN_SELECTOR_ROW}
    >
      <Wrapper
        style={style}
        text={<ThemedText.Caption textAlign="center">{tooltip}</ThemedText.Caption>}
        size={TooltipSize.ExtraSmall}
      >
        <MenuItem
          tabIndex={0}
          className={`token-item-${key}`}
          onKeyPress={(e) => (e.key === 'Enter' ? onSelect(!!warning) : null)}
          onClick={() => onSelect(!!warning)}
          selected={otherSelected || isSelected}
          dim={isBlockedToken}
          disabled={disabled}
        >
          <Column>
            <CurrencyLogo
              currency={currency}
              size={36}
              style={{ opacity: isBlockedToken ? blockedTokenOpacity : '1' }}
            />
          </Column>
          <AutoColumn style={{ opacity: isBlockedToken ? blockedTokenOpacity : '1' }} gap="xs">
            <Row>
              <CurrencyName title={currencyName}>{currencyName}</CurrencyName>
              <WarningContainer>
                <TokenSafetyIcon warning={warning} />
              </WarningContainer>
            </Row>
            <Row gap="sm">
              <ThemedText.Caption ml="0px" color="neutral2">
                {currency.symbol}
              </ThemedText.Caption>
              {showAddress && currency.isToken && (
                <ThemedText.Caption color="neutral3">{shortenAddress(currency.address)}</ThemedText.Caption>
              )}
            </Row>
          </AutoColumn>
          <Column>
            <RowFixed style={{ justifySelf: 'flex-end' }}>
              <TokenTags currency={currency} />
            </RowFixed>
          </Column>
          {showCurrencyAmount && (
            <RowFixed style={{ justifySelf: 'flex-end' }}>
              {account.isConnected ? balance ? <Balance balance={balance} /> : <Loader /> : null}
            </RowFixed>
          )}
        </MenuItem>
      </Wrapper>
    </Trace>
  )
}

interface TokenRowProps {
  data: Array<CurrencyListRow>
  index: number
  style: CSSProperties
}

export const formatAnalyticsEventProperties = (
  token: Currency,
  index: number,
  data: any[],
  searchQuery: string,
  isAddressSearch: string | false,
) => ({
  token_symbol: token?.symbol,
  token_address: token?.isToken ? token?.address : undefined,
  is_suggested_token: false,
  is_selected_from_list: true,
  scroll_position: '',
  token_list_index: index,
  token_list_length: data.length,
  ...(isAddressSearch === false
    ? { search_token_symbol_input: searchQuery }
    : { search_token_address_input: isAddressSearch }),
})

const LoadingRow = () => (
  <LoadingRows data-testid="loading-rows">
    <div />
    <div />
    <div />
  </LoadingRows>
)

/**
 * This is used to display disabled currencies in the list.
 */
export class CurrencyListRow {
  constructor(
    public readonly currency: Currency | undefined,
    public readonly options?: {
      disabled?: boolean
      showAddress?: boolean
      tooltip?: string
    },
  ) {}
}

/**
 * This is used to intersperse section titles into the list without needing to break up the data array
 * and render multiple lists.
 */
export class CurrencyListSectionTitle extends CurrencyListRow {
  constructor(public readonly label: string) {
    super(undefined)
  }
}

export default function CurrencyList({
  height,
  currencies,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  fixedListRef,
  showCurrencyAmount,
  isLoading,
  searchQuery,
  isAddressSearch,
  balances,
}: {
  height: number
  currencies: Array<CurrencyListRow>
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency, hasWarning?: boolean) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showCurrencyAmount?: boolean
  isLoading: boolean
  searchQuery: string
  isAddressSearch: string | false
  balances: TokenBalances
  disabled?: boolean
}) {
  const Row = useCallback(
    function TokenRow({ data, index, style }: TokenRowProps) {
      const row: CurrencyListRow = data[index]

      if (row instanceof CurrencyListSectionTitle) {
        return (
          <LabelContainer style={style}>
            <ThemedText.BodySecondary>{row.label}</ThemedText.BodySecondary>
          </LabelContainer>
        )
      }

      if (!row.currency) {
        return null
      }

      const currency: Currency = row.currency
      const key = currencyKey(currency)

      const balance =
        tryParseCurrencyAmount(String(balances[key]?.balance ?? 0), currency) ??
        CurrencyAmount.fromRawAmount(currency, 0)

      const isSelected = Boolean(currency && selectedCurrency && selectedCurrency.equals(currency))
      const otherSelected = Boolean(currency && otherCurrency && otherCurrency.equals(currency))
      const handleSelect = (hasWarning: boolean) => currency && onCurrencySelect(currency, hasWarning)

      const token = currency?.wrapped

      if (isLoading) {
        return LoadingRow()
      } else if (currency) {
        return (
          <CurrencyRow
            style={style}
            currency={currency}
            onSelect={handleSelect}
            otherSelected={otherSelected}
            isSelected={isSelected}
            showCurrencyAmount={showCurrencyAmount && balance.greaterThan(0)}
            eventProperties={formatAnalyticsEventProperties(token, index, data, searchQuery, isAddressSearch)}
            balance={balance}
            disabled={row.options?.disabled}
            tooltip={row.options?.tooltip}
            showAddress={row.options?.showAddress}
          />
        )
      } else {
        return null
      }
    },
    [
      selectedCurrency,
      otherCurrency,
      isLoading,
      onCurrencySelect,
      showCurrencyAmount,
      searchQuery,
      isAddressSearch,
      balances,
    ],
  )

  const itemKey = useCallback((index: number, data: typeof currencies) => {
    const currency = data[index]
    return currencyListRowKey(currency)
  }, [])

  return (
    <div data-testid="currency-list-wrapper">
      {isLoading ? (
        <FixedSizeList
          className={scrollbarStyle}
          height={height}
          ref={fixedListRef as any}
          width="100%"
          itemData={[]}
          itemCount={10}
          itemSize={ROW_ITEM_SIZE}
        >
          {LoadingRow}
        </FixedSizeList>
      ) : (
        <FixedSizeList
          className={scrollbarStyle}
          height={height}
          ref={fixedListRef as any}
          width="100%"
          itemData={currencies}
          itemCount={currencies.length}
          itemSize={ROW_ITEM_SIZE}
          itemKey={itemKey}
        >
          {Row}
        </FixedSizeList>
      )}
    </div>
  )
}
