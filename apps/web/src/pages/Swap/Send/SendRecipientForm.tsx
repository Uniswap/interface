import Column, { AutoColumn } from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useAccount } from 'hooks/useAccount'
import { useGroupedRecentTransfers } from 'hooks/useGroupedRecentTransfers'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useUnmountingAnimation } from 'hooks/useUnmountingAnimation'
import styled, { css, keyframes } from 'lib/styled-components'
import { ChangeEvent, ForwardedRef, forwardRef, KeyboardEvent, useCallback, useRef, useState } from 'react'
import { X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { RecipientData } from 'state/send/hooks'
import { useSendContext } from 'state/send/SendContext'
import { ThemedText } from 'theme/components'
import { AnimationType } from 'theme/components/FadePresence'
import { ClickableStyle } from 'theme/components/styles'
import { capitalize } from 'tsafe'
import { Flex, Popover, Text, Tooltip, styled as UIStyled } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useENSName } from 'uniswap/src/features/ens/api'
import { shortenAddress } from 'utilities/src/addresses'

const StyledConfirmedRecipientRow = styled(Row)`
  padding: 6px 0px;
  justify-content: space-between;
`

const StyledConfirmedRecipientDisplayRow = styled(Row)`
  ${ClickableStyle}
`

const StyledCloseIcon = styled(X)`
  color: ${({ theme }) => theme.neutral3};
  ${ClickableStyle}
`

const RecipientWrapper = UIStyled(Flex, {
  position: 'relative',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  padding: '$spacing16',
  gap: '$spacing4',
  opacity: 1,
  borderColor: '$transparent',
  borderWidth: '$spacing1',

  variants: {
    isDisabled: {
      true: {
        opacity: 0.4,
        pointerEvents: 'none',
      },
    },
    isFocused: {
      true: {
        borderColor: '$surface3',
        backgroundColor: '$surface1',
      },
    },
  } as const,
})

const StyledRecipientInput = styled.input`
  background: none;
  width: 100%;
  color: ${({ theme }) => theme.neutral1};
  outline: none;
  border: none;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;

  ::placeholder {
    color: ${({ theme }) => theme.neutral3};
  }
`

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(-40px) }
  to { opacity: 1; transform: translateY(0px) }
`
const slideInAnimation = css`
  animation: ${slideIn} ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`

const slideOut = keyframes`
  from { opacity: 1; transform: translateY(0px) }
  to { opacity: 0; transform: translateY(-40px) }
`
const slideOutAnimation = css`
  animation: ${slideOut} ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`

const MenuFlyout = styled(AutoColumn)`
  width: 100%;
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  box-shadow:
    0px 0px 1px rgba(0, 0, 0, 0.01),
    0px 4px 8px rgba(0, 0, 0, 0.04),
    0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  position: absolute;
  z-index: 100;
  padding: 16px;
  transition: display ${({ theme }) => `${theme.transition.duration.fast} ${theme.transition.timing.inOut}`};
  ${slideInAnimation}
  &.${AnimationType.EXITING} {
    ${slideOutAnimation}
  }
`

const StyledTransferText = styled(ThemedText.BodySecondary)`
  flex-shrink: 0;
`

const StyledAutocompleteRow = styled(Row)`
  ${ClickableStyle}
