import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, GetProps, ScrollView, Text } from 'ui/src'
import { Person } from 'ui/src/components/icons/Person'
import { fonts, imageSizes } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { GenericHeader } from 'uniswap/src/components/misc/GenericHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useENSName } from 'uniswap/src/features/ens/api'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { isMobileApp } from 'utilities/src/platform'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

type NewAddressWarningModalProps = {
  address: string
  onAcknowledge: () => void
  onClose: () => void
}

/**
 * Helper component to render a left label column and a right child. The label + text
 * will wrap if the content is too long.
 *
 * @param leftText Label text on left
 * @param rightChild Dynamic child on the right side
 */
const LeftRightText = ({ leftText, rightChild }: { leftText: string; rightChild: ReactNode }): JSX.Element => {
  return (
    <Flex row flexGrow={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" px="$spacing16">
      <Text color="$neutral2" fontWeight="bold" variant="body3" pr="$spacing8">
        {leftText}
      </Text>
      <Flex flexShrink={1}>{rightChild}</Flex>
    </Flex>
  )
}

/**
 * Modal shown when trying to do a transaction with a that the user has not done a transaction
 * with before. The user can then confirm that they want to proceed or cancel the transaction.
 *
 * @param address Target address the user has not transacted with
 * @param onAcknowledge Callback when the user has confirmed they want to proceed
 * @param onConfirm Callback when the user does not want to proceed with the transaction for new address
 */
export function NewAddressWarningModal({ address, onAcknowledge, onClose }: NewAddressWarningModalProps): JSX.Element {
  const { t } = useTranslation()

  // TODO(WALL-7065): Update to support Solana validation
  const validated = getValidAddress({ address, platform: Platform.EVM })
  const displayName = useDisplayName(address, { includeUnitagSuffix: true })
  const ensDisplayName = useENSName(validated ?? undefined)

  return (
    <Modal name={ModalName.NewAddressWarning} onClose={onClose}>
      <Flex px={isMobileApp ? '$spacing24' : undefined} py={isMobileApp ? '$spacing12' : undefined}>
        <GenericHeader
          Icon={Person}
          iconSize="$icon.24"
          title={t('send.warning.newAddress.title')}
          subtitle={t('send.warning.newAddress.message')}
          subtitleVariant="body3"
          flexProps={{ pb: '$spacing16' }}
        />
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          borderColor="$surface3"
          borderRadius="$rounded16"
          borderWidth="$spacing1"
          flexDirection="column"
          py="$padding12"
        >
          {displayName?.type === DisplayNameType.Unitag && (
            <LeftRightText
              leftText={t('send.warning.newAddress.details.username')}
              rightChild={
                <AddressDisplay
                  hideAddressInSubtitle
                  includeUnitagSuffix
                  horizontalGap="$spacing4"
                  address={address}
                  lineHeight={fonts.body3.lineHeight}
                  size={16}
                  variant="body3"
                  disableForcedWidth={true}
                />
              }
            />
          )}
          {ensDisplayName.data && (
            <LeftRightText
              leftText={t('send.warning.newAddress.details.ENS')}
              rightChild={
                <Flex shrink row alignItems="center" gap="$spacing4">
                  <AccountIcon address={address} size={imageSizes.image16} />
                  <Text
                    adjustsFontSizeToFit
                    allowFontScaling
                    flexShrink={1}
                    numberOfLines={1}
                    loading={ensDisplayName.isLoading}
                    variant="body3"
                    whiteSpace="initial"
                  >
                    {ensDisplayName.data}
                  </Text>
                </Flex>
              }
            />
          )}
          <LeftRightText
            leftText={t('send.warning.newAddress.details.walletAddress')}
            rightChild={
              <Text
                adjustsFontSizeToFit
                allowFontScaling
                flexShrink={1}
                numberOfLines={1}
                variant="body3"
                whiteSpace="initial"
              >
                {shortenAddress({ address, chars: 6 })}
              </Text>
            }
          />
        </ScrollView>

        <Flex row gap="$spacing12" pt="$spacing24">
          <Button emphasis="secondary" onPress={onClose}>
            {t('common.button.back')}
          </Button>
          <Button emphasis="primary" variant="branded" onPress={onAcknowledge}>
            {t('common.button.confirm')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}

const styles = {
  scrollViewContent: {
    flexDirection: 'column',
    py: '$spacing16',
    flexGrow: 1,
  } satisfies GetProps<typeof ScrollView>['contentContainerStyle'],
}
