import { Platform, areAddressesEqual } from '@universe/chains'
import { Flex, type FlexCompatProps, Text, TouchableArea } from '@universe/mycelium'
import { Unitag } from '@universe/mycelium/icons/Unitag'
import { X } from '@universe/mycelium/icons/X'
import { useShadowPropsMedium } from '@universe/mycelium/theme-hooks-compat'
import { type TouchableAreaCompatEvent } from '@universe/mycelium/touchable-area'
import { type ElementRef, forwardRef, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { capitalize } from 'tsafe'
import { AdaptiveWebPopoverContent, Input, type InputProps, Popover, Tooltip } from 'ui/src'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useENSName } from 'uniswap/src/features/ens/api'
import { useRecentTransfersByAddress, TransferCount } from 'uniswap/src/features/send/useRecentTransfersByAddress'
import { shortenAddress } from 'utilities/src/addresses'
import { useAccount } from '~/hooks/useAccount'
import { useOnClickOutside } from '~/hooks/useOnClickOutside'
import { RecipientData } from '~/pages/Swap/Send/state/hooks'
import { useSendContext } from '~/pages/Swap/Send/state/SendContext'

const SEND_RECIPIENT_INPUT_PADDING = 16

// Use Flex (not TouchableArea) so the editable recipient input is not nested
// inside a role="button" control on web.
const RecipientWrapper = ({
  isDisabled,
  isFocused,
  ...props
}: FlexCompatProps & { isDisabled?: boolean; isFocused?: boolean }): JSX.Element => (
  <Flex
    backgroundColor={isFocused ? '$surface1' : '$surface2'}
    borderRadius="$rounded16"
    padding={SEND_RECIPIENT_INPUT_PADDING}
    gap="$spacing4"
    opacity={isDisabled ? 0.4 : 1}
    pointerEvents={isDisabled ? 'none' : undefined}
    borderColor={isFocused ? '$surface3' : '$transparent'}
    borderWidth="$spacing1"
    {...props}
  />
)

const SendRecipientInput = forwardRef<ElementRef<typeof Input>, InputProps>(function SendRecipientInput(props, ref) {
  return (
    <Input
      ref={ref}
      unstyled
      width="100%"
      backgroundColor="transparent"
      borderWidth={0}
      outlineWidth={0}
      padding={0}
      fontSize={16}
      fontWeight="500"
      lineHeight={24}
      color="$neutral1"
      placeholderTextColor="$neutral3"
      focusStyle={{ outlineWidth: 0, outlineStyle: 'none', borderWidth: 0 }}
      focusVisibleStyle={{ outlineWidth: 0, outlineStyle: 'none', borderWidth: 0 }}
      $platform-web={{ outlineStyle: 'none', outlineWidth: 0 }}
      {...props}
    />
  )
})

type SendRecipientInputRef = ElementRef<typeof SendRecipientInput>

const AutocompletePanel = (props: FlexCompatProps): JSX.Element => (
  <Flex
    width="100%"
    backgroundColor="$surface1"
    borderWidth={1}
    borderColor="$surface3"
    borderRadius="$rounded12"
    padding="$spacing16"
    flexDirection="column"
    gap="$spacing4"
    {...props}
  />
)

const AutocompleteRow = ({
  address,
  validatedEnsName,
  numberOfTransfers,
  selectRecipient,
}: {
  address: string
  validatedEnsName?: string
  numberOfTransfers: number
  selectRecipient: (recipient: RecipientData) => void
}) => {
  const { t } = useTranslation()
  const account = useAccount()
  const { data: unitag } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })
  const { data: ENSName } = useENSName(address)
  const cachedEnsName = ENSName || validatedEnsName
  const formattedAddress = shortenAddress({ address, chars: 8 })
  const shouldShowAddress = !unitag?.username && !cachedEnsName

  const boundSelectRecipient = useCallback(
    () =>
      selectRecipient({
        address,
        ensName: cachedEnsName,
        unitag: unitag?.username,
      }),
    [address, cachedEnsName, selectRecipient, unitag?.username],
  )

  return (
    <Popover.Close asChild>
      <TouchableArea
        row
        width="100%"
        alignItems="center"
        justifyContent="space-between"
        p="$spacing8"
        hoverStyle={{ backgroundColor: '$surface1Hovered' }}
        onMouseDown={(e) => e.preventDefault()}
        onPress={boundSelectRecipient}
      >
        <Flex row gap="$gap8" alignItems="center">
          <AccountIcon address={address} size={36} />
          <Flex gap="$gap4">
            <Flex row gap="$gap4" alignItems="center">
              {shouldShowAddress ? (
                <Tooltip placement="top-start">
                  <Tooltip.Trigger>
                    <Text variant="subheading2">{formattedAddress}</Text>
                  </Tooltip.Trigger>
                  <Tooltip.Content maxWidth="fit-content">
                    <Text variant="body4">{address}</Text>
                  </Tooltip.Content>
                </Tooltip>
              ) : (
                <Text variant="body2">{unitag?.username ?? cachedEnsName}</Text>
              )}
              {unitag?.username && (
                <Flex pt="$spacing2">
                  <Unitag size={18} />
                </Flex>
              )}
            </Flex>
            {!shouldShowAddress && (
              <Tooltip placement="top-start">
                <Tooltip.Trigger>
                  <Text variant="body3" color="$neutral2">
                    {formattedAddress}
                  </Text>
                </Tooltip.Trigger>
                <Tooltip.Content maxWidth="fit-content">
                  <Text variant="body4">{address}</Text>
                </Tooltip.Content>
              </Tooltip>
            )}
          </Flex>
        </Flex>
        {account.isConnected && (
          <Text variant="body2" color="$neutral2" flexShrink={0}>
            {numberOfTransfers} {t('common.transfer', { count: numberOfTransfers })}
          </Text>
        )}
      </TouchableArea>
    </Popover.Close>
  )
}

