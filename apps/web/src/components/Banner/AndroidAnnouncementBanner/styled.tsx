import { ButtonText } from 'components/Button'
import { OpacityHoverState } from 'components/Common'
import { X } from 'react-feather'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

export const PopupContainer = styled.div<{ show: boolean }>`
  ${({ show }) => !show && 'display: none'};
  background-color: ${({ theme }) => theme.surface2};
  color: ${({ theme }) => theme.neutral1};
  position: fixed;
  z-index: ${Z_INDEX.sticky};
  user-select: none;
  border-radius: 20px;
  bottom: 40px;
  right: 20px;
  width: 360px;
  height: 92px;
  border: 1.3px solid ${({ theme }) => theme.surface3};

  @media only screen and (max-width: ${BREAKPOINTS.md}px) {
    bottom: 62px;
  }

  @media only screen and (max-width: ${BREAKPOINTS.xs}px) {
    width: unset;
    right: 10px;
    left: 10px;
  }
`
export const StyledXButton = styled(X)`
  cursor: pointer;
  position: absolute;
  top: -30px;
  right: 0px;
  padding: 4px;
  border-radius: 50%;

  background-color: ${({ theme }) => theme.surface5};
  color: ${({ theme }) => theme.neutral2};
  ${OpacityHoverState};

  @media only screen and (max-width: ${BREAKPOINTS.xs}px) {
    top: 8px;
    right: 8px;
  }
`

export const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  height: 100%;
  overflow: hidden;
  border-radius: 20px;
  gap: 16px;
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
  padding: 10px 0px 10px;
  line-height: 16px;

  @media only screen and (max-width: ${BREAKPOINTS.xs}px) {
    width: 220px;
  }
`
export const StyledQrCode = styled.img`
  padding: 2px;
  border-radius: 8px;
  width: 64px;
  height: 64px;
  background-color: ${({ theme }) => theme.white};
  margin-right: 16px;

  @media only screen and (max-width: ${BREAKPOINTS.xs}px) {
    display: none;
  }
`
export const DownloadButton = styled(ButtonText)`
  line-height: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.accent1};
`
