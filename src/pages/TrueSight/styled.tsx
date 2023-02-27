import { Text } from 'rebass'
import styled from 'styled-components'

export const TrueSightPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 24px 100px;
  width: 100%;
  max-width: 1500px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px 100px;
  `}
`

export const TabContainer = styled.div`
  display: flex;
  align-items: center;
`

export const TabItem = styled.div<{ active: boolean }>`
  font-size: 24px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  cursor: pointer;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 20px;
  `}
`

export const TabDivider = styled.div`
  font-size: 24px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  margin: 0 20px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 20px;
    margin: 0 12px;
  `}
`

export const TrueSightFilterBarLayout = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const TrueSightFilterBarSection = styled.div`
  display: flex;
  align-items: center;
`

export const TrueSightFilterBarLayoutMobile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
`

export const OptionsContainer = styled.div`
  display: flex;
  position: absolute;
  bottom: -6px;
  right: 0;
  border-radius: 16px;
  flex-direction: column;
  background: ${({ theme }) => theme.tableHeader};
  overflow: hidden;
  z-index: 9999;
  width: 100%;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  left: 50%;
  transform: translate(-50%, 100%);
  min-width: max-content;

  & > * {
    cursor: pointer;
    padding: 12px;

    &:hover {
      background: ${({ theme }) => theme.background};
    }
  }

  & div {
    min-width: max-content !important;
  }

  .no-hover-effect {
    cursor: default;
    &:hover {
      background: inherit;
    }
  }

  .no-hover-effect-divider {
    &:hover {
      background: ${({ theme }) => theme.border};
    }
  }
`

export const TextTooltip = styled(Text)<{ color: string }>`
  position: relative;
  cursor: pointer;

  ::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 2px);
    height: 0;
    border-bottom: ${({ color }) => `1px dashed ${color}`};
  }
`
