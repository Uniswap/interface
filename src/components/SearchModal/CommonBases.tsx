import { Currency } from '@uniswap/sdk-core'
import { ElementName, Event, EventName } from 'components/AmplitudeAnalytics/constants'
import { TraceEvent } from 'components/AmplitudeAnalytics/TraceEvent'
import { getTokenAddress } from 'components/AmplitudeAnalytics/utils'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { AutoRow } from 'components/Row'
import { COMMON_BASES } from 'constants/routing'
import { Phase0Variant, usePhase0Flag } from 'featureFlags/flags/phase0'
import { useTokenInfoFromActiveList } from 'hooks/useTokenInfoFromActiveList'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { currencyId } from 'utils/currencyId'

const MobileWrapper = styled(AutoColumn)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const BaseWrapper = styled.div<{ disable?: boolean; phase0Flag?: boolean }>`
  border: 1px solid
    ${({ theme, disable, phase0Flag }) =>
      disable
        ? phase0Flag
          ? theme.accentAction
          : theme.none
        : phase0Flag
        ? theme.backgroundOutline
        : theme.deprecated_bg3};
  border-radius: ${({ phase0Flag }) => (phase0Flag ? '16px' : '10px')};
  display: flex;
  padding: 6px;
  padding-right: 12px;

  align-items: center;
  :hover {
    cursor: ${({ disable }) => !disable && 'pointer'};
    background-color: ${({ theme, disable, phase0Flag }) =>
      (phase0Flag && theme.hoverDefault) || (!disable && theme.deprecated_bg2)};
  }

  color: ${({ theme, disable, phase0Flag }) => disable && (phase0Flag ? theme.accentAction : theme.deprecated_text3)};
  background-color: ${({ theme, disable, phase0Flag }) =>
    disable && (phase0Flag ? theme.accentActionSoft : theme.deprecated_bg3)};
  filter: ${({ disable, phase0Flag }) => disable && !phase0Flag && 'grayscale(1)'};
`

const formatAnalyticsEventProperties = (currency: Currency, searchQuery: string, isAddressSearch: string | false) => ({
  token_symbol: currency?.symbol,
  token_chain_id: currency?.chainId,
  token_address: getTokenAddress(currency),
  is_suggested_token: true,
  is_selected_from_list: false,
  is_imported_by_user: false,
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
}) {
  const bases = typeof chainId !== 'undefined' ? COMMON_BASES[chainId] ?? [] : []
  const phase0Flag = usePhase0Flag()
  const phase0FlagEnabled = phase0Flag === Phase0Variant.Enabled

  return bases.length > 0 ? (
    <MobileWrapper gap="md">
      <AutoRow gap="4px">
        {bases.map((currency: Currency) => {
          const isSelected = selectedCurrency?.equals(currency)

          return (
            <TraceEvent
              events={[Event.onClick, Event.onKeyPress]}
              name={EventName.TOKEN_SELECTED}
              properties={formatAnalyticsEventProperties(currency, searchQuery, isAddressSearch)}
              element={ElementName.COMMON_BASES_CURRENCY_BUTTON}
              key={currencyId(currency)}
            >
              <BaseWrapper
                tabIndex={0}
                onKeyPress={(e) => !isSelected && e.key === 'Enter' && onSelect(currency)}
                onClick={() => !isSelected && onSelect(currency)}
                disable={isSelected}
                phase0Flag={phase0FlagEnabled}
                key={currencyId(currency)}
              >
                <CurrencyLogoFromList currency={currency} />
                <Text fontWeight={500} fontSize={16}>
                  {currency.symbol}
                </Text>
              </BaseWrapper>
            </TraceEvent>
          )
        })}
      </AutoRow>
    </MobileWrapper>
  ) : null
}

/** helper component to retrieve a base currency from the active token lists */
function CurrencyLogoFromList({ currency }: { currency: Currency }) {
  const token = useTokenInfoFromActiveList(currency)

  return <CurrencyLogo currency={token} style={{ marginRight: 8 }} />
}
