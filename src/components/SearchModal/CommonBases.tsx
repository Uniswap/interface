import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import React from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import { NETWORKS_INFO } from 'constants/networks'
import { nativeOnChain } from 'constants/tokens'

import { SUGGESTED_BASES } from '../../constants'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import { AutoRow } from '../Row'

const BaseWrapper = styled.div`
  padding: 6px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  display: flex;
  align-items: center;

  cursor: pointer;

  &[data-selected='true'] {
    background-color: ${({ theme }) => rgba(theme.primary, 0.15)};
  }

  :hover {
    background-color: ${({ theme }) => theme.buttonBlack};
  }
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
          <Trans>Common bases</Trans>
        </Text>
        <InfoHelper text={t`These tokens are commonly paired with other tokens`} />
      </AutoRow>
      <AutoRow gap="4px">
        <BaseWrapper
          onClick={() => {
            if (!selectedCurrency || !selectedCurrency.isNative) {
              onSelect(nativeOnChain(chainId as number))
            }
          }}
          data-selected={selectedCurrency?.isNative}
        >
          <CurrencyLogo currency={nativeOnChain(chainId as number)} style={{ marginRight: 8 }} />
          <Text fontWeight={500} fontSize={16}>
            {NETWORKS_INFO[chainId || ChainId.MAINNET].nativeToken.symbol}
          </Text>
        </BaseWrapper>
        {(chainId ? SUGGESTED_BASES[chainId] : []).map((token: Token) => {
          const selected = selectedCurrency instanceof Token && selectedCurrency.address === token.address
          let showWToken: Currency = token
          if (chainId) {
            showWToken = token
          }

          return (
            <BaseWrapper onClick={() => !selected && onSelect(showWToken)} data-selected={selected} key={token.address}>
              <CurrencyLogo currency={showWToken} style={{ marginRight: 8 }} />
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
