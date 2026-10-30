import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { useShadowPropsMedium } from '@universe/mycelium/theme-hooks-compat'
import * as React from 'react'
import { X } from 'ui/src/components/icons/X'
import { POPUP_MAX_WIDTH } from '~/components/Popups/constants'

type ToastProps = {
  children: React.ReactNode
  className?: string
  onPress?: () => void
}

type ToastIconProps = {
  children: React.ReactNode
}

type ToastContentProps = {
  children: React.ReactNode
}

type ToastTitleProps = {
  children: React.ReactNode
}

type ToastDescriptionProps = {
  children: React.ReactNode
}

type ToastActionProps = {
  children: React.ReactNode
  onPress: () => void
}

type ToastCloseProps = {
  onPress: () => void
}

export const Toast = Object.assign(ToastRoot, {
  Icon: ToastIcon,
  Content: ToastContent,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose,
})

function ToastRoot({ children, onPress, className }: ToastProps): JSX.Element {
  // On web the hook only ever returns a `$platform-web` boxShadow; unwrap it for the web-only compat Flex.
  const { '$platform-web': shadowStyle } = useShadowPropsMedium()
  return (
    <Flex
      row
      alignItems="flex-start"
      // Scoped to opacity/transform (never color properties) so theme toggling doesn't animate token colors.
      transition="opacity 300ms ease-in-out, transform 300ms ease-in-out"
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      justifyContent="space-between"
      left={0}
      mx={0}
      boxShadow={shadowStyle?.boxShadow}
      position="relative"
      width="100%"
      maxWidth={POPUP_MAX_WIDTH}
      opacity={1}
      $sm={{ width: 'max-content', mx: 'auto' }}
      className={className}
    >
      <TouchableArea onPress={onPress} flexShrink={1} width="100%">
        <Flex row alignItems="center" gap={20} flexShrink={1} p="$spacing16">
          {children}
        </Flex>
      </TouchableArea>
    </Flex>
  )
}

function ToastIcon({ children }: ToastIconProps): JSX.Element {
  return <>{children}</>
}

function ToastContent({ children }: ToastContentProps): JSX.Element {
  return (
    <Flex flexDirection="column" gap={4} flexShrink={1}>
      {children}
    </Flex>
  )
}

function ToastTitle({ children }: ToastTitleProps): JSX.Element {
  return <Text variant="subheading2">{children}</Text>
}

function ToastDescription({ children }: ToastDescriptionProps): JSX.Element {
  return (
    <Text variant="body3" color="$neutral2" flexShrink={1}>
      {children}
    </Text>
  )
}

function ToastAction({ children, onPress }: ToastActionProps): JSX.Element {
  return (
    <Text variant="body3" color="$accent1" onPress={onPress}>
      {children}
    </Text>
  )
}

function ToastClose({ onPress }: ToastCloseProps): JSX.Element {
  return (
    <TouchableArea
      onPress={(e) => {
        e.stopPropagation()
        onPress()
      }}
    >
      <X color="$neutral2" size={16} ml="$spacing8" />
    </TouchableArea>
  )
}
