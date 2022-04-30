import React from 'react'
import { Text } from 'rebass'
import { Currency, currencyEquals, Token } from '@uniswap/sdk-core'
import styled from 'styled-components/macro'

import { ChainId } from 'constants/chains'
import { SUGGESTED_BASES } from '../../constants/routing'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow } from '../Row'
import CurrencyLogo from '../CurrencyLogo'
import { Evmos, EVMOS } from '../../constants/tokens'
import { CurrencyLogoFromList } from 'components/CurrencyLogo/CurrencyLogoFromList'

const BaseWrapper = styled.div<{ disable?: boolean }>`
  border: 1px solid ${({ theme, disable }) => (disable ? 'transparent' : theme.primaryTransparent)};
  border-radius: 8px;
  display: flex;
  padding: 6px;

  align-items: center;
  :hover {
    cursor: ${({ disable }) => !disable && 'pointer'};
    background-color: ${({ theme, disable }) => !disable && theme.secondary1_30};
  }

  background-color: ${({ theme, disable }) => disable && theme.bg3};
  opacity: ${({ disable }) => disable && '0.4'};
`

export default function CommonBases({
  chainId,
  onSelect,
  selectedCurrency,
}: {
  chainId?: ChainId
  selectedCurrency?: Currency | null
  onSelect: (currency: Currency) => void
}) {
  return (
    <AutoColumn gap="md">
      <AutoRow>
        <Text fontWeight={500} fontSize={14}>
          Common bases
        </Text>
        <QuestionHelper text="These tokens are commonly paired with other tokens." />
      </AutoRow>
      <AutoRow gap="4px">
        <BaseWrapper
          onClick={() => {
            if (chainId) {
              const photon = Evmos.onChain(chainId || ChainId.MAINNET)
              if (!selectedCurrency || !currencyEquals(selectedCurrency, photon)) {
                onSelect(photon)
              }
            }
          }}
          disable={selectedCurrency?.isNative}
        >
          <CurrencyLogo currency={EVMOS} style={{ marginRight: 8 }} />
          <Text fontWeight={500} fontSize={16}>
            {EVMOS.symbol}
          </Text>
        </BaseWrapper>
        {(typeof chainId === 'number' ? SUGGESTED_BASES[chainId] ?? [] : []).map((token: Token) => {
          const selected = selectedCurrency?.isToken && selectedCurrency.address === token.address
          return (
            <BaseWrapper onClick={() => !selected && onSelect(token)} disable={selected} key={token.address}>
              <CurrencyLogoFromList currency={token} style={{ marginRight: 8 }} />
              <Text fontWeight={500} fontSize={16}>
                {token.symbol}
              </Text>
            </BaseWrapper>
          )
        })}
      </AutoRow>
    </AutoColumn>
  )
}
