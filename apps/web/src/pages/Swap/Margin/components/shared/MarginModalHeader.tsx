import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { useEvent } from 'utilities/src/react/hooks'

// Shared header for the margin action modals: title (subheading1) left; Get-help pill + close ✕ right,
// reusing GetHelpHeader for its close-icon + telemetry parity. Link defaults to the Uniswap help center
// (GetHelpHeader's baseUrl). width="auto" overrides GetHelpHeader's internal full-width so the title keeps
// its space in the row.
export function MarginModalHeader({ title, onClose }: { title: string; onClose: () => void }): JSX.Element {
  const closeModal = useEvent(onClose)
  return (
    <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12" width="100%">
      <Text variant="subheading1" color="$neutral1" testID={TestID.MarginModalTitle}>
        {title}
      </Text>
      <Flex flexShrink={0}>
        <GetHelpHeader closeModal={closeModal} width="auto" />
      </Flex>
    </Flex>
  )
}
