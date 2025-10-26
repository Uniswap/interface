import { AddressDisplay } from 'components/AccountDetails/AddressDisplay'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { GenericPasskeyMenuModal, PasskeyMenuModalState } from 'components/AccountDrawer/PasskeyMenu/PasskeyMenuModal'
import StatusIcon from 'components/StatusIcon'
import { useDisconnect } from 'hooks/useDisconnect'
import { usePasskeyAuthWithHelpModal } from 'hooks/usePasskeyAuthWithHelpModal'
import { Dispatch, SetStateAction, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Flex, Text } from 'ui/src'
import { Trash } from 'ui/src/components/icons/Trash'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Authenticator, deleteAuthenticator, disconnectWallet } from 'uniswap/src/features/passkey/embeddedWallet'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { NumberType } from 'utilities/src/format/types'

export function DeletePasskeyMenu({
  show,
  setPasskeyMenuModalState,
  refreshAuthenticators,
  authenticator,
  isLastAuthenticator = false,
  credential,
}: {
  show: boolean
  setPasskeyMenuModalState: Dispatch<SetStateAction<PasskeyMenuModalState | undefined>>
  refreshAuthenticators: () => void
  authenticator: Authenticator
  isLastAuthenticator?: boolean
  credential?: string
}) {
  const { t } = useTranslation()
  const disconnect = useDisconnect()
  const accountDrawer = useAccountDrawer()
  const evmAddress = useWallet().evmAccount?.address
  const { data: portfolioTotalValue } = usePortfolioTotalValue({ evmAddress, svmAddress: undefined }) // Passkey account should be EVM-only
  const { balanceUSD } = portfolioTotalValue || {}
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const [acknowledged, setAcknowledged] = useState(false)

  const { mutate: handleDeleteAuthenticator } = usePasskeyAuthWithHelpModal(
    async () => {
      return await deleteAuthenticator({ authenticator, credential })
    },
    {
      onSuccess: async (success) => {
        if (success && isLastAuthenticator) {
          await disconnectWallet()
          disconnect()
          accountDrawer.close()
        } else if (success) {
          setPasskeyMenuModalState(undefined)
          await refreshAuthenticators()
        }
      },
      onError: async () => {
        setPasskeyMenuModalState(undefined)
        await refreshAuthenticators()
      },
      onSettled: async () => {
        setAcknowledged(false)
      },
    },
  )

  return (
    <Trace logImpression modal={ModalName.DeletePasskey}>
      <GenericPasskeyMenuModal show={show} onClose={() => setPasskeyMenuModalState(undefined)}>
        <Flex p="$gap12" borderRadius="$rounded12" backgroundColor="$statusCritical2">
          <Trash color="$statusCritical" size={24} />
        </Flex>
        <Flex gap="$gap8" alignItems="center">
          <Text variant="subheading2" textAlign="center">
            {t('account.passkey.delete.title')}
          </Text>
          <Text variant="body3" color="$neutral2" textAlign="center">
            {t('account.passkey.delete.description')}
          </Text>
          <Text variant="body3" color="$statusCritical" textAlign="center">
            {t('account.passkey.delete.descriptionEmphasized')}
          </Text>
        </Flex>
        {evmAddress && (
          <Flex
            row
            gap="$gap12"
            width="100%"
            p="$gap12"
            borderColor="$surface3"
            borderWidth={1}
            borderRadius="$rounded12"
            borderStyle="solid"
          >
            <StatusIcon size={24} showMiniIcons={false} />
            <AddressDisplay address={evmAddress} />
            <Text variant="body3" color="$statusCritical" ml="auto" mr="0">
              {convertFiatAmountFormatted(balanceUSD, NumberType.FiatTokenPrice)}
            </Text>
          </Flex>
        )}
        <Flex
          row
          gap="$gap12"
          width="100%"
          borderRadius="$rounded16"
          backgroundColor="$surface2"
          justifyContent="center"
          alignItems="center"
          p="$padding12"
        >
          <Trace logPress element={ElementName.DeletePasskeyAcknowledge}>
            <Checkbox size="$icon.16" checked={acknowledged} onPress={() => setAcknowledged((prev) => !prev)} />
          </Trace>
          <Text variant="body4" color="$neutral1">
            {t('account.passkey.delete.acknowledge')}
          </Text>
        </Flex>
        <Flex row justifyContent="space-between" width="100%" gap="$gap8">
          <Trace logPress element={ElementName.Cancel}>
            <Button
              py="$padding12"
              variant="default"
              emphasis="secondary"
              onPress={() => setPasskeyMenuModalState(undefined)}
            >
              {t('common.button.cancel')}
            </Button>
          </Trace>
          <Trace logPress element={ElementName.DeletePasskey}>
            <Button
              py="$padding12"
              variant="critical"
              emphasis="primary"
              onPress={() => handleDeleteAuthenticator()}
              isDisabled={!acknowledged}
            >
              {t('common.button.delete')}
            </Button>
          </Trace>
        </Flex>
      </GenericPasskeyMenuModal>
    </Trace>
  )
}
