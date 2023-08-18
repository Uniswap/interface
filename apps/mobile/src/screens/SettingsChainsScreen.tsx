import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { Switch } from 'src/components/buttons/Switch'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Box } from 'src/components/layout/Box'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Text } from 'src/components/Text'
import { flex, theme } from 'ui/src/theme/restyle'
import { ALL_SUPPORTED_CHAIN_IDS, CHAIN_INFO } from 'wallet/src/constants/chains'
import { useActiveChainIds } from 'wallet/src/features/chains/hooks'
import { setChainActiveStatus } from 'wallet/src/features/chains/slice'

export function SettingsChainsScreen(): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const activeChains = useActiveChainIds()

  return (
    <SheetScreen pt="spacing24" px="spacing24">
      <ScrollView contentContainerStyle={{ ...flex.fill, paddingTop: theme.spacing.spacing48 }}>
        <BackHeader alignment="left" mb="spacing24">
          <Text variant="subheadLarge">{t('Chain Settings')}</Text>
        </BackHeader>
        <Box px="spacing12">
          <Text variant="subheadLarge">{t('Configure active chains (networks)')}</Text>
          {ALL_SUPPORTED_CHAIN_IDS.map((chainId) => {
            const isActive = activeChains.includes(chainId)
            return (
              <Box
                key={chainId}
                alignItems="center"
                flexDirection="row"
                justifyContent="space-between"
                mt="spacing24">
                <Text variant="bodyLarge">{CHAIN_INFO[chainId].label}</Text>
                <Switch
                  value={isActive}
                  onValueChange={(newValue: boolean): void => {
                    dispatch(setChainActiveStatus({ chainId, isActive: newValue }))
                  }}
                />
              </Box>
            )
          })}
        </Box>
      </ScrollView>
    </SheetScreen>
  )
}
