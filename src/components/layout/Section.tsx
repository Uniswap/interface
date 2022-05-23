import React, { PropsWithChildren, ReactNode } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

export function Container({ children }: PropsWithChildren<{}>) {
  return (
    <Flex bg="translucentBackground" borderRadius="md" p="md">
      {children}
    </Flex>
  )
}

interface HeaderProps {
  title: string
  subtitle?: string | ReactNode
  buttonLabel: string
  expanded: boolean
  onMinimize: () => void
  onMaximize: () => void
}

function Header({ buttonLabel, expanded, onMaximize, onMinimize, subtitle, title }: HeaderProps) {
  const theme = useAppTheme()

  const onPress = () => (expanded ? onMinimize() : onMaximize())

  return (
    <TextButton onPress={onPress}>
      <Flex gap="xxs" width="100%">
        <Flex row alignItems="center" justifyContent="space-between" width="100%">
          <Text color="neutralTextSecondary" variant="body2">
            {title}
          </Text>

          {/* TODO(judo): move to component */}
          {expanded ? (
            <Chevron color={theme.colors.neutralAction} direction="s" height={12} width={12} />
          ) : (
            <Flex row gap="xs">
              <Text color="neutralTextSecondary" variant="body2">
                {buttonLabel}
              </Text>
              <Chevron
                color={theme.colors.neutralTextSecondary}
                direction="e"
                height={10}
                width={10}
              />
            </Flex>
          )}
        </Flex>
        {subtitle ? (
          typeof subtitle === 'string' ? (
            <Text variant="subHead1">{subtitle}</Text>
          ) : (
            subtitle
          )
        ) : null}
      </Flex>
    </TextButton>
  )
}

interface EmptyStateProps {
  buttonLabel: string
  description: string
  onPress: () => void
  title: string
}

export function EmptyState({ buttonLabel, description, onPress, title }: EmptyStateProps) {
  return (
    <Flex centered gap="sm" p="sm">
      <Text fontWeight="600" textAlign="center" variant="subHead1">
        {title}
      </Text>
      <Text color="neutralTextSecondary" textAlign="center" variant="caption">
        {description}
      </Text>
      <PrimaryButton label={buttonLabel} textVariant="body1" variant="blue" onPress={onPress} />
    </Flex>
  )
}

export const Section = {
  Container,
  EmptyState,
  Header,
}