`

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
    <StyledAutocompleteRow justify="space-between" padding="8px 0px" onClick={boundSelectRecipient}>
      <Row gap="sm">
        <AccountIcon address={address} size={36} />
        <Column>
          <Row gap="xs">
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
              <ThemedText.BodyPrimary lineHeight="24px">{unitag?.username ?? cachedEnsName}</ThemedText.BodyPrimary>
            )}
            {unitag?.username && <Unitag size={18} />}
          </Row>
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
        </Column>
      </Row>
      {account.isConnected && (
        <StyledTransferText>
          {numberOfTransfers} {t('common.transfer', { count: numberOfTransfers })}
        </StyledTransferText>
      )}
    </StyledAutocompleteRow>
  )
}

interface AutocompleteFlyoutProps {
  transfers?: { [address: string]: number }
  validatedRecipientData?: RecipientData
  selectRecipient: (recipient: RecipientData) => void
}

const AutocompleteFlyout = forwardRef((props: AutocompleteFlyoutProps, ref: ForwardedRef<HTMLDivElement>) => {
  const { transfers, validatedRecipientData, selectRecipient } = props
  const { t } = useTranslation()

  if (validatedRecipientData) {
    return (
      <MenuFlyout ref={ref}>
        <AutocompleteRow
          address={validatedRecipientData.address}
          validatedEnsName={validatedRecipientData.ensName}
          numberOfTransfers={transfers?.[validatedRecipientData.address] ?? 0}
          selectRecipient={selectRecipient}
        />
      </MenuFlyout>
    )
  }

  if (!transfers) {
    return null
  }

  return (
    <MenuFlyout ref={ref}>
      <ThemedText.SubHeaderSmall>{t('sendRecipientForm.recentAddresses.label')}</ThemedText.SubHeaderSmall>
      {Object.keys(transfers)
        .slice(0, 3)
        .map((address) => (
          <AutocompleteRow
            key={address}
            address={address}
            numberOfTransfers={transfers[address]}
            selectRecipient={selectRecipient}
          />
        ))}
    </MenuFlyout>
  )
})

AutocompleteFlyout.displayName = 'AutocompleteFlyout'

export function SendRecipientForm({ disabled }: { disabled?: boolean }) {
  const { t } = useTranslation()
  const account = useAccount()
  const { sendState, setSendState, derivedSendInfo } = useSendContext()
  const { recipient } = sendState
  const { recipientData } = derivedSendInfo

  const { transfers: recentTransfers } = useGroupedRecentTransfers(account.address)

  const [[isFocusing, isForcingFocus], setFocus] = useState([false, false])
  const handleFocus = useCallback((focus: boolean) => setFocus([focus, false]), [])
  const handleForceFocus = useCallback((focus: boolean) => setFocus([focus, true]), [])

  const inputNode = useRef<HTMLInputElement | null>(null)
  const inputWrapperNode = useRef<HTMLDivElement | null>(null)
  const popoverContentRef = useRef<HTMLDivElement | null>(null)
  useOnClickOutside({
    node: inputWrapperNode,
    handler: isFocusing ? () => handleFocus(false) : undefined,
    ignoredNodes: [popoverContentRef],
  })

  const showFlyout = isFocusing && (!!recipientData || !recipient)
  const flyoutRef = useRef<HTMLDivElement>(null)
  useUnmountingAnimation({ node: flyoutRef, getAnimatingClass: () => AnimationType.EXITING })

  const handleInputValidatedRecipient = useCallback(
    (value?: RecipientData) => {
      setSendState((prev) => ({
        ...prev,
        recipient: value?.address ?? '',
        validatedRecipient: value,
      }))
    },
    [setSendState],
  )

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target.value
      const inputWithoutSpaces = input.replace(/\s+/g, '')
      setSendState((prev) => ({
        ...prev,
        recipient: inputWithoutSpaces,
        validatedRecipient: undefined,
      }))
    },
    [setSendState],
  )

  const selectValidatedRecipient = useCallback(
    (value: RecipientData) => {
      if (!recipientData) {
        handleInputValidatedRecipient(value)
      }

      handleFocus(false)
      inputNode.current?.blur()
    },
    [handleFocus, handleInputValidatedRecipient, recipientData],
  )

  const clearValidatedRecipient = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
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

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (recipientData) {
          inputNode.current?.blur()
          handleFocus(false)
        }
      }
    },
    [handleFocus, recipientData],
  )

  const showInputField = !recipientData || isFocusing || isForcingFocus

  return (
    <RecipientWrapper isDisabled={disabled} isFocused={isFocusing}>
      <Popover open={isFocusing} placement="bottom-start" offset={{ crossAxis: -16 }}>
        <Popover.Trigger>
          {showInputField ? (
            <Flex ref={inputWrapperNode}>
              <Text variant="body3" userSelect="none" color="$neutral2">
                {capitalize(t('common.to'))}
              </Text>
              <StyledRecipientInput
                ref={inputNode}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                placeholder={recipientData ? '' : t('common.addressOrENS')}
                pattern="^(0x[a-fA-F0-9]{40})$"
                onChange={handleInput}
                onFocus={() => handleFocus(true)}
                value={recipient}
                onKeyDown={handleEnter}
                autoFocus={isForcingFocus}
              />
            </Flex>
          ) : (
            <StyledConfirmedRecipientRow>
              <StyledConfirmedRecipientDisplayRow gap="md" onClick={editValidatedRecipient}>
                <AccountIcon address={recipientData.address} size={36} />
                <Column>
                  <Row gap="xs">
                    <ThemedText.BodyPrimary lineHeight="24px">
                      {recipientData.unitag ??
                        recipientData.ensName ??
                        shortenAddress({ address: recipientData.address })}
                    </ThemedText.BodyPrimary>
                    {recipientData.unitag && <Unitag size={18} />}
                  </Row>
                  {Boolean(recipientData.ensName) && (
                    <ThemedText.LabelMicro lineHeight="16px">
                      {shortenAddress({ address: recipientData.address })}
                    </ThemedText.LabelMicro>
                  )}
                </Column>
              </StyledConfirmedRecipientDisplayRow>
              <StyledCloseIcon size={20} onClick={clearValidatedRecipient} />
            </StyledConfirmedRecipientRow>
          )}
        </Popover.Trigger>
        <Popover.Content
          background="transparent"
          width={(inputNode.current?.clientWidth ?? 0) + 32}
          ref={popoverContentRef}
        >
          {showFlyout && (
            <AutocompleteFlyout
              ref={flyoutRef}
              transfers={recentTransfers}
              validatedRecipientData={recipientData}
              selectRecipient={selectValidatedRecipient}
            />
          )}
        </Popover.Content>
      </Popover>
    </RecipientWrapper>
  )
}
