import { ShadowProps } from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useColorScheme } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, BoxProps, Flex } from 'src/components/layout'
import { Trace } from 'src/components/telemetry/Trace'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'
import { opacify } from 'src/utils/colors'

const SHADOW_OFFSET: ShadowProps<Theme>['shadowOffset'] = { width: 4, height: 8 }
export const SHADOW_OFFSET_SMALL: ShadowProps<Theme>['shadowOffset'] = { width: 0, height: 2 }

// Container
export function Container({
  children,
  ...trace
}: PropsWithChildren<ComponentProps<typeof Trace>>): JSX.Element {
  return (
    <Trace {...trace}>
      <Box
        bg="background1"
        borderColor="backgroundOutline"
        borderRadius="rounded16"
        borderWidth={0.25}
        overflow="visible"
        shadowColor="black"
        shadowOffset={SHADOW_OFFSET}
        shadowOpacity={0.05}
        shadowRadius={10}>
        {children}
      </Box>
    </Trace>
  )
}

export function Shadow({ children, ...rest }: BoxProps): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark'
  const theme = useAppTheme()
  return (
    <Box
      // bg={rest?.bg ?? isDarkMode ? 'backgroundOutline' : 'background1'}
      borderRadius="rounded16"
      p="spacing12"
      shadowColor={isDarkMode ? 'black' : 'none'}
      shadowOffset={SHADOW_OFFSET_SMALL}
      shadowOpacity={0.4}
      shadowRadius={6}
      style={{ backgroundColor: opacify(isDarkMode ? 10 : 100, theme.colors.white) }}
      {...rest}>
      {children}
    </Box>
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
  const theme = useAppTheme()

  return (
    <TouchableArea
      borderBottomColor="backgroundOutline"
      borderBottomWidth={0.25}
      px="spacing16"
      py="spacing12"
      onPress={onPress}
      {...buttonProps}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex gap="spacing4">
          <Flex row alignItems="center" gap="spacing8">
            {icon}
            {typeof title === 'string' ? (
              <Text color="textSecondary" variant="subheadSmall">
                {title}
              </Text>
            ) : (
              title
            )}
          </Flex>
          {subtitle ? (
            typeof subtitle === 'string' ? (
              <Text variant="subheadLarge">{subtitle}</Text>
            ) : (
              subtitle
            )
          ) : null}
        </Flex>
        <Chevron color={theme.colors.textSecondary} direction="e" height={20} />
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
    <Flex centered gap="spacing24" p="spacing12" width="100%">
      <Flex centered>
        {icon}
        <Flex centered gap="spacing8">
          {title && (
            <Text textAlign="center" variant="buttonLabelMedium">
              {title}
            </Text>
          )}
          <Text color="textSecondary" textAlign="center" variant="bodySmall">
            {description}
          </Text>
        </Flex>
      </Flex>
      <Flex row>
        {buttonLabel && (
          <TouchableArea hapticFeedback onPress={onPress}>
            <Text color="magentaVibrant" variant="buttonLabelSmall">
              {buttonLabel}
            </Text>
          </TouchableArea>
        )}
        {additionalButtonLabel && (
          <TouchableArea onPress={onPressAdditional}>
            <Text color="magentaVibrant" variant="buttonLabelSmall">
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
  const { title, description = t('Something went wrong'), retryButtonLabel, onRetry, icon } = props
  return (
    <Flex centered grow gap="spacing24" p="spacing12" width="100%">
      <Flex centered>
        {icon}
        <Flex centered gap="spacing8">
          {title ? (
            <Text textAlign="center" variant="buttonLabelMedium">
              {title}
            </Text>
          ) : null}
          <Text color="textSecondary" textAlign="center" variant="bodySmall">
            {description}
          </Text>
        </Flex>
      </Flex>
      <Flex row>
        {retryButtonLabel ? (
          <TouchableArea hapticFeedback onPress={onRetry}>
            <Text color="magentaVibrant" variant="buttonLabelSmall">
              {retryButtonLabel}
            </Text>
          </TouchableArea>
        ) : null}
      </Flex>
    </Flex>
  )
}

type InlineErrorStateProps = {
  backgroundColor?: keyof Theme['colors']
  textColor?: keyof Theme['colors']
} & Pick<ErrorStateProps, 'icon' | 'title' | 'onRetry' | 'retryButtonLabel'>

function InlineErrorState(props: InlineErrorStateProps): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const {
    backgroundColor = 'background2',
    textColor = 'textPrimary',
    title = t('Oops! Something went wrong.'),
    onRetry: retry,
    retryButtonLabel = t('Retry'),
    icon = (
      <AlertTriangle
        color={theme.colors.textTertiary}
        height={theme.iconSizes.icon16}
        width={theme.iconSizes.icon16}
      />
    ),
  } = props

  return (
    <Flex
      grow
      row
      alignItems="center"
      bg={backgroundColor}
      borderRadius="rounded16"
      gap="spacing24"
      justifyContent="space-between"
      p="spacing12"
      width="100%">
      <Flex row shrink alignItems="center" gap="spacing8">
        {icon}
        <Text
          color={textColor}
          ellipsizeMode="tail"
          numberOfLines={1}
          textAlign="center"
          variant="subheadSmall">
          {title}
        </Text>
      </Flex>
      {retry ? (
        <TouchableArea hapticFeedback onPress={retry}>
          <Text color="accentActive" variant="buttonLabelSmall">
            {retryButtonLabel}
          </Text>
        </TouchableArea>
      ) : null}
    </Flex>
  )
}

export const BaseCard = {
  Container,
  EmptyState,
  ErrorState,
  Header,
  InlineErrorState,
  Shadow,
}
