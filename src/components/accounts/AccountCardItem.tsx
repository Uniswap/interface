import React, { useMemo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import QrCode from 'src/assets/icons/qr-code.svg'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { UniconAttributes } from 'src/components/unicons/types'
import { deriveUniconAttributeIndices, getUniconAttributeData } from 'src/components/unicons/utils'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { ElementName } from 'src/features/telemetry/constants'
import { Account } from 'src/features/wallet/accounts/types'
import { opacify } from 'src/utils/colors'

interface Props {
  account: Account
  isActive?: boolean
  isViewOnly: boolean
  onPress?: (address: Address) => void
  onPressQRCode: (address: Address) => void
  onPressEdit?: (address: Address) => void
}

export function AccountCardItem({
  account,
  isActive,
  isViewOnly,
  onPress,
  onPressQRCode,
  onPressEdit,
}: Props) {
  const { address } = account
  const theme = useAppTheme()

  const gradientData = useMemo(() => {
    const attributeIndices = deriveUniconAttributeIndices(address || '')
    if (!attributeIndices) return undefined

    const attributeData = getUniconAttributeData(attributeIndices)
    return {
      start: attributeData[UniconAttributes.GradientStart].toString(),
      end: attributeData[UniconAttributes.GradientEnd].toString(),
    }
  }, [address])

  // TODO: make the outline / bg an actual gradient as per design
  // instead of just one solid color (gradientStart for now)
  const gradientStart = gradientData?.start ?? 'accentActive'
  // const gradientEnd = gradientData?.end ?? 'accentActive'

  const currentChains = useActiveChainIds()
  const { balances } = useAllBalancesByChainId(address, currentChains)

  return (
    <Button mx="lg" onPress={onPress ? () => onPress(address) : undefined}>
      <Flex
        borderRadius="lg"
        borderWidth={isActive ? 0.5 : 0}
        flexDirection="column"
        gap="sm"
        my="xs"
        p="md"
        style={{
          borderColor: gradientStart,
          backgroundColor: isActive ? opacify(12, gradientStart) : theme.colors.backgroundContainer,
        }}
        testID={`account_item/${address.toLowerCase()}`}>
        <Flex row alignItems="flex-start" borderRadius="sm" justifyContent="space-between">
          <AddressDisplay
            showAddressAsSubtitle
            address={address}
            flexShrink={1}
            showNotificationBadge={true}
            showViewOnly={isViewOnly}
            size={36}
            variant="subhead"
            verticalGap="none"
          />

          {isActive && (
            <Button
              alignItems="center"
              height={24}
              justifyContent="center"
              padding="sm"
              width={24}
              onPress={() => onPressQRCode(address)}>
              <QrCode color={theme.colors.textSecondary} height={24} strokeWidth={2} width={24} />
            </Button>
          )}
        </Flex>
        <Flex row alignItems="center" justifyContent="space-between">
          <TotalBalance balances={balances} variant="body" />
          {onPressEdit && (
            <Button name={ElementName.Edit} onPress={() => onPressEdit(address)}>
              <TripleDots
                color={theme.colors.textTertiary}
                height={12}
                strokeLinecap="round"
                strokeWidth="1"
                width={20}
              />
            </Button>
          )}
        </Flex>
      </Flex>
    </Button>
  )
}
