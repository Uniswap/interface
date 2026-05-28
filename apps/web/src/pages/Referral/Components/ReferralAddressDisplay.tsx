import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useAccount } from 'hooks/useAccount'
import { ConnectedAddressDisplay } from 'pages/Referral/Components/ConnectedAddressDisplay'
import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'

export function ReferralAddressDisplay({ isCompact }: { isCompact: boolean }): JSX.Element {
  const account = useAccount()
  const { address } = account
  const accountDrawer = useAccountDrawer()
  const { t } = useTranslation()

  if (!address) {
    return (
      <Flex row alignItems="center">
        <Button variant="branded" size="small" emphasis="secondary" width={160} onPress={accountDrawer.open}>
          {t('common.connectWallet.button')}
        </Button>
      </Flex>
    )
  }

  return <ConnectedAddressDisplay isCompact={isCompact} />
}
