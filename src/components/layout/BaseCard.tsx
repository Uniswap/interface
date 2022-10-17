import { BoxProps, ShadowProps } from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren, ReactElement, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Trace } from 'src/features/telemetry/Trace'
import { Theme } from 'src/styles/theme'

const SHADOW_OFFSET: ShadowProps<Theme>['shadowOffset'] = { width: 4, height: 8 }
const SHADOW_OFFSET_SMALL: ShadowProps<Theme>['shadowOffset'] = { width: 0, height: 2 }

// Container
export function Container({ children, ...trace }: PropsWithChildren<ComponentProps<typeof Trace>>) {
  return (
    <Trace {...trace}>
      <Box
        bg="backgroundSurface"
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
      bg={isDarkMode ? 'backgroundSurface' : 'backgroundBackdrop'}
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
} & ComponentProps<typeof Button>

function Header({ title, subtitle, onPress, icon, ...buttonProps }: HeaderProps) {
  const theme = useAppTheme()

  return (
    <Button
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
              <Text variant="subhead">{subtitle}</Text>
            ) : (
              subtitle
            )
          ) : null}
        </Flex>
        <Chevron color={theme.colors.textSecondary} direction="e" height={20} />
      </Flex>
    </Button>
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
}

function EmptyState({
  additionalButtonLabel,
  buttonLabel,
  description,
  onPress,
  onPressAdditional,
  title,
}: EmptyStateProps) {
  return (
    <Flex centered gap="sm" p="sm" width="100%">
      {title && (
        <Text textAlign="center" variant="subhead">
          {title}
        </Text>
      )}
      <Text color="textSecondary" textAlign="center" variant="caption">
        {description}
      </Text>
      {buttonLabel && (
        <PrimaryButton
          borderColor="backgroundOutline"
          borderRadius="md"
          label={buttonLabel}
          textVariant="smallLabel"
          variant="transparent"
          onPress={onPress}
        />
      )}
      {additionalButtonLabel && (
        <PrimaryButton
          borderColor="backgroundOutline"
          borderRadius="md"
          label={additionalButtonLabel}
          textVariant="smallLabel"
          variant="transparent"
          onPress={onPressAdditional}
        />
      )}
    </Flex>
  )
}

export const BaseCard = {
  Container,
  EmptyState,
  Header,
  Shadow,
}
