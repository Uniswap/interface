import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { Button, Flex, Separator, Text } from 'ui/src'
import { InsufficientGas } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/chains/types'
import { createEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { InsufficientFundsNetworkRow, NetworkInfo } from 'wallet/src/features/smartWallet/InsufficientFundsNetworkRow'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

const maxHeightList = 300

export type SmartWalletInsufficientFundsOnNetworkModalProps = {
  isOpen: boolean
  canContinue?: boolean
  isDisabled?: boolean
  onClose: () => void
  onContinueButton?: (networkInfo: NetworkInfo[]) => void
  onDisableButton?: (networkInfo: NetworkInfo[]) => void
  onReactivateButton?: () => void
  showInsufficientFundsOnly?: boolean
}

export type SmartWalletInsufficientFundsOnNetworkModalState = Omit<
  SmartWalletInsufficientFundsOnNetworkModalProps,
  'isOpen'
>

export function SmartWalletInsufficientFundsOnNetworkModal({
  isOpen,
  canContinue,
  isDisabled,
  onClose,
  onContinueButton,
  onDisableButton,
  onReactivateButton,
  showInsufficientFundsOnly = false,
}: SmartWalletInsufficientFundsOnNetworkModalProps): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const activeAccount = useActiveAccount()
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo[]>([])

  useEffect(() => {
    async function checkBalances(): Promise<void> {
      if (!activeAccount?.address) {
        setNetworkInfo([])
        return
      }

      const networkInfoPromises = SUPPORTED_CHAIN_IDS.map(async (chainId): Promise<NetworkInfo | undefined> => {
        try {
          const provider = createEthersProvider(chainId)
          const nativeBalance = (await provider?.getBalance(activeAccount.address)) ?? 0
          const chainInfo = getChainInfo(chainId)

          return {
            chainId,
            name: chainInfo.label ?? t('common.unknown'),
            nativeCurrency: chainInfo.nativeCurrency.name ?? t('common.unknown'),
            // TODO: Connect to the new gast estimate
            hasSufficientFunds: parseInt(nativeBalance.toString(), 10) > 0,
          }
        } catch (error) {
          return undefined
        }
      })

      const networkFundsInfo = (await Promise.all(networkInfoPromises)).filter((info): info is NetworkInfo => {
        if (info === undefined) {
          return false
        }
        return !showInsufficientFundsOnly || info.hasSufficientFunds
      })

      setNetworkInfo(networkFundsInfo)
    }

    checkBalances().catch(() => {
      setNetworkInfo([])
    })
  }, [activeAccount, showInsufficientFundsOnly, t])

  const onConfirm = useCallback(() => {
    onClose()

    onContinueButton?.(networkInfo)
  }, [onClose, onContinueButton, networkInfo])

  const onDisable = useCallback(() => {
    onClose()

    onDisableButton?.(networkInfo)
  }, [onClose, onDisableButton, networkInfo])

  const renderItem = ({ item, index }: { item: NetworkInfo; index: number }): JSX.Element => (
    <Flex>
      <InsufficientFundsNetworkRow key={`${index}`} networkInfo={item} />
    </Flex>
  )

  const renderItemSeparator = (): JSX.Element => <Separator />

  return (
    <Modal name={ModalName.SmartWalletInsufficientFundsOnNetworkModal} isModalOpen={isOpen} onClose={onClose}>
      <Flex p="$spacing24">
        <Flex centered pb="$spacing24">
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
            {t('smartWallet.Insufficient.title', {
              amount: networkInfo.length,
            })}
          </Text>
          <Text textAlign="center" variant="body3" color="$neutral2">
            {t('smartWallet.Insufficient.description')}
          </Text>
        </Flex>
        <Flex maxHeight={maxHeightList} pb="$spacing16">
          <FlatList
            data={networkInfo}
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
                onPress={onDisable || onConfirm}
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
