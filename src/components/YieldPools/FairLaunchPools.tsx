import React, { useState } from 'react'
import { Flex } from 'rebass'
import { useMedia } from 'react-use'
import { t, Trans } from '@lingui/macro'
import { BigNumber } from '@ethersproject/bignumber'

import { ChainId } from 'libs/sdk/src'
import { AVERAGE_BLOCK_TIME_IN_SECS } from 'constants/index'
import InfoHelper from 'components/InfoHelper'
import { ButtonDropdown } from 'components/Button'
import { AutoRow, RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useFairLaunch from 'hooks/useFairLaunch'
import { useAppDispatch } from 'state/hooks'
import { useBlockNumber } from 'state/application/hooks'
import { Farm } from 'state/farms/types'
import { setAttemptingTxn, setShowConfirm, setTxHash, setYieldPoolsError } from 'state/farms/actions'
import { ExternalLink } from 'theme'
import { getEtherscanLink, shortenAddress } from 'utils'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { useFarmRewards } from 'utils/dmm'
import ListItem from './ListItem'
import HarvestAll from './HarvestAll'
import { FairLaunchPoolsWrapper, FairLaunchPoolsTitle, HarvestAllSection, TableHeader, ClickableText } from './styleds'

interface FarmsListProps {
  fairLaunchAddress: string
  farms?: Farm[]
  stakedOnly?: boolean
}

const FairLaunchPools = ({ fairLaunchAddress, farms, stakedOnly }: FarmsListProps) => {
  const dispatch = useAppDispatch()
  const { chainId, account } = useActiveWeb3React()
  const [expanded, setExpanded] = useState<boolean>(true)
  const above768 = useMedia('(min-width: 768px)')
  const above1000 = useMedia('(min-width: 1000px)')
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

  const stakedOnlyFarms = farmsList.filter(
    farm => farm.userData?.stakedBalance && BigNumber.from(farm.userData.stakedBalance).gt(0)
  )

  const renderHeader = () => {
    return above1000 ? (
      <TableHeader>
        <Flex grid-area="pools" alignItems="center" justifyContent="flex-start">
          <ClickableText>
            <Trans>Pools | AMP</Trans>
          </ClickableText>
          <InfoHelper
            text={t`AMP = Amplification factor. Amplified pools have higher capital efficiency. Higher AMP, higher capital efficiency and amplified liquidity within a price range.`}
          />
        </Flex>

        <Flex grid-area="liq" alignItems="center" justifyContent="flex-center">
          <ClickableText>
            <Trans>Staked TVL</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="end" alignItems="right" justifyContent="flex-end">
          <ClickableText>
            <Trans>Ending In</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="apy" alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>APY</Trans>
          </ClickableText>
          <InfoHelper text={t`Estimated total annualized yield from fees + rewards`} />
        </Flex>

        <Flex grid-area="reward" alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>My Rewards</Trans>
          </ClickableText>
        </Flex>

        <Flex grid-area="staked_balance" alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>My Deposit</Trans>
          </ClickableText>
        </Flex>
      </TableHeader>
    ) : null
  }

  return (
    <FairLaunchPoolsWrapper expanded={expanded}>
      <FairLaunchPoolsTitle>
        {above768 ? (
          <>
            <span>
              Contract:{' '}
              <ExternalLink href={getEtherscanLink(chainId as ChainId, fairLaunchAddress, 'address')}>
                {shortenAddress(fairLaunchAddress)}
              </ExternalLink>
            </span>
            <HarvestAllSection>
              <HarvestAll totalRewards={totalRewards} onHarvestAll={handleHarvestAll} />
              <ButtonDropdown
                expanded={expanded}
                marginLeft="8px"
                padding="9px"
                width="fit-content"
                onClick={() => setExpanded(!expanded)}
              />
            </HarvestAllSection>
          </>
        ) : (
          <>
            <RowBetween marginBottom="1rem">
              <span>
                Contract:{' '}
                <ExternalLink href={getEtherscanLink(chainId as ChainId, fairLaunchAddress, 'address')}>
                  {shortenAddress(fairLaunchAddress)}
                </ExternalLink>
              </span>
              <ButtonDropdown
                expanded={expanded}
                marginLeft="8px"
                padding="9px"
                width="fit-content"
                onClick={() => setExpanded(!expanded)}
              />
            </RowBetween>
            <AutoRow justify="flex-end">
              <HarvestAll totalRewards={totalRewards} onHarvestAll={handleHarvestAll} />
            </AutoRow>
          </>
        )}
      </FairLaunchPoolsTitle>

      {expanded && (farms || []).length > 0 && (
        <>
          {renderHeader()}
          {(farms ? (stakedOnly ? stakedOnlyFarms : farmsList) : []).map((farm, index) => {
            if (farm) {
              return (
                <ListItem
                  key={`${farm.fairLaunchAddress}_${farm.stakeToken}`}
                  farm={farm}
                  oddRow={(index + 1) % 2 !== 0}
                />
              )
            }

            return null
          })}
        </>
      )}
    </FairLaunchPoolsWrapper>
  )
}

export default FairLaunchPools
