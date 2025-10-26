import { memo } from 'react'
import { ScrollView } from 'ui/src'
import { useActivityDataWallet } from 'wallet/src/features/activity/useActivityDataWallet'

export const ActivityTab = memo(function _ActivityTab({
  address,
  skip,
}: {
  address: Address
  skip?: boolean
}): JSX.Element {
  const { maybeEmptyComponent, renderActivityItem, sectionData } = useActivityDataWallet({
    evmOwner: address,
    skip,
  })

  if (maybeEmptyComponent) {
    return maybeEmptyComponent
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} width="100%">
      {/* `sectionData` will be either an array of transactions or an array of loading skeletons */}
      {sectionData.map((item, index) => renderActivityItem({ item, index }))}
    </ScrollView>
  )
})
