import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { ColumnCenter } from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import styled, { DefaultTheme } from 'lib/styled-components'
import { ReactNode } from 'react'
import { Gap } from 'theme'
import { ThemedText } from 'theme/components'
import { Button, ButtonEmphasis, ButtonVariant } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const Container = styled(ColumnCenter)`
  background-color: ${({ theme }) => theme.surface1};
  border-radius: 16px;
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

const DialogHeader = styled(GetHelpHeader)`
  padding: 4px 0px;
`

export enum DialogButtonType {
  Primary = 'primary',
  Error = 'error',
  Accent = 'accent',
}

function getButtonEmphasis(type?: DialogButtonType): ButtonEmphasis {
  switch (type) {
    case DialogButtonType.Accent:
    case DialogButtonType.Error:
      return 'primary'
    default:
      return 'secondary' // default/undefined DialogButtonType should show as Button default variant, secondary emphasis
  }
}

function getButtonVariant(type?: DialogButtonType): ButtonVariant {
  switch (type) {
    case DialogButtonType.Error:
      return 'critical'
    case DialogButtonType.Accent:
      return 'branded'
    default:
      return 'default'
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
  left?: ButtonConfig | JSX.Element
  right?: ButtonConfig | JSX.Element
  gap?: Gap
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
 * All the content of the dialog that doesn't relate to the modal presentation.
 * Use this if you want to use the dialog within a different modal.
 */
export function DialogContent({ icon, title, description, body, buttonsConfig }: DialogProps) {
  const { left, right, gap } = buttonsConfig ?? {}
  return (
    <ColumnCenter gap="lg">
      <ColumnCenter gap="16px">
        <IconContainer>{icon}</IconContainer>
        <ColumnCenter gap="sm">
          <TitleText>{title}</TitleText>
          <DescriptionText>{description}</DescriptionText>
          {body}
        </ColumnCenter>
      </ColumnCenter>
      <Row align="center" justify="center" gap={gap ?? 'md'}>
        {left ? (
          'title' in left ? (
            <Button
              size="small"
              onPress={left.onClick}
              isDisabled={left.disabled}
              height={40}
              emphasis={getButtonEmphasis(left.type)}
              variant={getButtonVariant(left.type)}
            >
              {left.title}
            </Button>
          ) : (
            left
          )
        ) : null}
        {right ? (
          'title' in right ? (
            <Button
              size="small"
              onPress={right.onClick}
              isDisabled={right.disabled}
              height={40}
              emphasis={getButtonEmphasis(right.type)}
              variant={getButtonVariant(right.type)}
            >
              {right.title}
            </Button>
          ) : (
            right
          )
        ) : null}
      </Row>
    </ColumnCenter>
  )
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
export function Dialog(props: DialogProps) {
  return (
    <Modal name={ModalName.Dialog} isModalOpen={props.isVisible} onClose={props.onCancel} padding={0}>
      <Container gap="lg">
        <DialogHeader closeModal={props.onCancel} closeDataTestId="Dialog-closeButton" />
        <DialogContent {...props} />
      </Container>
    </Modal>
  )
}
