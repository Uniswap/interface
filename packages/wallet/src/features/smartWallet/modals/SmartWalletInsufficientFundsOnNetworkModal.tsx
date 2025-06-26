import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { Button, Flex, Separator, Text } from 'ui/src'
import { InsufficientGas } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { InsufficientFundsNetworkRow, NetworkInfo } from 'wallet/src/features/smartWallet/InsufficientFundsNetworkRow'

const maxHeightList = 300

export type SmartWalletInsufficientFundsOnNetworkModalProps = {
  isOpen: boolean
  isDisabled?: boolean
  onClose: () => void
  onContinueButton?: (sortedData: NetworkInfo[]) => void
  onDisableButton?: (sortedData: NetworkInfo[]) => void
  onReactivateButton?: () => void
  networkBalances?: NetworkInfo[]
  showActiveDelegatedNetworks?: boolean
}

export type SmartWalletInsufficientFundsOnNetworkModalState = Omit<
  SmartWalletInsufficientFundsOnNetworkModalProps,
  'isOpen'
>

export function SmartWalletInsufficientFundsOnNetworkModal({
  isOpen,
  isDisabled,
  onClose,
  onContinueButton,
  onDisableButton,
  onReactivateButton,
  networkBalances,
  showActiveDelegatedNetworks = false,
}: SmartWalletInsufficientFundsOnNetworkModalProps): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()

  const sortedData = [...(networkBalances ?? [])].sort(
    (a, b) => Number(a.hasSufficientFunds) - Number(b.hasSufficientFunds),
  )
  const sufficientFundsCount = sortedData.filter((chain) => chain.hasSufficientFunds === false).length
  const canContinue = sortedData.some((chain) => chain.hasSufficientFunds)

  const onConfirm = useCallback(() => {
    onContinueButton?.(sortedData)
  }, [onContinueButton, sortedData])

  const onDisable = useCallback(() => {
    onClose()
    onDisableButton?.(sortedData)
  }, [onClose, onDisableButton, sortedData])

  const renderItem = ({ item, index }: { item: NetworkInfo; index: number }): JSX.Element => (
    <Flex>
      <InsufficientFundsNetworkRow key={`${index}`} networkInfo={item} />
    </Flex>
  )

  const renderItemSeparator = (): JSX.Element => <Separator />

  return (
    <Modal name={ModalName.SmartWalletInsufficientFundsOnNetworkModal} isModalOpen={isOpen} onClose={onClose}>
      <Flex px="$spacing24" pt="$spacing24">
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
          <Text variant="subheading1" color="$neutral1" mb="$spacing8">
            {showActiveDelegatedNetworks
              ? sortedData.length > 1
                ? t('smartWallet.activeNetworks.title.plural', { amount: sortedData.length })
                : t('smartWallet.activeNetworks.title')
              : sufficientFundsCount > 1
                ? t('smartWallet.insufficient.title.plural', { amount: sufficientFundsCount })
                : t('smartWallet.insufficient.title')}
          </Text>
          <Text textAlign="center" variant="body3" color="$neutral2">
            {t('smartWallet.insufficient.description')}
          </Text>
        </Flex>
        <Flex maxHeight={maxHeightList} pb="$spacing16">
          <FlatList
            data={sortedData}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${index}-${item.chainId}`}
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={renderItemSeparator}
          />
        </Flex>

        <Flex backgroundColor="$surface1" gap="$gap12" pb={insets.bottom + spacing.spacing12} alignSelf="stretch">
          {(onDisableButton || (canContinue && onContinueButton)) && (
            <Flex row>
              <Button
                variant="default"
                size="medium"
                emphasis={onDisableButton ? (isDisabled ? 'tertiary' : 'primary') : 'tertiary'}
                isDisabled={onDisableButton && isDisabled}
                onPress={isDisabled ? onDisable : onConfirm}
              >
                {t(
                  onDisableButton && isDisabled
                    ? 'smartWallet.InsufficientFunds.button.disable.noFunds'
                    : onDisableButton
                      ? 'smartWallet.InsufficientFunds.button.disable.single.text'
                      : 'smartWallet.InsufficientFunds.button.continue.text',
                )}
              </Button>
            </Flex>
          )}

          <Flex row>
            <Button size="medium" emphasis={onReactivateButton ? 'text-only' : 'secondary'} onPress={onClose}>
              {t(onReactivateButton ? 'common.reactivate' : 'common.close')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}
