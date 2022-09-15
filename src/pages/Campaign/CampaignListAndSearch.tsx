import { Trans, t } from '@lingui/macro'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Text } from 'rebass'
import styled from 'styled-components'

import Search from 'components/Search'
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'
import { CampaignData } from 'state/campaigns/actions'

import CampaignItem from './CampaignItem'

export default function CampaignListAndSearch({
  onSelectCampaign,
}: {
  onSelectCampaign: (campaign: CampaignData) => void
}) {
  const [searchCampaign, setSearchCampaign] = useState('')
  const theme = useTheme()

  const { data: campaigns, selectedCampaign } = useSelector((state: AppState) => state.campaigns)

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
        {filteredCampaigns.map((campaign, index) => (
          <CampaignItem
            campaign={campaign}
            onSelectCampaign={onSelectCampaign}
            key={index}
            isSelected={Boolean(selectedCampaign && selectedCampaign.id === campaign.id)}
          />
        ))}
      </CampaignList>
    </CampaignListAndSearchContainer>
  )
}

const CampaignListAndSearchContainer = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.background};
  border-radius: 20px;
  padding: 24px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow: hidden;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    background: ${({ theme }) => theme.tableHeader};
    border-radius: 0;
  `}
`

const CampaignList = styled.div`
  flex: 1 1 0; // scroll
  overflow-y: auto;
  width: calc(100% + 40px);
  margin: 0 -20px;
  border-top: 1px solid ${({ theme }) => theme.border};
  ${({ theme }) => theme.mediaWidth.upToMedium`
   flex: 1;
  `}
  &::-webkit-scrollbar {
    display: block;
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.disableText};
  }
`
