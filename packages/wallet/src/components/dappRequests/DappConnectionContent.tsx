import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AccountSelectPopover } from 'wallet/src/components/dappRequests/AccountSelectPopover'
import { DappConnectionPermissions } from 'wallet/src/components/dappRequests/DappConnectionPermissions'
import { DappVerificationStatus } from 'wallet/src/features/dappRequests/types'

interface DappConnectionContentProps {
  verificationStatus?: DappVerificationStatus
  confirmedWarning?: boolean
  onConfirmWarning?: (confirmed: boolean) => void

  // Optional multi-account selection
  allAccountAddresses?: string[]
  selectedAccountAddresses?: string[]
  setSelectedAccountAddresses?: (addresses: string[]) => void

  // Account state
  isViewOnly: boolean

  // Optional platform-specific spacing
  bottomSpacing?: React.ReactNode
}

export function DappConnectionContent({
  verificationStatus,
  confirmedWarning,
  onConfirmWarning,
  allAccountAddresses,
  selectedAccountAddresses,
  setSelectedAccountAddresses,
  isViewOnly,
  bottomSpacing,
}: DappConnectionContentProps): JSX.Element {
  const { t } = useTranslation()

  const showAccountSelection =
    !isViewOnly && allAccountAddresses && selectedAccountAddresses && setSelectedAccountAddresses

  return (
    <>
      <DappConnectionPermissions
        verificationStatus={verificationStatus}
        confirmedWarning={confirmedWarning}
        onConfirmWarning={onConfirmWarning}
      />
      {showAccountSelection && (
        <Flex pb="$spacing12" pt="$spacing16" px="$spacing8">
          <AccountSelectPopover
            selectedAccountAddresses={selectedAccountAddresses}
            setSelectedAccountAddresses={setSelectedAccountAddresses}
            allAccountAddresses={allAccountAddresses}
          />
        </Flex>
      )}
      {isViewOnly && (
        <Flex
          centered
          row
          backgroundColor="$surface2"
          borderRadius="$rounded12"
          minHeight={40}
          p="$spacing8"
          mt="$spacing16"
        >
          <Text color="$neutral2" variant="body2">
            {t('home.warning.viewOnly')}
          </Text>
        </Flex>
      )}
      {bottomSpacing}
    </>
  )
}
