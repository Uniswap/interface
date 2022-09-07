import { ComponentProps, default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import 'react-native-gesture-handler'
import {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { AccountCardItem } from 'src/components/accounts/AccountCardItem'
import { AnimatedBox, Flex } from 'src/components/layout'
import { AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'
import { Text } from 'src/components/Text'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'

const CONTENT_MAX_SCROLL_Y = 20

type AccountListProps = Pick<
  ComponentProps<typeof AccountCardItem>,
  'onPress' | 'onPressEdit' | 'onPressQRCode'
> & {
  data: Account[]
}

export function AccountList({ data, onPressQRCode, onPressEdit, onPress }: AccountListProps) {
  const { t } = useTranslation()

  const activeAccount = useActiveAccount()

  const { scrollHandler, headerBorderStyle } = useListScroll()

  const renderItem = useCallback(
    () =>
      ({ item }: ListRenderItemInfo<Account>) => {
        return (
          <AccountCardItem
            account={item}
            isActive={!!activeAccount && activeAccount.address === item.address}
            isViewOnly={item.type === AccountType.Readonly}
            onPress={onPress}
            onPressEdit={onPressEdit}
            onPressQRCode={onPressQRCode}
          />
        )
      },
    [activeAccount, onPress, onPressEdit, onPressQRCode]
  )

  return (
    <AnimatedFlatList
      ListHeaderComponent={
        <Flex bg="backgroundBackdrop" borderBottomColor="backgroundOutline" pt="sm">
          <Text color="textPrimary" px="lg" variant="headlineSmall">
            {t('Your wallets')}
          </Text>
          <AnimatedBox bg="backgroundOutline" height={1} style={headerBorderStyle} />
        </Flex>
      }
      data={data}
      keyExtractor={key}
      renderItem={renderItem()}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[0]}
      onScroll={scrollHandler}
    />
  )
}

function useListScroll() {
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
    onEndDrag: (event) => {
      scrollY.value = withTiming(
        event.contentOffset.y > CONTENT_MAX_SCROLL_Y / 2 ? CONTENT_MAX_SCROLL_Y : 0
      )
    },
  })

  const _headerBorderStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y], [0, 1], Extrapolate.CLAMP),
    }
  }, [scrollY.value])

  // useAnimatedStyle gets rebuilt on every re-render
  // https://github.com/software-mansion/react-native-reanimated/issues/1767
  // Make headerBorderStyle to depend only on `scrollY.value`
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const headerBorderStyle = useMemo(() => _headerBorderStyle, [scrollY.value])

  return { scrollHandler, headerBorderStyle }
}

const key = (account: Account) => account.address
