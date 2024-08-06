import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStackNavigation } from 'src/app/navigation/types'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { AccountType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

const DEFAULT_ACCOUNTS_TO_DISPLAY = 6

export function WalletSettings(): JSX.Element {
  const { t } = useTranslation()
  const navigation = useSettingsStackNavigation()
  const addressToAccount = useAccounts()
  const [showAll, setShowAll] = useState(false)

  const allAccounts = useMemo(() => {
    const accounts = Object.values(addressToAccount)
    const _mnemonicWallets = accounts
      .filter((a): a is SignerMnemonicAccount => a.type === AccountType.SignerMnemonic)
      .sort((a, b) => {
        return a.derivationIndex - b.derivationIndex
      })
    const _viewOnlyWallets = accounts
      .filter((a) => a.type === AccountType.Readonly)
      .sort((a, b) => {
        return a.timeImportedMs - b.timeImportedMs
      })
    return [..._mnemonicWallets, ..._viewOnlyWallets]
  }, [addressToAccount])

  const toggleViewAll = (): void => {
    setShowAll(!showAll)
  }

  const handleNavigation = (address: string): void => {
    navigation.navigate(MobileScreens.SettingsWallet, { address })
  }

  return (
    <Flex mb="$spacing16">
      <Flex row justifyContent="space-between">
        <Text color="$neutral2" variant="body1">
          {t('settings.section.wallet.title')}
        </Text>
      </Flex>
      {allAccounts.slice(0, showAll ? allAccounts.length : DEFAULT_ACCOUNTS_TO_DISPLAY).map((account) => {
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
                showViewOnlyLabel={isViewOnlyWallet}
                size={iconSizes.icon40}
                variant="body1"
              />
              <RotatableChevron color="$neutral3" direction="end" height={iconSizes.icon24} width={iconSizes.icon24} />
            </Flex>
          </TouchableArea>
        )
      })}
      {allAccounts.length > DEFAULT_ACCOUNTS_TO_DISPLAY && (
        <Button theme="tertiary" onPress={toggleViewAll}>
          <Text color="$neutral1" variant="buttonLabel4">
            {showAll ? t('settings.section.wallet.button.viewLess') : t('settings.section.wallet.button.viewAll')}
          </Text>
        </Button>
      )}
    </Flex>
  )
}
