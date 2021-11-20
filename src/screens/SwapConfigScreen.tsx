import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackButton } from 'src/components/buttons/BackButton'
import { Switch } from 'src/components/buttons/Switch'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { TooltipButton } from 'src/components/tooltip/TooltipButton'
import { RootStackParamList } from 'src/screens/navTypes'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<RootStackParamList, Screens.SwapConfig>

export function SwapConfigScreen({}: Props) {
  // TODO this will be the where the fees + settings for swaps live
  // Just setting up some components for now
  const [expertMode, setExpertMode] = useState(false)

  const { t } = useTranslation()

  return (
    <Screen>
      <Box>
        <Box my="md" alignItems="center" justifyContent="flex-start" flexDirection="row">
          <BackButton ml="sm" />
          <Text variant="h3" ml="md">
            {t('Transaction Settings')}
          </Text>
        </Box>
        <Box alignItems="center" flexDirection="row">
          <Text variant="body">Gas Price</Text>
          <TooltipButton
            title={t('About Gas Price')}
            lines={[
              t(
                'Gas price determines the priority with which your transaction is handled by the network.'
              ),
              t('Higher fees will result in faster transaction processing.'),
            ]}
          />
        </Box>
        <Box alignItems="center" flexDirection="row">
          <CheckmarkCircle size={20} backgroundColor="blue" />
        </Box>
        <Box
          alignItems="center"
          justifyContent="space-between"
          flexDirection="row"
          width="100%"
          px="md">
          <Text variant="body">Expert Mode</Text>
          <Switch value={expertMode} onValueChange={setExpertMode} />
        </Box>
      </Box>
    </Screen>
  )
}
