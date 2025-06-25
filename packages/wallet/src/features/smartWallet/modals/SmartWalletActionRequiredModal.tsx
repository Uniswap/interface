import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { Button, Flex, Loader, Separator, Text } from 'ui/src'
import { InsufficientGas } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { isExtension } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { InsufficientFundsNetworkRow, NetworkInfo } from 'wallet/src/features/smartWallet/InsufficientFundsNetworkRow'

const maxHeightList = 300

export type SmartWalletActionRequiredModalProps = {
  isOpen: boolean
  isDisabled?: boolean
  onClose: () => void
  onConfirm?: () => void
  onReactivate?: () => void
  networkBalances: NetworkInfo[]
}

export type SmartWalletActionRequiredModalState = Omit<SmartWalletActionRequiredModalProps, 'isOpen'>

export function SmartWalletActionRequiredModal({
  isOpen,
  onClose,
  onConfirm,
  onReactivate,
  networkBalances,
}: SmartWalletActionRequiredModalProps): JSX.Element | null {
  const { t } = useTranslation()
  const insets = useAppInsets()

  const onConfirmCallback = useEvent(() => {
    onClose()
    onConfirm?.()
  })

  const onReactivateCallback = useEvent(() => {
    onClose()
    onReactivate?.()
  })

  const sortedData = [...networkBalances].sort((a, b) => Number(a.hasSufficientFunds) - Number(b.hasSufficientFunds))
  const sufficientFundsCount = sortedData.filter((chain) => chain.hasSufficientFunds).length
  const canContinue = sufficientFundsCount > 0

  const renderItem = ({ item, index }: { item: NetworkInfo; index: number }): JSX.Element => (
    <Flex>
      <InsufficientFundsNetworkRow key={`${index}`} networkInfo={item} />
    </Flex>
  )

  const renderItemSeparator = (): JSX.Element => <Separator />

  const isLoading = sortedData.length === 0

  const ctaButtonText = isLoading
    ? undefined
    : sufficientFundsCount === 0
      ? t('smartWallet.actionRequired.insufficientFunds')
      : sufficientFundsCount > 1
        ? t('smartWallet.actionRequired.cta.plural', { amount: sufficientFundsCount })
        : t('smartWallet.actionRequired.cta')

  return (
    <Modal
      fullScreen={isExtension}
      name={ModalName.SmartWalletActionRequiredModal}
      isModalOpen={isOpen}
      onClose={onClose}
    >
      <Flex
        flex={isExtension ? 1 : 0}
        px="$spacing24"
        pt="$spacing24"
        justifyContent={isExtension ? 'space-between' : 'unset'}
      >
        <Flex grow>
          <Flex centered>
            <Flex
              backgroundColor="$accent2"
              borderRadius="$rounded12"
              height="$spacing48"
              width="$spacing48"
              alignItems="center"
              justifyContent="center"
              mb="$spacing16"
            >
              <InsufficientGas size="$icon.24" />
            </Flex>
            <Text
              loading={isLoading}
              variant="subheading1"
              color="$neutral1"
              loadingPlaceholderText={t('smartWallet.actionRequired.title')}
            >
              {sortedData.length > 1
                ? t('smartWallet.actionRequired.title.plural', { amount: sortedData.length })
                : t('smartWallet.actionRequired.title')}
            </Text>
            <Text textAlign="center" variant="body3" color="$neutral2" mt="$spacing8">
              {t('smartWallet.actionRequired.description')}
            </Text>
          </Flex>
          <Flex maxHeight={maxHeightList} p="$spacing16">
            {isLoading && <Loader.InsufficientFundsNetworkRow repeat={1} />}
            <FlatList
              data={sortedData}
              renderItem={renderItem}
              keyExtractor={(item, index) => `${index}-${item.chainId}`}
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={renderItemSeparator}
            />
          </Flex>
        </Flex>

        <Flex backgroundColor="$surface1" gap="$gap12" pb={insets.bottom + spacing.spacing12} alignSelf="stretch">
          <Flex row>
            <Button
              variant="default"
              size="medium"
              isDisabled={!canContinue || isLoading}
              loading={isLoading}
              emphasis="primary"
              onPress={onConfirmCallback}
            >
              {ctaButtonText}
            </Button>
          </Flex>

          <Flex row>
            <Button size="medium" emphasis="text-only" onPress={onReactivateCallback}>
              {t('smartWallet.actionRequired.reactivate')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}
