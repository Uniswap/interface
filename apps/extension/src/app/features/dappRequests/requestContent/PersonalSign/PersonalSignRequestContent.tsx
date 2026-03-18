import { toUtf8String } from '@ethersproject/strings'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { SignMessageRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { EthMethod } from 'uniswap/src/features/dappRequests/types'
import { logger } from 'utilities/src/logger/logger'
import { containsNonPrintableChars } from 'utilities/src/primitives/string'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { DappPersonalSignContent } from 'wallet/src/components/dappRequests/DappPersonalSignContent'
import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import { shouldDisableConfirm } from 'wallet/src/features/dappRequests/utils/riskUtils'

interface PersonalSignRequestProps {
  dappRequest: SignMessageRequest
}

export function PersonalSignRequestContent({ dappRequest }: PersonalSignRequestProps): JSX.Element | null {
  const { t } = useTranslation()
  const { dappUrl, currentAccount } = useDappRequestQueueContext()
  const activeChain = useDappLastChainId(dappUrl)
  const { value: confirmedRisk, setValue: setConfirmedRisk } = useBooleanState(false)
  // Initialize with null to indicate scan hasn't completed yet
  const [riskLevel, setRiskLevel] = useState<TransactionRiskLevel | null>(null)

  // Decode message to UTF-8
  const hexMessage = dappRequest.messageHex
  const [utf8Message, setUtf8Message] = useState<string | undefined>()

  useEffect(() => {
    try {
      const decodedMessage = toUtf8String(hexMessage)
      setUtf8Message(decodedMessage)
    } catch {
      // If the message is not valid UTF-8, we'll show the hex message instead
      setUtf8Message(undefined)
    }
  }, [hexMessage])

  const isDecoded = Boolean(utf8Message && !containsNonPrintableChars(utf8Message))
  const message = (isDecoded ? utf8Message : hexMessage) || hexMessage
  const hasLoggedError = useRef(false)

  if (!activeChain) {
    if (!hasLoggedError.current) {
      logger.error(new Error('No active chain found'), {
        tags: { file: 'PersonalSignRequestContent', function: 'PersonalSignRequestContent' },
      })
      hasLoggedError.current = true
    }
    return null
  }

  const disableConfirm = shouldDisableConfirm({ riskLevel, confirmedRisk })

  return (
    <DappRequestContent
      confirmText={t('common.button.sign')}
      title={t('dapp.request.signature.header')}
      showAddressFooter={false}
      disableConfirm={disableConfirm}
    >
      <DappPersonalSignContent
        chainId={activeChain}
        account={currentAccount.address}
        message={message}
        isDecoded={isDecoded}
        method={EthMethod.PersonalSign}
        params={[hexMessage, currentAccount.address]}
        dappUrl={dappUrl}
        confirmedRisk={confirmedRisk}
        onConfirmRisk={setConfirmedRisk}
        onRiskLevelChange={setRiskLevel}
      />
    </DappRequestContent>
  )
}
