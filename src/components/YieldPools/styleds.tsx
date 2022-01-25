import styled, { css } from 'styled-components'
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

export const Divider = styled.div`
  width: 1px;
  height: 20px;
  background: ${({ theme }) => theme.border};
  margin-right: 1.5rem;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-right: 12px;
  `}
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
  margin-right: 1.5rem;
  font-weight: 400;
  padding: 0;
  padding-bottom: 4px;
  color: ${({ theme, isActive }) => (isActive ? theme.text : theme.subText)};
  border-radius: 0;
  border-bottom: ${({ theme, isActive }) => (isActive ? `2px solid ${theme.primary}` : 'none')};

  &:hover {
    text-decoration: none;
  }

  &:focus {
    text-decoration: none;
  }

  &:last-child {
    margin-right: 0;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-right: 12px;
  `}
`

export const PoolTitleContainer = styled.div`
  display: flex;
  align-items: center;
`

export const UpcomingPoolsWrapper = styled.div`
  position: relative;
  margin-right: 4px;
`

export const NewText = styled.div`
  position: absolute;
  top: -10px;
  right: -12px;
  font-size: 10px;
  font-weight: 500;
  color: #ff537b;
`

export const StakedOnlyToggleWrapper = styled.div`
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-top: 20px;
  `}
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
  margin-bottom: 1.75rem;
  border-radius: 0.5rem;
  position: relative;
`

export const LearnMoreBtn = styled.a`
  outline: none;
  border: none;
  text-decoration: none;
  background-color: #244641;
  color: ${({ theme }) => theme.primary};
  position: absolute;
  bottom: 0.25rem;
  right: 0;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-top-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;

  :hover {
    text-decoration: underline;
  }
`

export const HeadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 0;
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-start;
  `}
`
export const HeadingRight = styled.div`
  display: flex;
  gap: 20px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: flex;
    flex-direction: column-reverse;
    gap: 0;
  `}
`
export const TotalRewardsContainer = styled.div<{ disabled?: boolean }>`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  border-radius: 4px;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  background-color: ${({ theme }) => theme.apr};
  color: ${({ theme }) => theme.textReverse};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    justify-content: space-between
  `};

  ${({ disabled }) =>
    disabled &&
    css`
      background-color: ${({ theme }) => theme.buttonGray};
      color: ${({ theme }) => theme.disableText};
      cursor: not-allowed;
    `};
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

export const HistoryButton = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.subText};
  padding: 10px 14px;
  border-radius: 4px;
  margin-left: auto;
  cursor: pointer;
  white-space: nowrap;

  svg {
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
  justify-content: space-between;
  align-items: center;
  background-color: ${({ backgroundColor }) => backgroundColor};
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
  align-items: flex-end;
  `}
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
  grid-gap: 1rem;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr 0.25fr;
  grid-template-areas: 'pools liq end apy reward staked_balance expand';
  padding: 18px 24px;
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
  min-width: 14rem;
  background-color: ${({ theme }) => theme.background};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.2));
  border-radius: 5px;
  padding: 12px 16px;
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
  grid-gap: 1rem;
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
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-areas: 'stake unstake harvest';
  margin-bottom: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
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
  color: ${({ theme }) => theme.subText};
`

export const LPInfoContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-top: 1rem;
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
  color: ${({ theme }) => theme.primary};
`

export const StyledItemCard = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-column-gap: 4px;
  border: ${({ theme }) => `1px solid ${theme.border}`};
  border-radius: 8px;
  margin-bottom: 24px;
  padding: 8px 20px 4px 20px;
  background-color: ${({ theme }) => theme.background};
  box-shadow: 0px 0px 8px 2px rgba(0, 0, 0, 0.06);
`

export const RewardBalanceWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  justify-content: space-around;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.background};
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
  color: ${({ theme }) => theme.apr};
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
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

export const SearchContainer = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 4px;
  width: 320px;
  font-size: 12px;
  display: flex;
  align-items: center;
  padding: 10px 12px;
  gap: 8px;

  > svg {
    cursor: pointer;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 100%;
    margin-top: 20px;
  `}
`

export const SearchInput = styled.input`
  outline: none;
  border: none;
  flex: 1;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.background};

  :placeholder {
    color: ${({ theme }) => theme.disableText};
  }
`
