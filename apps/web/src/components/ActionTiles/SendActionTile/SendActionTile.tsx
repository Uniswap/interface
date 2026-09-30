import { UniverseChainId } from '@universe/chains'
import type { FlexCompatProps as FlexProps } from '@universe/mycelium'
import { SendAction } from '@universe/mycelium/icons/SendAction'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { ActionTileWithIconAnimation } from '~/components/ActionTiles/ActionTileWithIconAnimation'
import { SendButtonTooltip } from '~/components/ActionTiles/SendActionTile/SendButtonTooltip'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'

export function SendActionTile({
  onPress,
  padding,
  recipient,
  dataTestId = TestID.Send,
}: {
  onPress?: () => void
  padding?: FlexProps['p']
  recipient?: Address
  /** Override for e2e when tile is in portfolio overview (avoids collision with drawer). */
  dataTestId?: string
}): JSX.Element {
  const { t } = useTranslation()
  const { navigateToSendFlow } = useUniswapContext()
  const { evmAddress, svmAddress } = useActiveAddresses()
  const { chainId } = usePortfolioRoutes()

  const isSolanaOnlyWallet = Boolean(svmAddress && !evmAddress)

  const onPressSend = useEvent(() => {
    if (!isSolanaOnlyWallet) {
      navigateToSendFlow({ chainId: chainId ?? UniverseChainId.Mainnet, recipient })
      onPress?.()
    }
  })

  return (
    <Trace logPress element={ElementName.PortfolioActionSend}>
      <SendButtonTooltip isSolanaOnlyWallet={isSolanaOnlyWallet}>
        <ActionTileWithIconAnimation
          dataTestId={dataTestId}
          Icon={SendAction}
          name={t('common.send.button')}
          onClick={onPressSend}
          disabled={isSolanaOnlyWallet}
          padding={padding}
        />
      </SendButtonTooltip>
    </Trace>
  )
}
