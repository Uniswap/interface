import { BigNumber } from '@ethersproject/bignumber'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import InfoHelper from 'components/InfoHelper'
import Row, { RowBetween, RowFit } from 'components/Row'
import ShareModal from 'components/ShareModal'
import { AMP_HINT, OUTSIDE_FAIRLAUNCH_ADDRESSES } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useFairLaunchVersion } from 'hooks/useContract'
import useFairLaunch from 'hooks/useFairLaunch'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useBlockNumber, useModalOpen, useOpenModal } from 'state/application/hooks'
import { setAttemptingTxn, setShowConfirm, setTxHash, setYieldPoolsError } from 'state/farms/classic/actions'
import { FairLaunchVersion, Farm } from 'state/farms/classic/types'
import { useAppDispatch } from 'state/hooks'
import { useViewMode } from 'state/user/hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { useFarmRewards } from 'utils/dmm'
import { getFullDisplayBalance } from 'utils/formatBalance'
import { getFormattedTimeFromSecond } from 'utils/formatTime'

import HarvestAll from './HarvestAll'
import ListItem from './ListItem'
import {
  ClassicFarmGridWrapper,
  ClassicFarmWrapper,
  ClickableText,
  ExpandableWrapper,
  ListItemWrapper,
  TableHeader,
  ToggleButtonWrapper,
} from './styleds'

interface FarmsListProps {
  fairLaunchAddress: string
  farms?: Farm[]
  active?: boolean
}

const ToggleButton = ({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => {
  return (
    <ToggleButtonWrapper onClick={onClick}>
      <DropdownSVG style={{ rotate: isOpen ? '180deg' : 'none' }} />
    </ToggleButtonWrapper>
  )
}

const FairLaunchPools = ({ fairLaunchAddress, farms, active }: FarmsListProps) => {
  const dispatch = useAppDispatch()
  const [viewMode] = useViewMode()
  const above1200 = useMedia(`(min-width:${MEDIA_WIDTHS.upToLarge}px)`)
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const { chainId, account, isEVM, networkInfo } = useActiveWeb3React()
  const networkRoute = networkInfo.route || undefined
  const theme = useTheme()
  const blockNumber = useBlockNumber()
  const totalRewards = useFarmRewards(farms)
  const fairLaunchVersion = useFairLaunchVersion(fairLaunchAddress)
  const { harvestMultiplePools } = useFairLaunch(fairLaunchAddress)
  const { mixpanelHandler } = useMixpanel()

  const [sharedPoolAddress, setSharedPoolAddress] = useState('')
  const [expanded, setExpanded] = useState(true)

  const openShareModal = useOpenModal(ApplicationModal.SHARE)
  const isShareModalOpen = useModalOpen(ApplicationModal.SHARE)

  useEffect(() => {
    if (sharedPoolAddress) {
      openShareModal()
    }
  }, [openShareModal, sharedPoolAddress])

  useEffect(() => {
    setSharedPoolAddress(addr => {
      if (!isShareModalOpen) {
        return ''
      }

      return addr
    })
  }, [isShareModalOpen, setSharedPoolAddress])

  if (!isEVM) return <Navigate to="/" />
  const shareUrl = sharedPoolAddress
    ? window.location.origin + `/farms/${networkRoute}?search=` + sharedPoolAddress + '&tab=classic'
    : undefined

  const handleHarvestAll = async () => {
    if (!account) {
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

      const txHash = await harvestMultiplePools(
        poolsHaveReward.map(farm => farm.pid),
        totalRewards,
      )
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

          if (!isFarmStarted) {
            remainingBlocks = farm && blockNumber && farm.startBlock - blockNumber
          } else {
            remainingBlocks = farm && blockNumber && farm.endBlock - blockNumber
          }
          const estimatedRemainingSeconds =
            remainingBlocks && remainingBlocks * (networkInfo as EVMNetworkInfo).averageBlockTimeInSeconds
          const formattedEstimatedRemainingTime =
            estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)

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

  const ConditionListWrapper = viewMode === VIEW_MODE.LIST && above1200 ? ListItemWrapper : ClassicFarmGridWrapper

  return (
    <ClassicFarmWrapper>
      {!!displayFarms.length && (
        <>
          <RowBetween gap="16px">
            <RowFit style={{ whiteSpace: 'nowrap' }}>
              <Text fontSize={16} lineHeight="20px" color={theme.subText}>
                <Trans>Farming Contract</Trans>
              </Text>
              {outsideFarm && (
                <Text fontSize={14} fontStyle="italic" color={theme.subText}>
                  <Trans>
                    This pool require {outsideFarm.name} LP Tokens. Get the LP Tokens{' '}
                    <ExternalLink href={outsideFarm.getLPTokenLink}>here ↗</ExternalLink>{' '}
                  </Trans>
                </Text>
              )}
            </RowFit>
            {above768 && (
              <Row justify="flex-end">
                <HarvestAll totalRewards={totalRewards} onHarvestAll={handleHarvestAll} />
              </Row>
            )}
            <RowFit flex="0 0 36px">
              <ToggleButton isOpen={expanded} onClick={() => setExpanded(prev => !prev)} />
            </RowFit>
          </RowBetween>
          {!above768 && (
            <Row justify="flex-end">
              <HarvestAll totalRewards={totalRewards} onHarvestAll={handleHarvestAll} />
            </Row>
          )}
          <ExpandableWrapper expanded={expanded}>
            <ConditionListWrapper>
              {viewMode === VIEW_MODE.LIST && above1200 && (
                <TableHeader>
                  <Row>
                    <ClickableText>
                      <Trans>Pools | AMP</Trans>
                    </ClickableText>
                    <InfoHelper text={AMP_HINT} />
                  </Row>
                  <Row>
                    <ClickableText>
                      <Trans>Staked TVL</Trans>
                    </ClickableText>
                  </Row>
                  <Row>
                    <ClickableText>
                      <Trans>AVG APR</Trans>
                    </ClickableText>
                    <InfoHelper
                      text={
                        active
                          ? t`Total estimated return based on yearly fees and bonus rewards of the pool`
                          : t`Estimated return based on yearly fees of the pool`
                      }
                    />
                  </Row>
                  <Row>
                    <ClickableText>
                      <Trans>Ending in</Trans>
                    </ClickableText>
                    <InfoHelper
                      text={t`After harvesting, your rewards will unlock linearly over the indicated time period`}
                    />
                  </Row>
                  <Row>
                    <ClickableText>
                      <Trans>My Deposit | Target Volume</Trans>
                    </ClickableText>
                  </Row>
                  <Row justify="flex-end">
                    <ClickableText>
                      <Trans>My Rewards</Trans>
                    </ClickableText>
                  </Row>
                  <Row justify="flex-end">
                    <ClickableText>
                      <Trans>Actions</Trans>
                    </ClickableText>
                  </Row>
                </TableHeader>
              )}
              {displayFarms.map(farm => {
                return (
                  <ListItem
                    key={`${farm.fairLaunchAddress}_${farm.stakeToken}`}
                    farm={farm}
                    setSharedPoolAddress={setSharedPoolAddress}
                  />
                )
              })}
            </ConditionListWrapper>
          </ExpandableWrapper>
        </>
      )}

      <ShareModal title={t`Share this farm with your friends!`} url={shareUrl} />
    </ClassicFarmWrapper>
  )
}

export default FairLaunchPools
