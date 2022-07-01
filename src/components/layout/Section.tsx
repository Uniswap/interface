import React, { ComponentProps, PropsWithChildren, ReactNode } from 'react'
import { FlatList, FlatListProps } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Trace } from 'src/features/telemetry/Trace'

// Container
export function Container({ children, ...trace }: PropsWithChildren<ComponentProps<typeof Trace>>) {
  return (
    <Trace {...trace}>
      <Box bg="translucentBackground" borderRadius="md" pb="md">
        {children}
      </Box>
    </Trace>
  )
}

// Header
interface HeaderProps {
  title: string | ReactNode
  subtitle?: string | ReactNode
  onPress?: () => void
}

function Header({ title, subtitle, onPress }: HeaderProps) {
  const theme = useAppTheme()

  return (
    <Button
      borderBottomColor="backgroundOutline"
      borderBottomWidth={0.5}
      px="md"
      py="sm"
      onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex gap="xxs">
          {typeof title === 'string' ? (
            <Text color="textSecondary" variant="body">
              {title}
            </Text>
          ) : (
            title
          )}
          {subtitle ? (
            typeof subtitle === 'string' ? (
              <Text variant="subhead">{subtitle}</Text>
            ) : (
              subtitle
            )
          ) : null}
        </Flex>
        <Chevron color={theme.colors.textSecondary} direction="e" />
      </Flex>
    </Button>
  )
}

// Empty State
interface EmptyStateProps {
  buttonLabel: string
  description: string
  onPress: () => void
  title?: string
}

function EmptyState({ buttonLabel, description, onPress, title }: EmptyStateProps) {
  return (
    <Flex centered gap="sm" p="sm" width="100%">
      {title && (
        <Text fontWeight="600" textAlign="center" variant="subhead">
          {title}
        </Text>
      )}
      <Text color="textSecondary" textAlign="center" variant="caption">
        {description}
      </Text>
      <PrimaryButton
        borderColor="backgroundOutline"
        label={buttonLabel}
        textVariant="smallLabel"
        variant="transparent"
        onPress={onPress}
      />
    </Flex>
  )
}

// List
type ListProps = FlatListProps<any>

function List(props: ListProps) {
  return (
    <FlatList
      {...props}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  )
}

export const Section = {
  Container,
  EmptyState,
  Header,
  List,
}
