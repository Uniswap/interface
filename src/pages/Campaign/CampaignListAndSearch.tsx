import React, { useState } from 'react'
import { Flex, Text } from 'rebass'
import { t, Trans } from '@lingui/macro'

import Search from 'components/Search'
import { CampaignData, CampaignStatus } from 'state/campaigns/actions'
import styled, { css } from 'styled-components'
import { darken, rgba } from 'polished'
import useTheme from 'hooks/useTheme'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { SelectedHighlight } from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import { NETWORKS_INFO } from 'constants/networks'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { BigNumber } from '@ethersproject/bignumber'
import BigNumberJS from 'bignumber.js'
import { formatNumberWithPrecisionRange } from 'utils'

export default function CampaignListAndSearch({
  onSelectCampaign,
}: {
  onSelectCampaign: (campaign: CampaignData) => void
}) {
  const [searchCampaign, setSearchCampaign] = useState('')
  const theme = useTheme()

  const campaigns = useSelector((state: AppState) => state.campaigns.data)
  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)

  const filteredCampaigns = campaigns.filter(item =>
    item.name.toLowerCase().includes(searchCampaign.trim().toLowerCase()),
  )

  return (
    <CampaignListAndSearchContainer>
      <Text fontSize="20px" lineHeight="24px" fontWeight={500}>
        <Trans>Campaigns</Trans>
      </Text>
      <Search
        searchValue={searchCampaign}
        onSearch={(newSearchCampaign: string) => setSearchCampaign(newSearchCampaign)}
        style={{ background: theme.buttonBlack, width: '100%' }}
        placeholder={t`Search for campaign`}
      />
      <CampaignList>
        {filteredCampaigns.map((campaign, index) => {
          const isSelected = selectedCampaign && selectedCampaign.id === campaign.id

          // Temporary use BigNumberJS for handling float of reward amount
          // Backward compatibility.
          const totalRewardAmountInWei: BigNumberJS = campaign.rewardDistribution.reduce((acc, value) => {
            const valueBn = new BigNumberJS(value.amount ?? 0)
            return acc.plus(valueBn)
          }, new BigNumberJS(0))
          const totalRewardAmount = totalRewardAmountInWei.div(
            BigNumber.from(10)
              .pow(18) // TODO nguyenhuudungz: Wait for backend refactoring.
              .toString(),
          )
          return (
            <CampaignItem key={index} onClick={() => onSelectCampaign(campaign)}>
              <Flex justifyContent="space-between" alignItems="center" style={{ gap: '12px' }}>
                <Text
                  fontWeight={500}
                  color={isSelected ? theme.primary : theme.text}
                  style={{ wordBreak: 'break-word' }}
                >
                  {campaign.name}
                </Text>
                <CampaignStatusText status={campaign.status}>{campaign.status}</CampaignStatusText>
              </Flex>
              <Flex justifyContent="space-between" alignItems="center" style={{ gap: '12px' }}>
                <Flex style={{ gap: '8px' }}>
                  {campaign &&
                    campaign.chainIds &&
                    campaign.chainIds
                      .split(',')
                      .map(chainId => (
                        <img
                          key={chainId}
                          src={NETWORKS_INFO[(chainId as any) as ChainId].icon}
                          alt="network_icon"
                          style={{ width: '16px', minWidth: '16px', height: '16px', minHeight: '16px' }}
                        />
                      ))}
                </Flex>
                {totalRewardAmount.gt(0) && (
                  <Text fontSize="14px">
                    {formatNumberWithPrecisionRange(totalRewardAmount.toNumber(), 0, 2)}{' '}
                    {campaign.rewardDistribution[0].tokenSymbol}
                  </Text>
                )}
              </Flex>
              {isSelected && <SelectedHighlight />}
            </CampaignItem>
          )
        })}
      </CampaignList>
    </CampaignListAndSearchContainer>
  )
}

const CampaignListAndSearchContainer = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  padding: 24px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
`

const CampaignList = styled.div`
  flex: 1;
  overflow-y: auto;
  width: calc(100% + 40px);
  margin: 0 -20px;
  border-top: 1px solid ${({ theme }) => theme.border};

  &::-webkit-scrollbar {
    display: block;
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.disableText};
  }
`

const CampaignItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  position: relative;

  &:hover {
    background: ${({ theme }) => darken(0.03, theme.background)} !important;
  }
`

const CampaignStatusText = styled.div<{ status: CampaignStatus }>`
  font-size: 12px;
  line-height: 10px;
  padding: 5px 8px;
  min-width: 76px;
  text-align: center;
  height: fit-content;
  border-radius: 24px;

  ${({ theme, status }) =>
    status === 'Upcoming' &&
    css`
      background: ${rgba(theme.warning, 0.2)};
      color: ${theme.warning};
    `}

  ${({ theme, status }) =>
    status === 'Ongoing' &&
    css`
      background: ${rgba(theme.primary, 0.2)};
      color: ${theme.primary};
    `}

  ${({ theme, status }) =>
    status === 'Ended' &&
    css`
      background: ${rgba(theme.red, 0.2)};
      color: ${theme.red};
    `}
`
