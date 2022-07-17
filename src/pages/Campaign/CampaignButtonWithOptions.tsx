import React, { useRef, useState } from 'react'
import { CampaignData, CampaignLeaderboard } from 'state/campaigns/actions'
import { Trans } from '@lingui/macro'
import { ChevronDown } from 'react-feather'
import styled, { css } from 'styled-components'
import { Button } from 'theme'
import useTheme from 'hooks/useTheme'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { OptionsContainer } from 'pages/TrueSight/styled'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { NETWORKS_INFO } from 'constants/networks'
import { Flex, Text } from 'rebass'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useActiveWeb3React } from 'hooks'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionResponse } from '@ethersproject/providers'
import useSendTransactionCallback from 'hooks/useSendTransactionCallback'
import axios from 'axios'
import { BigNumber } from '@ethersproject/bignumber'
import { useActiveNetwork } from 'hooks/useActiveNetwork'

export default function CampaignButtonWithOptions({
  campaign,
  disabled = false,
  type,
}: {
  campaign: CampaignData | undefined
  disabled?: boolean
  type: 'enter_now' | 'claim_rewards'
}) {
  const theme = useTheme()
  const [isShowNetworks, setIsShowNetworks] = useState(false)
  const { changeNetwork } = useActiveNetwork()
  const containerRef = useRef<HTMLButtonElement>(null)
  useOnClickOutside(containerRef, () => setIsShowNetworks(false))
  const { mixpanelHandler } = useMixpanel()

  const chainIds: ChainId[] = campaign
    ? campaign[type === 'enter_now' ? 'chainIds' : 'rewardChainIds'].split(',').map(item => +item)
    : []

  const { account, library } = useActiveWeb3React()

  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)
  const selectedCampaignLeaderboard = useSelector((state: AppState) => state.campaigns.selectedCampaignLeaderboard)

  const addTransactionWithType = useTransactionAdder()
  const onClaimRewardSuccess = (
    response: TransactionResponse,
    campaignName: string,
    campaignLeaderboard: CampaignLeaderboard,
  ) => {
    // TODO nguyenhuudungz: Compile a list of unclaimed rewards from `campaignLeaderboard`.
    addTransactionWithType(response, {
      type: 'Claim',
      summary: `rewards from campaign "${campaignName}"`,
    })
    return response.hash
  }

  const sendTransaction = useSendTransactionCallback()
  const claimRewards = async () => {
    if (!account || !library || !selectedCampaign || !selectedCampaignLeaderboard) return

    const url = process.env.REACT_APP_REWARD_SERVICE_API + '/rewards/claim'

    const refs: string[] = []
    if (selectedCampaignLeaderboard && selectedCampaignLeaderboard.rewards) {
      selectedCampaignLeaderboard.rewards.forEach(reward => {
        if (!reward.claimed && reward.rewardAmount > 0) {
          refs.push(reward.ref)
        }
      })
    }
    const data = {
      wallet: account.toLowerCase(),
      chainId: selectedCampaign.rewardChainIds,
      clientCode: 'campaign',
      ref: refs.join(','),
    }
    const response = await axios({
      method: 'POST',
      url,
      data,
    })
    if (response.data.code === 200000) {
      const rewardContractAddress = response.data.data.ContractAddress
      const encodedData = response.data.data.EncodedData
      console.log(`rewardContractAddress`, rewardContractAddress)
      console.log(`encodedData`, encodedData)
      try {
        await sendTransaction(rewardContractAddress, encodedData, BigNumber.from(0), transactionResponse => {
          return onClaimRewardSuccess(transactionResponse, selectedCampaign.name, selectedCampaignLeaderboard)
        })
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <StyledCampaignButtonWithOptions
      style={{
        padding: '12px 58px',
        minWidth: 'fit-content',
        height: 'fit-content',
        lineHeight: '20px',
        fontWeight: 500,
        color: theme.textReverse,
      }}
      onClick={e => {
        e.stopPropagation()
        setIsShowNetworks(prev => !prev)
      }}
      disabled={disabled}
      ref={containerRef}
    >
      <Trans>{type === 'enter_now' ? 'Enter now' : 'Claim Rewards'}</Trans>
      <ChevronDown
        size="20px"
        style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)' }}
      />
      {isShowNetworks && (
        <OptionsContainer style={{ margin: '0 12px', width: 'calc(100% - 24px)' }}>
          {chainIds.map(chainId => {
            return (
              <Flex
                key={chainId}
                alignItems="center"
                onClick={async () => {
                  if (type === 'enter_now') {
                    mixpanelHandler(MIXPANEL_TYPE.CAMPAIGN_ENTER_NOW_CLICKED, { campaign_name: campaign?.name })
                    window.open(campaign?.enterNowUrl + '?networkId=' + chainId)
                  } else {
                    await changeNetwork(chainId, claimRewards)
                  }
                }}
              >
                <img src={NETWORKS_INFO[chainId].icon} alt="Network" style={{ minWidth: '16px', width: '16px' }} />
                <Text marginLeft="4px" color={theme.subText} fontSize="12px" fontWeight={500} minWidth="fit-content">
                  <Trans>
                    {type === 'enter_now' ? 'Swap' : 'Claim'} on {NETWORKS_INFO[chainId].name}
                  </Trans>
                </Text>
              </Flex>
            )
          })}
        </OptionsContainer>
      )}
    </StyledCampaignButtonWithOptions>
  )
}

const StyledCampaignButtonWithOptions = styled(Button)`
  position: relative;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    ${css`
      flex: 1;
    `}
  `}
`
