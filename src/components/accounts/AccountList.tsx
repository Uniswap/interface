import { ComponentProps, default as React, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { AccountCardItem } from 'src/components/accounts/AccountCardItem'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'

type AccountListProps = Pick<ComponentProps<typeof AccountCardItem>, 'onPress' | 'onPressEdit'> & {
  mnenomicAccounts: Account[]
  viewOnlyAccounts: Account[]
}

export function AccountList({
  mnenomicAccounts,
  viewOnlyAccounts,
  onPressEdit,
  onPress,
}: AccountListProps) {
  const { t } = useTranslation()

  const activeAccount = useActiveAccount()

  const sectionData = useMemo(
    () => [
      ...(mnenomicAccounts.length > 0
        ? [
            {
              title: t('Wallets'),
              data: mnenomicAccounts,
            },
          ]
        : []),
      ...(viewOnlyAccounts.length > 0
        ? [
            {
              title: t('View Only'),
              data: viewOnlyAccounts,
            },
          ]
        : []),
    ],
    [mnenomicAccounts, t, viewOnlyAccounts]
  )

  const renderSectionHeader = useMemo(() => {
    return ({ section: { title } }: { section: { title: string } }) => (
      <Box bg="backgroundBackdrop" pb="md" px="lg">
        <Text variant="body">{title}</Text>
      </Box>
    )
  }, [])

  const renderItem = useMemo(
    () =>
      ({ item }: ListRenderItemInfo<Account>) => {
        return (
          <AccountCardItem
            account={item}
            isActive={!!activeAccount && activeAccount.address === item.address}
            isViewOnly={item.type === AccountType.Readonly}
            onPress={onPress}
            onPressEdit={onPressEdit}
          />
        )
      },
    [activeAccount, onPress, onPressEdit]
  )

  return (
    <SectionList
      keyExtractor={key}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      sections={sectionData}
      showsVerticalScrollIndicator={false}
    />
  )
}

const key = (account: Account) => account.address
