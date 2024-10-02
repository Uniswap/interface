import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { UserSquare } from 'ui/src/components/icons'
import { fonts, iconSizes, imageSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useENSAvatar, useENSName } from 'uniswap/src/features/ens/api'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

type NewAddressWarningModalProps = {
  address: string
  onAcknowledge: () => void
  onClose: () => void
}

export function NewAddressWarningModal({ address, onAcknowledge, onClose }: NewAddressWarningModalProps): JSX.Element {
  const { t } = useTranslation()

  const validated = getValidAddress(address)
  const displayName = useDisplayName(address, { includeUnitagSuffix: true })
  const ensDisplayName = useENSName(validated ?? undefined)
  const { data: ensAvatar } = useENSAvatar(validated)

  return (
    <Modal name={ModalName.NewAddressWarning} onClose={onClose}>
      <Flex px="$spacing24" py="$spacing12">
        <Flex centered gap="$spacing16" pb="$spacing16">
          <Flex centered backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12">
            <UserSquare color="$neutral2" size={iconSizes.icon24} />
          </Flex>
          <Text color="$neutral1" variant="subheading1">
            {t('send.warning.newAddress.title')}
          </Text>
          <Text color="$neutral2" variant="body3">
            {t('send.warning.newAddress.message')}
          </Text>
        </Flex>

        <Flex borderColor="$surface3" borderRadius="$rounded16" borderWidth={1} gap="$spacing8" p="$spacing16">
          {displayName?.type === DisplayNameType.Unitag && (
            <Flex row justifyContent="space-between">
              <Text color="$neutral2" fontWeight="bold" variant="body3">
                {t('send.warning.newAddress.details.username')}
              </Text>
              <AddressDisplay
                hideAddressInSubtitle
                includeUnitagSuffix
                address={address}
                lineHeight={fonts.body3.lineHeight}
                size={16}
                variant="body3"
              />
            </Flex>
          )}

          {ensDisplayName.data && (
            <Flex row justifyContent="space-between">
              <Text color="$neutral2" fontWeight="bold" variant="body3">
                {t('send.warning.newAddress.details.ENS')}
              </Text>
              <Flex row alignItems="center" gap="$spacing4">
                <AccountIcon address={address} avatarUri={ensAvatar} size={imageSizes.image16} />
                <Text flexShrink={1} loading={ensDisplayName.isLoading} numberOfLines={1} variant="body3">
                  {ensDisplayName.data}
                </Text>
              </Flex>
            </Flex>
          )}

          <Flex row alignItems="center" gap="$spacing16" justifyContent="space-between">
            <Text color="$neutral2" fontWeight="bold" variant="body3">
              {t('send.warning.newAddress.details.walletAddress')}
            </Text>
            <Text flexShrink={1} numberOfLines={1} variant="body3">
              {shortenAddress(address, 8, 8)}
            </Text>
          </Flex>
        </Flex>

        <Flex row gap="$spacing12" pt="$spacing24">
          <Button flex={1} flexBasis={1} theme="secondary" onPress={onClose}>
            {t('common.button.back')}
          </Button>
          <Button flex={1} flexBasis={1} theme="primary" onPress={onAcknowledge}>
            {t('common.button.confirm')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
