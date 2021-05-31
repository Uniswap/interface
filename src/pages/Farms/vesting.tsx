import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { ExpandedContent } from 'components/FarmsList/ListItem'
import { AutoRow } from 'components/Row'
import useVesting from 'hooks/useVesting'
import React, { useState, useContext, useCallback } from 'react'
import styled, { ThemeContext } from 'styled-components'

import { TYPE } from 'theme'
import { BigNumber } from '@ethersproject/bignumber'
import { useTimestampFromBlock } from 'hooks/useTimestampFromBlock'
import { useBlockNumber, useKNCPrice } from 'state/application/hooks'
import { Fraction, JSBI } from 'libs/sdk/src'
import { KNC } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { getFormattedTimeFromSecond } from 'utils/formatTime'

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
const Tag = styled.div<{ tag?: string }>`
  display: flex;
  position: relative;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 16px;
  color: ${({ tag }) => (tag == 'active' ? '#1f292e' : 'inherit')};
  background-color: ${({ theme, tag }) => (tag == 'active' ? '#4aff8c' : theme.bg11)};
  z-index: 9999;
  box-sizing: border-box;
  box-shadow: 0px 24px 32px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.04),
    0px 0px 1px rgba(0, 0, 0, 0.04);
  @media screen and (max-width: 500px) {
    box-shadow: none;
  }
`

const Seperator = styled.div`
  padding: 30px 0;
  border: 1px solid #404b51;
`

