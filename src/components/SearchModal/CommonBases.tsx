import React from 'react'
import { Text } from 'rebass'
import { ChainId, Currency, currencyEquals, ETHER, Token } from '@dynamic-amm/sdk'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'

import { SUGGESTED_BASES } from '../../constants'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow } from '../Row'
import CurrencyLogo from '../CurrencyLogo'
import { convertToNativeTokenFromETH } from 'utils/dmm'

const BaseWrapper = styled.div<{ disable?: boolean }>`
  border: 1px solid ${({ theme, disable }) => (disable ? 'transparent' : theme.bg3)};
  border-radius: 10px;
  display: flex;
  padding: 6px;

  align-items: center;
  :hover {
    cursor: ${({ disable }) => !disable && 'pointer'};
    background-color: ${({ theme, disable }) => !disable && theme.bg2};
  }

  background-color: ${({ theme, disable }) => disable && theme.bg3};
  opacity: ${({ disable }) => disable && '0.4'};
`

export default function CommonBases({
  chainId,
  onSelect,
  selectedCurrency
}: {
  chainId?: ChainId
  selectedCurrency?: Currency | null
  onSelect: (currency: Currency) => void
}) {
  return (
    <AutoColumn gap="md">
      <AutoRow>
        <Text fontWeight={500} fontSize={14}>
          <Trans>Common bases</Trans>
        </Text>
        <QuestionHelper text={t`These tokens are commonly paired with other tokens.`} />
      </AutoRow>
      <AutoRow gap="4px">
        <BaseWrapper
          onClick={() => {
            if (!selectedCurrency || !currencyEquals(selectedCurrency, ETHER)) {
              onSelect(ETHER)
            }
          }}
          disable={selectedCurrency === ETHER}
        >
          <CurrencyLogo currency={ETHER} style={{ marginRight: 8 }} />
          <Text fontWeight={500} fontSize={16}>
            {chainId && [1, 3, 4, 5, 42].includes(chainId) && `ETH`}
            {chainId && [137, 80001].includes(chainId) && `MATIC`}
            {chainId && [97, 56].includes(chainId) && `BNB`}
            {chainId && [43113, 43114].includes(chainId) && `AVAX`}
          </Text>
        </BaseWrapper>
        {(chainId ? SUGGESTED_BASES[chainId] : []).map((token: Token) => {
          const selected = selectedCurrency instanceof Token && selectedCurrency.address === token.address
          let showWToken: Currency = token
          if (chainId) {
            showWToken = convertToNativeTokenFromETH(token, chainId)
          }
          return (
            <BaseWrapper onClick={() => !selected && onSelect(showWToken)} disable={selected} key={token.address}>
              <CurrencyLogo currency={token} style={{ marginRight: 8 }} />
              <Text fontWeight={500} fontSize={16}>
                {showWToken.symbol}
              </Text>
            </BaseWrapper>
          )
        })}
      </AutoRow>
    </AutoColumn>
  )
}
