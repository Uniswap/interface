import { useTranslation } from 'react-i18next'
import { Flex, Separator, Text, TouchableArea } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export function AdvancedSettingsSeparator({ isExpanded, onToggle }: { isExpanded: boolean; onToggle: () => void }) {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" gap="$spacing16">
      <Separator />
      <Trace logPress element={ElementName.AuctionAdvancedSettingsToggle}>
        <TouchableArea flexDirection="row" alignItems="center" py="$spacing4" onPress={onToggle}>
          <Text variant="buttonLabel4" color="$neutral2">
            {isExpanded
              ? t('toucan.createAuction.step.configureAuction.hideAdvancedSettings')
              : t('toucan.createAuction.step.configureAuction.showAdvancedSettings')}
          </Text>
          {isExpanded ? (
            <ChevronsIn size="$icon.16" color="$neutral2" />
          ) : (
            <ChevronsOut size="$icon.16" color="$neutral2" />
          )}
        </TouchableArea>
      </Trace>
      <Separator />
    </Flex>
  )
}
