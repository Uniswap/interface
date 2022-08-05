import { BigNumber } from '@ethersproject/bignumber'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React from 'react'
import { Text } from 'rebass'

import { OUTSIDE_FAIRLAUNCH_ADDRESSES } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useFairLaunchVersion } from 'hooks/useContract'
import useFairLaunch from 'hooks/useFairLaunch'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useBlockNumber } from 'state/application/hooks'
import { setAttemptingTxn, setShowConfirm, setTxHash, setYieldPoolsError } from 'state/farms/actions'
import { FairLaunchVersion, Farm } from 'state/farms/types'
import { useAppDispatch } from 'state/hooks'
import { ExternalLink } from 'theme'
import { useFarmRewards } from 'utils/dmm'
import { getFullDisplayBalance } from 'utils/formatBalance'
import { getFormattedTimeFromSecond } from 'utils/formatTime'

import HarvestAll from './HarvestAll'
import ListItem from './ListItem'
import { FairLaunchPoolsTitle, FairLaunchPoolsWrapper, ListItemWrapper } from './styleds'

interface FarmsListProps {
  fairLaunchAddress: string
  farms?: Farm[]
}

const FairLaunchPools = ({ fairLaunchAddress, farms }: FarmsListProps) => {
  const dispatch = useAppDispatch()
  const { chainId, account } = useActiveWeb3React()
  const theme = useTheme()
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
      dispatch(setYieldPoolsError(err as Error))
    }

    dispatch(setAttemptingTxn(false))
  }

  const currentTimestamp = Math.floor(Date.now() / 1000)

  const farmsList =
    fairLaunchVersion === FairLaunchVersion.V1
      ? (farms || []).map(farm => {
          // TODO: hard code for SIPHER. Need to be remove later
          const isSipherFarm =
            farm.fairLaunchAddress.toLowerCase() === '0xc0601973451d9369252Aee01397c0270CD2Ecd60'.toLowerCase() &&
            chainId === ChainId.MAINNET

          const isFarmStarted = farm && blockNumber && farm.startBlock < blockNumber
          const isFarmEnded = farm && blockNumber && farm.endBlock < blockNumber

          let remainingBlocks: number | false | undefined
          let estimatedRemainingSeconds: number | false | undefined
          let formattedEstimatedRemainingTime: string | false | 0 | undefined

          if (!isFarmStarted) {
            remainingBlocks = farm && blockNumber && farm.startBlock - blockNumber
            estimatedRemainingSeconds =
              remainingBlocks && remainingBlocks * NETWORKS_INFO[chainId || ChainId.MAINNET].averageBlockTimeInSeconds
            formattedEstimatedRemainingTime =
              estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)
          } else {
            remainingBlocks = farm && blockNumber && farm.endBlock - blockNumber
            estimatedRemainingSeconds =
              remainingBlocks && remainingBlocks * NETWORKS_INFO[chainId || ChainId.MAINNET].averageBlockTimeInSeconds
            formattedEstimatedRemainingTime =
              estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)
          }

          return {
            ...farm,
            time: `${
              isSipherFarm
                ? ''
                : isFarmEnded
                ? 'Ended'
                : (isFarmStarted ? '' : 'Starting in ') + formattedEstimatedRemainingTime
            }`,
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
          <FairLaunchPoolsTitle justify={outsideFarm ? 'space-between' : 'flex-end'}>
            {outsideFarm && (
              <Text fontSize={14} fontStyle="italic" color={theme.subText}>
                <Trans>
                  This pool require {outsideFarm.name} LP Tokens. Get the LP Tokens{' '}
                  <ExternalLink href={outsideFarm.getLPTokenLink}>here ↗</ExternalLink>{' '}
                </Trans>
              </Text>
            )}

            <HarvestAll totalRewards={totalRewards} onHarvestAll={handleHarvestAll} />
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
