import { ChainId, Token } from '@ubeswap/sdk'
import { useAllTokens } from 'hooks/Tokens'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import styled from 'styled-components'

import { SUGGESTED_BASES } from '../../constants'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import QuestionHelper from '../QuestionHelper'
import { AutoRow } from '../Row'

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
  selectedCurrency,
}: {
  chainId?: ChainId
  selectedCurrency?: Token | null
  onSelect: (currency: Token) => void
}) {
  const allTokens = useAllTokens()
  const { t } = useTranslation()
  return (
    <AutoColumn gap="md">
      <AutoRow>
        <Text fontWeight={500} fontSize={14}>
          {t('CommonBases')}
        </Text>
        <QuestionHelper text={t('TheseTokensAreCommonlyPairedWithOtherTokens')} />
      </AutoRow>
      <AutoRow gap="4px">
        {(chainId ? SUGGESTED_BASES[chainId] : []).map((token: Token) => {
          const selected = selectedCurrency instanceof Token && selectedCurrency.address === token.address
          return (
            <BaseWrapper onClick={() => !selected && onSelect(token)} disable={selected} key={token.address}>
              <CurrencyLogo currency={allTokens[token.address] ?? token} style={{ marginRight: 8 }} />
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
