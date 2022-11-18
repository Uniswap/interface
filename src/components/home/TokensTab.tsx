import React from 'react'
import { useTranslation } from 'react-i18next'
import { ViewStyle } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { NoTokens } from 'src/components/icons/NoTokens'
import { Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { TabViewScrollProps } from 'src/components/layout/screens/TabbedScrollScreen'
import { TAB_STYLES } from 'src/components/layout/TabHelpers'
import { TokenBalanceList } from 'src/components/TokenBalanceList/TokenBalanceList'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { CurrencyId } from 'src/utils/currencyId'

export function TokensTab({
  owner,
  tabViewScrollProps,
  loadingContainerStyle,
}: {
  owner: string
  tabViewScrollProps?: TabViewScrollProps
  loadingContainerStyle?: ViewStyle
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const onPressToken = (currencyId: CurrencyId) => {
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigate(currencyId)
  }

  const onPressBuy = () => {
    dispatch(openModal({ name: ModalName.FiatOnRamp }))
  }

  return (
    <Flex grow style={TAB_STYLES.tabContentContainerStandard}>
      <TokenBalanceList
        empty={
          <Flex centered flex={1}>
            <BaseCard.EmptyState
              buttonLabel={t('Buy crypto')}
              description={t(
                'Transfer tokens from a centralized exchange or another wallet to get started.'
              )}
              icon={<NoTokens />}
              title={t('No tokens yet')}
              onPress={onPressBuy}
            />
          </Flex>
        }
        loadingContainerStyle={loadingContainerStyle}
        owner={owner}
        tabViewScrollProps={tabViewScrollProps}
        onPressToken={onPressToken}
      />
    </Flex>
  )
}
