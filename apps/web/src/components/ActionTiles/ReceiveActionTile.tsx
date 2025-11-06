import { ActionTileWithIconAnimation } from 'components/ActionTiles/ActionTileWithIconAnimation'
import { ReceiveModalState } from 'components/ReceiveCryptoModal/types'
import { useOpenReceiveCryptoModal } from 'components/ReceiveCryptoModal/useOpenReceiveCryptoModal'
import { useTranslation } from 'react-i18next'
import { ArrowDownCircleFilled } from 'ui/src/components/icons/ArrowDownCircleFilled'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function ReceiveActionTile() {
  const { t } = useTranslation()

  const openReceiveCryptoModal = useOpenReceiveCryptoModal({
    modalState: ReceiveModalState.DEFAULT,
  })

  return (
    <ActionTileWithIconAnimation
      dataTestId={TestID.WalletReceiveCrypto}
      Icon={ArrowDownCircleFilled}
      name={t('common.receive')}
      onClick={openReceiveCryptoModal}
    />
  )
}
