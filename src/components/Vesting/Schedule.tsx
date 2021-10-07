import React, { useCallback, useMemo } from 'react'
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
import { useBlockNumber } from 'state/application/hooks'
import { useRewardTokenPrices } from 'state/farms/hooks'
import { setAttemptingTxn, setShowConfirm, setTxHash, setVestingError } from 'state/vesting/actions'
import { TYPE } from 'theme'
import { getTokenSymbol } from 'utils'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { fixedFormatting } from 'utils/formatBalance'
import { Tag, ScheduleWrapper } from './styleds'
import { Flex, Text } from 'rebass'

const Schedule = ({ rewardLockerAddress, schedule }: { rewardLockerAddress: string; schedule: any }) => {
  const dispatch = useAppDispatch()
  const { account, chainId } = useActiveWeb3React()
  const above768 = useMedia('(min-width: 768px)') // Extra large screen
  const above1400 = useMedia('(min-width: 1400px)') // Extra large screen
  const theme = useTheme()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rewardTokens = useMemo(() => [schedule[4]], [JSON.stringify(schedule)])
  const tokenPrices = useRewardTokenPrices(rewardTokens)
  const { vestAtIndex } = useVesting(rewardLockerAddress)

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

  const toUSD: (value: BigNumber) => string = useCallback(
    value =>
      tokenPrices[0] && value ? `$${(tokenPrices[0] * parseFloat(fixedFormatting(value, 18))).toFixed(2)}` : '',
    [tokenPrices]
  )

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
    <Flex alignItems="center" style={{ gap: '8px' }} flexWrap="wrap">
      <TYPE.body color={theme.text11} fontWeight={400} fontSize={16}>
        <Trans>
          Rewards: {fixedFormatting(BigNumber.from(schedule[2]), 18)} {getTokenSymbol(schedule[4], chainId)}
        </Trans>
      </TYPE.body>

      <TYPE.body color={theme.text9} fontWeight={'normal'} fontSize={14}>
        {toUSD(BigNumber.from(schedule[2]))}
      </TYPE.body>

      {vestedAndVestablePercent === 100 && !fullyVestedAlready && (
        <Tag
          style={{
            color: '#1f292e',
            fontSize: '14px',
            padding: '6px 18px',
            borderRadius: '999px',
            backgroundColor: '#2FC99E'
          }}
        >
          <Trans>Fully Vested</Trans>
        </Tag>
      )}
    </Flex>
  )

  const claimBlock = !fullyVestedAlready && (
    <Flex
      height="fit-content"
      width="fit-content"
      alignItems="center"
      marginTop="10px"
      backgroundColor={theme.bg12}
      style={{ borderRadius: '4px' }}
    >
      <Tag>
        <Trans>
          Unlocked: {fixedFormatting(vestableAmount, 18)} {getTokenSymbol(schedule[4], chainId)}
        </Trans>
      </Tag>

      <ButtonPrimary height="30px" onClick={onVest} style={{ flex: '1' }}>
        <Trans>Claim</Trans>
      </ButtonPrimary>
    </Flex>
  )

  const duration =
    chainId &&
    getFormattedTimeFromSecond(
      BigNumber.from(schedule[1])
        .sub(BigNumber.from(schedule[0]))
        .toNumber() * AVERAGE_BLOCK_TIME_IN_SECS[chainId as ChainId]
    )

  return (
    <ScheduleWrapper>
      <Flex
        justifyContent="space-between"
        alignItems={above768 ? 'flex-end' : 'flex-start'}
        flexDirection={above768 ? 'row' : 'column'}
      >
        <div>
          <TYPE.body color={theme.text11} fontWeight={400} fontSize={16} style={{ marginBottom: '10px' }}>
            <Trans>Vesting started: {startTimestamp && new Date(startTimestamp * 1000).toLocaleDateString()}</Trans>
          </TYPE.body>
          <TYPE.body color={theme.text11} fontWeight={400} fontSize={16} style={{ marginBottom: '10px' }}>
            <Trans>Duration: {duration}</Trans>
          </TYPE.body>
          {rewardBlock}
        </div>

        {claimBlock}
      </Flex>

      <div
        style={{
          position: 'relative',
          margin: '60px 0 0 0'
        }}
      >
        <AutoRow>
          <AutoRow style={{ position: 'relative' }}>
            {/* vested */}
            <TYPE.body
              color={theme.text7}
              fontWeight={'normal'}
              fontSize={12}
              style={{
                position: 'absolute',
                top: '-35px'
              }}
            >
              <Trans>CLAIMED</Trans> <br />
              <Text color={theme.text1} fontWeight={600} as="span">
                {fixedFormatting(BigNumber.from(schedule[3]), 18)}
              </Text>
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
                  fontSize={12}
                  style={{
                    position: 'absolute',
                    top: '-35px',
                    left: `${vestedPercent < 10 ? '10' : vestedPercent > 80 ? '80' : vestedPercent}%`
                  }}
                >
                  <Trans>UNLOCKED</Trans> <br />
                  <Text color={theme.text1} fontWeight={600} as="span">
                    {fixedFormatting(vestableAmount, 18)}
                  </Text>
                </TYPE.body>
              </>
            )}

            {vestedAndVestablePercent < 100 && (
              <>
                <TYPE.body
                  color={theme.text7}
                  fontWeight={'normal'}
                  fontSize={12}
                  style={{
                    position: 'absolute',
                    top: '13px',
                    padding: '5px 0 0 3px',
                    borderLeft: '1px dashed gray',
                    left: `${vestedAndVestablePercent}%`
                  }}
                >
                  <Text color={theme.text1} fontWeight={600} as="span">
                    {fixedFormatting(unvestableAmount, 18)}
                  </Text>{' '}
                  <Trans>LOCKED</Trans>
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
              fontSize={12}
              style={{
                textAlign: 'end',
                position: 'absolute',
                top: '-35px',
                right: '0'
              }}
            >
              <Text fontSize={14}>
                <Trans>FULL UNLOCK</Trans>
              </Text>
              <span style={{ marginRight: '4px' }}>
                {endTimestamp && `${new Date(endTimestamp * 1000).toLocaleDateString()}`}
              </span>
              <span>{!!endIn ? `(${getFormattedTimeFromSecond(endIn)} left)` : ''}</span>
            </TYPE.body>
            <div style={{ height: '12px', width: '100%', zIndex: 1, background: '#33444d', borderRadius: '999px' }} />
          </AutoRow>
        </AutoRow>
      </div>
    </ScheduleWrapper>
  )
}

export default Schedule
