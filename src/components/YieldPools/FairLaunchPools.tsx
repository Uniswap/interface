import React from 'react'
import { BigNumber } from '@ethersproject/bignumber'

import { ChainId } from '@dynamic-amm/sdk'
import { AVERAGE_BLOCK_TIME_IN_SECS, OUTSITE_FAIRLAUNCH_ADDRESSES } from 'constants/index'
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
import { Text } from 'rebass'
import { Trans } from '@lingui/macro'
import { ExternalLink } from 'theme'

interface FarmsListProps {
  fairLaunchAddress: string
  farms?: Farm[]
}

const FairLaunchPools = ({ fairLaunchAddress, farms }: FarmsListProps) => {
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
      time: `${isFarmEnded ? 'Ended' : (isFarmStarted ? '' : 'Starting in ') + formattedEstimatedRemainingTime}`
    }
  })

  const displayFarms = farmsList.sort((a, b) => b.endBlock - a.endBlock)

  const outsiteFarm = OUTSITE_FAIRLAUNCH_ADDRESSES[fairLaunchAddress]

  return (
    <FairLaunchPoolsWrapper>
      {!!displayFarms.length && (
        <>
          <FairLaunchPoolsTitle backgroundColor={isDarkMode ? `${theme.bg12}40` : `${theme.bg12}80`}>
            <Text fontSize={14} fontStyle="italic" color={theme.subText}>
              {outsiteFarm && (
                <Trans>
                  This pool require {outsiteFarm.name} LP Tokens. Get the LP Tokens{' '}
                  <ExternalLink href={outsiteFarm.getLPTokenLink}>here ↗</ExternalLink>{' '}
                </Trans>
              )}
            </Text>

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
