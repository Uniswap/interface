import styled from 'styled-components'

export const VestingHeader = styled.div`
  border-radius: 10px;
  background-color: ${({ theme }) => theme.bg6};
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
  font-size: 14px;
  font-weight: 500;
  padding: 16px 24px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    margin-bottom: 1rem;
  `};
`

export const VestPeriods = styled.div`
  margin-top: 1.5rem;
  background: ${({ theme }) => theme.bg6};
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
  padding: 1.5rem;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
`

export const MenuFlyout = styled.span`
  min-width: 15rem;
  background-color: ${({ theme }) => theme.background};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.2));
  border-radius: 5px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  position: absolute;
  top: 2.5rem !important;
  left: 0 !important;
  z-index: 10000;
`

export const Seperator = styled.div`
  padding: 24px 0;
  border-right: 1px solid ${({ theme }) => theme.border};
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
  background-color: ${({ theme, tag }) => (tag === 'active' ? '#4aff8c' : theme.bg12)};
  box-sizing: border-box;
  @media screen and (max-width: 500px) {
    box-shadow: none;
  }
`

export const RewardLockerSchedulesWrapper = styled.div<{ showBorder: boolean }>`
  border-bottom: ${({ theme, showBorder }) => (showBorder ? `1px solid ${theme.border}` : 'none')};

  background: ${({ theme }) => theme.bg16};

  :last-child {
    border-bottom-right-radius: 0.5rem;
    border-bottom-left-radius: 0.5rem;
    border-bottom: none;
  }
`

export const RewardLockerSchedulesTitle = styled.div<{ backgroundColor: string }>`
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ backgroundColor }) => backgroundColor};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
    padding: 24px 16px;
    align-items: flex-end;
  `};
`

export const ClaimAllSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: fit-content;
`

export const NoVestingSchedule = styled.div`
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  background-color: ${({ theme }) => `${theme.background}`};
`

export const ScheduleWrapper = styled.div`
  padding: 24px 0;
  margin: 0 24px;
  padding-bottom: 48px;
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;

  border-top: 1px solid ${({ theme }) => theme.border};

  :first-child,
  :nth-child(2) {
    border-top: none;
  }
`