interface AutocompleteFlyoutProps {
  transfers: TransferCount[]
  validatedRecipientData?: RecipientData
  selectRecipient: (recipient: RecipientData) => void
}

function AutocompleteFlyout(props: AutocompleteFlyoutProps) {
  const { transfers, validatedRecipientData, selectRecipient } = props
  const { t } = useTranslation()
  const shadowProps = useShadowPropsMedium()

  if (validatedRecipientData) {
    return (
      <AutocompletePanel {...shadowProps} onPointerDown={(e) => e.preventDefault()}>
        <AutocompleteRow
          address={validatedRecipientData.address}
          validatedEnsName={validatedRecipientData.ensName}
          numberOfTransfers={
            transfers.find((transfer) =>
              areAddressesEqual({
                addressInput1: { address: transfer.address, platform: Platform.EVM },
                addressInput2: { address: validatedRecipientData.address, platform: Platform.EVM },
              }),
            )?.count ?? 0
          }
          selectRecipient={selectRecipient}
        />
      </AutocompletePanel>
    )
  }

  if (transfers.length === 0) {
    return null
  }

  return (
    <AutocompletePanel {...shadowProps} onPointerDown={(e) => e.preventDefault()}>
      <Text variant="body3" color="$neutral2">
        {t('sendRecipientForm.recentAddresses.label')}
      </Text>
      {transfers.slice(0, 3).map((transfer) => (
        <AutocompleteRow
          key={transfer.address}
          address={transfer.address}
          numberOfTransfers={transfer.count}
          selectRecipient={selectRecipient}
        />
      ))}
    </AutocompletePanel>
  )
}

