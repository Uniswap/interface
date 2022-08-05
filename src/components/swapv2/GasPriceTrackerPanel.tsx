import { t } from '@lingui/macro'
import React from 'react'
import { ArrowLeft } from 'react-feather'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'

import { GasStation } from 'components/Icons'
import useGasPriceFromDeBank, { GasLevel } from 'hooks/useGasPriceFromDeBank'

type Props = {
  className?: string
  onBack: () => void
}

const mappings = [
  {
    gasLevel: GasLevel.SLOW,
    label: t`Low`,
  },
  {
    gasLevel: GasLevel.NORMAL,
    label: t`Average`,
  },
  {
    gasLevel: GasLevel.FAST,
    label: t`High`,
  },
]

const BackIconWrapper = styled(ArrowLeft)`
  height: 20px;
  width: 20px;
  margin-right: 10px;
  cursor: pointer;
  path {
    stroke: ${({ theme }) => theme.text} !important;
  }
`

const BackText = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const GasPriceList = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  padding-top: 20px;
  padding-bottom: 20px;

  border-top: 1px solid ${({ theme }) => theme.border};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const GasPriceItem = styled.div`
  flex: 1 1 33%;

  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 8px;

  &[data-type='${GasLevel.SLOW}'] {
    color: ${({ theme }) => theme.green};
  }
  &[data-type='${GasLevel.NORMAL}'] {
    color: ${({ theme }) => theme.text};

    border-left: 1px solid ${({ theme }) => theme.border};
    border-right: 1px solid ${({ theme }) => theme.border};
  }
  &[data-type='${GasLevel.FAST}'] {
    color: ${({ theme }) => theme.red};
  }
`

const GasPriceItemTitle = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  column-gap: 4px;

  height: 16px;

  color: inherit;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;

  svg {
    height: 100%;
    width: auto;
  }

  span {
    text-transform: capitalize;
  }
`

const PriceInGwei = styled.div`
  color: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
`

const PriceInUSD = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
`

const getPriceInGweiText = (value: number | undefined) => {
  return value ? `${value} gwei` : '-'
}

const getPriceInUSDText = (value: string | undefined) => {
  return value ? `$${value}` : '-'
}

const GasPriceTrackerPanel: React.FC<Props> = ({ className, onBack }) => {
  const data = useGasPriceFromDeBank()

  if (!data) {
    return null
  }

  return (
    <Box minHeight="300px" width="100%" className={className}>
      <Flex
        width={'100%'}
        flexDirection={'column'}
        sx={{
          rowGap: '16px',
        }}
      >
        <Flex
          alignItems="center"
          sx={{
            // this is to make the arrow stay exactly where it stays in Swap panel
            marginTop: '5px',
          }}
        >
          <BackIconWrapper onClick={onBack}></BackIconWrapper>
          <BackText>{t`Gas Price Tracker`}</BackText>
        </Flex>

        <GasPriceList>
          {mappings.map(({ gasLevel, label }) => (
            <GasPriceItem key={gasLevel} data-type={gasLevel}>
              <GasPriceItemTitle>
                <GasStation />
                <span>{label}</span>
              </GasPriceItemTitle>

              <PriceInGwei>{getPriceInGweiText(data[gasLevel].gasPriceInGwei)}</PriceInGwei>
              <PriceInUSD>{getPriceInUSDText(data[gasLevel].minimumTxFeeInUSD)}</PriceInUSD>
            </GasPriceItem>
          ))}
        </GasPriceList>
      </Flex>
    </Box>
  )
}

export default GasPriceTrackerPanel
