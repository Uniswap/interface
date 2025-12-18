import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { SignTypedDataRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { NonStandardTypedDataContent } from 'wallet/src/components/dappRequests/SignTypedData/NonStandardTypedDataContent'

interface NonStandardTypedDataRequestContentProps {
  dappRequest: SignTypedDataRequest
}

export function NonStandardTypedDataRequestContent({
  dappRequest,
}: NonStandardTypedDataRequestContentProps): JSX.Element {
  const { t } = useTranslation()
  const [checked, setChecked] = useState(false)

  return (
    <DappRequestContent
      showNetworkCost
      confirmText={t('common.button.sign')}
      title={t('dapp.request.signature.header')}
      disableConfirm={!checked}
    >
      <NonStandardTypedDataContent typedData={dappRequest.typedData} checked={checked} onCheckedChange={setChecked} />
    </DappRequestContent>
  )
}
