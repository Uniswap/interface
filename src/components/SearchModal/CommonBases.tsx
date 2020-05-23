import React from 'react'
import { Text } from 'rebass'
import { COMMON_BASES } from '../../constants'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow } from '../Row'
import TokenLogo from '../TokenLogo'
import { BaseWrapper } from './styleds'

export default function CommonBases({
  chainId,
  onSelect,
  selectedTokenAddress
}: {
  chainId: number
  selectedTokenAddress: string
  onSelect: (tokenAddress: string) => void
}) {
  return (
    <AutoColumn gap="md">
      <AutoRow>
        <Text fontWeight={500} fontSize={16}>
          Common Bases
        </Text>
        <QuestionHelper text="These tokens are commonly used in pairs." />
      </AutoRow>
      <AutoRow gap="10px">
        {COMMON_BASES[chainId]?.map(token => {
          return (
            <BaseWrapper
              gap="6px"
              onClick={() => selectedTokenAddress !== token.address && onSelect(token.address)}
              disable={selectedTokenAddress === token.address}
              key={token.address}
            >
              <TokenLogo address={token.address} />
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
