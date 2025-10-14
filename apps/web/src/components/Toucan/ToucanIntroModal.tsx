import { Button, Flex, Image, Text, TouchableArea, useSporeColors } from 'ui/src'
import toucanIntroBackground from 'ui/src/assets/backgrounds/toucan-intro.png'
import { Rocket } from 'ui/src/components/icons/Rocket'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface ToucanIntroModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ToucanIntroModal({ isOpen, onClose }: ToucanIntroModalProps) {
  const colors = useSporeColors()

  return (
    <Modal isModalOpen={isOpen} name={ModalName.Dialog} onClose={onClose} maxWidth={440} padding={0}>
      <Flex position="relative" backgroundColor="$surface1" overflow="hidden" flexDirection="column">
        <Flex position="absolute" top={0} left={0} right={0} height={120} zIndex={0}>
          <Image source={{ uri: toucanIntroBackground }} width="100%" height="100%" opacity={0.3} />
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            style={{
              background: `linear-gradient(180deg, ${colors.transparent.variable} 0%, ${colors.surface1.variable} 100%)`,
            }}
          />
        </Flex>

        <TouchableArea
          position="absolute"
          top="$spacing16"
          right="$spacing16"
          p="$spacing8"
          onPress={onClose}
          borderRadius="$rounded8"
          zIndex={2}
        >
          <X size="$icon.24" color="$neutral1" />
        </TouchableArea>

        <Flex p="$spacing24" pt="$spacing40" gap="$spacing24" zIndex={1}>
          <Flex gap="$spacing16" alignItems="flex-start">
            <Flex backgroundColor="$accent2" borderRadius="$rounded8" p="$spacing12">
              <Rocket size="$icon.28" color="$accent1" />
            </Flex>

            <Flex gap="$spacing4" flex={1}>
              <Text variant="subheading1" color="$neutral1">
                This is a New!
              </Text>
              <Text variant="body3" color="$neutral2">
                blah blah blah add the actual text after launch
              </Text>
            </Flex>
          </Flex>

          <Flex gap="$spacing8" px="$spacing8">
            <Text variant="subheading2" color="$neutral1">
              1. blah blah blah
            </Text>
            <Text variant="subheading2" color="$neutral1">
              2. blah blah blah blah
            </Text>
            <Text variant="subheading2" color="$neutral1">
              3. blah blah blah blah
            </Text>
          </Flex>

          <Flex gap="$spacing16" alignItems="center">
            <Text variant="buttonLabel3" color="$neutral2" textAlign="center">
              Learn how this works
            </Text>

            <Button fill={false} variant="default" emphasis="primary" size="medium" onPress={onClose} width="100%">
              Start using this feature
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}
