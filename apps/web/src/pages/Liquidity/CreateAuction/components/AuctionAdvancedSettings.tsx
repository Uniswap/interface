import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AdvancedSettingsSeparator } from '~/pages/Liquidity/CreateAuction/components/AdvancedSettingsSeparator'
import { KycCard } from '~/pages/Liquidity/CreateAuction/components/KycCard'

export function AuctionAdvancedSettings() {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Flex gap="$spacing24">
      <AdvancedSettingsSeparator isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />

      {isExpanded && (
        <Flex gap="$spacing12">
          <Flex gap="$spacing4">
            <Text variant="subheading1" color="$neutral1">
              {t('toucan.createAuction.step.configureAuction.participation')}
            </Text>
            <Text variant="body3" color="$neutral2">
              {t('toucan.createAuction.step.configureAuction.participation.description')}
            </Text>
          </Flex>

          <Flex width="50%">
            <KycCard />
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
