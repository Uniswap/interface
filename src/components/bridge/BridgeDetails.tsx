import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { TYPE } from '../../theme'
import QuestionHelper from '../QuestionHelper'
import { CurrencyAmount } from '@fuseio/fuse-swap-sdk'
import { useBridgeFee, useCalculatedBridgeFee } from '../../state/bridge/hooks'
import { useCurrency } from '../../hooks/Tokens'

const AdvancedDetailsFooter = styled.div<{ show: boolean }>`
  padding-top: calc(16px + 2rem);
  padding-bottom: 20px;
  margin-top: -2rem;
  width: 100%;
  max-width: 400px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.advancedBG};
  z-index: -1;

  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(-100%)')};
  transition: transform 300ms ease-in-out;
`

function BridgeDetails({
  inputCurrencyId,
  inputAmount
}: {
  inputCurrencyId: string | undefined
  inputAmount: CurrencyAmount | undefined
}) {
  const theme = useContext(ThemeContext)
  const currency = useCurrency(inputCurrencyId, 'Bridge')
  const fee = useBridgeFee(inputCurrencyId)
  const calculatedFee = useCalculatedBridgeFee(inputCurrencyId, inputAmount)

  const feePercentage = Number(fee) * 100
  const parsedCalculatedFee = Number(calculatedFee)
  const show = parsedCalculatedFee > 0

  return (
    <AdvancedDetailsFooter show={show}>
      <AutoColumn gap="md" style={{ padding: '0 20px' }}>
        <RowBetween style={{ flexWrap: 'wrap' }}>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              Bridge Fee
            </TYPE.black>
            <QuestionHelper
              text={`Moving funds to mainnet requires ${feePercentage}% fee in order to cover  transaction and bridge maintenance costs`}
            />
          </RowFixed>
          <TYPE.black fontSize={14} color={theme.text1}>
            {`${calculatedFee} ${currency?.symbol} Fee (${feePercentage}%)`}
          </TYPE.black>
        </RowBetween>
      </AutoColumn>
    </AdvancedDetailsFooter>
  )
}

export default BridgeDetails
