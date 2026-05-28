import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { DappConnectionContent } from 'wallet/src/components/dappRequests/DappConnectionContent'
import { useBlockaidVerification } from 'wallet/src/features/dappRequests/hooks/useBlockaidVerification'
import { useDappConnectionConfirmation } from 'wallet/src/features/dappRequests/hooks/useDappConnectionConfirmation'
import { DappVerificationStatus } from 'wallet/src/features/dappRequests/types'
import { applyFirstPartyOverride } from 'wallet/src/features/dappRequests/verification'

export function ConnectionRequestContent(): JSX.Element {
  const { t } = useTranslation()
  const { currentAccount, dappUrl } = useDappRequestQueueContext()
  const { verificationStatus: blockaidStatus } = useBlockaidVerification(dappUrl)
  // Apply the first-party override even when Blockaid is loading or unavailable (blockaidStatus is undefined),
  // defaulting to Unverified — consistent with how mergeVerificationStatuses treats missing signals on mobile.
  const verificationStatus = applyFirstPartyOverride(blockaidStatus ?? DappVerificationStatus.Unverified, dappUrl)

  const isViewOnly = currentAccount.type === AccountType.Readonly
  const { confirmedWarning, setConfirmedWarning, disableConfirm } = useDappConnectionConfirmation({
    verificationStatus,
    isViewOnly,
  })

  return (
    <DappRequestContent
      confirmText={t('common.button.connect')}
      title={t('dapp.request.connect.title')}
      verificationStatus={verificationStatus}
      disableConfirm={disableConfirm}
    >
      <DappConnectionContent
        verificationStatus={verificationStatus}
        confirmedWarning={confirmedWarning}
        onConfirmWarning={setConfirmedWarning}
        isViewOnly={isViewOnly}
      />
    </DappRequestContent>
  )
}
