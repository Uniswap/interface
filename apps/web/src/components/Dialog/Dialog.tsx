import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import GetHelp from 'components/Button/GetHelp'
import { ColumnCenter } from 'components/Column'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { ReactNode } from 'react'
import styled, { DefaultTheme } from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'

export const Container = styled(ColumnCenter)`
  background-color: ${({ theme }) => theme.surface1};
  outline: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  padding: 16px 24px 24px 24px;
  width: 100%;
`

const IconContainer = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.surface3};
  width: 48px;
  height: 48px;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
`

const TitleText = styled(ThemedText.HeadlineMedium)`
  font-size: 24px;
  line-height: 32px;
  text-align: center;
  font-weight: 500;
`

const DescriptionText = styled(ThemedText.BodySecondary)`
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0em;
  text-align: center;
`

const StyledButton = styled(ThemeButton)<{ $color?: keyof DefaultTheme }>`
  display: flex;
  flex-grow: 1;
  height: 40px;
  ${({ $color, theme }) => $color && `color: ${theme[$color]};`}
  border-radius: 12px;
`

export enum DialogButtonType {
  Primary = 'primary',
  Error = 'error',
}

function getButtonEmphasis(type?: DialogButtonType) {
  switch (type) {
    case DialogButtonType.Error:
      return ButtonEmphasis.destructive
    default:
      return ButtonEmphasis.medium
  }
}

type ButtonConfig = {
  type?: DialogButtonType
  title: ReactNode
  onClick: () => void
  disabled?: boolean
  textColor?: keyof DefaultTheme
}

type ButtonsConfig = {
  left?: ButtonConfig
  right?: ButtonConfig
}

export interface DialogProps {
  isVisible: boolean
  icon: ReactNode
  title: ReactNode
  description: ReactNode
  body?: ReactNode
  onCancel: () => void
  buttonsConfig?: ButtonsConfig
}

/**
 * Displays interruptive timely information.
 * Persists until dismissed by user.
 * Appears on top of a scrim.
 *
 * .------------------.
 * |      icon        |
 * |      title       |
 * |    description   |
 * |      body        |
 * |   left | right   |
 *  ------------------
 */
export function Dialog({ isVisible, buttonsConfig, icon, title, onCancel, description, body }: DialogProps) {
  const { left, right } = buttonsConfig ?? {}
  return (
    <Modal $scrollOverlay isOpen={isVisible} onDismiss={onCancel}>
      <Container gap="lg">
        <Row gap="10px" width="100%" padding="4px 0px" justify="end" align="center">
          <GetHelp />
          <CloseIcon data-testid="Dialog-closeButton" onClick={onCancel} />
        </Row>
        <ColumnCenter gap="md">
          <IconContainer>{icon}</IconContainer>
          <TitleText>{title}</TitleText>
          <DescriptionText>{description}</DescriptionText>
          {body}
        </ColumnCenter>
        <Row align="center" justify="center" gap="md">
          {left && (
            <StyledButton
              size={ButtonSize.small}
              onClick={left.onClick}
              disabled={left.disabled}
              emphasis={getButtonEmphasis(left.type)}
              $color={left.textColor}
            >
              {left.title}
            </StyledButton>
          )}
          {right && (
            <StyledButton
              size={ButtonSize.small}
              onClick={right.onClick}
              disabled={right.disabled}
              emphasis={getButtonEmphasis(right.type)}
              $color={right.textColor}
            >
              {right.title}
            </StyledButton>
          )}
        </Row>
      </Container>
    </Modal>
  )
}
