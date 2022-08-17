import React, { ComponentProps, PropsWithChildren, useState } from 'react'
import { Image, ImageStyle } from 'react-native'
import { FAVORITE_TOKENS_EMPTY_BG, WATCHED_TOKENS_EMPTY_BG } from 'src/assets'
import { Button } from 'src/components/buttons/Button'
import { CloseButton } from 'src/components/buttons/CloseButton'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Trace } from 'src/features/telemetry/Trace'

// Empty State
type EmptyStateProps = {
  buttonLabel: string
  description: string
  onPress?: () => void
  type?: 'favorite' | 'watched'
} & PropsWithChildren<ComponentProps<typeof Trace>>

const imgSrc = {
  favorite: FAVORITE_TOKENS_EMPTY_BG,
  watched: WATCHED_TOKENS_EMPTY_BG,
}

export function ExploreTokenCardEmptyState({
  buttonLabel,
  description,
  onPress,
  type = 'favorite',
}: EmptyStateProps) {
  const [visible, setIsVisible] = useState(true)

  if (!visible) {
    return null
  }

  return (
    <Flex
      row
      alignItems="stretch"
      bg="backgroundContainer"
      borderRadius="lg"
      gap="none"
      minHeight={150}>
      <Box position="absolute" right={13} top={14} zIndex="fixed">
        <CloseButton
          color="textSecondary"
          size={24}
          onPress={() => {
            setIsVisible(false)
          }}
        />
      </Box>
      <Box
        alignItems="flex-start"
        flexBasis={0}
        flexGrow={1}
        justifyContent="space-between"
        minWidth={0}
        p="md">
        <Text color="textPrimary" variant="bodySmall">
          {description}
        </Text>

        <Button backgroundColor="backgroundAction" borderRadius="md" p="xs" onPress={onPress}>
          <Text color="textPrimary" variant="smallLabel">
            {buttonLabel}
          </Text>
        </Button>
      </Box>
      <Flex grow flexBasis={0} minWidth={0} overflow="hidden" p="md">
        <Image source={imgSrc[type]} style={[BackgroundStyle]} />
      </Flex>
    </Flex>
  )
}

const BackgroundStyle: ImageStyle = {
  position: 'absolute',
}
