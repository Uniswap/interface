import { isAddress } from '@ethersproject/address'
import AddressInputPanel from 'components/AddressInputPanel'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { LoadingView, SubmittedView } from 'components/ModalViews'
import { RowBetween } from 'components/Row'
import { UNI } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import useENS from 'hooks/useENS'
import { Trans } from 'i18n'
import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import styled from 'lib/styled-components'
import { ReactNode, useState } from 'react'
import { X } from 'react-feather'
import { useDelegateCallback } from 'state/governance/hooks'
import { ThemedText } from 'theme/components'
import { Text } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px;
`

const StyledClosed = styled(X)`
  :hover {
    cursor: pointer;
  }
`

const TextButton = styled.div`
  :hover {
    cursor: pointer;
  }
`

interface VoteModalProps {
  isOpen: boolean
  onDismiss: () => void
  title: ReactNode
}

export default function DelegateModal({ isOpen, onDismiss, title }: VoteModalProps) {
  const account = useAccount()

  // state for delegate input
  const [usingDelegate, setUsingDelegate] = useState(false)
  const [typed, setTyped] = useState('')
  function handleRecipientType(val: string) {
    setTyped(val)
  }

  // monitor for self delegation or input for third part delegate
  // default is self delegation
  const activeDelegate = usingDelegate ? typed : account.address
  const { address: parsedAddress } = useENS(activeDelegate)

  // get the number of votes available to delegate
  const uniBalance = useTokenBalance(account.address, account.chainId ? UNI[account.chainId] : undefined)

  const delegateCallback = useDelegateCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onDelegate() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!delegateCallback) {
      return
    }

    // try delegation and store hash
    const hash = await delegateCallback(parsedAddress ?? undefined)?.catch((error) => {
      setAttempting(false)
      logger.info('DelegateModal', 'onDelegate', error)
    })

    if (hash) {
      setHash(hash)
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight="90vh">
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <ThemedText.DeprecatedMediumHeader fontWeight={535}>{title}</ThemedText.DeprecatedMediumHeader>
              <StyledClosed stroke="black" onClick={wrappedOnDismiss} />
            </RowBetween>
            <ThemedText.DeprecatedBody>
              <Trans i18nKey="uni.votingShares" />
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody>
              <Trans i18nKey="uni.voteOrDelegate" />
            </ThemedText.DeprecatedBody>
            {usingDelegate && <AddressInputPanel value={typed} onChange={handleRecipientType} />}
            <ButtonPrimary disabled={!isAddress(parsedAddress ?? '')} onClick={onDelegate}>
              <ThemedText.DeprecatedMediumHeader color="white">
                {usingDelegate ? <Trans i18nKey="uni.delegateVotes" /> : <Trans i18nKey="uni.selfDelegate" />}
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
            <TextButton onClick={() => setUsingDelegate(!usingDelegate)}>
              <Text color="$accent1">
                {usingDelegate ? <Trans i18nKey="uni.removeDelegate" /> : <Trans i18nKey="uni.addDelegate" />}
              </Text>
            </TextButton>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="md" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              {usingDelegate ? <Trans i18nKey="uni.delegatingVotes" /> : <Trans i18nKey="uni.unlockingVotes" />}
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedMain fontSize={36}> {formatCurrencyAmount(uniBalance, 4)}</ThemedText.DeprecatedMain>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="md" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans i18nKey="common.transactionSubmitted" />
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedMain fontSize={36}>{formatCurrencyAmount(uniBalance, 4)}</ThemedText.DeprecatedMain>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
