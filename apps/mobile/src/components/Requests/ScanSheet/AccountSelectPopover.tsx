import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox, Flex, Popover, Text, TouchableArea, useSporeColors } from 'ui/src'
import { DoubleChevronInverted } from 'ui/src/components/icons'
import { iconSizes, spacing } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { UniswapContext, useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { OverlappingAccountIcons } from 'wallet/src/components/accounts/OverlappingAccountIcons'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

type SwitchAccountProps = {
  allAccountAddresses: string[]
  selectedAccountAddresses: string[]
  setSelectedAccountAddresses: (addresses: string[]) => void
}

export const AccountSelectPopover = ({
  allAccountAddresses,
  selectedAccountAddresses,
  setSelectedAccountAddresses,
}: SwitchAccountProps): JSX.Element => {
  const { t } = useTranslation()
  const signerAccounts = useSignerAccounts()
  const walletUniswapContextValue = useUniswapContext()
  const accountIsSwitchable = signerAccounts.length > 1
  const [isOpen, setIsOpen] = useState(false)
  const colors = useSporeColors()

  const disableDeselect = selectedAccountAddresses.length === 1

  const handleAccountSelect = useEvent((address: string) => {
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
    <Popover open={isOpen} placement="top-end" offset={spacing.spacing12} onOpenChange={setIsOpen}>
      <TouchableArea
        disabled={!accountIsSwitchable}
        testID={TestID.WCDappSwitchAccount}
        onPress={() => accountIsSwitchable && setIsOpen(true)}
      >
        <Popover.Trigger asChild>
          <Flex row alignItems="center" gap="$spacing8" justifyContent="space-between">
            <Text color="$neutral2" variant="body3">
              {t('dapp.request.approve.label')}
            </Text>
            <Flex row alignItems="center" justifyContent="flex-end" gap="$spacing4">
              <OverlappingAccountIcons accountAddresses={selectedAccountAddresses} iconSize={iconSizes.icon24} />
              {accountIsSwitchable && <DoubleChevronInverted color="$neutral3" size={iconSizes.icon16} />}
            </Flex>
          </Flex>
        </Popover.Trigger>
      </TouchableArea>

      <Popover.Content
        elevate
        borderRadius="$rounded20"
        borderWidth={1}
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
                alignItems="center"
                borderRadius="$rounded12"
                px="$spacing8"
                py="$spacing4"
                pressStyle={{ backgroundColor: '$surface2' }}
                onPress={() => handleAccountSelect(address)}
              >
                <AddressDisplay
                  showAccountIcon
                  address={address}
                  hideAddressInSubtitle={false}
                  size={iconSizes.icon24}
                  textColor="$neutral1"
                  variant="buttonLabel3"
                  captionVariant="body4"
                  flexGrow={false}
                />
                <Checkbox
                  checked={isChecked}
                  size="$icon.16"
                  disabled={disableDeselect}
                  pointerEvents="none"
                  onCheckedChange={() => handleAccountSelect(address)}
                />
              </Flex>
            )
          })}
          <Popover.Arrow backgroundColor={colors.surface1.val} borderColor={colors.surface3.val} />
        </UniswapContext.Provider>
      </Popover.Content>
    </Popover>
  )
}
