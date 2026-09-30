import { Flex, iconSizes, spacing, Text, TouchableArea } from '@universe/mycelium'
import { CheckboxCompat as Checkbox } from '@universe/mycelium/checkbox-compat'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Popover } from 'ui/src'
import { CheckCircleFilled, ChevronsOut } from 'ui/src/components/icons'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { UniswapContext, useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useEvent } from 'utilities/src/react/hooks'
import { OverlappingAccountIcons } from 'wallet/src/components/accounts/OverlappingAccountIcons'

export type AccountSelectionMode = 'single' | 'multiple'

type AccountSelectPopoverProps = {
  allAccountAddresses: string[]
  selectedAccountAddresses: string[]
  setSelectedAccountAddresses: (addresses: string[]) => void
  selectionMode?: AccountSelectionMode
  placement?: 'top-end' | 'bottom-end'
}

export function AccountSelectPopover({
  allAccountAddresses,
  selectedAccountAddresses,
  setSelectedAccountAddresses,
  selectionMode = 'single',
  placement = 'top-end',
}: AccountSelectPopoverProps): JSX.Element {
  const { t } = useTranslation()
  const walletUniswapContextValue = useUniswapContext()
  const accountIsSwitchable = allAccountAddresses.length > 1
  const [isOpen, setIsOpen] = useState(false)
  const colors = useSporeColors()

  const isSingleSelect = selectionMode === 'single'
  const disableDeselect = selectedAccountAddresses.length === 1

  const handleAccountSelect = useEvent((address: string) => {
    if (isSingleSelect) {
      setSelectedAccountAddresses([address])
      setIsOpen(false)
      return
    }

    if (selectedAccountAddresses.includes(address)) {
      if (disableDeselect) {
        return
      }
      setSelectedAccountAddresses(selectedAccountAddresses.filter((account: string) => account !== address))
    } else {
      setSelectedAccountAddresses([...selectedAccountAddresses, address])
    }
  })

  return (
    <Popover open={isOpen} placement={placement} offset={spacing.spacing12} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <TouchableArea disabled={!accountIsSwitchable} testID={TestID.SwitchAccount}>
          <Flex row alignItems="center" gap="$spacing8" justifyContent="space-between">
            <Text color="$neutral2" variant="body3">
              {t('dapp.request.approve.label')}
            </Text>
            <Flex row alignItems="center" userSelect="none" justifyContent="flex-end" gap="$spacing4">
              {isSingleSelect && selectedAccountAddresses[0] ? (
                <AddressDisplay
                  hideAddressInSubtitle
                  address={selectedAccountAddresses[0]}
                  horizontalGap="$spacing4"
                  size={iconSizes.icon24}
                  variant="body3"
                />
              ) : (
                <OverlappingAccountIcons accountAddresses={selectedAccountAddresses} iconSize={iconSizes.icon24} />
              )}
              {accountIsSwitchable && <ChevronsOut color="$neutral3" size={iconSizes.icon16} />}
            </Flex>
          </Flex>
        </TouchableArea>
      </Popover.Trigger>

      <Popover.Content
        elevate
        pointerEvents="auto"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        borderColor="$surface3"
        backgroundColor="$surface1"
        p="$spacing16"
        gap="$gap20"
      >
        {/* Bridge the Uniswap context into the popover so that the AddressDisplay component can use it */}
        <UniswapContext.Provider value={walletUniswapContextValue}>
          {allAccountAddresses.map((address) => {
            const isChecked = selectedAccountAddresses.includes(address)

            return (
              <Flex
                key={address}
                row
                justifyContent="space-between"
                gap="$gap32"
                width="100%"
                cursor="pointer"
                alignItems="center"
                borderRadius="$rounded12"
                px="$spacing8"
                py="$spacing4"
                pressStyle={{ backgroundColor: '$surface2' }}
                maxWidth="100%"
                onPress={() => handleAccountSelect(address)}
              >
                <AddressDisplay
                  grow
                  showAccountIcon
                  address={address}
                  hideAddressInSubtitle={false}
                  size={iconSizes.icon24}
                  textColor="$neutral1"
                  variant="buttonLabel3"
                  captionVariant="body4"
                />

                {isSingleSelect && isChecked && <CheckCircleFilled color="$neutral1" size="$icon.20" />}
                {!isSingleSelect && (
                  <Checkbox
                    checked={isChecked}
                    size="$icon.16"
                    disabled={disableDeselect && isChecked}
                    pointerEvents="none"
                    onCheckedChange={() => handleAccountSelect(address)}
                  />
                )}
              </Flex>
            )
          })}
          <Popover.Arrow backgroundColor={colors.surface1.val} borderColor={colors.surface3.val} />
        </UniswapContext.Provider>
      </Popover.Content>
    </Popover>
  )
}
