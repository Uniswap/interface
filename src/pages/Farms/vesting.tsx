import { ButtonPrimary } from 'components/Button'
import { ExpandedContent } from 'components/FarmsList/ListItem'
import { AutoRow } from 'components/Row'
import useVesting from 'hooks/useVesting'
import React, { useState, useContext, useCallback } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { t, Trans } from '@lingui/macro'
import { ExternalLink, TYPE } from 'theme'
import { BigNumber } from '@ethersproject/bignumber'
import { useTimestampFromBlock } from 'hooks/useTimestampFromBlock'
import { useBlockNumber, useKNCPrice } from 'state/application/hooks'
import { ChainId, Fraction, JSBI, Token } from 'libs/sdk/src'
import { AVERAGE_BLOCK_TIME_IN_SECSS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import InfoHelper from 'components/InfoHelper'
import { formattedNum, getTokenSymbol } from 'utils'
import { useFarmRewardsUSD } from 'utils/dmm'
import { Reward } from 'state/farms/types'

import { Flex } from 'rebass'
import { useMedia } from 'react-use'

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

const fixedFormatting = (value: BigNumber, decimals: number) => {
  const res = new Fraction(value.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toFixed(6)
  return parseFloat(res).toString()
}

const Vesting = () => {
  const above1400 = useMedia('(min-width: 1400px)') // Extra large screen
  const theme = useContext(ThemeContext)

  const { account, chainId } = useActiveWeb3React()
  const currentBlockNumber = useBlockNumber()
  const { schedules, vestMultipleTokensAtIndices } = useVesting()

  const info = schedules.reduce<{
    [key: string]: {
      vestableIndexes: number[]
      vestableAmount: BigNumber
      fullyIndexes: number[]
      fullyAmount: BigNumber
      totalAmount: BigNumber
      unlockedAmount: BigNumber
      token: Token
    }
  }>((acc, s) => {
    if (!currentBlockNumber) return acc
    const address = (s[4] as Token).symbol as string
    if (!acc[address]) {
      acc[address] = {
        vestableIndexes: [],
        vestableAmount: BigNumber.from(0),
        fullyIndexes: [],
        fullyAmount: BigNumber.from(0),
        totalAmount: BigNumber.from(0),
        unlockedAmount: BigNumber.from(0),
        token: s[4] as Token
      }
    }

    acc[address].totalAmount = acc[address].totalAmount.add(BigNumber.from(s[2]))
    const fullyVestedAlready = BigNumber.from(s[2])
      .sub(BigNumber.from(s[3]))
      .isZero()

    const isEnd = !BigNumber.from(currentBlockNumber)
      .sub(BigNumber.from(s[1]))
      .isNegative()
    // const vestedAndVestablePercent = BigNumber.from(currentBlockNumber)
    //   .sub(BigNumber.from(s[1]))
    //   .isNegative()
    //   ? BigNumber.from(currentBlockNumber)
    //       .sub(BigNumber.from(s[0]))
    //       .mul(100)
    //       .div(BigNumber.from(s[1]).sub(BigNumber.from(s[0])))
    //   : 100
    // const unlockedAmount = BigNumber.from(s[2])
    //   .mul(vestedAndVestablePercent)
    //   .div(100)
    const unlockedAmount = isEnd
      ? BigNumber.from(s[2])
      : BigNumber.from(s[2])
          .mul(BigNumber.from(currentBlockNumber).sub(BigNumber.from(s[0])))
          .div(BigNumber.from(s[1]).sub(BigNumber.from(s[0])))
    const vestableAmount = unlockedAmount.sub(BigNumber.from(s[3]))
    if (!fullyVestedAlready) {
      acc[address].vestableIndexes.push(s[5])
    }
    acc[address].vestableAmount = acc[address].vestableAmount.add(
      vestableAmount.isNegative() ? BigNumber.from(0) : vestableAmount
    )

    if (!fullyVestedAlready && !!currentBlockNumber && currentBlockNumber > s[1]) {
      acc[address].fullyIndexes.push(s[5])
      acc[address].fullyAmount = acc[address].fullyAmount.add(BigNumber.from(s[2]))
    }

    acc[address].unlockedAmount = acc[address].unlockedAmount.add(unlockedAmount)
    return acc
  }, {})

  const totalUSD = useFarmRewardsUSD(
    Object.keys(info).map(k => {
      return { token: info[k].token, amount: info[k].totalAmount } as Reward
    })
  )
  const lockedUSD = useFarmRewardsUSD(
    Object.keys(info).map(k => {
      return { token: info[k].token, amount: info[k].totalAmount.sub(info[k].unlockedAmount) } as Reward
    })
  )
  const claimedUSD = useFarmRewardsUSD(
    Object.keys(info).map(k => {
      return { token: info[k].token, amount: info[k].unlockedAmount.sub(info[k].vestableAmount) } as Reward
    })
  )
  const unlockedUSD = useFarmRewardsUSD(
    Object.keys(info).map(k => {
      return { token: info[k].token, amount: info[k].vestableAmount } as Reward
    })
  )

  const [pendingTx, setPendingTx] = useState(false)
  const onClaimAll = async () => {
    if (!chainId || !account) return
    setPendingTx(true)
    const addresses = Object.keys(info).map(k => info[k].token.address)
    const indices = Object.keys(info).reduce<number[][]>((acc, k) => {
      acc.push(info[k].vestableIndexes)
      return acc
    }, [])
    await vestMultipleTokensAtIndices(addresses, indices)
    // await Promise.all(Object.keys(info).map(k => vestAtIndex(info[k].token.address, info[k].vestableIndexes)))
    setPendingTx(false)
  }
  const totalBlock = (
    <div>
      {Object.keys(info).map(k => (
        <div key={k}>
          <TYPE.body color={theme.text11} fontWeight={600} fontSize={28}>
            {fixedFormatting(info[k].totalAmount, 18)} {k}
          </TYPE.body>
        </div>
      ))}

      <TYPE.body color={theme.text9} fontWeight={'normal'} fontSize={24}>
        {formattedNum(totalUSD.toString(), true)}
      </TYPE.body>
    </div>
  )

  const lockedBlock = (
    <div>
      <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
        <Trans>Locked Rewards</Trans>
      </TYPE.body>
      {Object.keys(info).map(k => (
        <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={18} key={k}>
          {fixedFormatting(info[k].totalAmount.sub(info[k].unlockedAmount), 18)} {k}
        </TYPE.body>
      ))}

      <TYPE.body color={theme.text9} fontWeight={'normal'} fontSize={14}>
        {formattedNum(lockedUSD.toString(), true)}
      </TYPE.body>
    </div>
  )

  const claimedBlock = (
    <div>
      <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
        <Trans>Claimed Rewards</Trans>
      </TYPE.body>
      {Object.keys(info).map(k => (
        <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={18} key={k}>
          {fixedFormatting(info[k].unlockedAmount.sub(info[k].vestableAmount), 18)} {k}
        </TYPE.body>
      ))}

      <TYPE.body color={theme.text9} fontWeight={'normal'} fontSize={14}>
        {formattedNum(claimedUSD.toString(), true)}
      </TYPE.body>
    </div>
  )

  const unLockedBlock = (
    <div>
      <Tag style={{ width: `${above1400 ? '300px' : '100%'}`, padding: '20px' }}>
        <div>
          <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
            <Trans>Unlocked Rewards</Trans>
          </TYPE.body>
          {Object.keys(info).map(k => (
            <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={18} key={k}>
              {fixedFormatting(info[k].vestableAmount, 18)} {k}
            </TYPE.body>
          ))}

          <TYPE.body color={theme.text9} fontWeight={'normal'} fontSize={14}>
            {formattedNum(unlockedUSD.toString(), true)}
          </TYPE.body>
        </div>
        {Object.keys(info).length > 0 && (
          <div>
            <ButtonPrimary height="30px" onClick={onClaimAll}>
              <Trans>Claim All</Trans>
            </ButtonPrimary>
          </div>
        )}
      </Tag>
    </div>
  )
  return (
    <>
      <ExpandedContent>
        <TYPE.body color={theme.text11} fontWeight={600} fontSize={16} margin="0 0 10px 0">
          <Trans>TOTAL HARVESTED REWARDS</Trans>
          <InfoHelper
            text={t`Your total harvested rewards. Each time you harvest new rewards, they are locked and vested linearly over a short period (duration depends on the pool). Unlocked rewards can be claimed at any time with no deadline.`}
          />
        </TYPE.body>
        {above1400 ? (
          <AutoRow justify="space-between">
            {totalBlock}
            <Seperator />
            {lockedBlock}
            <Seperator />
            {claimedBlock}
            <Seperator />
            {unLockedBlock}
          </AutoRow>
        ) : (
          <>
            <div style={{ paddingBottom: '10px', borderBottom: '1px solid #404b51' }}>{totalBlock}</div>
            <AutoRow justify="space-between" style={{ margin: '10px 0' }}>
              {lockedBlock}
              <Seperator />
              {claimedBlock}
            </AutoRow>
            {unLockedBlock}
          </>
        )}

        <ExternalLink href="https://kyber.network/about/knc" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Flex justifyContent="flex-end" style={{ marginTop: '10px' }}>
            <Trans>What can KNC be used for? </Trans>
            <Tag
              style={{
                padding: '2px 4px',
                marginLeft: '10px',
                color: '#08a1e7',
                fontSize: '12px',
                borderRadius: '4px'
              }}
            >
              →
            </Tag>
          </Flex>
        </ExternalLink>
      </ExpandedContent>
      <ExpandedContent style={{ margin: '20px 0' }}>
        <VestSchedule style={{ padding: ' 0 0 20px 0', margin: '0 0 20px 0', borderBottom: '1px solid #404b51' }}>
          <AutoRow>
            <TYPE.body color={theme.text11} fontWeight={600} fontSize={16} margin="0 10px 0 0">
              <Trans>VESTING SCHEDULES</Trans>
              <InfoHelper
                text={t`Each time you harvest new rewards, a new vesting schedule (duration depends on the pool) is created. Multiple vesting schedules can run concurrently. Unlocked rewards can be claimed at any time with no deadline.`}
              />
            </TYPE.body>
          </AutoRow>
        </VestSchedule>
        {schedules.map(
          (s, index) =>
            !BigNumber.from(s[2])
              .sub(BigNumber.from(s[3]))
              .isZero() && <Schedule schedule={s} key={index} />
        )}

        {schedules.map(
          (s, index) =>
            BigNumber.from(s[2])
              .sub(BigNumber.from(s[3]))
              .isZero() && <Schedule schedule={s} key={index} />
        )}
      </ExpandedContent>
    </>
  )
}

const Schedule = ({ schedule }: { schedule: any }) => {
  const { account, chainId } = useActiveWeb3React()
  const above1400 = useMedia('(min-width: 1400px)') // Extra large screen
  const theme = useContext(ThemeContext)
  const kncPrice = useKNCPrice()
  const toUSD = useCallback(
    value => kncPrice && value && `$${(parseFloat(kncPrice) * parseFloat(fixedFormatting(value, 18))).toFixed(2)}`,
    [kncPrice]
  )
  const startTimestamp = useTimestampFromBlock(BigNumber.from(schedule[0]).toNumber())
  const endTimestamp =
    useTimestampFromBlock(BigNumber.from(schedule[1]).toNumber()) ||
    (chainId &&
      !!startTimestamp &&
      startTimestamp +
        BigNumber.from(schedule[1])
          .sub(BigNumber.from(schedule[0]))
          .mul(100 * AVERAGE_BLOCK_TIME_IN_SECSS[chainId])
          .div(100)
          .toNumber())
  const currentBlockNumber = useBlockNumber() || schedule[0]
  const endIn =
    chainId && currentBlockNumber && BigNumber.from(schedule[1]).toNumber() > currentBlockNumber
      ? BigNumber.from(schedule[1])
          .sub(currentBlockNumber)
          .mul(100 * AVERAGE_BLOCK_TIME_IN_SECSS[chainId])
          .div(100)
          .toNumber()
      : undefined
  const fullyVestedAlready = BigNumber.from(schedule[2])
    .sub(BigNumber.from(schedule[3]))
    .isZero()
  const vestedPercent = BigNumber.from(schedule[3])
    .mul(100)
    .div(BigNumber.from(schedule[2]))
    .toNumber()
  const isEnd = !BigNumber.from(currentBlockNumber)
    .sub(BigNumber.from(schedule[1]))
    .isNegative()
  const vestedAndVestablePercent = BigNumber.from(currentBlockNumber)
    .sub(BigNumber.from(schedule[1]))
    .isNegative()
    ? BigNumber.from(currentBlockNumber)
        .sub(BigNumber.from(schedule[0]))
        .mul(100)
        .div(BigNumber.from(schedule[1]).sub(BigNumber.from(schedule[0])))
    : 100
  let vestableAmount = isEnd
    ? BigNumber.from(schedule[2]).sub(BigNumber.from(schedule[3]))
    : BigNumber.from(schedule[2])
        .mul(BigNumber.from(currentBlockNumber).sub(BigNumber.from(schedule[0])))
        .div(BigNumber.from(schedule[1]).sub(BigNumber.from(schedule[0])))
        .sub(BigNumber.from(schedule[3]))
  vestableAmount = vestableAmount.isNegative() ? BigNumber.from(0) : vestableAmount

  const unvestableAmount = BigNumber.from(schedule[2])
    .mul(BigNumber.from(100).sub(vestedAndVestablePercent))
    .div(100)
  const [pendingTx, setPendingTx] = useState(false)
  const { vestAtIndex } = useVesting()
  const onVest = async () => {
    if (!chainId || !account) return
    setPendingTx(true)
    await vestAtIndex(schedule[4].address, [schedule[5]])
    setPendingTx(false)
  }
  const rewardBlock = (
    <AutoRow gap={'5px'} style={{ flex: '2' }}>
      <TYPE.body color={theme.text11} fontWeight={600} fontSize={16}>
        <Trans>
          Rewards: {fixedFormatting(BigNumber.from(schedule[2]), 18)} {getTokenSymbol(schedule[4], chainId)}
        </Trans>
      </TYPE.body>

      <TYPE.body color={theme.text9} fontWeight={'normal'} fontSize={14}>
        {toUSD(BigNumber.from(schedule[2]))}
      </TYPE.body>
      {vestedAndVestablePercent == 100 && !fullyVestedAlready && (
        <Tag tag={'active'} style={{ color: '#1f292e', fontSize: '14px', padding: '6px 20px' }}>
          <Trans>Fully Vested</Trans>
        </Tag>
      )}
    </AutoRow>
  )
  const claimBlock = !fullyVestedAlready && (
    <AutoRow gap={'5px'} style={{ flex: '1' }}>
      <Tag style={{ flex: '2', justifyContent: 'space-around' }}>
        <Trans>
          Unlocked: {fixedFormatting(vestableAmount, 18)} {getTokenSymbol(schedule[4], chainId)}
        </Trans>
      </Tag>

      <ButtonPrimary height="30px" onClick={onVest} style={{ flex: '1' }}>
        <Trans>Claim</Trans>
      </ButtonPrimary>
    </AutoRow>
  )
  const duration =
    chainId &&
    getFormattedTimeFromSecond(
      BigNumber.from(schedule[1])
        .sub(BigNumber.from(schedule[0]))
        .toNumber() * AVERAGE_BLOCK_TIME_IN_SECSS[chainId as ChainId]
    )
  return (
    <div style={{ padding: '20px 0 100px 0', borderBottom: '1px solid #404b51' }}>
      <TYPE.body color={theme.text11} fontWeight={600} fontSize={16} margin="0 0 20px 0">
        <Trans>Vesting started: {startTimestamp && new Date(startTimestamp * 1000).toLocaleDateString()}</Trans>
        <br />
        <Trans>Duration: {duration}</Trans>
      </TYPE.body>

      {above1400 ? (
        <AutoRow margin="0 0 20px 0" justify="space-between">
          {rewardBlock}
          {claimBlock}
        </AutoRow>
      ) : (
        <>
          {rewardBlock}
          <div style={{ margin: '20px 0' }}>{claimBlock}</div>
        </>
      )}

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
                top: '-35px'
              }}
            >
              <Trans>CLAIMED</Trans> <br />
              {fixedFormatting(BigNumber.from(schedule[3]), 18)}
            </TYPE.body>
            {/* <TYPE.body
              color={theme.text7}
              fontWeight={'normal'}
              fontSize={16}
              style={{
                position: 'absolute',
                top: '-20px'
              }}
            >
              {fixedFormatting(BigNumber.from(schedule[3]), 18)}
            </TYPE.body> */}

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
            {vestedPercent < 100 && above1400 && (
              <>
                {/* <TYPE.body
                  color={theme.text7}
                  fontWeight={'normal'}
                  fontSize={16}
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    left: `${vestedPercent < 10 ? '10' : vestedPercent > 80 ? '80' : vestedPercent}%`
                  }}
                >
                  {fixedFormatting(vestableAmount, 18)}
                </TYPE.body> */}
                <TYPE.body
                  color={theme.text7}
                  fontWeight={'normal'}
                  fontSize={14}
                  style={{
                    position: 'absolute',
                    top: '-35px',
                    left: `${vestedPercent < 10 ? '10' : vestedPercent > 80 ? '80' : vestedPercent}%`
                  }}
                >
                  <Trans>UNLOCKED</Trans> <br />
                  {fixedFormatting(vestableAmount, 18)}
                </TYPE.body>
              </>
            )}

            {vestedAndVestablePercent < 100 && (
              <>
                <TYPE.body
                  color={theme.text7}
                  fontWeight={'normal'}
                  fontSize={14}
                  style={{
                    position: 'absolute',
                    top: '13px',
                    padding: '5px 0 0 3px',
                    borderLeft: '1px dashed gray',
                    left: `${vestedAndVestablePercent}%`
                  }}
                >
                  {fixedFormatting(unvestableAmount, 18)} <Trans>LOCKED</Trans>
                </TYPE.body>

                {/* <TYPE.body
                  color={theme.text7}
                  fontWeight={'normal'}
                  fontSize={14}
                  style={{
                    position: 'absolute',
                    top: '-25px',
                    left: `${
                      vestedAndVestablePercent < 20
                        ? '20'
                        : vestedAndVestablePercent > 70
                        ? '70'
                        : vestedAndVestablePercent
                    }%`
                  }}
                >
                  LOCKED
                </TYPE.body> */}
              </>
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
              <Trans>FULL UNLOCK</Trans> <br />
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
