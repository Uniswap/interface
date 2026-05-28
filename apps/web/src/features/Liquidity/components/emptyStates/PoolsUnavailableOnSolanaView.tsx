import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { MenuStateVariant, useSetMenu } from '~/components/AccountDrawer/menuState'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import {
  BUTTON_AREA_WIDTH,
  PositionsEmptyStateLayout,
} from '~/features/Liquidity/components/emptyStates/PositionsEmptyStateLayout'

export function PoolsUnavailableOnSolanaView({ withBorder }: { withBorder?: boolean }): JSX.Element {
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()
  const setMenu = useSetMenu()

  const handleConnectEthereumWallet = () => {
    setMenu({ variant: MenuStateVariant.CONNECT_PLATFORM, platform: Platform.EVM })
    accountDrawer.open()
  }

  return (
    <PositionsEmptyStateLayout
      title={t('pool.notAvailableOnSolana')}
      description={t('pool.connectEthereumToView')}
      withBorder={withBorder}
      action={
        <Flex width={BUTTON_AREA_WIDTH} $md={{ width: '100%' }}>
          <Button
            $md={{
              py: '$spacing16',
            }}
            variant="default"
            size="small"
            fill={false}
            width="100%"
            onPress={handleConnectEthereumWallet}
          >
            {t('common.connectAWallet.button.evm')}
          </Button>
        </Flex>
      }
    />
  )
}
