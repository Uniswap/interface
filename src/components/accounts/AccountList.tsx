import { LinearGradient } from 'expo-linear-gradient'
import { ComponentProps, default as React, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import PlusIcon from 'src/assets/icons/plus.svg'
import { AccountCardItem } from 'src/components/accounts/AccountCardItem'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { spacing } from 'src/styles/sizing'

type AccountListProps = Pick<ComponentProps<typeof AccountCardItem>, 'onPress' | 'onPressEdit'> & {
  accounts: Account[]
  onAddWallet: () => void
}

const STICKY_HEADER_INDICES = [0]

export function AccountList({ accounts, onAddWallet, onPressEdit, onPress }: AccountListProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const activeAccount = useActiveAccount()

  const ListHeader = useMemo(
    () => (
      <Flex row alignItems="center" bg="background0" borderBottomColor="backgroundOutline" pb="sm">
        <Box flex={1}>
          <Text color="textPrimary" px="lg" variant="bodyLarge">
            {t('Your wallets')}
          </Text>
        </Box>
        <TouchableArea
          borderColor="backgroundOutline"
          borderRadius="full"
          borderWidth={1}
          mr="md"
          p="xs"
          onPress={onAddWallet}>
          <PlusIcon
            color={theme.colors.textSecondary}
            height={theme.iconSizes.sm}
            width={theme.iconSizes.sm}
          />
        </TouchableArea>
      </Flex>
    ),
    [t, theme, onAddWallet]
  )

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
    <Box flexShrink={1} position="relative">
      <FlatList
        ListFooterComponent={<Box height={theme.spacing.lg} />}
        ListHeaderComponent={ListHeader}
        bounces={false}
        data={accounts}
        keyExtractor={key}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={STICKY_HEADER_INDICES}
      />
      <LinearGradient
        colors={[theme.colors.translucentBackgroundBackdrop, theme.colors.background0]}
        end={{ x: 0, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={ListSheet.gradient}
      />
    </Box>
  )
}

const key = (account: Account) => account.address

const ListSheet = StyleSheet.create({
  gradient: {
    bottom: 0,
    height: spacing.lg,
    left: 0,
    position: 'absolute',
    width: '100%',
  },
})
