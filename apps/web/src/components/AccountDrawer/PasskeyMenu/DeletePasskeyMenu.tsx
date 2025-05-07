import { AddressDisplay } from 'components/AccountDetails/AddressDisplay'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { GenericPasskeyMenuModal, PasskeyMenuModalState } from 'components/AccountDrawer/PasskeyMenu/PasskeyMenuModal'
import StatusIcon from 'components/Identicon/StatusIcon'
import { useAccount } from 'hooks/useAccount'
import { useDisconnect } from 'hooks/useDisconnect'
import { Dispatch, SetStateAction, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Flex, Text } from 'ui/src'
import { Trash } from 'ui/src/components/icons/Trash'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances'
import { Authenticator, deleteAuthenticator, disconnectWallet } from 'uniswap/src/features/passkey/embeddedWallet'
import { useFormatter } from 'utils/formatNumbers'

export function DeletePasskeyMenu({
  show,
  setPasskeyMenuModalState,
  refreshAuthenticators,
  authenticator,
  isLastAuthenticator = false,
}: {
  show: boolean
  setPasskeyMenuModalState: Dispatch<SetStateAction<PasskeyMenuModalState | undefined>>
  refreshAuthenticators: () => void
  authenticator: Authenticator
  isLastAuthenticator?: boolean
}) {
  const { t } = useTranslation()
  const { disconnect } = useDisconnect()
  const accountDrawer = useAccountDrawer()
  const account = useAccount()
  const { data: portfolioTotalValue } = usePortfolioTotalValue({
    address: account.address,
  })
  const { balanceUSD } = portfolioTotalValue || {}
  const { formatFiatPrice } = useFormatter()
  const [acknowledged, setAcknowledged] = useState(false)

  return (
    <GenericPasskeyMenuModal show={show}>
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
      {account.address && (
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
          <AddressDisplay enableCopyAddress={false} address={account.address} />
          <Text variant="body3" color="$statusCritical" ml="auto" mr="0">
            {formatFiatPrice({ price: balanceUSD })}
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
        <Checkbox size="$icon.16" checked={acknowledged} onPress={() => setAcknowledged((prev) => !prev)} />
        <Text variant="body4" color="$neutral1">
          {t('account.passkey.delete.acknowledge')}
        </Text>
      </Flex>
      <Flex row justifyContent="space-between" width="100%" gap="$gap8">
        <Button
          py="$padding12"
          variant="default"
          emphasis="secondary"
          onPress={() => setPasskeyMenuModalState(undefined)}
        >
          {t('common.button.cancel')}
        </Button>
        <Button
          py="$padding12"
          variant="critical"
          emphasis="primary"
          onPress={async () => {
            const success = await deleteAuthenticator(authenticator)
            if (success && isLastAuthenticator) {
              await disconnectWallet()
              disconnect()
              accountDrawer.close()
            } else {
              setPasskeyMenuModalState(undefined)
              await refreshAuthenticators()
            }
          }}
          isDisabled={!acknowledged}
        >
          {t('common.button.delete')}
        </Button>
      </Flex>
    </GenericPasskeyMenuModal>
  )
}
