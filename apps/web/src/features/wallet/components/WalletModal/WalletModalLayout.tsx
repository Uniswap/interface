import { Flex, Text } from '@universe/mycelium'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectionErrorView } from '~/features/wallet/components/WalletModal/ConnectionErrorView'
import { PrivacyPolicyNotice } from '~/features/wallet/components/WalletModal/PrivacyPolicyNotice'
import { useShowMoonpayText } from '~/state/accountDrawer/hooks'

interface WalletModalLayoutProps {
  children: ReactNode
  header?: ReactNode
  downloadHeader?: ReactNode
  hidePolicyNotice?: boolean
}

export function WalletModalLayout({
  children,
  header,
  downloadHeader,
  hidePolicyNotice,
}: WalletModalLayoutProps): JSX.Element {
  const showMoonpayText = useShowMoonpayText()
  const { t } = useTranslation()

  return (
    <>
      {downloadHeader}
      <Flex backgroundColor="$surface1" p="$padding16" flex={1} gap="$gap16" testID="wallet-modal">
        <ConnectionErrorView />
        {header}
        <Flex gap="$gap12">
          {children}
          <Flex gap="$gap8">
            {!hidePolicyNotice && (
              <Flex px="$spacing4">
                <PrivacyPolicyNotice />
              </Flex>
            )}
            {showMoonpayText && (
              <Flex borderTopWidth={1} pt="$spacing8" borderColor="$surface3" px="$spacing4">
                <Text variant="body4" color="$neutral3">
                  {t('moonpay.poweredBy')}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
