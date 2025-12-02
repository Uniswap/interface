import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { AdvancedButton } from 'components/Liquidity/Create/AdvancedButton'
import { useLiquidityUrlState } from 'components/Liquidity/Create/hooks/useLiquidityUrlState'
import { HookModal } from 'components/Liquidity/HookModal'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton, styled, Text, TouchableArea } from 'ui/src'
import { DocumentList } from 'ui/src/components/icons/DocumentList'
import { X } from 'ui/src/components/icons/X'
import { Flex } from 'ui/src/components/layout/Flex'
import { fonts } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { useOnClickOutside, usePrevious } from 'utilities/src/react/hooks'
import { getAddress } from 'viem'

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

function AutocompleteFlyout({
  address,
  handleSelectAddress,
}: {
  address: string
  handleSelectAddress: (checksummedAddress: string) => void
}) {
  const { t } = useTranslation()

  const potentialChecksummedAddress = useMemo(() => {
    const validChecksummedAddress = getValidAddress({ address, withEVMChecksum: true, platform: Platform.EVM })

    let result: string | null = validChecksummedAddress
    if (!result) {
      try {
        result = getAddress(address)
      } catch {
        result = null
      }
    }
    return result
  }, [address])

  return (
    <MenuFlyout>
      {potentialChecksummedAddress ? (
        <TouchableArea onPress={() => handleSelectAddress(potentialChecksummedAddress)}>
          <Text variant="body2">{potentialChecksummedAddress}</Text>
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
  useOnClickOutside({
    node: inputWrapperNode,
    handler: isFocusing ? () => handleFocus(false) : undefined,
  })

  const [hookModalOpen, setHookModalOpen] = useState(false)

  const { hook: initialHook } = useLiquidityUrlState()
  const {
    positionState: { hook, protocolVersion },
    setPositionState,
  } = useCreateLiquidityContext()
  const [hookInputEnabled, setHookInputEnabled] = useState(!!hook)
  const [hookValue, setHookValue] = useState(hook ?? '')

  const onSelectHook = useCallback(
    (value: string | undefined) => {
      setPositionState((state) => ({
        ...state,
        hook: value,
        userApprovedHook: value,
        fee: undefined,
      }))
    },
    [setPositionState],
  )

  useEffect(() => {
    if (initialHook && protocolVersion === ProtocolVersion.V4) {
      setPositionState((state) => ({
        ...state,
        hook: initialHook,
      }))
      setHookInputEnabled(true)
    }
  }, [initialHook, protocolVersion, setPositionState])

  const onClearHook = useCallback(() => {
    setHookInputEnabled(false)
    setHookValue('')
    onSelectHook(undefined)
    setPositionState((state) => ({ ...state, fee: undefined }))
  }, [onSelectHook, setPositionState])

  // In the case that the user clears a hook that was filled in from a url
  // this ensures the input is cleared again
  const previousHook = usePrevious(hook)
  useEffect(() => {
    if (previousHook && !hook) {
      onClearHook()
    }
  }, [hook, onClearHook, previousHook])

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
            onClearHook={onClearHook}
            onContinue={() => onSelectHook(hookValue)}
          />
        )}
        {hook ? (
          <Flex row alignItems="center" gap="$spacing12">
            <TouchableArea
              onPress={() => {
                setHookModalOpen(true)
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
                <Text variant="buttonLabel3">{shortenAddress({ address: hook })}</Text>
              </Flex>
            </TouchableArea>
            <TouchableArea
              onPress={(e) => {
                e.preventDefault()
                onClearHook()
              }}
            >
              <Text variant="buttonLabel4" color="$neutral2">
                {t('common.clear')}
              </Text>
            </TouchableArea>
          </Flex>
        ) : (
          <Flex ref={inputWrapperNode} row gap="$spacing4">
            <TextInput
              autoFocus
              placeholder={t('liquidity.hooks.address.input')}
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
            <IconButton
              size="xsmall"
              emphasis="secondary"
              onPress={() => {
                setHookInputEnabled(false)
                setHookValue('')
              }}
              icon={<X />}
            />
            {showFlyout && (
              <AutocompleteFlyout
                address={hookValue}
                handleSelectAddress={(checksummedAddress: string) => {
                  setHookValue(checksummedAddress)
                  setHookModalOpen(true)
                }}
              />
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
