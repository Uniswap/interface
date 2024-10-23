import { ThemeNames } from 'ui/src/theme'

export type OnboardingScreenProps = {
  Icon?: JSX.Element
  children?: JSX.Element
  nextButtonEnabled?: boolean
  nextButtonIcon?: JSX.Element
  nextButtonText?: string
  nextButtonTheme?: ThemeNames
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
