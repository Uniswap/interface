import { isExtensionApp } from '@universe/environment'
import { useState } from 'react'
import { PlanDetailsView } from 'uniswap/src/components/activity/details/plan/PlanDetailsView'
import { TransactionDetailsOverview } from 'uniswap/src/components/activity/details/TransactionDetailsOverview'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useTransactionActions } from 'uniswap/src/features/activity/hooks/useTransactionActions'
import { AuthTrigger } from 'uniswap/src/features/auth/types'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isPlanTransactionInfo } from 'uniswap/src/features/transactions/types/utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'

export type TransactionDetailsModalProps = {
  isExternalProfile?: boolean
  transactionDetails: TransactionDetails
  authTrigger?: AuthTrigger
  onClose: () => void
  onReportSuccess?: () => void
  onUnhideTransaction?: () => void
  onCopySuccess?: () => void
  isEarnActivityDisplayEnabled?: boolean
}

enum TransactionDetailsView {
  Overview = 'Overview',
  Plan = 'Plan',
}

export function TransactionDetailsModal(props: TransactionDetailsModalProps): JSX.Element {
  const { transactionDetails } = props
  const { typeInfo, status } = transactionDetails
  const isEarnEnabled = useIsEarnEnabled()
  const isEarnActivityDisplayEnabled = props.isEarnActivityDisplayEnabled ?? isEarnEnabled
  const { renderModals, openCancelModal, menuItems } = useTransactionActions({
    ...props,
    transaction: props.transactionDetails,
  })
  const [view, setView] = useState<TransactionDetailsView>(TransactionDetailsView.Overview)

  const openPlanView = useEvent(() => setView(TransactionDetailsView.Plan))
  const closePlanView = useEvent(() => setView(TransactionDetailsView.Overview))

  return (
    <>
      <Modal
        isDismissible
        alignment={isExtensionApp ? 'top' : 'center'}
        name={ModalName.TransactionDetails}
        testID={TestID.TransactionDetailsModal}
        onClose={props.onClose}
      >
        {view === TransactionDetailsView.Overview && (
          <TransactionDetailsOverview
            {...props}
            isEarnActivityDisplayEnabled={isEarnActivityDisplayEnabled}
            menuItems={menuItems}
            openPlanView={openPlanView}
            openCancelModal={openCancelModal}
          />
        )}
        {view === TransactionDetailsView.Plan && isPlanTransactionInfo(typeInfo) && (
          <PlanDetailsView
            typeInfo={typeInfo}
            status={status}
            isEarnActivityDisplayEnabled={isEarnActivityDisplayEnabled}
            closePlanView={closePlanView}
            onClose={props.onClose}
          />
        )}
      </Modal>
      {renderModals()}
    </>
  )
}
