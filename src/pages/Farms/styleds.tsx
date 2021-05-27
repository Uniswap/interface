import styled from 'styled-components'
import { Switch } from '@rebass/forms'

import { ButtonEmpty } from 'components/Button'

export const PageWrapper = styled.div`
  padding: 0 17em;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 0 12rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0 4em;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0;
  `};
`

export const KNCPriceContainer = styled.div`
  position: absolute;
  top: 14px;
  left: 28px;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.bg13};
  padding: 4px 10px 4px 8px;
  font-size: 14px;
  font-weight: normal;
`

export const KNCPriceWrapper = styled.div`
  display: flex;
  align-items: center;
`

export const TabContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 1.5rem;
`

export const Tab = styled(ButtonEmpty)<{ isActive: boolean }>`
  width: fit-content;
  margin-right: 2rem;
  padding: 0 0 0 8px;
  color: ${({ theme }) => theme.text1};
  border-radius: 0;
  border-left: ${({ theme, isActive }) => (isActive ? `2px solid ${theme.primary1}` : 'none')};

  &:hover {
    text-decoration: none;
  }

  &:focus {
    text-decoration: none;
  }
`

export const StakedOnlyToggleWrapper = styled.div`
  display: flex;
  align-items: center;
`

export const StakedOnlyToggle = styled(Switch)`
  transform: scale(0.7);
  color: ${({ theme }) => theme.bg14};
`

export const StakedOnlyToggleText = styled.div`
  margin-left: 10px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text7};
`

export const AdContainer = styled.div`
  margin-bottom: 28px;
`

export const HeadingContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 3fr;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bg15};
  padding: 28px 32px;
  margin-bottom: 20px;
`

export const LearnMoreContainer = styled.div`
  padding-right: 56px;
  border-right: 1px solid #404b51;
`

export const LearnMoreInstruction = styled.div`
  margin-bottom: 10px;
`

export const LearnMoreLinkContainer = styled.div`
  font-size: 14px;
  font-weight: bold;
`

export const HarvestAllContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding-left: 36px;
`

export const TotalRewardsContainer = styled.div`
  margin-right: 16px;
`

export const TotalRewardsTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.text11};
  margin-bottom: 4px;
`

export const RewardNumber = styled.span`
  font-size: 24px;
  font-weight: 500;
  color: ${({ theme }) => theme.text11};
  margin-right: 12px;
`

export const RewardUSD = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.text11};
`

export const RemainingTimeContainer = styled.div`
  display: flex;
  font-size: 16px;
  margin-bottom: 20px;
`

export const EndInTitle = styled.div`
  margin-right: 12px;
  font-size: 16px;
  font-weight: 500;
`
