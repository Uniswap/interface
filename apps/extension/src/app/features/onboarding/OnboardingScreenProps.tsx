import { ButtonEmphasis, ButtonVariant } from 'ui/src'

export type OnboardingScreenProps = {
  Icon?: JSX.Element
  children?: JSX.Element
  nextButtonEnabled?: boolean
  nextButtonIcon?: JSX.Element
  nextButtonText?: string
  nextButtonVariant?: ButtonVariant
  nextButtonEmphasis?: ButtonEmphasis
  onBack?: () => void
  onSubmit?: () => void
  onSkip?: () => void
  subtitle?: string
  title?: string | JSX.Element
  warningSubtitle?: string
  outsideContent?: JSX.Element
  belowFrameContent?: JSX.Element
  endAdornment?: JSX.Element
  noTopPadding?: boolean
}
