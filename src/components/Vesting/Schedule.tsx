import React, { useCallback } from 'react'
import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'
import { BigNumber } from '@ethersproject/bignumber'

import { ChainId } from 'libs/sdk/src'
import { AVERAGE_BLOCK_TIME_IN_SECS } from 'constants/index'
import { ButtonPrimary } from 'components/Button'
import { AutoRow } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useTimestampFromBlock } from 'hooks/useTimestampFromBlock'
import useVesting from 'hooks/useVesting'
import useTheme from 'hooks/useTheme'
import { useAppDispatch } from 'state/hooks'
import { useBlockNumber, useKNCPrice } from 'state/application/hooks'
import { setAttemptingTxn, setShowConfirm, setTxHash, setVestingError } from 'state/vesting/actions'
import { TYPE } from 'theme'
import { getTokenSymbol } from 'utils'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { fixedFormatting } from 'utils/formatBalance'
import { Tag } from './styleds'

const Schedule = ({ rewardLockerAddress, schedule }: { rewardLockerAddress: string; schedule: any }) => {
  const dispatch = useAppDispatch()
  const { account, chainId } = useActiveWeb3React()
  const above1400 = useMedia('(min-width: 1400px)') // Extra large screen
  const theme = useTheme()
  const kncPrice = useKNCPrice()
  const { vestAtIndex } = useVesting(rewardLockerAddress)
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
          .mul(100 * AVERAGE_BLOCK_TIME_IN_SECS[chainId])
          .div(100)
          .toNumber())
  const currentBlockNumber = useBlockNumber() || schedule[0]
  const endIn =
    chainId && currentBlockNumber && BigNumber.from(schedule[1]).toNumber() > currentBlockNumber
      ? BigNumber.from(schedule[1])
          .sub(currentBlockNumber)
          .mul(100 * AVERAGE_BLOCK_TIME_IN_SECS[chainId])
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

  const onVest = async () => {
    if (!chainId || !account) {
      return
    }

    dispatch(setShowConfirm(true))
    dispatch(setAttemptingTxn(true))
    dispatch(setTxHash(''))

    try {
      const txHash = await vestAtIndex(schedule[4].address, [schedule[5]])
      dispatch(setTxHash(txHash))
    } catch (err) {
      console.error(err)
      dispatch(setVestingError((err as Error).message))
    }

    dispatch(setAttemptingTxn(false))
  }

  const rewardBlock = (
    <AutoRow gap={'5px'} style={{ flex: '2' }}>
      <TYPE.body color={theme.text11} fontWeight={400} fontSize={16}>
        <Trans>
          Rewards: {fixedFormatting(BigNumber.from(schedule[2]), 18)} {getTokenSymbol(schedule[4], chainId)}
        </Trans>
      </TYPE.body>

      <TYPE.body color={theme.text9} fontWeight={'normal'} fontSize={14}>
        {toUSD(BigNumber.from(schedule[2]))}
      </TYPE.body>
      {vestedAndVestablePercent === 100 && !fullyVestedAlready && (
        <Tag tag={'active'} style={{ color: '#1f292e', fontSize: '14px', padding: '6px 20px' }}>
          <Trans>Fully Vested</Trans>
        </Tag>
      )}
    </AutoRow>
  )

  const claimBlock = !fullyVestedAlready && (
    <AutoRow justify="center" style={{ flex: '1' }}>
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
        .toNumber() * AVERAGE_BLOCK_TIME_IN_SECS[chainId as ChainId]
    )

  return (
    <div style={{ padding: '20px 0 40px 0', borderTop: '1px solid #404b51' }}>
      <TYPE.body color={theme.text11} fontWeight={400} fontSize={16} style={{ marginBottom: '10px' }}>
        <Trans>Vesting started: {startTimestamp && new Date(startTimestamp * 1000).toLocaleDateString()}</Trans>
      </TYPE.body>
      <TYPE.body color={theme.text11} fontWeight={400} fontSize={16} style={{ marginBottom: '10px' }}>
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
          <div style={{ margin: '10px 0 20px 0' }}>{claimBlock}</div>
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
              <span style={{ marginRight: '4px' }}>
                {endTimestamp && `${new Date(endTimestamp * 1000).toLocaleDateString()}`}
              </span>
              <span>{!!endIn ? `(${getFormattedTimeFromSecond(endIn)} left)` : ''}</span>
            </TYPE.body>
            <div style={{ height: '12px', width: '100%', zIndex: 1, background: '#33444d', borderRadius: '26px' }} />
          </AutoRow>
        </AutoRow>
      </div>
    </div>
  )
}

export default Schedule
