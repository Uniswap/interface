// TODO(WALL-7189): Explore removing FlatList. Currently using this to fix a scrolling regression.
import { FlatList } from 'react-native-gesture-handler'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

type SettingsListModalProps<T> = {
  modalName: ModalNameType
  title: string
  selectedItem: T
  options: T[]
  getItemTitle: (item: T) => string
  getItemSubtitle?: (item: T) => string
  onSelectItem: (item: T) => Promise<void>
}

export function SettingsListModal<T extends string>(props: SettingsListModalProps<T>): JSX.Element {
  const { onClose } = useReactNavigationModal()

  return (
    <Modal fullScreen name={props.modalName} onClose={onClose}>
      <SettingsListModalContent {...props} />
    </Modal>
  )
}

function SettingsListModalContent<T extends string>({
  title,
  selectedItem,
  options,
  getItemTitle,
  getItemSubtitle,
  onSelectItem,
}: SettingsListModalProps<T>): JSX.Element {
  // Defer the gesture-handler-backed list until the sheet begins animating; mounting every row
  // (a gesture handler + Tamagui subtree each) synchronously on open otherwise blocks the open.
  const { isSheetReady } = useBottomSheetContext()

  const renderItem = useEvent(({ item }: { item: T }) => (
    <SettingsListModalOption
      active={selectedItem === item}
      item={item}
      getItemTitle={getItemTitle}
      getItemSubtitle={getItemSubtitle}
      onSelectItem={onSelectItem}
    />
  ))

  return (
    <>
      <Text pb="$spacing12" textAlign="center" variant="subheading1">
        {title}
      </Text>
      {/* When modifying this component, please test on a physical device that
          scrolling the languages list continues to work correctly. */}
      {isSheetReady && (
        <FlatList
          data={options}
          keyExtractor={(item: T) => item}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
        />
      )}
    </>
  )
}

function SettingsListModalOption<T>({
  active,
  item,
  getItemTitle,
  getItemSubtitle,
  onSelectItem,
}: {
  active?: boolean
  item: T
} & Pick<SettingsListModalProps<T>, 'getItemSubtitle' | 'getItemTitle' | 'onSelectItem'>): JSX.Element {
  const { onClose } = useReactNavigationModal()

  const onSelectOption = useEvent(async () => {
    await onSelectItem(item)
    onClose()
  })

  return (
    <TouchableArea row alignItems="center" px="$spacing12" py="$spacing12" onPress={onSelectOption}>
      <Flex row gap="$spacing12">
        <Flex grow row gap="$spacing12">
          <Text variant="subheading1">{getItemTitle(item)}</Text>
          {getItemSubtitle && (
            <Text color="$neutral3" variant="body1">
              {getItemSubtitle(item)}
            </Text>
          )}
        </Flex>
        {active && <Check color="$accent1" size="$icon.24" />}
      </Flex>
    </TouchableArea>
  )
}
