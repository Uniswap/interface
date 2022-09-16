import { ChainId, Fraction } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { rgba } from 'polished'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import ProgressBar from 'components/ProgressBar'
import { DEFAULT_SIGNIFICANT, RESERVE_USD_DECIMALS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { CampaignData, CampaignStatus, CampaignUserInfoStatus } from 'state/campaigns/actions'
import { useIsDarkMode } from 'state/user/hooks'

import CampaignActions from './CampaignActions'

const CampaignItemWrapper = styled.div<{ selected?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  :last-child {
    border-bottom: none;
  }
  position: relative;
  background: ${({ theme, selected }) => (selected ? rgba(theme.bg8, 0.12) : 'transparent')};

  ${({ theme, selected }) =>
    selected &&
    css`
      &:hover {
        background: darken(0.01, ${theme.background});
      }
    `}
`

const CampaignStatusText = styled.div<{ status: CampaignStatus }>`
  font-size: 12px;
  line-height: 10px;
  padding: 5px 8px;
  text-align: center;
  height: fit-content;
  border-radius: 24px;
  white-space: nowrap;

  ${({ theme, status }) => {
    const color = {
      [CampaignStatus.UPCOMING]: theme.warning,
      [CampaignStatus.ONGOING]: theme.primary,
      [CampaignStatus.ENDED]: theme.red,
    }[status]
    return css`
      background: ${rgba(color, 0.2)};
      color: ${color};
    `
  }}
`

const Container = styled.div`
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  display: flex;
`

export default function CampaignItem({
  campaign,
  onSelectCampaign,
  isSelected,
}: {
  isSelected: boolean
  campaign: CampaignData
  onSelectCampaign: (data: CampaignData) => void
}) {
  const { account } = useWeb3React()
  const theme = useTheme()
  const isDarkMode = useIsDarkMode()
  const isRewardInUSD = campaign.rewardDistribution[0]?.rewardInUSD
  let totalRewardAmount: Fraction = new Fraction(0)
  const {
    tradingNumberRequired,
    tradingVolumeRequired,
    userInfo: { tradingNumber, tradingVolume } = { tradingNumber: 0, tradingVolume: 0 },
  } = campaign

  try {
    totalRewardAmount = campaign.rewardDistribution.reduce((acc, value) => {
      return acc.add(
        new Fraction(
          parseUnits(value.amount || '0', RESERVE_USD_DECIMALS).toString(),
          isRewardInUSD
            ? JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS))
            : JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt((value?.token?.decimals ?? 18) + RESERVE_USD_DECIMALS)),
        ),
      )
    }, new Fraction(0))
  } catch (error) {}

  const isOngoing = campaign.status === CampaignStatus.ONGOING
  const rCampaignName = campaign.name
  const rCampaignStatus = campaign.status === CampaignStatus.UPCOMING ? t`Upcoming` : isOngoing ? t`Ongoing` : t`Ended`
  const rChainIdImages = campaign?.chainIds?.split?.(',').map(chainId => {
    const { iconDark, icon, name } = NETWORKS_INFO[chainId as unknown as ChainId]
    return (
      <img
        key={chainId}
        src={isDarkMode && iconDark ? iconDark : icon}
        alt={name + ' icon'}
        style={{ width: '16px', minWidth: '16px', height: '16px', minHeight: '16px' }}
      />
    )
  })
  const totalRewardAmountString = totalRewardAmount.toSignificant(DEFAULT_SIGNIFICANT, { groupSeparator: ',' })
  const tokenSymbol = campaign.rewardDistribution[0]?.token?.symbol
  const rCampaignReward = isRewardInUSD
    ? t`$${totalRewardAmountString} in ${tokenSymbol}`
    : `${totalRewardAmountString} ${tokenSymbol}`

  const isShowProgressBar = isOngoing && account && campaign?.userInfo?.status === CampaignUserInfoStatus.Eligible
  const percentVolume = !tradingVolumeRequired ? 0 : (tradingVolume / tradingVolumeRequired) * 100
  const percentTradingNumber = !tradingNumberRequired ? 0 : (tradingNumber / tradingNumberRequired) * 100

  return (
    <CampaignItemWrapper onClick={() => onSelectCampaign(campaign)} selected={isSelected}>
      <Container>
        <Flex style={{ gap: '8px' }}>{rChainIdImages}</Flex>
        <CampaignStatusText status={campaign.status}>{rCampaignStatus}</CampaignStatusText>
      </Container>

      <Container>
        <Text fontWeight={500} color={theme.text} style={{ wordBreak: 'break-word' }}>
          {rCampaignName}
        </Text>
      </Container>

      <Container>
        <Text fontSize="12px">
          <Trans>Total Reward: {rCampaignReward}</Trans>
        </Text>
      </Container>

      {isShowProgressBar && (
        <Flex style={{ gap: 10 }} flexDirection="column">
          {tradingVolumeRequired > 0 && (
            <ProgressBar
              title={t`Your Trading Volume`}
              percent={percentVolume}
              value={`${tradingVolume}/${tradingVolumeRequired}`}
              valueTextColor={theme.primary}
              color={percentVolume >= 100 ? theme.primary : theme.warning}
            />
          )}
          {tradingNumberRequired > 1 && (
            <ProgressBar
              title={t`Your Number of Trade`}
              percent={percentTradingNumber}
              value={`${tradingNumber}/${tradingNumberRequired}`}
              valueTextColor={theme.primary}
              color={percentTradingNumber >= 100 ? theme.primary : theme.warning}
            />
          )}
        </Flex>
      )}

      {!isShowProgressBar && (
        <div>
          <CampaignActions campaign={campaign} leaderboard={campaign.leaderboard} size="small" hideWhenDisabled />
        </div>
      )}
    </CampaignItemWrapper>
  )
}
