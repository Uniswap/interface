import type { FlexCompatProps as FlexProps } from '@universe/mycelium'
import { ArrowDownCircleFilled } from '@universe/mycelium/icons/ArrowDownCircleFilled'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ActionTileWithIconAnimation } from '~/components/ActionTiles/ActionTileWithIconAnimation'
import { useOpenReceiveCryptoModal } from '~/components/ReceiveCryptoModal/useOpenReceiveCryptoModal'
import { ReceiveModalState } from '~/types/receiveCryptoModal'

export function ReceiveActionTile({
  padding = '$spacing12',
  dataTestId = TestID.WalletReceiveCrypto,
}: {
  padding?: FlexProps['p']
  /** Override for e2e when tile is in portfolio overview (avoids collision with drawer). */
  dataTestId?: string
}) {
  const { t } = useTranslation()

  const openReceiveCryptoModal = useOpenReceiveCryptoModal({
    modalState: ReceiveModalState.DEFAULT,
  })

  return (
    <Trace logPress element={ElementName.PortfolioActionReceive}>
      <ActionTileWithIconAnimation
        dataTestId={dataTestId}
        Icon={ArrowDownCircleFilled}
        name={t('common.receive')}
        onClick={openReceiveCryptoModal}
        padding={padding}
      />
    </Trace>
  )
}
