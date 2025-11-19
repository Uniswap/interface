import { ActionTileWithIconAnimation } from 'components/ActionTiles/ActionTileWithIconAnimation'
import { SendButtonTooltip } from 'components/ActionTiles/SendActionTile/SendButtonTooltip'
import { useActiveAddresses } from 'features/accounts/store/hooks'
import { useTranslation } from 'react-i18next'
import { FlexProps } from 'ui/src'
import { SendAction } from 'ui/src/components/icons/SendAction'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'

export function SendActionTile({ onPress, padding }: { onPress?: () => void; padding?: FlexProps['p'] }): JSX.Element {
  const { t } = useTranslation()
  const { navigateToSendFlow } = useUniswapContext()
  const { evmAddress, svmAddress } = useActiveAddresses()

  const isSolanaOnlyWallet = Boolean(svmAddress && !evmAddress)

  const onPressSend = useEvent(() => {
    if (!isSolanaOnlyWallet) {
      navigateToSendFlow({ chainId: UniverseChainId.Mainnet })
      onPress?.()
    }
  })

  return (
    <Trace logPress element={ElementName.PortfolioActionSend}>
      <SendButtonTooltip isSolanaOnlyWallet={isSolanaOnlyWallet}>
        <ActionTileWithIconAnimation
          dataTestId={TestID.Send}
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
