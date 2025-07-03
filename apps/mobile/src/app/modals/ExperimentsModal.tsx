import React from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { MiscellaneousDevSection } from 'src/components/experiments/MiscellaneousDevSection'
import { ServerOverrides } from 'src/components/experiments/ServerOverrides'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { E2EPixel } from 'src/test/E2EPixel'
import { getFullAppVersion } from 'src/utils/version'
import { Accordion, Separator, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { GatingOverrides } from 'uniswap/src/components/gating/GatingOverrides'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function ExperimentsModal(): JSX.Element {
  const insets = useAppInsets()
  const { onClose } = useReactNavigationModal()

  return (
    <Modal fullScreen renderBehindBottomInset name={ModalName.Experiments} onClose={onClose}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom,
          paddingRight: spacing.spacing24,
          paddingLeft: spacing.spacing24,
        }}
      >
        <E2EPixel testID={TestID.Close} onPress={onClose} />
        <Text variant="body2" my="$spacing12">{`Version: ${getFullAppVersion({ includeBuildNumber: true })}`}</Text>
        <Accordion collapsible gap="$spacing12" type="single">
          <ServerOverrides />
          <Separator />
          <GatingOverrides />
          <MiscellaneousDevSection />
        </Accordion>
      </ScrollView>
    </Modal>
  )
}
