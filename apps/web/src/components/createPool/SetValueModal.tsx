import { parseUnits } from '@ethersproject/units'
import { Trans } from 'uniswap/src/i18n'
import JSBI from 'jsbi'
import { ReactNode, useCallback, useState } from 'react'
import { X } from 'react-feather'
import styled from 'lib/styled-components'
import { ThemedText } from 'theme/components/text'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { logger } from 'utilities/src/logger/logger'

import { PoolInfo } from 'state/buy/hooks'
import { useSetValueCallback } from 'state/pool/hooks'
import { useIsTransactionConfirmed, useTransaction } from 'state/transactions/hooks'
import { ButtonError } from 'components/Button/buttons'
import { AutoColumn } from 'components/deprecated/Column'
import { RowBetween } from 'components/deprecated/Row'
import Modal from 'components/Modal'
import { LoadingView, SubmittedView } from 'components/ModalViews'
import NameInputPanel from 'components/NameInputPanel'
import { useAccount } from 'hooks/useAccount'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px;
`

const StyledClosed = styled(X)`
  :hover {
    cursor: pointer;
  }
`

interface SetValueModalProps {
  isOpen: boolean
  onDismiss: () => void
  poolInfo: PoolInfo
  baseTokenSymbol: string
  title: ReactNode
}

export default function SetValueModal({ isOpen, onDismiss, poolInfo, baseTokenSymbol, title }: SetValueModalProps) {
  const account = useAccount()

  // state for create input
  const [typed, setTyped] = useState('')

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback((typed: string) => {
    const numberRegEx = RegExp(`^[0-9]*[.,]?[0-9]*$`)
    if (numberRegEx.test(String(typed))) {
      setTyped(typed)
    }
  }, [])

  const setValueCallback = useSetValueCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  const transaction = useTransaction(hash)
  const confirmed = useIsTransactionConfirmed(hash)
  const transactionSuccess = transaction?.status === TransactionStatus.Confirmed

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  let parsedValue = ''
  // TODO: use currency, as decimals are passed from parent
  try {
    parsedValue = parseUnits(typed, poolInfo.pool.decimals).toString()
  } catch (error) {
    const message = `failed to parse input amount: "${typed}"`
    logger.debug('SetValueModal', 'wrappedOnDismiss', message, error)
  }
  //const parsedValue = typed
  const isSameAsCurrent: boolean = JSBI.equal(
    JSBI.BigInt(parsedValue),
    poolInfo.poolPriceAmount?.quotient ?? JSBI.BigInt(0)
  )
  const isTooSmall: boolean = JSBI.lessThanOrEqual(
    JSBI.BigInt(parsedValue),
    JSBI.divide(poolInfo.poolPriceAmount?.quotient ?? JSBI.BigInt(0), JSBI.BigInt(5))
  )
  const isTooBig: boolean = JSBI.greaterThanOrEqual(
    JSBI.BigInt(parsedValue),
    JSBI.multiply(poolInfo.poolPriceAmount?.quotient ?? JSBI.BigInt(0), JSBI.BigInt(5))
  )

  async function onSetValue() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!account.address || !account.chainId || !setValueCallback || !parsedValue) {
      return
    }

    // try delegation and store hash
    const hash = await setValueCallback(parsedValue)?.catch((error) => {
      setAttempting(false)
      logger.info('SetValueModal', 'onSetValue', error)
    })

    if (hash) {
      setHash(hash)
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={480}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <ThemedText.DeprecatedMediumHeader fontWeight={500}>{title}</ThemedText.DeprecatedMediumHeader>
              <StyledClosed stroke="black" onClick={wrappedOnDismiss} />
            </RowBetween>
            <ThemedText.DeprecatedBody>
              <Trans>New value must be between 1/5th and 5 times the current value.</Trans>
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody>
              <Trans>Pool base token balance must be at least 3% of new pool value.</Trans>
            </ThemedText.DeprecatedBody>
            <NameInputPanel
              value={typed}
              onChange={onUserInput}
              label={`Unitary Value (${baseTokenSymbol})`}
              placeholder="New Value"
            />
            {/* TODO: display return error from hook */}
            <ButtonError
              disabled={typed === '' || typed?.length > 10 || isSameAsCurrent || isTooSmall || isTooBig}
              error={isSameAsCurrent || (typed && Number(parsedValue) !== 0 && isTooSmall) || isTooBig}
              onClick={onSetValue}
            >
              <ThemedText.DeprecatedMediumHeader color="white">
                {isSameAsCurrent ? (
                  <Trans>Same as current</Trans>
                ) : typed && Number(parsedValue) !== 0 && isTooSmall ? (
                  <Trans>less than 20% of current</Trans>
                ) : isTooBig ? (
                  <Trans>more than 5x current</Trans>
                ) : (
                  <Trans>Update Value</Trans>
                )}
              </ThemedText.DeprecatedMediumHeader>
            </ButtonError>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Updating Value</Trans>
            </ThemedText.DeprecatedLargeHeader>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash} transactionSuccess={transactionSuccess}>
          <AutoColumn gap="12px" justify="center">
            {!confirmed ? (
              <>
                <ThemedText.DeprecatedLargeHeader>
                  <Trans>Transaction Submitted</Trans>
                </ThemedText.DeprecatedLargeHeader>
                <ThemedText.DeprecatedBody fontSize={20}>
                  <Trans>
                    Setting value to {typed} {baseTokenSymbol}
                  </Trans>
                </ThemedText.DeprecatedBody>
              </>
            ) : transactionSuccess ? (
              <>
                <ThemedText.DeprecatedLargeHeader>
                  <Trans>Transaction Success</Trans>
                </ThemedText.DeprecatedLargeHeader>
                <ThemedText.DeprecatedBody fontSize={20}>
                  <Trans>
                    Value set to {typed} {baseTokenSymbol}
                  </Trans>
                </ThemedText.DeprecatedBody>
              </>
            ) : (
              <ThemedText.DeprecatedLargeHeader>
                <Trans>Transaction Failed</Trans>
              </ThemedText.DeprecatedLargeHeader>
            )}
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
