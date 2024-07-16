import { ThemeNames } from 'ui/src/theme'

export type OnboardingScreenProps = {
  Icon?: JSX.Element
  children?: JSX.Element
  nextButtonEnabled?: boolean
  nextButtonText?: string
  nextButtonTheme?: ThemeNames
  onBack?: () => void
  onSubmit?: () => void
  onSkip?: () => void
  subtitle?: string
  title: string | JSX.Element
  warningSubtitle?: string
  outsideContent?: JSX.Element
  belowFrameContent?: JSX.Element
}
