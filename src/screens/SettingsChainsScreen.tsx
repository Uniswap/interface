import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { BackButton } from 'src/components/buttons/BackButton'
import { Switch } from 'src/components/buttons/Switch'
import { Box } from 'src/components/layout/Box'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Text } from 'src/components/Text'
import { ALL_SUPPORTED_CHAIN_IDS, ChainId, CHAIN_INFO } from 'src/constants/chains'
import { setChainActiveStatus } from 'src/features/chains/chainsSlice'
import { useActiveChainIds } from 'src/features/chains/utils'
import { flex } from 'src/styles/flex'

export function SettingsChainsScreen() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const activeChains = useActiveChainIds()

  const onToggleChain = (chainId: ChainId) => {
    return (isActive: boolean) => dispatch(setChainActiveStatus({ chainId, isActive }))
  }

  return (
    <SheetScreen px="lg">
      <ScrollView contentContainerStyle={flex.fill}>
        <Box flexDirection="row" alignItems="center" mb="lg">
          <BackButton size={30} mr="md" />
          <Text variant="bodyLg">{t('Chain Settings')}</Text>
        </Box>
        <Box px="sm">
          <Text variant="bodyLg">{t('Configure active chains (networks)')}</Text>
          {ALL_SUPPORTED_CHAIN_IDS.map((chainId) => {
            const isActive = activeChains.includes(chainId)
            return (
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                mt="lg"
                key={chainId}>
                <Text variant="body">{CHAIN_INFO[chainId].label}</Text>
                <Switch value={isActive} onValueChange={onToggleChain(chainId)} />
              </Box>
            )
          })}
        </Box>
      </ScrollView>
    </SheetScreen>
  )
}
