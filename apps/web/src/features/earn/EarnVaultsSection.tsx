import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { MOCK_EARN_VAULTS, type MockEarnVault } from '~/features/earn/_fixtures/vaults'
import { EarnVaultChip } from '~/features/earn/EarnVaultChip'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'

// Scaffold only — backend data wires in via FE-2 (`GetEarnVaults`). See CONS-1779.
export function EarnVaultsSection() {
  const { t } = useTranslation()
  const [selectedVault, setSelectedVault] = useState<MockEarnVault | null>(null)

  const handleClose = useCallback(() => {
    setSelectedVault(null)
  }, [])

  return (
    <>
      <Flex
        width="100%"
        maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
        mx="auto"
        row
        alignItems="center"
        gap="$spacing16"
        $lg={{ row: false, flexDirection: 'column', alignItems: 'flex-start' }}
      >
        <Flex minWidth={200} gap="$spacing4" $lg={{ width: '100%' }}>
          <Text variant="heading3" color="$neutral1">
            {t('explore.earn.title')}
          </Text>
          <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
            {t('explore.earn.subtitle')}
          </Text>
        </Flex>
        <Flex
          flex={1}
          row
          gap="$spacing12"
          justifyContent="flex-end"
          $lg={{ width: '100%' }}
          $md={{ flexDirection: 'column' }}
        >
          {MOCK_EARN_VAULTS.map((vault) => (
            <EarnVaultChip key={vault.id} vault={vault} onPress={() => setSelectedVault(vault)} />
          ))}
        </Flex>
      </Flex>
      <EarnVaultModal vault={selectedVault} isOpen={selectedVault !== null} onClose={handleClose} />
    </>
  )
}
