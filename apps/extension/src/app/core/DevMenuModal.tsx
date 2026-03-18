import { lazy, Suspense } from 'react'
import { Flex } from 'ui/src'
import { Flag } from 'ui/src/components/icons/Flag'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

const DevMenuScreen = lazy(() =>
  import('src/app/features/settings/DevMenuScreen').then((module) => ({ default: module.DevMenuScreen })),
)

export function DevMenuModal(): JSX.Element {
  const { value: isOpen, setTrue: openModal, setFalse: closeModal } = useBooleanState(false)

  return (
    <>
      <Flex
        $platform-web={{
          position: 'fixed',
        }}
        bottom="$spacing24"
        p="$spacing4"
        left="$spacing24"
        zIndex={Number.MAX_SAFE_INTEGER}
        borderWidth={1}
        borderColor="$neutral2"
        borderRadius="$rounded4"
        cursor="pointer"
        backgroundColor="$surface1"
        hoverStyle={{
          backgroundColor: '$surface1Hovered',
        }}
        onPress={openModal}
      >
        <Flag size="$icon.24" color="$neutral2" />
      </Flex>

      {isOpen && (
        <Modal name={ModalName.FeatureFlags} onClose={closeModal}>
          <Suspense>
            <DevMenuScreen />
          </Suspense>
        </Modal>
      )}
    </>
  )
}
