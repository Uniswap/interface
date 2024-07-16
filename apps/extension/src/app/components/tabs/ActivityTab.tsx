import { memo } from 'react'
import { ScrollView } from 'ui/src'
import { useActivityData } from 'wallet/src/features/activity/useActivityData'

export const ActivityTab = memo(function _ActivityTab({ address }: { address: Address }): JSX.Element {
  const { maybeLoaderComponent, maybeEmptyComponent, renderActivityItem, sectionData } = useActivityData({
    owner: address,
  })

  if (maybeLoaderComponent) {
    return maybeLoaderComponent
  }

  if (maybeEmptyComponent) {
    return maybeEmptyComponent
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} width="100%">
      {(sectionData ?? []).map((item) => renderActivityItem({ item }))}
    </ScrollView>
  )
})
