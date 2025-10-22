import { useShowMoonpayText } from 'components/AccountDrawer/MiniPortfolio/hooks'
import ConnectionErrorView from 'components/WalletModal/ConnectionErrorView'
import PrivacyPolicyNotice from 'components/WalletModal/PrivacyPolicyNotice'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'

interface WalletModalLayoutProps {
  children: ReactNode
  header?: ReactNode
  downloadHeader?: ReactNode
}

export function WalletModalLayout({ children, header, downloadHeader }: WalletModalLayoutProps): JSX.Element {
  const showMoonpayText = useShowMoonpayText()
  const { t } = useTranslation()

  return (
    <>
      {downloadHeader}
      <Flex
        backgroundColor="$surface1"
        pt="$padding16"
        px="$padding12"
        pb="$padding20"
        flex={1}
        gap="$gap16"
        data-testid="wallet-modal"
      >
        <ConnectionErrorView />
        {header}
        <Flex gap="$gap12">
          {children}
          <Flex gap="$gap8">
            <Flex px="$spacing4">
              <PrivacyPolicyNotice />
            </Flex>
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
