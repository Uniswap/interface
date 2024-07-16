import Column, { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { BackArrowIcon } from 'nft/components/icons'
import { PropsWithChildren } from 'react'
import styled, { useTheme } from 'styled-components'
import { CloseIcon } from 'theme/components'
import { useIsDarkMode } from 'ui/src'
import { FOR_CONNECTING_BACKGROUND_DARK, FOR_CONNECTING_BACKGROUND_LIGHT } from 'ui/src/assets'

export const ContentWrapper = styled(Column)`
  background-color: ${({ theme }) => theme.surface1};
  width: 100%;
  overflow: hidden;
  flex: 1 1;
  position: relative;
  border-radius: 20px;
`

const ConnectingBackgroundImage = styled.img`
  pointer-events: none;
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
  box-shadow: 0 0 12px 12px transparent inset;
`

const ConnectedPaddedColumn = styled(AutoColumn)`
  position: relative;
  padding: 16px 24px 80px 24px;
`

const ConnectingContainer = styled(Column)`
  margin: 64px 0 0 0;
  align-items: center;
  z-index: 1;
`

const BackButton = styled(BackArrowIcon)`
  cursor: pointer;
`

const ConnectingViewHeader = styled(Row)`
  align-items: center;
  justify-content: space-between;
  z-index: 1;
  flex-direction: row-reverse;
`

interface ConnectingViewWrapperProps {
  closeModal: () => void
  onBack?: () => void
}

export function ConnectingViewWrapper({ children, closeModal, onBack }: PropsWithChildren<ConnectingViewWrapperProps>) {
  const isDarkMode = useIsDarkMode()
  const theme = useTheme()
  return (
    <ConnectedPaddedColumn gap="16px">
      <ConnectingBackgroundImage src={isDarkMode ? FOR_CONNECTING_BACKGROUND_DARK : FOR_CONNECTING_BACKGROUND_LIGHT} />
      <ConnectingViewHeader>
        <CloseIcon data-testid="ConnectingViewWrapper-close" onClick={closeModal} $color={theme.neutral2} />
        {onBack && <BackButton data-testid="ConnectingViewWrapper-back" fill={theme.neutral2} onClick={onBack} />}
      </ConnectingViewHeader>
      <ConnectingContainer gap="44px">{children}</ConnectingContainer>
    </ConnectedPaddedColumn>
  )
}
