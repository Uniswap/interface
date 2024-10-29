import { HookModal } from 'components/Liquidity/HookModal'
import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { AdvancedButton } from 'pages/Pool/Positions/create/shared'
import { useCallback, useRef, useState } from 'react'
import { Button, Text, TouchableArea, styled } from 'ui/src'
import { DocumentList } from 'ui/src/components/icons/DocumentList'
import { X } from 'ui/src/components/icons/X'
import { Flex } from 'ui/src/components/layout/Flex'
import { fonts } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { useTranslation } from 'uniswap/src/i18n'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { useOnClickOutside } from 'utilities/src/react/hooks'

const MenuFlyout = styled(Flex, {
  animation: 'fastHeavy',
  enterStyle: { top: 30, opacity: 0 },
  exitStyle: { top: 30, opacity: 0 },
  width: 'calc(100% - 8px)',
  backgroundColor: '$surface2',
  borderColor: '$surface3',
  borderWidth: 1,
  borderRadius: '$rounded12',
  position: 'absolute',
  top: 40,
  left: '$spacing4',
  zIndex: 100,
  p: '$padding16',
  opacity: 1,
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 25 },
  shadowOpacity: 0.2,
  shadowRadius: 50,
})

function AutocompleteFlyout({ address, handleSelectAddress }: { address: string; handleSelectAddress: () => void }) {
  const { t } = useTranslation()
  const validAddress = getValidAddress(address)

  return (
    <MenuFlyout>
      {validAddress ? (
        <TouchableArea onPress={handleSelectAddress}>
          <Text variant="body2">{address}</Text>
        </TouchableArea>
      ) : (
        <Text variant="body2">{t('position.addingHook.invalidAddress')}</Text>
      )}
    </MenuFlyout>
  )
}

export function AddHook() {
  const { t } = useTranslation()

  const [isFocusing, setFocus] = useState(false)
  const handleFocus = useCallback((focus: boolean) => setFocus(focus), [])

  const inputWrapperNode = useRef<HTMLDivElement | null>(null)
  useOnClickOutside(inputWrapperNode, isFocusing ? () => handleFocus(false) : undefined)

  const [hookInputEnabled, setHookInputEnabled] = useState(false)
  const [hookModalOpen, setHookModalOpen] = useState(false)

  const [hook, setHook] = useState<{ address: string; confirmed: boolean }>({
    address: '',
    confirmed: false,
  })
  const { setPositionState } = useCreatePositionContext()

  const handleToggleHookInput = () => {
    setHookInputEnabled((prev) => !prev)
    setHook({ address: '', confirmed: false })
  }

  const onSelectAddress = () => {
    setPositionState((state) => ({
      ...state,
      hook: hook.address,
    }))

    setHookModalOpen(true)
    setHook((state) => ({
      ...state,
      confirmed: true,
    }))
  }

  if (hookInputEnabled) {
    // TODO: investigate bug with invalid input and then making it valid after
    const showFlyout = isFocusing && !!hook.address && hook.address.length === 42

    return (
      <>
        <HookModal isOpen={hookModalOpen} onClose={() => setHookModalOpen(false)} />
        <Flex ref={inputWrapperNode} row gap="$spacing4">
          <TextInput
            autoFocus
            placeholder="Enter hook address"
            autoCapitalize="none"
            color="$neutral1"
            fontFamily="$subHeading"
            fontSize={fonts.body2.fontSize}
            fontWeight={fonts.body2.fontWeight}
            lineHeight={24}
            maxLength={42}
            numberOfLines={1}
            px="$spacing16"
            py={5}
            returnKeyType="done"
            width="100%"
            borderWidth={1.5}
            borderColor="$neutral3"
            borderRadius="$rounded12"
            focusStyle={{
              borderColor: '$neutral3',
            }}
            hoverStyle={{
              borderColor: '$neutral3',
            }}
            value={hook.address}
            onChangeText={(text: string) => setHook({ address: text, confirmed: false })}
            onFocus={() => handleFocus(true)}
          />
          <Button theme="secondary" py="$spacing8" px="$spacing12" borderWidth={0} onPress={handleToggleHookInput}>
            <X size="$icon.20" color="$neutral1" />
          </Button>
          {showFlyout && <AutocompleteFlyout address={hook.address} handleSelectAddress={onSelectAddress} />}
        </Flex>
      </>
    )
  }

  return (
    <AdvancedButton
      title={t('position.addHook')}
      Icon={DocumentList}
      onPress={handleToggleHookInput}
      tooltipText={t('position.addHook.tooltip')}
    />
  )
}
