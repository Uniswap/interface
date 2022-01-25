import { Pair, PricedTokenAmount, TokenAmount } from '@swapr/sdk'
import React, { useState } from 'react'
import { AutoColumn } from '../../../../../Column'
import CurrencyInputPanel from '../../../../../CurrencyInputPanel'
import { tryParseAmount } from '../../../../../../state/swap/hooks'
import { TYPE } from '../../../../../../theme'
import Countdown from '../../../../../Countdown'
import styled from 'styled-components'
import { AlertTriangle } from 'react-feather'
import { Box, Flex } from 'rebass'

const AlertIcon = styled(AlertTriangle)`
  color: ${props => props.theme.red1};
`

interface ConfirmStakeModalHeaderProps {
  stakablePair?: Pair | null
  maximumAmount?: TokenAmount | PricedTokenAmount
  timelocked?: boolean
  endingTimestamp?: number
  onAmountChange: (amount: TokenAmount) => void
}

export default function ConfirmStakingWithdrawingModalHeader({
  stakablePair,
  maximumAmount,
  timelocked,
  endingTimestamp,
  onAmountChange
}: ConfirmStakeModalHeaderProps) {
  const [typedAmount, setTypedAmount] = useState('')

  return (
    <AutoColumn gap="md" style={{ marginTop: '20px' }}>
      {timelocked && endingTimestamp && (
        <Flex>
          <Box mr="4px">
            <AlertIcon size="18px" />
          </Box>
          <Box>
            <TYPE.body fontWeight="500" lineHeight="19.5px" color="red1">
              Tokens will be locked for <Countdown to={endingTimestamp} />
            </TYPE.body>
          </Box>
        </Flex>
      )}
      <CurrencyInputPanel
        value={typedAmount}
        onUserInput={input => {
          if (!stakablePair) return
          setTypedAmount(input)
          const parsedAmount = tryParseAmount(input, stakablePair.liquidityToken) as TokenAmount | undefined
          if (parsedAmount) {
            onAmountChange(parsedAmount)
          }
        }}
        onMax={() => {
          if (!maximumAmount) return
          setTypedAmount(maximumAmount.toExact())
          onAmountChange(new TokenAmount(maximumAmount.token, maximumAmount.raw))
        }}
        showMaxButton
        pair={stakablePair}
        id="staked-amount"
        disableCurrencySelect
        customBalanceText="Stakable: "
        balance={maximumAmount}
      />
    </AutoColumn>
  )
}