const Vesting = () => {
  const theme = useContext(ThemeContext)
  const kncPrice = useKNCPrice()
  const toUSD = useCallback(
    value => kncPrice && value && `$${(parseFloat(kncPrice) * parseFloat(fixedFormatting(value, 18))).toFixed(2)}`,
    [kncPrice]
  )
  const { account, chainId } = useActiveWeb3React()
  const currentBlockNumber = useBlockNumber()
  const { schedules } = useVesting()
  console.log('==schedules', schedules)

  const { vestableIndexes, vestableAmount, fullyIndexes, fullyAmount, totalAmount, unlockedAmount } = schedules.reduce<{
    vestableIndexes: number[]
    vestableAmount: BigNumber
    fullyIndexes: number[]
    fullyAmount: BigNumber
    totalAmount: BigNumber
    unlockedAmount: BigNumber
  }>(
    (acc, s, index) => {
      acc.totalAmount = acc.totalAmount.add(BigNumber.from(s[2]))
      const fullyVestedAlready = BigNumber.from(s[2])
        .sub(BigNumber.from(s[3]))
        .isZero()
      const vestedAndVestablePercent = BigNumber.from(currentBlockNumber)
        .sub(BigNumber.from(s[1]))
        .isNegative()
        ? BigNumber.from(currentBlockNumber)
            .sub(BigNumber.from(s[0]))
            .mul(100)
            .div(BigNumber.from(s[1]).sub(BigNumber.from(s[0])))
        : 100
      const unlockedAmount = BigNumber.from(s[2])
        .mul(vestedAndVestablePercent)
        .div(100)
      const vestableAmount = unlockedAmount.sub(BigNumber.from(s[3]))
      if (!fullyVestedAlready) {
        acc.vestableIndexes.push(index)
      }
      acc.vestableAmount = acc.vestableAmount.add(vestableAmount)

      if (!fullyVestedAlready && !!currentBlockNumber && currentBlockNumber > s[1]) {
        acc.fullyIndexes.push(index)
        acc.fullyAmount = acc.fullyAmount.add(BigNumber.from(s[2]))
      }

      acc.unlockedAmount = acc.unlockedAmount.add(unlockedAmount)
      return acc
    },
    {
      vestableIndexes: [],
      vestableAmount: BigNumber.from(0),
      fullyIndexes: [],
      fullyAmount: BigNumber.from(0),
      totalAmount: BigNumber.from(0),
      unlockedAmount: BigNumber.from(0)
    }
  )

  const [pendingTx, setPendingTx] = useState(false)
  const { vestAtIndex } = useVesting()
  const onClaimAll = async () => {
    if (!chainId || !account) return
    console.log('===claim all active')
    setPendingTx(true)
    await vestAtIndex(KNC[chainId].address, vestableIndexes)
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
        <TYPE.body color={theme.text11} fontWeight={600} fontSize={16} margin="0 0 10px 0">
          TOTAL HARVESTED REWARDS
        </TYPE.body>
        <AutoRow justify="space-between">
          <div>
            <TYPE.body color={theme.text11} fontWeight={600} fontSize={28}>
              <img
                src={
                  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202/logo.png'
                }
                alt="uniswap-icon"
                width="24px"
              />
              {fixedFormatting(totalAmount, 18)} KNC
            </TYPE.body>
            <TYPE.body color={theme.text9} fontWeight={'normal'} fontSize={24} margin="3px 0 0 23px">
              {toUSD(totalAmount)}
            </TYPE.body>
          </div>
          <Seperator />
          <div>
            <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
              Locked Rewards
            </TYPE.body>
            <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={18} margin="10px 0 0 0">
              {fixedFormatting(totalAmount.sub(unlockedAmount), 18)} KNC
            </TYPE.body>

            <TYPE.body color={theme.text9} fontWeight={'normal'} fontSize={14}>
              {toUSD(totalAmount.sub(unlockedAmount))}
            </TYPE.body>
          </div>
          <Seperator />
          <div>
            <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
              Claimed Rewards
            </TYPE.body>
            <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={18} margin="10px 0 0 0">
              {fixedFormatting(unlockedAmount.sub(vestableAmount), 18)} KNC
            </TYPE.body>

            <TYPE.body color={theme.text9} fontWeight={'normal'} fontSize={14}>
              {toUSD(unlockedAmount.sub(vestableAmount))}
            </TYPE.body>
          </div>
          <Seperator />
          <Tag style={{ width: '300px', padding: '20px' }}>
            <div>
              <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
                Unlocked Rewards
              </TYPE.body>
              <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={18} margin="10px 0 0 0">
                {fixedFormatting(vestableAmount, 18)} KNC
              </TYPE.body>

              <TYPE.body color={theme.text9} fontWeight={'normal'} fontSize={14}>
                {toUSD(vestableAmount)}
              </TYPE.body>
            </div>
            <div>
              <ButtonPrimary height="30px" onClick={onClaimAll}>
                Claim All
              </ButtonPrimary>
            </div>
          </Tag>
          {/* <AutoRow>
            <ButtonPrimary height="30px">Claim all</ButtonPrimary>
          </AutoRow> */}
        </AutoRow>
      </ExpandedContent>
      <ExpandedContent style={{ margin: '20px 0' }}>
        <VestSchedule style={{ padding: ' 0 0 20px 0', margin: '0 0 20px 0', borderBottom: '1px solid #404b51' }}>
          <AutoRow>
            <TYPE.body color={theme.text11} fontWeight={600} fontSize={16} margin="0 10px 0 0">
              VESTING PERIODS
            </TYPE.body>
          </AutoRow>
        </VestSchedule>
        {schedules.map((s, index) => (
          <Schedule schedule={s} key={index} index={index} />
        ))}
      </ExpandedContent>
    </>
  )
}

