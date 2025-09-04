import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { Flex, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAccountsList, useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

const DEFAULT_ACCOUNTS_TO_DISPLAY = 3
interface Account {
  address: string
  type: AccountType
}

export function WalletSettings(): JSX.Element {
  const { t } = useTranslation()
  const allAccounts = useAccountsList()
  const [showAll, setShowAll] = useState(false)

  const activeAccount = useActiveAccountWithThrow()
  const activeAddress = activeAccount.address

  const accountsWithoutActiveAccount = allAccounts.filter((a) => a.address !== activeAddress)

  const toggleViewAll = (): void => {
    setShowAll(!showAll)
  }

  const handleNavigation = (address: string): void => {
    navigate(ModalName.ManageWalletsModal, {
      address,
    })
  }

  const renderAccountRow = (account: Account): JSX.Element => {
    const isViewOnlyWallet = account.type === AccountType.Readonly
    return (
      <TouchableArea
        key={account.address}
        pl="$spacing4"
        py="$spacing12"
        onPress={(): void => handleNavigation(account.address)}
      >
        <Flex row alignItems="center" justifyContent="space-between">
          <AddressDisplay
            showIconBackground
            address={account.address}
            captionVariant="subheading2"
            showViewOnlyBadge={isViewOnlyWallet}
            size={iconSizes.icon40}
            variant="body1"
          />
          <RotatableChevron color="$neutral3" direction="end" height={iconSizes.icon24} width={iconSizes.icon24} />
        </Flex>
      </TouchableArea>
    )
  }

  return (
    <Flex mb="$spacing16">
      {allAccounts.length > DEFAULT_ACCOUNTS_TO_DISPLAY ? (
        <>
          {renderAccountRow(activeAccount)}

          <ExpandoRow
            isExpanded={showAll}
            label={t('settings.section.wallet.hidden.row.title', { numHidden: allAccounts.length - 1 })}
            onPress={(): void => toggleViewAll()}
          />

          {showAll && accountsWithoutActiveAccount.map(renderAccountRow)}
        </>
      ) : (
        <>
          {renderAccountRow(activeAccount)}
          {accountsWithoutActiveAccount.map(renderAccountRow)}
        </>
      )}
    </Flex>
  )
}
