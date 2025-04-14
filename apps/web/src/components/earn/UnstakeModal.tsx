import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { Trans, useTranslation } from 'react-i18next'
import JSBI from 'jsbi'
import { ReactNode, useCallback, useState } from 'react'
import { X } from 'react-feather'
import styled from 'lib/styled-components'
import { ClickablePill } from 'pages/Swap/Buy/PredefinedAmount'
import { ThemedText } from 'theme/components/text'
import { Flex, useSporeColors } from 'ui/src'
import { GRG } from 'uniswap/src/constants/tokens'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ModalName} from 'uniswap/src/features/telemetry/constants'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { ResponsiveHeaderText } from 'components/vote/DelegateModal'
import { useRemoveLiquidityModalContext } from 'components/RemoveLiquidity/RemoveLiquidityModalContext'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
import { useUnstakeCallback } from 'state/stake/hooks'
import { useIsTransactionConfirmed, useTransaction } from 'state/transactions/hooks'
import { /*ButtonConfirmed,*/ ButtonPrimary } from 'components/Button/buttons'
//import { ButtonError } from '../Button'
import { LightCard } from 'components/Card/cards'
import { AutoColumn } from 'components/deprecated/Column'
import { RowBetween } from 'components/deprecated/Row'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LoadingView, SubmittedView } from 'components/ModalViews'
import Slider from 'components/Slider'
import { useAccount } from 'hooks/useAccount'
import { logger } from 'utilities/src/logger/logger'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px;
`

const StyledClosed = styled(X)`
  :hover {
    cursor: pointer;
  }
`

interface UnstakeModalProps {
  isOpen: boolean
  isPool?: boolean
  freeStakeBalance?: CurrencyAmount<Token>
  onDismiss: () => void
  title: ReactNode
}

// TODO: add balance input to display amount when withdrawing
export default function UnstakeModal({ isOpen, isPool, freeStakeBalance, onDismiss, title }: UnstakeModalProps) {
  const account = useAccount()
  const { t } = useTranslation()
  const colors = useSporeColors()

  // state for unstake input
  const [currencyValue] = useState<Token | undefined>(GRG[account.chainId ?? UniverseChainId.Mainnet])
  if (!currencyValue) {
    throw new Error ('No GRG token found to unstake')
  }

  const { percent, setPercent } = useRemoveLiquidityModalContext()
  const onPercentSelect = useCallback(
    (percent: number) => {
      setPercent(percent.toString())
    },
    [setPercent],
  )

  // boilerplate for the slider
  const [percentForSlider, onPercentSelectForSlider] = useDebouncedChangeHandler(Number(percent), onPercentSelect)
  const parsedAmount = CurrencyAmount.fromRawAmount(
    currencyValue,
    JSBI.divide(
      JSBI.multiply(freeStakeBalance ? freeStakeBalance.quotient : JSBI.BigInt(0), JSBI.BigInt(percentForSlider)),
      JSBI.BigInt(100)
    )
  )

  const unstakeCallback = useUnstakeCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const [stakeAmount, setStakeAmount] = useState<CurrencyAmount<Token>>()

  const transaction = useTransaction(hash)
  const confirmed = useIsTransactionConfirmed(hash)
  const transactionSuccess = transaction?.status === TransactionStatus.Confirmed

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    // if there was a tx hash, we want to clear the input
    if (hash) {
      onPercentSelectForSlider(0)
    }
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onUnstake() {
    setAttempting(true)
    setStakeAmount(parsedAmount)

    // if callback not returned properly ignore
    if (!unstakeCallback || !freeStakeBalance || !parsedAmount || !currencyValue?.isToken) {
      return
    }

    // try delegation and store hash
    const hash = await unstakeCallback(parsedAmount, isPool)?.catch((error) => {
      setAttempting(false)
      logger.info('UnstakeModal', 'onUnstake', error)
    })

    if (hash) {
      setHash(hash)
    }
  }

  return (
    <Modal name={ModalName.DappRequest} isModalOpen={isOpen} isDismissible onClose={wrappedOnDismiss} maxHeight={480}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <ThemedText.DeprecatedMediumHeader fontWeight={500}>{title}</ThemedText.DeprecatedMediumHeader>
              <StyledClosed stroke="black" onClick={wrappedOnDismiss} />
            </RowBetween>
            <RowBetween>
              {isPool ? <Trans>Unstaking smart pool free stake.</Trans> : <Trans>Unstaking your free stake.</Trans>}
            </RowBetween>
            <RowBetween>
              <ResponsiveHeaderText>
                <Trans>{{percentForSlider}}%</Trans>
              </ResponsiveHeaderText>
              <Flex row gap="$gap8" width="100%" justifyContent="center">
                {[25, 50, 75, 100].map((option) => {
                  const active = percent === option.toString()
                  const disabled = false
                  return (
                    <ClickablePill
                      key={option}
                      onPress={() => {
                        onPercentSelectForSlider(option)
                      }}
                      $disabled={disabled}
                      $active={active}
                      customBorderColor={colors.surface3.val}
                      foregroundColor={colors[disabled ? 'neutral3' : active ? 'neutral1' : 'neutral2'].val}
                      label={option < 100 ? option + '%' : t('swap.button.max')}
                      px="$spacing16"
                      textVariant="buttonLabel2"
                    />
                  )
                })}
              </Flex>
            </RowBetween>
            <Slider value={percentForSlider} onChange={onPercentSelectForSlider} />
            <LightCard>
              <AutoColumn gap="md">
                <RowBetween>
                  <ThemedText.DeprecatedBody fontSize={16} fontWeight={500}>
                    <Trans>Withdrawing {formatCurrencyAmount(parsedAmount, 4)} GRG</Trans>
                  </ThemedText.DeprecatedBody>
                </RowBetween>
              </AutoColumn>
            </LightCard>
            <ButtonPrimary disabled={formatCurrencyAmount(parsedAmount, 4) === '0'} onClick={onUnstake}>
              <ThemedText.DeprecatedMediumHeader color="white">
                <Trans>Unstake</Trans>{' '}
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Withdrawing Stake</Trans>
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedMain fontSize={36}>
              {formatCurrencyAmount(parsedAmount, 4)} GRG
            </ThemedText.DeprecatedMain>
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
                <ThemedText.DeprecatedMain fontSize={36}>
                  Unstaking {formatCurrencyAmount(stakeAmount, 4)} GRG
                </ThemedText.DeprecatedMain>
              </>
            ) : transactionSuccess ? (
              <>
                <ThemedText.DeprecatedLargeHeader>
                  <Trans>Transaction Success</Trans>
                </ThemedText.DeprecatedLargeHeader>
                <ThemedText.DeprecatedMain fontSize={36}>
                  Unstaked {formatCurrencyAmount(stakeAmount, 4)} GRG
                </ThemedText.DeprecatedMain>
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
