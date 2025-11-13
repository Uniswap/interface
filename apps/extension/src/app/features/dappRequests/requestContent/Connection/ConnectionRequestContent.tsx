import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { DappConnectionContent } from 'wallet/src/components/dappRequests/DappConnectionContent'

export function ConnectionRequestContent(): JSX.Element {
  const { t } = useTranslation()
  const { currentAccount } = useDappRequestQueueContext()

  const isViewOnly = currentAccount.type === AccountType.Readonly

  return (
    <DappRequestContent confirmText={t('common.button.connect')} title={t('dapp.request.connect.title')}>
      <DappConnectionContent isViewOnly={isViewOnly} />
    </DappRequestContent>
  )
}
