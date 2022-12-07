import React from 'react'
import { useTranslation } from 'react-i18next'
import { FadeOut } from 'react-native-reanimated'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Separator } from 'src/components/layout/Separator'
import { TokenBalanceLoader } from 'src/components/loading/TokenBalanceLoader'
import { PriceChartLoading } from 'src/components/PriceChart/PriceChartLoading'
import { Text } from 'src/components/Text'
import { TokenDetailsBackButtonRow } from 'src/components/TokenDetails/TokenDetailsBackButtonRow'
import { TokenDetailsHeader } from 'src/components/TokenDetails/TokenDetailsHeader'
import { TokenDetailsMarketData } from 'src/components/TokenDetails/TokenDetailsStats'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccountWithThrow, useDisplayName } from 'src/features/wallet/hooks'

export function TokenDetailsLoader({ currencyId }: { currencyId: string }) {
  const { t } = useTranslation()

  const activeAccount = useActiveAccountWithThrow()
  const accountType = activeAccount?.type
  const displayName = useDisplayName(activeAccount?.address)?.name
  const isReadonly = accountType === AccountType.Readonly

  return (
    <AnimatedBox exiting={FadeOut} flexGrow={1}>
      <Screen>
        <Flex flex={1}>
          <TokenDetailsBackButtonRow currencyId={currencyId} />
          <Flex gap="xl">
            <Flex gap="xxs">
              <TokenDetailsHeader onPressWarningIcon={() => undefined} />
              <PriceChartLoading />
            </Flex>
            <Flex gap="lg">
              {/* TokenBalances mock loader */}
              <Flex borderRadius="sm" gap="lg" px="md">
                <Flex gap="xs">
                  <Text color="textTertiary" variant="subheadSmall">
                    {isReadonly
                      ? t("{{owner}}'s balance", { owner: displayName })
                      : t('Your balance')}
                  </Text>
                  <TokenBalanceLoader />
                </Flex>
              </Flex>
              <Separator mx="md" />
              {/* TokenDetailsStats mock loader */}
              <Box mx="md">
                <Flex gap="lg">
                  <Text variant="subheadLarge">{t('Stats')}</Text>
                </Flex>
              </Box>
              <Box mx="md">
                <TokenDetailsMarketData isLoading={true} />
              </Box>
            </Flex>
          </Flex>
        </Flex>
      </Screen>
    </AnimatedBox>
  )
}
