import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { Switch } from '@rebass/forms'

import { ButtonEmpty } from 'components/Button'

export const PageWrapper = styled.div`
  padding: 12px 16px 100px;
  width: 100%;

  @media only screen and (min-width: 768px) {
    padding: 16px 16px 100px;
  }

  @media only screen and (min-width: 1000px) {
    padding: 16px 32px 100px;
  }

  @media only screen and (min-width: 1366px) {
    padding: 16px 215px 50px;
  }

  @media only screen and (min-width: 1440px) {
    padding: 16px 252px 50px;
  }
`

export const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`

export const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 1rem;

  @media only screen and (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`

export const TabWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  @media only screen and (min-width: 768px) {
    margin-bottom: 0;
  }
`

export const Tab = styled(ButtonEmpty)<{ isActive: boolean }>`
  width: fit-content;
  margin-right: 2rem;
  padding: 0 0 4px 0;
  color: ${({ theme }) => theme.text1};
  border-radius: 0;
  border-bottom: ${({ theme, isActive }) => (isActive ? `2px solid ${theme.primary1}` : 'none')};

  &:hover {
    text-decoration: none;
  }

  &:focus {
    text-decoration: none;
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    margin-right: 12px;
  `}
`

export const PoolTitleContainer = styled.div`
  display: flex;
  align-items: center;
`

export const UpcomingPoolsWrapper = styled.div`
  position: relative;
  padding: 8px 16px 8px 0;
`

export const NewText = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  font-size: 10px;
  font-weight: 500;
  color: #ff537b;
`

export const StakedOnlyToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`

export const StakedOnlyToggle = styled(Switch)`
  transform: scale(0.7);
  color: ${({ theme }) => theme.bg14};
  cursor: pointer;
`

export const StakedOnlyToggleText = styled.div`
  margin-left: 10px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text7};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    margin-left: 4px;
  `}
`

export const AdContainer = styled.div`
  margin-bottom: 28px;
`

export const HeadingContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 20px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column-reverse;
    gap: 0;
  `}
`
export const HeadingRight = styled.div`
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bg16};
  padding: 24px;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);

  ${({ theme }) => theme.mediaWidth.upToMedium`
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
    box-shadow: none;
    padding-bottom: 0;

    :after {
      content: "";
      display: block;
      border-bottom: 1px solid #404b51;
    }
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding-bottom: 0;
  `}
`

export const HeadingLeft = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bg16};
  padding: 24px;
  gap: 16px;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);

  ${({ theme }) => theme.mediaWidth.upToMedium`
    border-top-left-radius: 0px;
    border-top-right-radius: 0px;
    box-shadow: none;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 0;
    display: flex;
    flex-direction: column;
  `}
`

export const LearnMoreContainer = styled.div`
  padding-right: 24px;
  border-right: 1px solid #404b51;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-row: 2;
    padding-bottom: 24px;
    padding-right: 0;
    border-bottom: 1px solid #404b51;
    border-right: none;
  `}
`

export const UpcomingFarmsContainer = styled.div`
  padding-left: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding-top: 24px;
    padding-left: 0;
  `}
`
export const LearnMoreInstruction = styled.div`
  margin-bottom: 20px;
`

export const LearnMoreLinkContainer = styled.div`
  font-size: 14px;
  font-weight: bold;
`

export const HarvestAllContainer = styled.div`
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-bottom: 24px;
  `}
`

export const TotalRewardsContainer = styled.div`
  margin-right: 32px;
`

export const TotalRewardsTitleWrapper = styled.div`
  display: flex;
  margin-bottom: 12px;
`

export const TotalRewardsTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.text11};
`

export const HarvestAllButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: flex-start;
  `}
`

export const HarvestAllInstruction = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: fit-content;
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  font-weight: 500;
  color: ${({ theme }) => theme.text7};
  background-color: ${({ theme }) => theme.bg12};
  padding: 20px;
  border-radius: 8px;
`

export const RewardNumberContainer = styled.div`
  font-size: 24px;
  font-weight: 500;
  color: ${({ theme }) => theme.text11};
  margin-right: 12px;
`

export const RewardToken = styled.span`
  @media (min-width: 1200px) {
    display: block;
    margin-bottom: 4px;
  }
`

export const Plus = styled.span`
  margin: 0 4px;

  @media (min-width: 1200px) {
    display: none;
  }
`

export const TotalRewardUSD = styled.span`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`

export const HistoryButton = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.subText};
  padding: 10px 14px;
  border-radius: 4px;
  margin-left: auto;
  cursor: pointer;
  white-space: nowrap;

  img {
    vertical-align: bottom;
    margin-right: 8px;
  }
`

