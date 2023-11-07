import { ButtonText } from 'components/Button'
import { OpacityHoverState } from 'components/Common'
import { X } from 'react-feather'
import styled from 'styled-components'
import { Z_INDEX } from 'theme/zIndex'

export const PopupContainer = styled.div<{ show: boolean }>`
  ${({ show }) => !show && 'display: none'};

  background-color: ${({ theme }) => theme.surface2};
  color: ${({ theme }) => theme.neutral1};
  position: fixed;
  z-index: ${Z_INDEX.sticky};

  border-radius: 20px;
  bottom: 20px;
  right: 20px;
  width: 359px;
  height: 92px;

  border: 1.3px solid ${({ theme }) => theme.surface3};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    bottom: 62px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    background-position: top 32px right -10px;
    width: unset;
    right: 10px;
    left: 10px;
  }

  user-select: none;
`
export const StyledXButton = styled(X)`
  cursor: pointer;
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px;
  border-radius: 50%;

  background-color: ${({ theme }) => theme.surface5};
  color: ${({ theme }) => theme.neutral2};
  ${OpacityHoverState};
`

export const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  height: 100%;
  overflow: hidden;
  border-radius: 20px;
`
export const Thumbnail = styled.img`
  width: 82px;
`
export const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  color: ${({ theme }) => theme.neutral2};
  padding: 10px 16px 16px;
  line-height: 16px;
  width: 245px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: 245px;
  }
`
export const DownloadButton = styled(ButtonText)`
  line-height: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.accent1};
`
