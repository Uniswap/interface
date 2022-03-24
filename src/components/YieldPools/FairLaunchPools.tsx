import React from 'react'
import { BigNumber } from '@ethersproject/bignumber'

import { ChainId } from '@dynamic-amm/sdk'
import { AVERAGE_BLOCK_TIME_IN_SECS, OUTSIDE_FAIRLAUNCH_ADDRESSES } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useFairLaunch from 'hooks/useFairLaunch'
import { useAppDispatch } from 'state/hooks'
import { useBlockNumber } from 'state/application/hooks'
import { FairLaunchVersion, Farm } from 'state/farms/types'
import { setAttemptingTxn, setShowConfirm, setTxHash, setYieldPoolsError } from 'state/farms/actions'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { useFarmRewards } from 'utils/dmm'
import ListItem from './ListItem'
import HarvestAll from './HarvestAll'
import { FairLaunchPoolsWrapper, FairLaunchPoolsTitle, HarvestAllSection, ListItemWrapper } from './styleds'
import useTheme from 'hooks/useTheme'
import { useIsDarkMode } from 'state/user/hooks'
import { useFairLaunchVersion } from 'hooks/useContract'
import { Text } from 'rebass'
import { Trans } from '@lingui/macro'
import { ExternalLink } from 'theme'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { getFullDisplayBalance } from 'utils/formatBalance'

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
  const fairLaunchVersion = useFairLaunchVersion(fairLaunchAddress)
  const { harvestMultiplePools } = useFairLaunch(fairLaunchAddress)
  const { mixpanelHandler } = useMixpanel()

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
      if (txHash) {
        mixpanelHandler(MIXPANEL_TYPE.ALL_REWARDS_HARVESTED, {
          reward_tokens_and_amounts:
            totalRewards &&
            Object.assign(
              {},
              ...totalRewards.map(reward => {
                if (reward?.token?.symbol)
                  return { [reward.token.symbol]: getFullDisplayBalance(reward.amount, reward.token.decimals) }
                return {}
              }),
            ),
        })
      }
      dispatch(setTxHash(txHash))
    } catch (err) {
      console.error(err)
      dispatch(setYieldPoolsError((err as Error).message))
    }

    dispatch(setAttemptingTxn(false))
  }

  const currentTimestamp = Math.floor(Date.now() / 1000)

  const farmsList =
    fairLaunchVersion === FairLaunchVersion.V1
      ? (farms || []).map(farm => {
          const isFarmStarted = farm && blockNumber && farm.startBlock < blockNumber
          const isFarmEnded = farm && blockNumber && farm.endBlock < blockNumber

          let remainingBlocks: number | false | undefined
          let estimatedRemainingSeconds: number | false | undefined
          let formattedEstimatedRemainingTime: string | false | 0 | undefined

          if (!isFarmStarted) {
            remainingBlocks = farm && blockNumber && farm.startBlock - blockNumber
            estimatedRemainingSeconds =
              remainingBlocks && remainingBlocks * AVERAGE_BLOCK_TIME_IN_SECS[chainId as ChainId]
            formattedEstimatedRemainingTime =
              estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)
          } else {
            remainingBlocks = farm && blockNumber && farm.endBlock - blockNumber
            estimatedRemainingSeconds =
              remainingBlocks && remainingBlocks * AVERAGE_BLOCK_TIME_IN_SECS[chainId as ChainId]
            formattedEstimatedRemainingTime =
              estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)
          }

          return {
            ...farm,
            time: `${isFarmEnded ? 'Ended' : (isFarmStarted ? '' : 'Starting in ') + formattedEstimatedRemainingTime}`,
          }
        })
      : (farms || []).map(farm => {
          const isFarmStarted = farm && currentTimestamp && farm.startTime < currentTimestamp
          const isFarmEnded = farm && currentTimestamp && farm.endTime < currentTimestamp

          let formattedEstimatedRemainingTime: string

          if (!isFarmStarted) {
            formattedEstimatedRemainingTime = getFormattedTimeFromSecond(farm.startTime - currentTimestamp)
          } else {
            formattedEstimatedRemainingTime = getFormattedTimeFromSecond(farm.endTime - currentTimestamp)
          }

          return {
            ...farm,
            time: `${isFarmEnded ? 'Ended' : (isFarmStarted ? '' : 'Starting in ') + formattedEstimatedRemainingTime}`,
          }
        })

  const displayFarms = farmsList.sort((a, b) => b.endBlock - a.endBlock)

  const outsideFarm = OUTSIDE_FAIRLAUNCH_ADDRESSES[fairLaunchAddress]

  return (
    <FairLaunchPoolsWrapper>
      {!!displayFarms.length && (
        <>
          <FairLaunchPoolsTitle backgroundColor={isDarkMode ? `${theme.bg12}40` : `${theme.bg12}80`}>
            <Text fontSize={14} fontStyle="italic" color={theme.subText}>
              {outsideFarm && (
                <Trans>
                  This pool require {outsideFarm.name} LP Tokens. Get the LP Tokens{' '}
                  <ExternalLink href={outsideFarm.getLPTokenLink}>here ↗</ExternalLink>{' '}
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
