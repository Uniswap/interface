import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip } from 'ui/src'
import { AlertTriangle } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { isMobileApp } from 'utilities/src/platform'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { ContentRow } from 'wallet/src/features/transactions/TransactionRequest/ContentRow'

export function AddressFooter({
  connectedAccountAddress,
  activeAccountAddress,
}: {
  connectedAccountAddress?: string
  activeAccountAddress: string
}): JSX.Element {
  const { t } = useTranslation()

  const variant = isMobileApp ? 'body3' : 'body4'

  const currentAccountAddress = connectedAccountAddress || activeAccountAddress

  const showWarning = connectedAccountAddress && !areAddressesEqual(connectedAccountAddress, activeAccountAddress)

  return (
    <Flex grow px="$spacing8">
      <ContentRow
        label={
          <Flex grow row alignItems="center" gap="$spacing4">
            <Text color="$neutral2" variant={variant}>
              {t('dapp.request.approve.label')}
            </Text>
            {showWarning && <TooltipWarning />}
          </Flex>
        }
      >
        <AddressDisplay
          hideAddressInSubtitle
          address={currentAccountAddress}
          horizontalGap="$spacing4"
          size={16}
          variant={variant}
        />
      </ContentRow>
    </Flex>
  )
}

const TooltipWarning = (): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Tooltip placement="top">
      <Tooltip.Trigger>
        <AlertTriangle color="$neutral3" size={iconSizes.icon16} />
      </Tooltip.Trigger>
      <Tooltip.Content ml="$spacing12" px="$none" py="$none">
        <Flex
          backgroundColor="$surface3"
          borderColor="$surface3"
          borderRadius="$rounded16"
          borderWidth={1}
          p="$spacing12"
        >
          <Text variant="body4">{t('dapp.request.warning.notActive.title')}</Text>
          <Text color="$neutral2" variant="body4">
            {t('dapp.request.warning.notActive.message')}
          </Text>
        </Flex>
      </Tooltip.Content>
    </Tooltip>
  )
}
