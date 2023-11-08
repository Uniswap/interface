import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { TraceEvent } from 'analytics'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { useCachedPortfolioBalancesQuery } from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import { AutoRow } from 'components/Row'
import { COMMON_BASES } from 'constants/routing'
import { useTokenInfoFromActiveList } from 'hooks/useTokenInfoFromActiveList'
import { getTokenAddress } from 'lib/utils/analytics'
import { Text } from 'rebass'
import styled from 'styled-components'
import { currencyId } from 'utils/currencyId'

const BaseWrapper = styled.div<{ disable?: boolean }>`
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 18px;
  display: flex;
  padding: 6px;
  padding-top: 5px;
  padding-bottom: 5px;
  padding-right: 12px;
  line-height: 0px;

  align-items: center;
  :hover {
    cursor: ${({ disable }) => !disable && 'pointer'};
    background-color: ${({ theme }) => theme.deprecated_hoverDefault};
  }

  color: ${({ theme, disable }) => disable && theme.neutral1};
  background-color: ${({ theme, disable }) => disable && theme.surface3};
`

const formatAnalyticsEventProperties = (
  currency: Currency,
  searchQuery: string,
  isAddressSearch: string | false,
  portfolioBalanceUsd: number | undefined
) => ({
  token_symbol: currency?.symbol,
  token_chain_id: currency?.chainId,
  token_address: getTokenAddress(currency),
  is_suggested_token: true,
  is_selected_from_list: false,
  is_imported_by_user: false,
  total_balances_usd: portfolioBalanceUsd,
  ...(isAddressSearch === false
    ? { search_token_symbol_input: searchQuery }
    : { search_token_address_input: isAddressSearch }),
})

export default function CommonBases({
  chainId,
  onSelect,
  selectedCurrency,
  searchQuery,
  isAddressSearch,
}: {
  chainId?: number
  selectedCurrency?: Currency | null
  onSelect: (currency: Currency) => void
  searchQuery: string
  isAddressSearch: string | false
  portfolioBalanceUsd?: number
}) {
  const bases = chainId !== undefined ? COMMON_BASES[chainId] ?? [] : []
  const { account } = useWeb3React()
  const { data } = useCachedPortfolioBalancesQuery({ account })
  const portfolioBalanceUsd = data?.portfolios?.[0].tokensTotalDenominatedValue?.value

  return bases.length > 0 ? (
    <AutoRow gap="4px">
      {bases.map((currency: Currency) => {
        const isSelected = selectedCurrency?.equals(currency)

        return (
          <TraceEvent
            events={[BrowserEvent.onClick, BrowserEvent.onKeyPress]}
            name={InterfaceEventName.TOKEN_SELECTED}
            properties={formatAnalyticsEventProperties(currency, searchQuery, isAddressSearch, portfolioBalanceUsd)}
            element={InterfaceElementName.COMMON_BASES_CURRENCY_BUTTON}
            key={currencyId(currency)}
          >
            <BaseWrapper
              tabIndex={0}
              onKeyPress={(e) => !isSelected && e.key === 'Enter' && onSelect(currency)}
              onClick={() => !isSelected && onSelect(currency)}
              disable={isSelected}
              key={currencyId(currency)}
              data-testid={`common-base-${currency.symbol}`}
            >
              <CurrencyLogoFromList currency={currency} />
              <Text fontWeight={535} fontSize={16} lineHeight="16px">
                {currency.symbol}
              </Text>
            </BaseWrapper>
          </TraceEvent>
        )
      })}
    </AutoRow>
  ) : null
}

/** helper component to retrieve a base currency from the active token lists */
function CurrencyLogoFromList({ currency }: { currency: Currency }) {
  const token = useTokenInfoFromActiveList(currency)

  return <CurrencyLogo currency={token} style={{ marginRight: 8 }} />
}
