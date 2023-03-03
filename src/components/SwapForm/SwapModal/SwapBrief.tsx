import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import React from 'react'
import { ArrowDown } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { RowFixed } from 'components/Row'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import UpdatedBadge, { Props as UpdatedBadgeProps } from 'components/SwapForm/SwapModal/SwapDetails/UpdatedBadge'
import useTheme from 'hooks/useTheme'

type Props = {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
} & UpdatedBadgeProps

const TruncatedText = styled(Text)`
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 24px;
  font-weight: 500;
`

const SwapBrief: React.FC<Props> = ({ inputAmount, outputAmount, $level }) => {
  const theme = useTheme()
  const { typedValue, feeConfig } = useSwapFormContext()
  return (
    <AutoColumn gap={'md'} style={{ marginTop: '20px', padding: '0 8px' }}>
      <Flex
        alignItems="center"
        width="100%"
        sx={{
          gap: '8px',
        }}
      >
        <CurrencyLogo currency={inputAmount.currency} size={'24px'} />
        <TruncatedText>{!!feeConfig ? typedValue : inputAmount.toSignificant(6)}</TruncatedText>
        <Text flex="0 0 fit-content" fontSize={24} fontWeight={500}>
          {inputAmount.currency.symbol}
        </Text>
      </Flex>

      <RowFixed>
        <ArrowDown size="16" color={theme.text2} style={{ marginLeft: '4px', minWidth: '16px' }} />
      </RowFixed>

      <Flex
        alignItems="center"
        width="100%"
        sx={{
          gap: '8px',
        }}
      >
        <Flex
          alignItems="center"
          flex="1 1 0"
          sx={{
            gap: '8px',
          }}
        >
          <CurrencyLogo currency={outputAmount?.currency} size={'24px'} />
          <TruncatedText>{outputAmount.toSignificant(6) || ''}</TruncatedText>
          <Text flex="0 0 fit-content" fontSize={24} fontWeight={500}>
            {outputAmount.currency.symbol}
          </Text>
        </Flex>

        <UpdatedBadge $level={$level} />
      </Flex>
    </AutoColumn>
  )
}

export default SwapBrief
