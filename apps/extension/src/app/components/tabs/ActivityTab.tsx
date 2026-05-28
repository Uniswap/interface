import { memo } from 'react'
import { ScrollView } from 'ui/src'
import { useActivityData } from 'wallet/src/features/activity/hooks/useActivityData'

export const ActivityTab = memo(function _ActivityTab({ address }: { address: Address }): JSX.Element {
  const { maybeEmptyComponent, renderActivityItem, sectionData } = useActivityData({
    owner: address,
  })

  if (maybeEmptyComponent) {
    return maybeEmptyComponent
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} width="100%">
      {/* `sectionData` will be either an array of transactions or an array of loading skeletons */}
      {(sectionData ?? []).map((item, index) => renderActivityItem({ item, index }))}
    </ScrollView>
  )
})
