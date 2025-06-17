import { SkeletonBox } from 'src/app/components/loading/SkeletonBox'
import { Flex } from 'ui/src'
import { WALLET_PREVIEW_CARD_MIN_HEIGHT } from 'wallet/src/components/WalletPreviewCard/WalletPreviewCard'

export function SelectWalletsSkeleton({ repeat = 3 }: { repeat?: number }): JSX.Element {
  return (
    <Flex fill gap="$spacing12">
      {/* eslint-disable-next-line max-params */}
      {new Array(repeat).fill(null).map((_, i, { length }) => (
        <WalletSkeleton key={i} opacity={(length - i) / length} />
      ))}
    </Flex>
  )
}

function WalletSkeleton({ opacity }: { opacity: number }): JSX.Element {
  return (
    <Flex
      row
      alignItems="center"
      borderColor="$surface3"
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      height={WALLET_PREVIEW_CARD_MIN_HEIGHT}
      justifyContent="flex-start"
      opacity={opacity}
      overflow="hidden"
      px="$spacing16"
      py="$spacing16"
      style={{
        boxShadow: 'rgba(0, 0, 0, 0.05) 0px 0px 8px',
      }}
    >
      <Flex fill row alignItems="center" gap="$spacing12">
        <Flex backgroundColor="$neutral3" borderRadius="$roundedFull" height={32} opacity={0.5} width={32} />

        <Flex grow alignItems="flex-start" gap="$spacing2">
          <SkeletonBox height={21} width={150} />
          <SkeletonBox height={21} width={95} />
        </Flex>
      </Flex>
    </Flex>
  )
}
