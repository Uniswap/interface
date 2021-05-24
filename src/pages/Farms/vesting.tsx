import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { ExpandedContent } from 'components/FarmsList/ListItem'
import { AutoRow } from 'components/Row'
import useVesting from 'hooks/useVesting'
import React, { useState, useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'

import { TYPE } from 'theme'
import { BigNumber } from '@ethersproject/bignumber'
import { useTimestampFromBlock } from 'hooks/useTimestampFromBlock'
import { useBlockNumber } from 'state/application/hooks'
import { Fraction, JSBI } from 'libs/sdk/src'
import { KNC } from 'constants/index'
import { useActiveWeb3React } from 'hooks'

const VestAllGroup = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  grid-template-areas: 'total vestable vest';
  margin-bottom: 32px;
`

const VestSchedule = styled.div`
  display: grid;
  grid-template-columns: 4fr 1fr;
  grid-template-areas: 'total vestable vest';
`
const Tag = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 16px;
  background-color: ${({ theme }) => theme.bg11};
  z-index: 9999;
  box-sizing: border-box;
  box-shadow: 0px 24px 32px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.04),
    0px 0px 1px rgba(0, 0, 0, 0.04);
  @media screen and (max-width: 500px) {
    box-shadow: none;
  }
`

const Vesting = () => {
  const theme = useContext(ThemeContext)
  const { account, chainId } = useActiveWeb3React()
  const currentBlockNumber = useBlockNumber()
  const { schedules } = useVesting()
  console.log('==schedules', schedules)

  const { activeIndexes, activeAmount, fullyIndexes, fullyAmount, totalAmount } = schedules.reduce<{
    activeIndexes: number[]
    activeAmount: BigNumber
    fullyIndexes: number[]
    fullyAmount: BigNumber
    totalAmount: BigNumber
  }>(
    (acc, s, index) => {
      acc.totalAmount = acc.totalAmount.add(BigNumber.from(s[2]))
      if (
        !BigNumber.from(s[2])
          .sub(BigNumber.from(s[3]))
          .isZero()
      ) {
        const vestedAndVestablePercent = BigNumber.from(currentBlockNumber)
          .sub(BigNumber.from(s[1]))
          .isNegative()
          ? BigNumber.from(currentBlockNumber)
              .sub(BigNumber.from(s[0]))
              .mul(100)
              .div(BigNumber.from(s[1]).sub(BigNumber.from(s[0])))
          : 100
        const vestableAmount = BigNumber.from(s[2])
          .mul(vestedAndVestablePercent)
          .div(100)
          .sub(BigNumber.from(s[3]))
        acc.activeIndexes.push(index)
        acc.activeAmount = acc.activeAmount.add(vestableAmount)

        if (!!currentBlockNumber && currentBlockNumber > s[1]) {
          acc.fullyIndexes.push(index)
          acc.fullyAmount = acc.fullyAmount.add(BigNumber.from(s[2]))
        }
      }
      return acc
    },
    {
      activeIndexes: [],
      activeAmount: BigNumber.from(0),
      fullyIndexes: [],
      fullyAmount: BigNumber.from(0),
      totalAmount: BigNumber.from(0)
    }
  )

  const [pendingTx, setPendingTx] = useState(false)
  const { vestAtIndex } = useVesting()
  const onClaimAllActive = async () => {
    if (!chainId || !account) return
    console.log('===claim all active')
    setPendingTx(true)
    await vestAtIndex(KNC[chainId].address, activeIndexes)
    setPendingTx(false)
  }

  const onClaimAllFully = async () => {
    if (!chainId || !account) return
    console.log('===claim all fully')
    setPendingTx(true)
    await vestAtIndex(KNC[chainId].address, fullyIndexes)
    setPendingTx(false)
  }
  return (
    <>
      <ExpandedContent>
        <TYPE.body color={theme.text1} fontWeight={600} fontSize={16} margin="0 0 10px 0">
          REWARD IN LOCKER
        </TYPE.body>
        <VestAllGroup>
          <div style={{ borderRight: 'solid 1px #404b51', marginRight: '20px' }}>
            <TYPE.body color={theme.text1} fontWeight={600} fontSize={32}>
              <img
                src={
                  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202/logo.png'
                }
                alt="uniswap-icon"
                width="24px"
              />
              {fixedFormatting(totalAmount, 18)} KNC
            </TYPE.body>
            <TYPE.body color={theme.text1} fontWeight={'normal'} fontSize={20} margin="0 0 0 23px">
              $1,800,000
            </TYPE.body>
          </div>
          <div>
            <TYPE.body color={theme.text1} fontWeight={'normal'} fontSize={16} margin="3px 0 12px 0">
              Available to Vest
            </TYPE.body>
            <AutoRow>
              <TYPE.body color={theme.text1} fontWeight={'normal'} fontSize={24}>
                {fixedFormatting(activeAmount, 18)} KNC
              </TYPE.body>
              &nbsp;
              <TYPE.body color={theme.text1} fontWeight={'normal'} fontSize={16}>
                $1,200,000
              </TYPE.body>
            </AutoRow>
          </div>
          <AutoRow>
            <ButtonPrimary height="30px">Claim all</ButtonPrimary>
          </AutoRow>
        </VestAllGroup>
      </ExpandedContent>
      <ExpandedContent style={{ margin: '20px 0' }}>
        <VestSchedule style={{ padding: ' 0 0 20px 0', margin: '0 0 20px 0', borderBottom: '1px solid #404b51' }}>
          <AutoRow>
            <TYPE.body color={theme.text1} fontWeight={600} fontSize={16} margin="0 10px 0 0">
              ACTIVE VESTING SCHEDULES
            </TYPE.body>

            <Tag>Total: {fixedFormatting(activeAmount, 18)} KNC</Tag>
          </AutoRow>
          <ButtonPrimary height="30px" onClick={onClaimAllActive}>
            Claim all active vesting
          </ButtonPrimary>
        </VestSchedule>
        {schedules.map((s, index) => (
          <Schedule schedule={s} key={index} index={index} />
        ))}
      </ExpandedContent>
      <ExpandedContent>
        <VestSchedule>
          <AutoRow>
            <TYPE.body color={theme.text1} fontWeight={600} fontSize={16} margin="0 10px 0 0">
              FULLY VESTED SCHEDULES
            </TYPE.body>

            <Tag>Total: {fixedFormatting(fullyAmount, 18)} KNC</Tag>
          </AutoRow>
          <ButtonPrimary height="30px" onClick={onClaimAllFully}>
            Claim
          </ButtonPrimary>
        </VestSchedule>
      </ExpandedContent>
    </>
  )
}

const fixedFormatting = (value: BigNumber, decimals: number) => {
  return new Fraction(value.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toSignificant(6)
}

const Schedule = ({ schedule, index }: any) => {
  const startTimestamp = useTimestampFromBlock(BigNumber.from(schedule[0]).toNumber())
  const endTimestamp =
    useTimestampFromBlock(BigNumber.from(schedule[1]).toNumber()) ||
    (!!startTimestamp &&
      startTimestamp +
        BigNumber.from(schedule[1])
          .sub(BigNumber.from(schedule[0]))
          .mul(13)
          .toNumber())
  const currentBlockNumber = useBlockNumber()
  const vestedPercent = BigNumber.from(schedule[3])
    .mul(100)
    .div(BigNumber.from(schedule[2]))
    .toNumber()
  const vestedAndVestablePercent = BigNumber.from(currentBlockNumber)
    .sub(BigNumber.from(schedule[1]))
    .isNegative()
    ? BigNumber.from(currentBlockNumber)
        .sub(BigNumber.from(schedule[0]))
        .mul(100)
        .div(BigNumber.from(schedule[1]).sub(BigNumber.from(schedule[0])))
    : 100
  const vestableAmount = BigNumber.from(schedule[2])
    .mul(vestedAndVestablePercent)
    .div(100)
    .sub(BigNumber.from(schedule[3]))

  const unvestableAmount = BigNumber.from(schedule[2])
    .mul(BigNumber.from(100).sub(vestedAndVestablePercent))
    .div(100)

  const { account, chainId } = useActiveWeb3React()
  const [pendingTx, setPendingTx] = useState(false)
  const { vestAtIndex } = useVesting()
  const onVest = async () => {
    if (!chainId || !account) return
    console.log('===vest', index)
    setPendingTx(true)
    await vestAtIndex(KNC[chainId].address, [index])
    setPendingTx(false)
  }
  return (
    <>
      <AutoRow>
        <Tag>Total: {fixedFormatting(BigNumber.from(schedule[2]), 18)} KNC</Tag>
      </AutoRow>
      <VestSchedule
        style={{
          margin: '35px 0 65px 0'
        }}
      >
        <AutoRow style={{ paddingRight: '40px' }}>
          <AutoRow style={{ position: 'relative' }}>
            {/* vested */}
            <div
              style={{
                position: 'absolute',
                top: '20px'
              }}
            >
              VESTED
            </div>
            <div style={{ position: 'absolute', top: '35px' }}>
              {startTimestamp && new Date(startTimestamp * 1000).toLocaleDateString()}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '-25px'
              }}
            >
              {fixedFormatting(BigNumber.from(schedule[3]), 18)}
            </div>

            <div
              style={{
                position: 'absolute',
                height: '12px',
                width: `${vestedPercent}%`,
                background: '#1183b7',
                borderRadius: '26px',
                zIndex: 3
              }}
            ></div>

            {/* vestable */}
            <div
              style={{
                position: 'absolute',
                height: '12px',
                width: `${vestedAndVestablePercent}%`,
                background: '#78d5ff',
                borderRadius: '26px',
                zIndex: 2
              }}
            ></div>
            {vestedPercent < 100 && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    top: '-25px',
                    left: `${vestedPercent < 10 ? '10' : vestedPercent > 80 ? '80' : vestedPercent}%`
                  }}
                >
                  {fixedFormatting(vestableAmount, 18)}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: `${vestedPercent < 10 ? '10' : vestedPercent > 80 ? '80' : vestedPercent}%`
                  }}
                >
                  VESTING <br />
                  AVAILABLE
                </div>
              </>
            )}

            {vestedAndVestablePercent < 100 && (
              <div
                style={{
                  position: 'absolute',
                  top: '-25px',
                  left: `${vestedAndVestablePercent}%`
                }}
              >
                {fixedFormatting(unvestableAmount, 18)}
              </div>
            )}

            {/* finish */}
            <div style={{ position: 'absolute', top: '20px', right: '0' }}>UNLOCK</div>
            <div style={{ position: 'absolute', top: '35px', right: '0' }}>
              {endTimestamp && new Date(endTimestamp * 1000).toLocaleDateString()}
            </div>
            <div
              style={{ height: '12px', width: '100%', zIndex: 1, background: '#33444d', borderRadius: '26px' }}
            ></div>
          </AutoRow>
        </AutoRow>
        <AutoRow>
          <ButtonPrimary height="30px" onClick={onVest}>
            Claim
          </ButtonPrimary>
        </AutoRow>
      </VestSchedule>
    </>
  )
}
export default Vesting
