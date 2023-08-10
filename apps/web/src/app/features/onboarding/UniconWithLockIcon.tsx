import { Icons } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { Unicon } from 'ui/src/components/Unicon'
import { iconSizes } from 'ui/src/theme/iconSizes'

export function UniconWithLockIcon({ address }: { address: Address }): JSX.Element {
  return (
    <Flex>
      <Unicon address={address} size={iconSizes.icon64} />
      <Flex
        backgroundColor="$surface2"
        borderRadius="$roundedFull"
        bottom={-4}
        padding="$spacing8"
        position="absolute"
        right={-4}>
        <Icons.FileListLock color="$accent1" size={iconSizes.icon16} />
      </Flex>
    </Flex>
  )
}
