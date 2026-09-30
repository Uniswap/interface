import { Button, Flex, Loader, Text } from '@universe/mycelium'
import { Scan } from '@universe/mycelium/icons/Scan'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { QrCodeSelection } from 'src/features/send/qrCodeSelection'
import { QrCodeSelectionChangeType, QrCodeSelectionType } from 'src/features/send/qrCodeSelection'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { getTokenProtectionWarning, getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/warnings/slice/hooks'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { RecipientSelectSpeedBumps } from 'wallet/src/components/RecipientSearch/RecipientSelectSpeedBumps'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'

type QrCodeSelectionHandlerProps = {
  selection: QrCodeSelection
  onClose: () => void
}

export function QrCodeSelectionHandler(props: QrCodeSelectionHandlerProps): JSX.Element {
  return <QrCodeSelectionHandlerContent key={props.selection.type} {...props} />
}

function QrCodeSelectionHandlerContent({ selection, onClose }: QrCodeSelectionHandlerProps): JSX.Element {
  const { t } = useTranslation()
  const { onSelectCurrency, recipient } = useSendContext()
  const [checkTargetChainSpeedBumps, setCheckTargetChainSpeedBumpsState] = useState(false)
  const [initialSelectionStarted, setInitialSelectionStarted] = useState(false)
  const [showTokenWarning, setShowTokenWarning] = useState(false)
  const recipientCheckConfirmed = useRef(false)
  const { data: currencyInfo, isLoading } = useCurrencyInfoWithLoading(
    buildCurrencyId(selection.chainId, selection.tokenAddress),
  )
  const tokenProtectionWarning = getTokenProtectionWarning(currencyInfo)
  const tokenWarningSeverity = getTokenWarningSeverity(currencyInfo)
  const { tokenWarningDismissed } = useDismissedTokenWarnings(currencyInfo?.currency, tokenProtectionWarning)
  const isInitialSelection = selection.type === QrCodeSelectionType.Initial
  const shouldCheckRecipient = isInitialSelection || selection.changeType !== QrCodeSelectionChangeType.Token
  const needsTokenWarning = Boolean(
    currencyInfo?.currency.isToken &&
    (tokenWarningSeverity === WarningSeverity.Blocked ||
      (tokenWarningSeverity !== WarningSeverity.None && !tokenWarningDismissed)),
  )
  const copyByChangeType = {
    [QrCodeSelectionChangeType.Network]: {
      title: t('send.qrCodeSelection.warning.network.title'),
      message: t('send.qrCodeSelection.warning.network.message'),
    },
    [QrCodeSelectionChangeType.Token]: {
      title: t('send.qrCodeSelection.warning.token.title'),
      message: t('send.qrCodeSelection.warning.token.message'),
    },
    [QrCodeSelectionChangeType.NetworkAndToken]: {
      title: t('send.qrCodeSelection.warning.networkAndToken.title'),
      message: t('send.qrCodeSelection.warning.networkAndToken.message'),
    },
  } satisfies Record<QrCodeSelectionChangeType, { title: string; message: string }>
  const copy = selection.type === QrCodeSelectionType.Change ? copyByChangeType[selection.changeType] : undefined

  const setCheckTargetChainSpeedBumps = useCallback(
    (value: boolean): void => {
      setCheckTargetChainSpeedBumpsState(value)
      if (!value && isInitialSelection && !recipientCheckConfirmed.current) {
        onClose()
      }
    },
    [isInitialSelection, onClose],
  )

  useEffect(() => {
    if (!isInitialSelection || isLoading || initialSelectionStarted) {
      return
    }

    if (!currencyInfo) {
      onClose()
      return
    }

    setInitialSelectionStarted(true)
    setCheckTargetChainSpeedBumps(true)
  }, [currencyInfo, initialSelectionStarted, isInitialSelection, isLoading, onClose, setCheckTargetChainSpeedBumps])

  const applySelection = (): void => {
    if (!currencyInfo) {
      return
    }

    onSelectCurrency({ currency: currencyInfo.currency })
    onClose()
  }

  const continueAfterRecipientCheck = (): void => {
    recipientCheckConfirmed.current = true
    if (needsTokenWarning) {
      setShowTokenWarning(true)
    } else {
      applySelection()
    }
  }

  const onUpdate = (): void => {
    if (!currencyInfo) {
      return
    }

    if (shouldCheckRecipient) {
      setCheckTargetChainSpeedBumps(true)
    } else {
      continueAfterRecipientCheck()
    }
  }

  const onAcknowledgeTokenWarning = (): void => {
    setShowTokenWarning(false)
    applySelection()
  }

  const closeTokenWarning = (): void => {
    setShowTokenWarning(false)
    if (isInitialSelection) {
      onClose()
    }
  }

  return (
    <>
      {copy && (
        <Modal name={ModalName.QrCodeSelectionWarning} onClose={onClose}>
          <Flex px="$spacing24" pb="$spacing12" pt="$spacing12">
            <Flex centered gap="$spacing8">
              <Flex centered backgroundColor="$surface2" borderRadius="$rounded12" mb="$spacing4" p="$spacing12">
                <Scan color="$neutral2" size="$icon.24" />
              </Flex>
              <Text textAlign="center" variant="subheading1">
                {copy.title}
              </Text>
              <Text color="$neutral2" textAlign="center" variant="body3">
                {copy.message}
              </Text>
            </Flex>

            <Flex
              borderColor="$surface3"
              borderRadius="$rounded16"
              borderWidth="$spacing1"
              gap="$spacing8"
              mt="$spacing16"
              p="$spacing16"
            >
              <SelectionDetailRow
                label={t('send.qrCodeSelection.warning.details.chain')}
                value={
                  <Flex row alignItems="center" gap="$spacing4">
                    <NetworkLogo chainId={selection.chainId} size={16} />
                    <Text variant="body3">{getChainLabel(selection.chainId)}</Text>
                  </Flex>
                }
              />
              <SelectionDetailRow
                label={t('send.qrCodeSelection.warning.details.token')}
                value={
                  <Flex row alignItems="center" gap="$spacing4">
                    {isLoading ? (
                      <Loader.Box borderRadius="$roundedFull" height={16} width={16} />
                    ) : (
                      <CurrencyLogo hideNetworkLogo currencyInfo={currencyInfo} size={16} />
                    )}
                    <Text variant="body3">
                      {currencyInfo?.currency.symbol ?? shortenAddress({ address: selection.tokenAddress })}
                    </Text>
                  </Flex>
                }
              />
              {!isLoading && !currencyInfo && (
                <Text color="$statusCritical" variant="body3">
                  {t('send.qrCodeSelection.warning.token.unavailable', {
                    chainName: getChainLabel(selection.chainId),
                  })}
                </Text>
              )}
            </Flex>

            <Flex row gap="$spacing8" pt="$spacing24">
              <Button fill={false} flex={1} emphasis="secondary" size="medium" onPress={onClose}>
                {t('send.qrCodeSelection.warning.action.keep')}
              </Button>
              <Button
                fill={false}
                flex={1}
                disabled={!currencyInfo}
                emphasis="primary"
                loading={isLoading}
                size="medium"
                variant="branded"
                onPress={onUpdate}
              >
                {t('send.qrCodeSelection.warning.action.update')}
              </Button>
            </Flex>
          </Flex>
        </Modal>
      )}
      {shouldCheckRecipient && recipient && (
        <RecipientSelectSpeedBumps
          onlyCheckChainDependentWarnings
          chainId={selection.chainId}
          checkSpeedBumps={checkTargetChainSpeedBumps}
          recipientAddress={recipient}
          setCheckSpeedBumps={setCheckTargetChainSpeedBumps}
          onConfirm={continueAfterRecipientCheck}
        />
      )}
      {showTokenWarning && currencyInfo && (
        <TokenWarningModal
          isVisible
          currencyInfo0={currencyInfo}
          closeModalOnly={closeTokenWarning}
          onAcknowledge={onAcknowledgeTokenWarning}
        />
      )}
    </>
  )
}

function SelectionDetailRow({ label, value }: { label: string; value: ReactNode }): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text color="$neutral2" variant="body3">
        {label}
      </Text>
      {value}
    </Flex>
  )
}
