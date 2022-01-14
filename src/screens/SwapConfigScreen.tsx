import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackButton } from 'src/components/buttons/BackButton'
import { Switch } from 'src/components/buttons/Switch'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { TooltipButton } from 'src/components/tooltip/TooltipButton'

export function SwapConfigScreen() {
  // TODO this will be the where the fees + settings for swaps live
  // Just setting up some components for now
  const [expertMode, setExpertMode] = useState(false)

  const { t } = useTranslation()

  return (
    <Screen>
      <Box>
        <Box alignItems="center" flexDirection="row" justifyContent="flex-start" my="md">
          <BackButton ml="sm" />
          <Text ml="md" variant="h3">
            {t('Transaction Settings')}
          </Text>
        </Box>
        <Box alignItems="center" flexDirection="row">
          <Text variant="body">Gas Price</Text>
          <TooltipButton
            lines={[
              t(
                'Gas price determines the priority with which your transaction is handled by the network.'
              ),
              t('Higher fees will result in faster transaction processing.'),
            ]}
            title={t('About Gas Price')}
          />
        </Box>
        <Box alignItems="center" flexDirection="row">
          <CheckmarkCircle backgroundColor="blue" size={20} />
        </Box>
        <Box
          alignItems="center"
          flexDirection="row"
          justifyContent="space-between"
          px="md"
          width="100%">
          <Text variant="body">Expert Mode</Text>
          <Switch value={expertMode} onValueChange={setExpertMode} />
        </Box>
      </Box>
    </Screen>
  )
}
