import { BoxProps, ShadowProps } from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren, ReactElement, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Trace } from 'src/components/telemetry/Trace'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

const SHADOW_OFFSET: ShadowProps<Theme>['shadowOffset'] = { width: 4, height: 8 }
const SHADOW_OFFSET_SMALL: ShadowProps<Theme>['shadowOffset'] = { width: 0, height: 2 }

// Container
export function Container({ children, ...trace }: PropsWithChildren<ComponentProps<typeof Trace>>) {
  return (
    <Trace {...trace}>
      <Box
        bg="background1"
        borderColor="backgroundOutline"
        borderRadius="lg"
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

export function Shadow({ children, ...rest }: PropsWithChildren<BoxProps<Theme, true>>) {
  const isDarkMode = useColorScheme() === 'dark'
  return (
    <Box
      alignItems="center"
      bg={isDarkMode ? 'background1' : 'background0'}
      borderRadius="lg"
      p="sm"
      shadowColor="black"
      shadowOffset={SHADOW_OFFSET_SMALL}
      shadowOpacity={0.05}
      shadowRadius={6}
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
  icon?: ReactElement
} & ComponentProps<typeof TouchableArea>

function Header({ title, subtitle, onPress, icon, ...buttonProps }: HeaderProps) {
  const theme = useAppTheme()

  return (
    <TouchableArea
      borderBottomColor="backgroundOutline"
      borderBottomWidth={0.25}
      px="md"
      py="sm"
      onPress={onPress}
      {...buttonProps}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex gap="xxs">
          <Flex row alignItems="center" gap="xs">
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
}: EmptyStateProps) {
  return (
    <Flex centered gap="lg" p="sm" width="100%">
      <Flex centered>
        {icon}
        <Flex centered gap="xs">
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
  description: string
  retry?: () => void
  retryButtonLabel?: string
  icon?: ReactNode
}

function ErrorState({ title, description, retry, retryButtonLabel, icon }: ErrorStateProps) {
  const theme = useAppTheme()
  return (
    <Flex centered grow gap="lg" p="sm" width="100%">
      <Flex centered>
        {icon ?? (
          <AlertTriangle
            color={theme.colors.textSecondary}
            height={theme.iconSizes.xxxl}
            width={theme.iconSizes.xxxl}
          />
        )}
        <Flex centered gap="xs">
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
          <TouchableArea hapticFeedback onPress={retry}>
            <Text color="magentaVibrant" variant="buttonLabelSmall">
              {retryButtonLabel}
            </Text>
          </TouchableArea>
        ) : null}
      </Flex>
    </Flex>
  )
}

export const BaseCard = {
  Container,
  EmptyState,
  ErrorState,
  Header,
  Shadow,
}
