import React from 'react'
import { Text } from 'rebass'
import { ChainId, Currency, currencyEquals, Token } from '@swapr/sdk'

import { SUGGESTED_BASES } from '../../constants'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow, RowBetween } from '../Row'
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
    <AutoColumn gap="md">
      <AutoRow>
        <TYPE.body fontWeight={500} fontSize="11px" lineHeight="13px" letterSpacing="0.06em">
          COMMON BASES
        </TYPE.body>
        <QuestionHelper text="These tokens are commonly paired with other tokens." />
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
          <RowBetween>
            <CurrencyLogo size="20px" currency={nativeCurrency} marginRight={8} />
            <Text fontWeight={500} fontSize={16}>
              {nativeCurrency.symbol}
            </Text>
          </RowBetween>
        </Option>
        {(chainId ? SUGGESTED_BASES[chainId] : []).map((token: Token) => {
          const selected = selectedCurrency instanceof Token && selectedCurrency.address === token.address
          return (
            <Option transparent onClick={() => !selected && onSelect(token)} disabled={selected} key={token.address}>
              <RowBetween>
                <CurrencyLogo size="20px" currency={token} marginRight={8} />
                <Text fontWeight={500} fontSize={16}>
                  {token.symbol}
                </Text>
              </RowBetween>
            </Option>
          )
        })}
      </AutoRow>
    </AutoColumn>
  )
}
