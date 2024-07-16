import { Flex, Unicon } from 'ui/src'
import { FileListLock } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'

export function UniconWithLockIcon({ address }: { address: Address }): JSX.Element {
  return (
    <Flex>
      <Unicon address={address} size={iconSizes.icon64} />
      <Flex
        backgroundColor="$surface2"
        borderRadius="$roundedFull"
        bottom={-4}
        p="$spacing8"
        position="absolute"
        right={-4}
      >
        <FileListLock color="$accent1" size={iconSizes.icon16} />
      </Flex>
    </Flex>
  )
}