export function SendRecipientForm({ disabled }: { disabled?: boolean }) {
  const { t } = useTranslation()
  const account = useAccount()
  const { sendState, setSendState, derivedSendInfo } = useSendContext()
  const { recipient, validatedRecipientData } = sendState
  const { recipientData } = derivedSendInfo

  const { transfers: recentTransfers } = useRecentTransfersByAddress(account.address)

  const [[isFocusing, isForcingFocus], setFocus] = useState([false, false])
  const handleFocus = useCallback((focus: boolean) => setFocus([focus, false]), [])
  const handleForceFocus = useCallback((focus: boolean) => setFocus([focus, true]), [])

  const inputWrapperNode = useRef<HTMLDivElement | null>(null)
  const inputNode = useRef<SendRecipientInputRef | null>(null)
  const popoverContentRef = useRef<HTMLDivElement | null>(null)
  /** When true, ignore blur-driven commit — `blur()` runs before validatedRecipientData flushes from select/Enter. */
  const skipBlurRecipientCommitRef = useRef(false)
  useOnClickOutside({
    node: inputWrapperNode,
    handler: isFocusing
      ? () => {
          inputNode.current?.blur()
          handleFocus(false)
        }
      : undefined,
    ignoredNodes: [popoverContentRef],
  })

  /** When to render flyout body: focused + resolved match and/or recents shell. Popover `open` uses `isFocusing` so Enter/blur matches main. */
  const showFlyout = isFocusing && (!!recipientData || !recipient)
  const showInputField = !validatedRecipientData || isFocusing || isForcingFocus

  const handleInputValidatedRecipient = useCallback(
    (value?: RecipientData) => {
      setSendState((prev) => ({
        ...prev,
        recipient: value?.address ?? '',
        validatedRecipientData: value,
      }))
    },
    [setSendState],
  )

  const handleRecipientChangeText = useCallback(
    (text: string) => {
      const inputWithoutSpaces = text.replace(/\s+/g, '')
      setSendState((prev) => ({
        ...prev,
        recipient: inputWithoutSpaces,
        validatedRecipientData: undefined,
      }))
    },
    [setSendState],
  )

  const selectValidatedRecipient = useCallback(
    (value: RecipientData) => {
      skipBlurRecipientCommitRef.current = true
      handleInputValidatedRecipient(value)
      inputNode.current?.blur()
      handleFocus(false)
      queueMicrotask(() => {
        skipBlurRecipientCommitRef.current = false
      })
    },
    [handleFocus, handleInputValidatedRecipient],
  )

  const clearValidatedRecipient = useCallback(
    (e: TouchableAreaCompatEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleForceFocus(true)
      handleInputValidatedRecipient(undefined)
    },
    [handleForceFocus, handleInputValidatedRecipient],
  )

  const editValidatedRecipient = useCallback(() => {
    handleForceFocus(true)
  }, [handleForceFocus])

  /** Tamagui `Input` is RN `TextInput`; Enter is `onSubmitEditing`, not reliably `onKeyDown` like a native `<input>`. */
  const handleRecipientSubmitEditing = useCallback(() => {
    if (!recipientData) {
      return
    }
    selectValidatedRecipient(recipientData)
  }, [recipientData, selectValidatedRecipient])

  const handleRecipientInputBlur = useCallback(() => {
    if (!skipBlurRecipientCommitRef.current && !validatedRecipientData && recipientData) {
      handleInputValidatedRecipient(recipientData)
    }
    handleFocus(false)
  }, [handleFocus, handleInputValidatedRecipient, recipientData, validatedRecipientData])

  const focusRecipientInput = useCallback(() => {
    if (disabled) {
      return
    }
    handleFocus(true)
    inputNode.current?.focus()
  }, [disabled, handleFocus])

  return (
    <Popover open={isFocusing} placement="bottom" allowFlip stayInFrame>
      <Popover.Anchor ref={inputWrapperNode}>
        <RecipientWrapper
          isDisabled={disabled}
          isFocused={isFocusing}
          cursor={showInputField && !disabled ? 'text' : undefined}
          onPress={() => showInputField && focusRecipientInput()}
        >
          {showInputField ? (
            <Flex>
              <Text variant="body3" userSelect="none" color="$neutral2">
                {capitalize(t('common.to'))}
              </Text>
              <SendRecipientInput
                ref={inputNode}
                aria-label={capitalize(t('common.to'))}
                accessibilityLabel={capitalize(t('common.to'))}
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                returnKeyType="done"
                placeholder={recipientData ? '' : t('common.addressOrENS')}
                // @ts-expect-error Web-only `<input pattern>`; Tamagui `Input` typings omit it (RN `TextInput`).
                pattern="^(0x[a-fA-F0-9]{40})$"
                value={recipient}
                onChangeText={handleRecipientChangeText}
                onBlur={handleRecipientInputBlur}
                onFocus={() => handleFocus(true)}
                onSubmitEditing={handleRecipientSubmitEditing}
                autoFocus={isForcingFocus}
              />
            </Flex>
          ) : (
            <Flex row py="$spacing6" justifyContent="space-between" alignItems="center">
              <TouchableArea row alignItems="center" gap="$spacing12" onPress={editValidatedRecipient}>
                <AccountIcon address={validatedRecipientData.address} size={36} />
                <Flex gap="$spacing4">
                  <Flex row alignItems="center" gap="$spacing4">
                    <Text variant="body2">
                      {validatedRecipientData.unitag ??
                        validatedRecipientData.ensName ??
                        shortenAddress({ address: validatedRecipientData.address })}
                    </Text>
                    {validatedRecipientData.unitag && (
                      <Flex pt="$spacing2">
                        <Unitag size={18} />
                      </Flex>
                    )}
                  </Flex>
                  {Boolean(validatedRecipientData.ensName) && (
                    <Text variant="body4" color="$neutral2">
                      {shortenAddress({ address: validatedRecipientData.address })}
                    </Text>
                  )}
                </Flex>
              </TouchableArea>
              <TouchableArea
                aria-label="Clear recipient"
                accessibilityLabel="Clear recipient"
                onPress={clearValidatedRecipient}
              >
                <X size="$icon.20" color="$neutral3" />
              </TouchableArea>
            </Flex>
          )}
        </RecipientWrapper>
      </Popover.Anchor>
      <AdaptiveWebPopoverContent
        adaptWhen={false}
        isOpen={isFocusing}
        placement="bottom"
        disableFocusScope
        background="transparent"
        animation="quick"
        animateOnly={['transform', 'opacity']}
        enterStyle={{ y: -12, opacity: 0 }}
        exitStyle={{ y: -12, opacity: 0 }}
        width={(inputWrapperNode.current?.getBoundingClientRect().width ?? 0) + SEND_RECIPIENT_INPUT_PADDING * 2}
        ref={popoverContentRef}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
        }}
      >
        {showFlyout ? (
          <AutocompleteFlyout
            transfers={recentTransfers}
            validatedRecipientData={recipientData}
            selectRecipient={selectValidatedRecipient}
          />
        ) : null}
      </AdaptiveWebPopoverContent>
    </Popover>
  )
}
