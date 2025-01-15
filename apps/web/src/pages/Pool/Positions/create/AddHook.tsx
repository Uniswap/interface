import { HookModal } from 'components/Liquidity/HookModal'
import { isDynamicFeeTier } from 'components/Liquidity/utils'
import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { AdvancedButton } from 'pages/Pool/Positions/create/shared'
import { DEFAULT_POSITION_STATE } from 'pages/Pool/Positions/create/types'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Text, TouchableArea, styled } from 'ui/src'
import { DocumentList } from 'ui/src/components/icons/DocumentList'
import { X } from 'ui/src/components/icons/X'
import { Flex } from 'ui/src/components/layout/Flex'
import { fonts } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { useOnClickOutside } from 'utilities/src/react/hooks'

const MenuFlyout = styled(Flex, {
  animation: 'fastHeavy',
  enterStyle: { top: 30, opacity: 0 },
  exitStyle: { top: 30, opacity: 0 },
  width: 'calc(100% - 48px)',
  backgroundColor: '$surface2',
  borderColor: '$surface3',
  borderWidth: 1,
  borderRadius: '$rounded12',
  position: 'absolute',
  top: 40,
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
        <Text variant="body2" color="$neutral2">
          {t('position.addingHook.invalidAddress')}
        </Text>
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

  const [hookValue, setHookValue] = useState('')
  const {
    positionState: { hook, fee },
    setPositionState,
  } = useCreatePositionContext()

  const onSelectHook = (value: string | undefined) => {
    setPositionState((state) => ({
      ...state,
      hook: value,
    }))
  }

  const onClearHook = () => {
    if (isDynamicFeeTier(fee)) {
      setPositionState((state) => ({
        ...state,
        fee: DEFAULT_POSITION_STATE.fee,
      }))
    }

    setHookInputEnabled(false)
    setHookValue('')
    onSelectHook(undefined)
  }

  if (hookInputEnabled) {
    const showFlyout = isFocusing && hookValue

    return (
      <>
        {hookModalOpen && (
          // intentionally only render this when the value is true to ensure that the address is valid.
          <HookModal
            isOpen={hookModalOpen}
            address={hookValue}
            onClose={() => setHookModalOpen(false)}
            onClearHook={() => {
              setHookInputEnabled(false)
              setHookValue('')
            }}
            onContinue={() => onSelectHook(hookValue)}
          />
        )}
        {hook ? (
          <Flex row alignItems="center" gap="$spacing12">
            <TouchableArea
              onPress={() => {
                setHookInputEnabled(true)
                onSelectHook(undefined)
              }}
            >
              <Flex
                row
                alignItems="center"
                backgroundColor="$surface3"
                borderRadius="$rounded12"
                gap="$gap8"
                py="$padding8"
                px="$padding12"
              >
                <DocumentList size="$icon.20" color="$neutral1" />
                <Text variant="buttonLabel3">{shortenAddress(hook)}</Text>
              </Flex>
            </TouchableArea>
            <TouchableArea onPress={onClearHook}>
              <Text variant="buttonLabel4" color="$neutral2">
                {t('common.clear')}
              </Text>
            </TouchableArea>
          </Flex>
        ) : (
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
              value={hookValue}
              onChangeText={setHookValue}
              onFocus={() => handleFocus(true)}
            />
            <Button
              theme="secondary"
              py="$spacing8"
              px="$spacing12"
              borderWidth={0}
              borderRadius="$rounded12"
              onPress={() => {
                setHookInputEnabled(false)
                setHookValue('')
              }}
            >
              <X size="$icon.20" color="$neutral1" />
            </Button>
            {showFlyout && (
              <AutocompleteFlyout address={hookValue} handleSelectAddress={() => setHookModalOpen(true)} />
            )}
          </Flex>
        )}
      </>
    )
  }

  return (
    <AdvancedButton
      title={t('position.addHook')}
      Icon={DocumentList}
      onPress={() => setHookInputEnabled(true)}
      tooltipText={t('position.addHook.tooltip')}
      elementName={ElementName.AddHook}
    />
  )
}