const fixedFormatting = (value: BigNumber, decimals: number) => {
  return new Fraction(value.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toSignificant(6)
}

const Schedule = ({ schedule, index }: any) => {
  const theme = useContext(ThemeContext)
  const kncPrice = useKNCPrice()
  const toUSD = useCallback(
    value => kncPrice && value && `$${(parseFloat(kncPrice) * parseFloat(fixedFormatting(value, 18))).toFixed(2)}`,
    [kncPrice]
  )
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
  const endIn =
    currentBlockNumber && BigNumber.from(schedule[1]).toNumber() > currentBlockNumber
      ? BigNumber.from(schedule[1])
          .sub(currentBlockNumber)
          .mul(13)
          .toNumber()
      : undefined
  const fullyVestedAlready = BigNumber.from(schedule[2])
    .sub(BigNumber.from(schedule[3]))
    .isZero()
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
    <div style={{ padding: '20px 0 100px 0', borderBottom: '1px solid #404b51' }}>
      <TYPE.body color={theme.text11} fontWeight={600} fontSize={16} margin="0 0 20px 0">
        Vesting stared: {startTimestamp && new Date(startTimestamp * 1000).toLocaleDateString()}
      </TYPE.body>

      <AutoRow margin="0 0 20px 0" justify="space-between">
        <AutoRow gap={'5px'} style={{ flex: '2' }}>
          <TYPE.body color={theme.text11} fontWeight={600} fontSize={16}>
            Rewards: {fixedFormatting(BigNumber.from(schedule[2]), 18)} KNC
          </TYPE.body>

          <TYPE.body color={theme.text9} fontWeight={'normal'} fontSize={14}>
            {toUSD(BigNumber.from(schedule[2]))}
          </TYPE.body>
          {vestedAndVestablePercent == 100 && !fullyVestedAlready && (
            <Tag tag={'active'} style={{ color: '#1f292e', fontSize: '14px', padding: '6px 20px' }}>
              Fully Vested
            </Tag>
          )}
        </AutoRow>
        {!fullyVestedAlready && (
          <AutoRow gap={'5px'} style={{ flex: '1' }}>
            <Tag style={{ flex: '2', justifyContent: 'space-around' }}>
              Unlocked: {fixedFormatting(vestableAmount, 18)} KNC
            </Tag>

            <ButtonPrimary height="30px" onClick={onVest} style={{ flex: '1' }}>
              Claim
            </ButtonPrimary>
          </AutoRow>
        )}
      </AutoRow>
      <div
        style={{
          position: 'relative',
          margin: '50px 0 0 0'
        }}
      >
        <AutoRow>
          <AutoRow style={{ position: 'relative' }}>
            {/* vested */}
            <TYPE.body
              color={theme.text7}
              fontWeight={'normal'}
              fontSize={14}
              style={{
                position: 'absolute',
                top: '-25px'
              }}
            >
              CLAIMED
            </TYPE.body>
            <TYPE.body
              color={theme.text7}
              fontWeight={'normal'}
              fontSize={16}
              style={{
                position: 'absolute',
                top: '20px'
              }}
            >
              {fixedFormatting(BigNumber.from(schedule[3]), 18)}
            </TYPE.body>

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
                <TYPE.body
                  color={theme.text7}
                  fontWeight={'normal'}
                  fontSize={16}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: `${vestedPercent < 10 ? '10' : vestedPercent > 80 ? '80' : vestedPercent}%`
                  }}
                >
                  {fixedFormatting(vestableAmount, 18)}
                </TYPE.body>
                <TYPE.body
                  color={theme.text7}
                  fontWeight={'normal'}
                  fontSize={14}
                  style={{
                    position: 'absolute',
                    top: '-25px',
                    left: `${vestedPercent < 10 ? '10' : vestedPercent > 80 ? '80' : vestedPercent}%`
                  }}
                >
                  UNLOCKED
                </TYPE.body>
              </>
            )}

            {vestedAndVestablePercent < 100 && (
              <TYPE.body
                color={theme.text7}
                fontWeight={'normal'}
                fontSize={16}
                style={{
                  position: 'absolute',
                  top: '-25px',
                  left: `${vestedAndVestablePercent}%`
                }}
              >
                {fixedFormatting(unvestableAmount, 18)}
              </TYPE.body>
            )}

            {/* finish */}
            <TYPE.body
              color={theme.text7}
              fontWeight={'normal'}
              fontSize={14}
              style={{
                textAlign: 'end',
                position: 'absolute',
                top: '-35px',
                right: '0'
              }}
            >
              FULL UNLOCK <br />
              {endTimestamp &&
                `${new Date(endTimestamp * 1000).toLocaleDateString()}${
                  !!endIn ? `(${getFormattedTimeFromSecond(endIn)} left)` : ''
                }`}
            </TYPE.body>
            <div
              style={{ height: '12px', width: '100%', zIndex: 1, background: '#33444d', borderRadius: '26px' }}
            ></div>
          </AutoRow>
        </AutoRow>
      </div>
    </div>
  )
}
export default Vesting
