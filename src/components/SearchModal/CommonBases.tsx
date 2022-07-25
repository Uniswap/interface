import React from 'react'
import { Text } from 'rebass'
import { Currency, Token, ChainId } from '@kyberswap/ks-sdk-core'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'

import { SUGGESTED_BASES } from '../../constants'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'
import CurrencyLogo from '../CurrencyLogo'
import { nativeOnChain } from 'constants/tokens'
import { NETWORKS_INFO } from 'constants/networks'
import InfoHelper from 'components/InfoHelper'

const BaseWrapper = styled.div<{ disable?: boolean }>`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  display: flex;
  padding: 6px;

  align-items: center;
  :hover {
    cursor: ${({ disable }) => !disable && 'pointer'};
    background-color: ${({ theme, disable }) => !disable && theme.buttonBlack};
  }

  background-color: ${({ theme, disable }) => disable && theme.primary + '33'};
  color: ${({ theme, disable }) => disable && theme.primary};
  opacity: ${({ disable }) => disable && '0.8'};
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
          disable={selectedCurrency?.isNative}
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
            <BaseWrapper onClick={() => !selected && onSelect(showWToken)} disable={selected} key={token.address}>
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
