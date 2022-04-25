import styled from 'styled-components'
import { Flex, Text } from 'rebass'

export const TrueSightPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 16px 100px;
  width: 100%;

  @media only screen and (min-width: 768px) {
    padding: 32px 64px 100px;
  }

  @media only screen and (min-width: 1700px) {
    padding: 32px 252px 50px;
  }
`

export const TabContainer = styled.div`
  display: flex;
`

export const TabItem = styled.div<{ active: boolean }>`
  font-size: 20px;
  font-weight: 500;
  line-height: 23.46px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  cursor: pointer;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 18px;
  `}
`

export const TabDivider = styled.div`
  font-size: 20px;
  font-weight: 500;
  line-height: 23.46px;
  color: ${({ theme }) => theme.subText};
  margin: 0 20px;
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

export const OptionsContainer = styled(Flex)`
  position: absolute;
  bottom: -4px;
  right: 0;
  border-radius: 4px;
  flex-direction: column;
  background: ${({ theme }) => theme.tableHeader};
  z-index: 9999;
  width: 100%;
  box-shadow: 0 0 0 1px ${({ theme }) => theme.bg4};
  transform: translate(0, 100%);
  min-width: max-content !important;

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
