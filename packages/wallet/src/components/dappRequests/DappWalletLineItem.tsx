import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { ContentRow } from 'uniswap/src/components/transactions/requests/ContentRow'
import { isExtensionApp, isMobileApp } from 'utilities/src/platform'

/**
 * Displays the active account address in dapp request footers.
 *
 * Note: This component intentionally does not compare connectedAccountAddress vs activeAccountAddress.
 * That security check is extension-specific and handled by the AddressFooter component in the extension.
 * This shared component is used in mobile and scanning UIs where the address comparison is not needed
 * or is handled differently by the consuming application.
 */
export function DappWalletLineItem({ activeAccountAddress }: { activeAccountAddress: string }): JSX.Element {
  const { t } = useTranslation()

  const variant = isMobileApp || isExtensionApp ? 'body3' : 'body4'

  return (
    <Flex grow>
      <ContentRow
        label={
          <Text color="$neutral2" variant={variant}>
            {t('dapp.request.approve.label')}
          </Text>
        }
      >
        <AddressDisplay
          disableForcedWidth
          hideAddressInSubtitle
          address={activeAccountAddress}
          horizontalGap="$spacing4"
          size={16}
          variant={variant}
          flexGrow={false}
        />
      </ContentRow>
    </Flex>
  )
}
