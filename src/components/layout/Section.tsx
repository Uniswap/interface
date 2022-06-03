import React, { ComponentProps, PropsWithChildren, ReactNode } from 'react'
import { FlatListProps } from 'react-native'
import {
  Directions,
  FlatList,
  FlingGestureHandler,
  FlingGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler'
import { useAppTheme } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Trace } from 'src/features/telemetry/Trace'

// Container
export function Container({ children, ...trace }: PropsWithChildren<ComponentProps<typeof Trace>>) {
  return (
    <Trace {...trace}>
      <Flex bg="neutralBackground" borderRadius="md" gap="xs" p="md">
        {children}
      </Flex>
    </Trace>
  )
}

// Header
interface HeaderProps {
  title: string
  subtitle?: string | ReactNode
  buttonLabel: string
  expanded: boolean
  // TODO: replace with `expandedScreen`
  onMinimize?: () => void
  onMaximize?: () => void
}

function Header({ buttonLabel, expanded, onMaximize, onMinimize, subtitle, title }: HeaderProps) {
  const theme = useAppTheme()

  const onPress = () => (expanded ? onMinimize?.() : onMaximize?.())
  const onFling = ({ nativeEvent }: FlingGestureHandlerGestureEvent) => {
    if (nativeEvent.state === State.ACTIVE) {
      onPress()
    }
  }

  return (
    <FlingGestureHandler
      direction={expanded ? Directions.DOWN : Directions.UP}
      onHandlerStateChange={onFling}>
      <Box>
        <TextButton onPress={onPress}>
          <Flex gap="xxs" width="100%">
            <Flex row alignItems="center" justifyContent="space-between" width="100%">
              <Text color="neutralTextSecondary" variant="body2">
                {title}
              </Text>

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
      </Box>
    </FlingGestureHandler>
  )
}

// Empty State
interface EmptyStateProps {
  buttonLabel: string
  description: string
  onPress: () => void
  title: string
}

function EmptyState({ buttonLabel, description, onPress, title }: EmptyStateProps) {
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