export const FairLaunchPoolsWrapper = styled.div`
  background-color: ${({ theme }) => theme.background};
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
  :last-child {
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
  `};
`

export const FairLaunchPoolsTitle = styled.div<{ backgroundColor: string }>`
  padding: 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: ${({ backgroundColor }) => backgroundColor};
`

export const ListItemWrapper = styled.div`
  padding: 0 24px 24px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px;
  `};
`

export const HarvestAllSection = styled.div<{ expanded?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: fit-content;
`

export const TableHeader = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 3rem;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr 0.25fr;
  grid-template-areas: 'pools liq end apy reward staked_balance expand';
  padding: 18px 0 18px 24px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.tableHeader};
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-gap: 1rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-gap: 1.5rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-gap: 1.5rem;
  `};
`

export const ClickableText = styled(Text)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
  user-select: none;
  text-transform: uppercase;
`

export const MenuFlyout = styled.span`
  min-width: 15rem;
  background-color: ${({ theme }) => theme.background};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.2));
  border-radius: 5px;
  padding: 19px 32px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  position: absolute;
  top: 2.5rem !important;
  left: 0 !important;
  z-index: 10000;
`

export const Tag = styled.div<{ tag?: string }>`
  display: flex;
  position: relative;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 14px;
  color: ${({ tag }) => (tag === 'active' ? '#1f292e' : 'inherit')};
  background-color: ${({ theme, tag }) => (tag === 'active' ? '#4aff8c' : theme.bg11)};
  box-sizing: border-box;
  @media screen and (max-width: 500px) {
    box-shadow: none;
  }
`

export const TableRow = styled.div<{ fade?: boolean; isExpanded?: boolean }>`
  display: grid;
  grid-gap: 3rem;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr 0.25fr;
  grid-template-areas: 'pools liq end apy reward staked_balance expand';
  padding: 15px 0 13px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.background};
  border: 1px solid transparent;
  border-bottom: 1px solid ${({ theme, isExpanded }) => (isExpanded ? 'transparent' : theme.advancedBorder)};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-gap: 1rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-gap: 1.5rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-gap: 1.5rem;
  `};

  &:hover {
    cursor: pointer;
  }
`

export const ExpandedSection = styled.div`
  background: ${({ theme }) => theme.tableHeader};
  border-radius: 8px;
`

export const ExpandedContent = styled.div`
  border-radius: 8px;
  background-color: ${({ theme }) => theme.tableHeader};
  font-size: 14px;
  font-weight: 500;
  padding: 16px 24px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    margin-bottom: 1rem;
  `};
`

export const StakeGroup = styled.div`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 3fr 3fr 2fr;
  grid-template-areas: 'stake unstake harvest';
  margin-bottom: 8px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr;
    grid-template-areas: 'stake';
    grid-gap: 1rem;
  `};
`

export const BalanceInfo = styled.div`
  display: flex;
  justify-content: space-between;
`

export const GreyText = styled.div`
  color: ${({ theme }) => theme.primaryText2};
  margin-bottom: 8px;
`

export const LPInfoContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 12px;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  `};
`
export const GetLP = styled.span`
  font-size: 14px;
  font-weight: 600;
`

export const StyledItemCard = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-column-gap: 4px;
  border: ${({ theme }) => `1px solid ${theme.border3}`};
  border-radius: 8px;
  margin-bottom: 24px;
  padding: 8px 20px 4px 20px;
  background-color: ${({ theme }) => theme.background};
  box-shadow: 0px 0px 8px 2px rgba(0, 0, 0, 0.06);
`

export const RewardBalanceWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
`

export const PoolRewardUSD = styled.div`
  color: ${({ theme }) => theme.primaryText2};
`

export const DataText = styled(Flex)<{ align?: string }>`
  color: ${({ theme }) => theme.text};
  justify-content: ${({ align }) => (align === 'right' ? 'flex-end' : 'flex-start')};
  font-weight: 500;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    font-size: 14px;
  `}
`

export const APY = styled(DataText)`
  color: ${({ theme }) => theme.text12};
`

export const GridItem = styled.div<{ noBorder?: boolean }>`
  position: relative;
  margin-top: 8px;
  margin-bottom: 8px;
  border-bottom: ${({ theme, noBorder }) => (noBorder ? 'none' : `1px dashed ${theme.border}`)};
  padding-bottom: 12px;
`

export const DataTitle = styled.div`
  display: flex;
  align-items: flex-start;
  color: ${({ theme }) => theme.subText};
  &:hover {
    opacity: 0.6;
  }
  user-select: none;
  text-transform: uppercase;
  margin-bottom: 4px;
  font-size: 12px;
`

export const Seperator = styled.div`
  border: 1px solid ${({ theme }) => theme.bg14};
`

export const TotalRewardsDetailWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
`
