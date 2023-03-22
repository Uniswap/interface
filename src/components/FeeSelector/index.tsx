import { Currency } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Down } from 'assets/svg/down.svg'
import { MoneyBag } from 'components/Icons'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useProAmmPoolInfos } from 'hooks/useProAmmPoolInfo'
import useTheme from 'hooks/useTheme'
import { useElasticFarms } from 'state/farms/elastic/hooks'

import { FEE_AMOUNTS, useFeeTierDistribution } from './hook'

const FEE_AMOUNT_DETAIL: { [key in FeeAmount]: { label: string; description: ReactNode } } = {
  [FeeAmount.VERY_STABLE]: {
    label: '0.008',
    description: <Trans>Best for very stable pairs</Trans>,
  },
  [FeeAmount.VERY_STABLE1]: {
    label: '0.01',
    description: <Trans>Best for very stable pairs</Trans>,
  },
  [FeeAmount.VERY_STABLE2]: {
    label: '0.02',
    description: <Trans>Best for very stable pairs</Trans>,
  },
  [FeeAmount.STABLE]: {
    label: '0.04',
    description: <Trans>Best for stable pairs</Trans>,
  },
  [FeeAmount.MOST_PAIR]: {
    label: '0.1',
    description: <Trans>Best for most pairs</Trans>,
  },
  [FeeAmount.MOST_PAIR1]: {
    label: '0.25',
    description: <Trans>Best for most pairs</Trans>,
  },
  [FeeAmount.MOST_PAIR2]: {
    label: '0.3',
    description: <Trans>Best for most pairs</Trans>,
  },
  [FeeAmount.EXOTIC]: {
    label: '1',
    description: <Trans>Best for exotic pairs</Trans>,
  },
  [FeeAmount.VOLATILE]: {
    label: '2',
    description: <Trans>Best for very volatile pairs</Trans>,
  },
  [FeeAmount.RARE]: {
    label: '5',
    description: <Trans>Best for rare use cases</Trans>,
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
  hasFarm,
}: {
  onClick: () => void
  active: boolean
  label: string
  description: ReactNode
  percentSelected?: string
  hasFarm: boolean
}) => {
  const theme = useTheme()
  return (
    <Option active={active} role="button" onClick={onClick}>
      <Flex
        sx={{
          flexDirection: 'column',
        }}
      >
        <Flex
          sx={{
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Text as="span" fontWeight={500} fontSize="14px">
            {label}%
          </Text>
          {hasFarm && <MoneyBag size={14} color={theme.apr} />}
        </Flex>

        <Text as="span" color={theme.subText} marginTop="4px" fontSize="10px">
          {description}
        </Text>
      </Flex>
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
  z-index: 3;
`

const SelectWrapperOuter = styled.div<{ show: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  top: 56px;
  border-radius: 20px;
  overflow: hidden;
  background: ${({ theme }) => theme.tableHeader};
  padding: ${({ show }) => (show ? '4px' : 0)};
  transition: padding 0.15s ${({ show }) => (show ? 'ease-in' : 'ease-out')};
`

const SelectWrapper = styled.div<{ show: boolean }>`
  border-radius: 20px;
  z-index: 2;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
  max-height: ${({ show }) => (show ? '252px' : 0)};
  overflow-y: scroll;
  transition: max-height 0.15s ${({ show }) => (show ? 'ease-in' : 'ease-out')};

  /* width */
  ::-webkit-scrollbar {
    display: unset;
    width: 4px;
    border-radius: 999px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 999px;
    margin: 8px 0;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 999px;
  }
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
  const theme = useTheme()

  const [show, setShow] = useState(false)
  const feeTierDistribution = useFeeTierDistribution(currencyA, currencyB)

  const { farms } = useElasticFarms()

  const showFeeDistribution = Object.values(feeTierDistribution).some(item => item !== 0)

  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => {
    setShow(false)
  })

  const now = Date.now() / 1000
  const farmingPoolAddress =
    farms
      ?.map(farm => farm.pools)
      .flat()
      .filter(farm => farm.endTime >= now)
      .map(farm => farm.poolAddress) || []

  const poolAddresses = useProAmmPoolInfos(currencyA, currencyB, FEE_AMOUNTS)
  const tiersThatHasFarm = FEE_AMOUNTS.filter((_fee, i) => {
    const poolAddress = poolAddresses[i].toLowerCase()
    return farmingPoolAddress.includes(poolAddress)
  })

  return (
    <FeeSelectorWrapper role="button" onClick={() => setShow(prev => !prev)} ref={ref}>
      <Flex
        sx={{
          flexDirection: 'column',
        }}
      >
        <Flex
          sx={{
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Text as="span" fontSize="14px" lineHeight="20px" fontWeight={500}>
            {FEE_AMOUNT_DETAIL[feeAmount].label}%
          </Text>
          {tiersThatHasFarm.includes(feeAmount) && <MoneyBag size={14} color={theme.apr} />}
        </Flex>

        <Text as="span" marginTop="4px" fontSize="10px">
          {FEE_AMOUNT_DETAIL[feeAmount].description}
        </Text>
      </Flex>

      <Flex alignItems="center" sx={{ gap: '8px' }}>
        {showFeeDistribution && (
          <FeeSelectionPercent>{feeTierDistribution[feeAmount].toFixed(0)}% select</FeeSelectionPercent>
        )}

        <Down style={{ transform: `rotate(${show ? '-180deg' : 0})`, transition: 'transform 0.15s' }} />
      </Flex>

      <SelectWrapperOuter show={show}>
        <SelectWrapper show={show}>
          {FEE_AMOUNTS.map(_feeAmount => {
            return (
              <FeeOption
                onClick={() => onChange(_feeAmount)}
                key={_feeAmount}
                active={feeAmount === _feeAmount}
                label={FEE_AMOUNT_DETAIL[_feeAmount].label}
                description={FEE_AMOUNT_DETAIL[_feeAmount].description}
                percentSelected={showFeeDistribution ? feeTierDistribution[_feeAmount].toFixed(0) : undefined}
                hasFarm={tiersThatHasFarm.includes(_feeAmount)}
              />
            )
          })}
        </SelectWrapper>
      </SelectWrapperOuter>
    </FeeSelectorWrapper>
  )
}

export default FeeSelector
