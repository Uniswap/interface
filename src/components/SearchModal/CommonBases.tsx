import React from 'react'
import { Text } from 'rebass'
import { ChainId, Currency, currencyEquals, Token } from '@swapr/sdk'

import { SUGGESTED_BASES } from '../../constants'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'
import { Option } from '../../components/Option'
import CurrencyLogo from '../CurrencyLogo'
import { TYPE } from '../../theme'
import { useNativeCurrency } from '../../hooks/useNativeCurrency'

export default function CommonBases({
  chainId,
  onSelect,
  selectedCurrency
}: {
  chainId?: ChainId
  selectedCurrency?: Currency | null
  onSelect: (currency: Currency) => void
}) {
  const nativeCurrency = useNativeCurrency()

  return (
    <AutoColumn gap="15px">
      <AutoRow>
        <TYPE.body fontWeight={500} fontSize="11px" lineHeight="13px" letterSpacing="0.06em">
          COMMON TOKENS
        </TYPE.body>
      </AutoRow>
      <AutoRow gap="4px">
        <Option
          transparent
          onClick={() => {
            if (!selectedCurrency || !currencyEquals(selectedCurrency, nativeCurrency)) {
              onSelect(nativeCurrency)
            }
          }}
          disabled={selectedCurrency === nativeCurrency}
        >
          <CurrencyLogo size="20px" currency={nativeCurrency} marginRight={8} />
          <Text fontWeight={500} fontSize={16}>
            {nativeCurrency.symbol}
          </Text>
        </Option>
        {(chainId ? SUGGESTED_BASES[chainId] : []).map((token: Token) => {
          const selected = selectedCurrency instanceof Token && selectedCurrency.address === token.address
          return (
            <Option
              backgroundColor={'bg3'}
              onClick={() => !selected && onSelect(token)}
              disabled={selected}
              key={token.address}
            >
              <CurrencyLogo size="20px" currency={token} marginRight={8} />
              <Text fontWeight={500} fontSize={16}>
                {token.symbol}
              </Text>
            </Option>
          )
        })}
      </AutoRow>
    </AutoColumn>
  )
}
