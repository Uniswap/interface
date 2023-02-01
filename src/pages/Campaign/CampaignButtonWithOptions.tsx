import { BigNumber } from '@ethersproject/bignumber'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import axios from 'axios'
import { useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as ChevronDown } from 'assets/svg/down.svg'
import { ButtonPrimary } from 'components/Button'
import { REWARD_SERVICE_API } from 'constants/env'
import { BIG_INT_ZERO, DEFAULT_SIGNIFICANT } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/useChangeNetwork'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { Dots } from 'pages/Pool/styleds'
import { OptionsContainer } from 'pages/TrueSight/styled'
import { AppState } from 'state'
import {
  CampaignData,
  CampaignLeaderboard,
  CampaignLeaderboardReward,
  setCampaignData,
  setSelectedCampaignLeaderboard,
} from 'state/campaigns/actions'
import { useSetClaimingCampaignRewardId, useSwapNowHandler } from 'state/campaigns/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { findTx } from 'utils'
import { sendEVMTransaction } from 'utils/sendTransaction'

type Size = 'small' | 'large'
export default function CampaignButtonWithOptions({
  campaign,
  leaderboard,
  disabled = false,
  type,
  addTemporaryClaimedRefs,
  size,
}: {
  campaign: CampaignData | undefined
  leaderboard?: CampaignLeaderboard
  disabled?: boolean
  type: 'swap_now' | 'claim_rewards'
  size: Size
  addTemporaryClaimedRefs?: (claimedRefs: string[]) => void
}) {
  const theme = useTheme()
  const [isShowNetworks, setIsShowNetworks] = useState(false)
  const changeNetwork = useChangeNetwork()
  const containerRef = useRef<HTMLButtonElement>(null)
  useOnClickOutside(containerRef, () => setIsShowNetworks(false))
  const { mixpanelHandler } = useMixpanel()

  const chainIds: ChainId[] = campaign
    ? campaign[type === 'swap_now' ? 'chainIds' : 'rewardChainIds'].split(',').map(Number)
    : []

  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()

  const leaderboardInfo = leaderboard || campaign?.leaderboard

  const refs: string[] = []
  if (leaderboardInfo && leaderboardInfo.rewards) {
    leaderboardInfo.rewards.forEach(reward => {
      if (!reward.claimed && reward.rewardAmount.greaterThan(BIG_INT_ZERO)) {
        refs.push(reward.ref)
      }
    })
  }

  const transactionsState = useSelector<AppState, AppState['transactions']>(state => state.transactions)
  const {
    selectedCampaign,
    data: campaignData,
    selectedCampaignLeaderboard,
  } = useSelector((state: AppState) => state.campaigns)
  const transactions = useMemo(
    () => (campaign ? transactionsState[parseInt(campaign.rewardChainIds)] ?? {} : {}),
    [transactionsState, campaign],
  )
  const [claimingCampaignRewardId, setClaimingCampaignRewardId] = useSetClaimingCampaignRewardId()
  const [ref2Hash, setRef2Hash] = useState<{ [ref: string]: string }>({})
  const claimRewardHashes = refs.map(ref => ref2Hash[ref]).filter(hash => !!hash)
  const isClaimingThisCampaignRewards =
    claimRewardHashes.some(hash => {
      return transactions[hash] !== undefined && findTx(transactions, hash)?.receipt === undefined
    }) || campaign?.id === claimingCampaignRewardId

  const dispatch = useDispatch()

  const updateCampaignStore = () => {
    const rewards: CampaignLeaderboardReward[] = leaderboardInfo?.rewards?.map(rw => ({ ...rw, claimed: true })) ?? []

    // update selected leaderboard of campaign
    if (campaign?.id === selectedCampaign?.id && selectedCampaignLeaderboard) {
      const newLeaderboard = { ...selectedCampaignLeaderboard, rewards }
      dispatch(
        setSelectedCampaignLeaderboard({
          leaderboard: newLeaderboard,
        }),
      )
    }

    // update leaderboard of list campaign
    const campaigns = campaignData?.map((el: CampaignData) => {
      if (el.id === campaign?.id && el.leaderboard) return { ...el, leaderboard: { ...el.leaderboard, rewards } }
      return el
    })
    dispatch(setCampaignData({ campaigns }))
  }

  const addTransactionWithType = useTransactionAdder()

  const claimRewards = async (claimChainId: ChainId) => {
    if (!account || !library || !campaign || !leaderboardInfo) return
    setClaimingCampaignRewardId(campaign.id)
    const url = REWARD_SERVICE_API + '/rewards/claim'

    const data = {
      wallet: account.toLowerCase(),
      chainId: campaign.rewardChainIds,
      clientCode: 'campaign',
      // ref: refs.join(','),
      ref: '',
    }
    let response: any
    try {
      response = await axios({ method: 'POST', url, data })
    } catch (err) {
      console.error(err)
      setClaimingCampaignRewardId(null)
    }

    if (response?.data?.code === 200000) {
      const rewardContractAddress = response.data.data.ContractAddress
      const encodedData = response.data.data.EncodedData
      try {
        await sendEVMTransaction(
          account,
          library,
          rewardContractAddress,
          encodedData,
          BigNumber.from(0),
          async transactionResponse => {
            const accumulatedUnclaimedRewards = leaderboardInfo?.rewards
              .filter(reward => !reward.claimed)
              .reduce((acc: { [p: string]: CampaignLeaderboardReward }, value) => {
                const key = value.token.chainId + '_' + value.token.address
                if (acc[key] === undefined) {
                  acc[key] = value
                } else {
                  acc[key] = {
                    ...value,
                    rewardAmount: value.rewardAmount.add(acc[key].rewardAmount),
                  }
                }
                return acc
              }, {})
            const rewardString = Object.values(accumulatedUnclaimedRewards ?? {})
              .map(reward => reward.rewardAmount.toSignificant(DEFAULT_SIGNIFICANT) + ' ' + reward.token.symbol)
              .join(' ' + t`and` + ' ')
            addTransactionWithType({
              hash: transactionResponse.hash,
              type: TRANSACTION_TYPE.CLAIM_REWARD,
              desiredChainId: claimChainId,
              extraInfo: {
                summary: `${rewardString} from campaign "${campaign?.name}"`,
                contract: rewardContractAddress,
              },
            })
            const newRef2Hash = refs
              .filter(ref => !!ref)
              .reduce((acc, ref) => ({ ...acc, [ref]: transactionResponse.hash }), {})
            setRef2Hash(prev => ({ ...prev, ...newRef2Hash }))
            const transactionReceipt = await transactionResponse.wait()
            if (transactionReceipt.status === 1) {
              addTemporaryClaimedRefs && addTemporaryClaimedRefs(refs)
              updateCampaignStore()
            }
          },
        )
      } catch (err) {
        console.error(err)
        setClaimingCampaignRewardId(null)
      }
    }
  }

  const handleSwapNow = useSwapNowHandler()

  return (
    <StyledPrimaryButton
      size={size}
      onClick={e => {
        e.stopPropagation()
        setIsShowNetworks(prev => !prev)
      }}
      disabled={disabled || isClaimingThisCampaignRewards}
      ref={containerRef}
    >
      {type === 'swap_now' ? t`Swap now` : isClaimingThisCampaignRewards ? t`Claiming Rewards` : t`Claim Rewards`}
      {isClaimingThisCampaignRewards && <Dots />}
      <ChevronDown style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)' }} />
      {isShowNetworks && (
        <OptionsContainer>
          {chainIds.map(chainId => {
            return (
              <Flex
                key={chainId}
                alignItems="center"
                onClick={async () => {
                  if (type === 'swap_now') {
                    handleSwapNow(chainId)
                  } else {
                    mixpanelHandler(MIXPANEL_TYPE.CAMPAIGN_CLAIM_REWARDS_CLICKED, { campaign_name: campaign?.name })
                    await changeNetwork(chainId, () => claimRewards(chainId))
                  }
                }}
              >
                <img src={NETWORKS_INFO[chainId].icon} alt="Network" style={{ minWidth: '16px', width: '16px' }} />
                <Text marginLeft="8px" color={theme.subText} fontSize="12px" fontWeight={500} minWidth="fit-content">
                  {type === 'swap_now'
                    ? t`Swap on ${NETWORKS_INFO[chainId].name}`
                    : t`Claim on ${NETWORKS_INFO[chainId].name}`}
                </Text>
              </Flex>
            )
          })}
        </OptionsContainer>
      )}
    </StyledPrimaryButton>
  )
}

export const StyledPrimaryButton = styled(ButtonPrimary)<{ size: Size }>`
  position: relative;
  font-size: 14px;
  padding: 12px 48px;
  min-width: fit-content;
  height: ${({ size }) => (size === 'large' ? '44px' : '35px')};
  font-weight: 500;
  color: ${({ theme }) => theme.textReverse};
  border: none;
  z-index: unset;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    ${css`
      flex: 1;
    `}
  `};
`
