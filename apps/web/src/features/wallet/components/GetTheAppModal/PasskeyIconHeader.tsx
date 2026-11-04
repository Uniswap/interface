import { Flex } from '@universe/mycelium'
import { Faceid } from '@universe/mycelium/icons/Faceid'
import { Fingerprint } from '@universe/mycelium/icons/Fingerprint'

export function PasskeyIconHeader(): JSX.Element {
  return (
    <Flex position="relative" height={48} width={80} alignItems="center" justifyContent="center">
      <Flex
        position="absolute"
        backgroundColor="$surface2"
        p="$spacing12"
        borderRadius="$rounded16"
        transform={[{ rotate: '-15deg' }, { translateY: '-5px' }]}
        left={0}
      >
        <Fingerprint size="$icon.24" color="$neutral1" />
      </Flex>
      <Flex
        position="absolute"
        backgroundColor="$surface2"
        p="$spacing12"
        borderRadius="$rounded16"
        transform={[{ rotate: '15deg' }]}
        borderWidth={2}
        borderColor="$surface1"
        right={0}
      >
        <Faceid size="$icon.24" color="$neutral1" />
      </Flex>
    </Flex>
  )
}
