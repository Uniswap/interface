import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { rgba } from 'polished'

import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { Spinner } from 'components/Header/Polling'

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

export const OptionsContainer = styled(Flex)`
  position: absolute;
  bottom: -4px;
  right: 0;
  border-radius: 20px;
  flex-direction: column;
  background: ${({ theme }) => theme.tableHeader};
  overflow: hidden;
  z-index: 9999;
  width: 100%;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
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

export const SubscribeButton = styled(ButtonPrimary)<{ isDisabled: boolean }>`
  overflow: hidden;
  width: fit-content;
  height: 36px;
  padding: 8px 12px;
  background: ${({ theme, isDisabled }) => (isDisabled ? theme.buttonGray : theme.primary)};
  color: ${({ theme, isDisabled }) => (isDisabled ? theme.border : theme.textReverse)};

  ${({ theme, isDisabled }) => theme.mediaWidth.upToExtraSmall`
    width: 36px;
    min-width: 36px;
    padding: 6px;
    background: ${isDisabled ? theme.buttonGray : rgba(theme.primary, 0.2)};
    color: ${isDisabled ? theme.border : theme.primary};
  `}
`

export const UnSubscribeButton = styled(ButtonEmpty)`
  width: fit-content;
  height: 36px;
  padding: 8px 12px;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 36px;
    min-width: 36px;
    padding: 6px;
  `}
`

export const ButtonText = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  margin-left: 6px !important;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `}
`

export const StyledSpinner = styled(Spinner)<{ color: string }>`
  border-left: ${({ color }) => `1px solid  ${color}`};
  width: 16px;
  height: 16px;
  top: 0px;
  left: 0px;
`
