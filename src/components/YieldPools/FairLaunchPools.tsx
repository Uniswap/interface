import React from 'react'
import { BigNumber } from '@ethersproject/bignumber'

import { ChainId } from 'libs/sdk/src'
import { AVERAGE_BLOCK_TIME_IN_SECS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useFairLaunch from 'hooks/useFairLaunch'
import { useAppDispatch } from 'state/hooks'
import { useBlockNumber } from 'state/application/hooks'
import { Farm } from 'state/farms/types'
import { setAttemptingTxn, setShowConfirm, setTxHash, setYieldPoolsError } from 'state/farms/actions'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { useFarmRewards } from 'utils/dmm'
import ListItem from './ListItem'
import HarvestAll from './HarvestAll'
import { FairLaunchPoolsWrapper, FairLaunchPoolsTitle, HarvestAllSection, ListItemWrapper } from './styleds'
import useTheme from 'hooks/useTheme'
import { useIsDarkMode } from 'state/user/hooks'

interface FarmsListProps {
  fairLaunchAddress: string
  farms?: Farm[]
  stakedOnly?: boolean
}

const FairLaunchPools = ({ fairLaunchAddress, farms, stakedOnly }: FarmsListProps) => {
  const dispatch = useAppDispatch()
  const { chainId, account } = useActiveWeb3React()
  const theme = useTheme()
  const isDarkMode = useIsDarkMode()
  const blockNumber = useBlockNumber()
  const totalRewards = useFarmRewards(farms)
  const { harvestMultiplePools } = useFairLaunch(fairLaunchAddress)

  const handleHarvestAll = async () => {
    if (!chainId || !account) {
      return
    }

    dispatch(setShowConfirm(true))
    dispatch(setAttemptingTxn(true))
    dispatch(setTxHash(''))

    try {
      const poolsHaveReward = (farms || []).filter(farm => {
        if (!farm.userData?.rewards) {
          return false
        }

        const hasReward = farm.userData?.rewards?.some(value => BigNumber.from(value).gt(0))

        return hasReward
      })

      const txHash = await harvestMultiplePools(poolsHaveReward.map(farm => farm.pid))
      dispatch(setTxHash(txHash))
    } catch (err) {
      console.error(err)
      dispatch(setYieldPoolsError((err as Error).message))
    }

    dispatch(setAttemptingTxn(false))
  }

  const farmsList = (farms || []).map(farm => {
    const isFarmStarted = farm && blockNumber && farm.startBlock < blockNumber
    const isFarmEnded = farm && blockNumber && farm.endBlock < blockNumber

    let remainingBlocks: number | false | undefined
    let estimatedRemainingSeconds: number | false | undefined
    let formattedEstimatedRemainingTime: string | false | 0 | undefined

    if (!isFarmStarted) {
      remainingBlocks = farm && blockNumber && farm.startBlock - blockNumber
      estimatedRemainingSeconds = remainingBlocks && remainingBlocks * AVERAGE_BLOCK_TIME_IN_SECS[chainId as ChainId]
      formattedEstimatedRemainingTime =
        estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)
    } else {
      remainingBlocks = farm && blockNumber && farm.endBlock - blockNumber
      estimatedRemainingSeconds = remainingBlocks && remainingBlocks * AVERAGE_BLOCK_TIME_IN_SECS[chainId as ChainId]
      formattedEstimatedRemainingTime =
        estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)
    }
    return {
      ...farm,
      time: `${isFarmEnded ? 'Ended' : (isFarmStarted ? '' : 'Start in ') + formattedEstimatedRemainingTime}`
    }
  })

  const displayFarms = farmsList.filter(farm =>
    Boolean(stakedOnly ? farm.userData?.stakedBalance && BigNumber.from(farm.userData.stakedBalance).gt(0) : farm)
  )

  return (
    <FairLaunchPoolsWrapper>
      {!!displayFarms.length && (
        <>
          <FairLaunchPoolsTitle backgroundColor={isDarkMode ? `${theme.bg12}40` : `${theme.bg12}80`}>
            <HarvestAllSection>
              <HarvestAll totalRewards={totalRewards} onHarvestAll={handleHarvestAll} />
            </HarvestAllSection>
          </FairLaunchPoolsTitle>

          <ListItemWrapper>
            {displayFarms.map((farm, index) => {
              return (
                <ListItem
                  key={`${farm.fairLaunchAddress}_${farm.stakeToken}`}
                  farm={farm}
                  oddRow={(index + 1) % 2 !== 0}
                />
              )
            })}
          </ListItemWrapper>
        </>
      )}
    </FairLaunchPoolsWrapper>
  )
}

export default FairLaunchPools
