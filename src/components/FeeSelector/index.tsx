import { Currency } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Down } from 'assets/svg/down.svg'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'

import { useFeeTierDistribution } from './hook'

const FEE_AMOUNT_DETAIL: { [key: string]: { label: string; description: ReactNode } } = {
  [FeeAmount.STABLE]: {
    label: '0.008',
    description: <Trans>Best for very stable pairs</Trans>,
  },

  [FeeAmount.LOWEST]: {
    label: '0.01',
    description: <Trans>Best for very stable pairs</Trans>,
  },

  [FeeAmount.LOW]: {
    label: '0.04',
    description: <Trans>Best for stable pairs</Trans>,
  },
  [FeeAmount.MEDIUM]: {
    label: '0.3',
    description: <Trans>Best for most pairs</Trans>,
  },
  [FeeAmount.HIGH]: {
    label: '1',
    description: <Trans>Best for exotic pairs</Trans>,
  },
}

const Option = styled.div<{ active: boolean }>`
  padding: 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;

  :hover {
    background: ${({ theme }) => theme.buttonBlack};
  }
`

const FeeOption = ({
  active,
  label,
  description,
  onClick,
  percentSelected,
}: {
  onClick: () => void
  active: boolean
  label: string
  description: ReactNode
  percentSelected?: string
}) => {
  const theme = useTheme()
  return (
    <Option active={active} role="button" onClick={onClick}>
      <div>
        <Text fontWeight={500} fontSize="14px">
          {label}%
        </Text>
        <Text color={theme.subText} marginTop="4px" fontSize="10px">
          {description}
        </Text>
      </div>
      {percentSelected && <FeeSelectionPercent>{percentSelected}% select</FeeSelectionPercent>}
    </Option>
  )
}

const FeeSelectorWrapper = styled.div`
  display: flex;
  padding: 8px 12px;
  justify-content: space-between;
  align-items: center;
  background: ${({ theme }) => theme.buttonBlack};
  position: relative;
  cursor: pointer;
  border-radius: 16px;
`

const SelectWrapper = styled.div<{ show: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  top: 56px;
  background: ${({ theme }) => theme.tableHeader};
  border-radius: 20px;
  overflow: hidden;
  z-index: 2;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
  max-height: ${({ show }) => (show ? '1000px' : 0)};
  transition: max-height 0.15s ${({ show }) => (show ? 'ease-in' : 'ease-out')};
`

const FeeSelectionPercent = styled.div`
  border-radius: 999px;
  height: fit-content;
  padding: 4px 8px;
  font-size: 10px;
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  color: ${({ theme }) => theme.subText};
`

function FeeSelector({
  feeAmount,
  onChange,
  currencyA,
  currencyB,
}: {
  feeAmount: FeeAmount
  onChange: (fee: FeeAmount) => void
  currencyA: Currency | undefined
  currencyB: Currency | undefined
}) {
  const [show, setShow] = useState(false)
  const feeTierDistribution = useFeeTierDistribution(currencyA, currencyB)

  const showFeeDistribution = Object.values(feeTierDistribution).some(item => item !== 0)

  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => {
    setShow(false)
  })

  return (
    <FeeSelectorWrapper role="button" onClick={() => setShow(prev => !prev)} ref={ref}>
      <div>
        <Text fontSize="14px" lineHeight="20px" fontWeight={500}>
          {FEE_AMOUNT_DETAIL[feeAmount].label}%
        </Text>
        <Text fontSize={10} marginTop="4px">
          {FEE_AMOUNT_DETAIL[feeAmount].description}
        </Text>
      </div>

      <Flex alignItems="center" sx={{ gap: '8px' }}>
        {showFeeDistribution && (
          <FeeSelectionPercent>{feeTierDistribution[feeAmount].toFixed(0)}% select</FeeSelectionPercent>
        )}

        <Down style={{ transform: `rotate(${show ? '-180deg' : 0})`, transition: 'transform 0.15s' }} />
      </Flex>

      <SelectWrapper show={show}>
        {[FeeAmount.STABLE, FeeAmount.LOWEST, FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH].map(_feeAmount => {
          return (
            <FeeOption
              onClick={() => onChange(_feeAmount)}
              key={_feeAmount}
              active={feeAmount === _feeAmount}
              label={FEE_AMOUNT_DETAIL[_feeAmount].label}
              description={FEE_AMOUNT_DETAIL[_feeAmount].description}
              percentSelected={showFeeDistribution ? feeTierDistribution[_feeAmount].toFixed(0) : undefined}
            />
          )
        })}
      </SelectWrapper>
    </FeeSelectorWrapper>
  )
}

export default FeeSelector
