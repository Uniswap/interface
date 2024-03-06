import { ComponentProps, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ColorTokens,
  Flex,
  FlexProps,
  Icons,
  Text,
  TouchableArea,
  useIsDarkMode,
  useSporeColors,
} from 'ui/src'
import { opacify } from 'ui/src/theme'

export const SHADOW_OFFSET_SMALL = { width: 0, height: 2 } as const

export function Shadow({ children, ...rest }: FlexProps): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const colors = useSporeColors()

  const hasBackgroundColor = Boolean(rest.backgroundColor)

  return (
    <Flex
      borderRadius="$rounded16"
      p="$spacing12"
      shadowColor={isDarkMode ? '$sporeBlack' : '$transparent'}
      shadowOffset={SHADOW_OFFSET_SMALL}
      shadowOpacity={0.0075}
      shadowRadius={10}
      style={
        hasBackgroundColor
          ? undefined
          : { backgroundColor: opacify(isDarkMode ? 10 : 100, colors.sporeWhite.val) }
      }
      {...rest}>
      {children}
    </Flex>
  )
}

// Header
type HeaderProps = {
  title: string | ReactNode
  subtitle?: string | ReactNode
  onPress?: () => void
  icon?: JSX.Element
} & ComponentProps<typeof TouchableArea>

function Header({ title, subtitle, onPress, icon, ...buttonProps }: HeaderProps): JSX.Element {
  return (
    <TouchableArea
      borderBottomColor="$surface3"
      borderBottomWidth={0.25}
      px="$spacing16"
      py="$spacing12"
      onPress={onPress}
      {...buttonProps}>
      <Flex row alignItems="center" gap="$spacing16" justifyContent="space-between">
        <Flex gap="$spacing4">
          <Flex row alignItems="center" gap="$spacing8">
            {icon}
            {typeof title === 'string' ? (
              <Text color="$neutral2" variant="subheading2">
                {title}
              </Text>
            ) : (
              title
            )}
          </Flex>
          {subtitle ? (
            typeof subtitle === 'string' ? (
              <Text variant="subheading1">{subtitle}</Text>
            ) : (
              subtitle
            )
          ) : null}
        </Flex>
        <Icons.RotatableChevron color="$neutral2" direction="end" height={20} />
      </Flex>
    </TouchableArea>
  )
}

// Empty State
type EmptyStateProps = {
  additionalButtonLabel?: string
  buttonLabel?: string
  description: string
  onPress?: () => void
  onPressAdditional?: () => void
  title?: string
  icon?: ReactNode
}

function EmptyState({
  additionalButtonLabel,
  buttonLabel,
  description,
  onPress,
  onPressAdditional,
  title,
  icon,
}: EmptyStateProps): JSX.Element {
  return (
    <Flex centered gap="$spacing16" width="100%">
      <Flex centered gap="$spacing8">
        {icon}
        <Flex centered gap="$spacing8">
          {title && (
            <Text textAlign="center" variant="buttonLabel2">
              {title}
            </Text>
          )}
          <Text color="$neutral2" textAlign="center" variant="body2">
            {description}
          </Text>
        </Flex>
      </Flex>
      <Flex row gap="$spacing16">
        {buttonLabel && (
          <TouchableArea hapticFeedback onPress={onPress}>
            <Text color="$accent1" textAlign="center" variant="buttonLabel2">
              {buttonLabel}
            </Text>
          </TouchableArea>
        )}
        {additionalButtonLabel && (
          <TouchableArea onPress={onPressAdditional}>
            <Text color="$accent1" variant="buttonLabel2">
              {additionalButtonLabel}
            </Text>
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
}

// Error State
type ErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void
  retryButtonLabel?: string
  icon?: ReactNode
}

function ErrorState(props: ErrorStateProps): JSX.Element {
  const { t } = useTranslation()
  const {
    title,
    description = t('common.card.error.description'),
    retryButtonLabel,
    onRetry,
    icon,
  } = props
  return (
    <Flex centered grow gap="$spacing24" p="$spacing12" width="100%">
      <Flex centered gap="$spacing16">
        {icon}
        <Flex centered gap="$spacing8">
          {title ? (
            <Text textAlign="center" variant="buttonLabel2">
              {title}
            </Text>
          ) : null}
          <Text color="$neutral2" textAlign="center" variant="body2">
            {description}
          </Text>
        </Flex>
      </Flex>
      <Flex row>
        {retryButtonLabel ? (
          <TouchableArea hapticFeedback onPress={onRetry}>
            <Text color="$accent1" variant="buttonLabel3">
              {retryButtonLabel}
            </Text>
          </TouchableArea>
        ) : null}
      </Flex>
    </Flex>
  )
}

type InlineErrorStateProps = {
  backgroundColor?: ColorTokens
  textColor?: ColorTokens
} & Pick<ErrorStateProps, 'icon' | 'title' | 'onRetry' | 'retryButtonLabel'>

function InlineErrorState(props: InlineErrorStateProps): JSX.Element {
  const { t } = useTranslation()
  const {
    backgroundColor = '$surface2',
    textColor = '$neutral1',
    title = t('common.card.error.title'),
    onRetry: retry,
    retryButtonLabel = t('common.button.retry'),
    icon = <Icons.AlertTriangle color="$neutral3" size="$icon.16" testID="error-icon" />,
  } = props

  return (
    <Flex
      grow
      row
      alignItems="center"
      backgroundColor={backgroundColor}
      borderRadius="$rounded16"
      gap="$spacing24"
      justifyContent="space-between"
      p="$spacing12"
      width="100%">
      <Flex row shrink alignItems="center" gap="$spacing8">
        {icon}
        <Text
          color={textColor}
          ellipsizeMode="tail"
          numberOfLines={1}
          textAlign="center"
          variant="subheading2">
          {title}
        </Text>
      </Flex>
      {retry ? (
        <TouchableArea hapticFeedback onPress={retry}>
          <Text color="$accent1" variant="buttonLabel3">
            {retryButtonLabel}
          </Text>
        </TouchableArea>
      ) : null}
    </Flex>
  )
}

export const BaseCard = {
  EmptyState,
  ErrorState,
  Header,
  InlineErrorState,
  Shadow,
}
