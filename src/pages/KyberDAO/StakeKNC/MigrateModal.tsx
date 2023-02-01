import { ChainId, MaxUint256, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { parseUnits } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import { ArrowDown, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import Row, { AutoRow, RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useKyberDAOInfo, useKyberDaoStakeActions } from 'hooks/kyberdao'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTheme from 'hooks/useTheme'
import useTokenBalance from 'hooks/useTokenBalance'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'

import CurrencyInputForStake from './CurrencyInputForStake'
import { useSwitchToEthereum } from './SwitchToEthereumModal'

const Wrapper = styled.div`
  padding: 24px;
`

export default function MigrateModal({
  setPendingText,
  setShowConfirm,
  setAttemptingTxn,
  setTransactionError,
  setTxHash,
}: {
  setPendingText: React.Dispatch<React.SetStateAction<string>>
  setShowConfirm: React.Dispatch<React.SetStateAction<boolean>>
  setAttemptingTxn: React.Dispatch<React.SetStateAction<boolean>>
  setTransactionError: React.Dispatch<React.SetStateAction<string | undefined>>
  setTxHash: React.Dispatch<React.SetStateAction<string | undefined>>
}) {
  const kyberDAOInfo = useKyberDAOInfo()
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const modalOpen = useModalOpen(ApplicationModal.MIGRATE_KNC)
  const toggleModal = useToggleModal(ApplicationModal.MIGRATE_KNC)
  const { migrate } = useKyberDaoStakeActions()
  const [value, setValue] = useState('1')
  const [error, setError] = useState('')
  const [approval, approveCallback] = useApproveCallback(
    TokenAmount.fromRawAmount(
      new Token(
        chainId === ChainId.GÖRLI ? ChainId.GÖRLI : ChainId.MAINNET,
        kyberDAOInfo?.KNCLAddress || '',
        18,
        'KNCL',
      ),
      MaxUint256,
    ),
    kyberDAOInfo?.KNCAddress,
  )
  const oldKNCBalance = useTokenBalance(kyberDAOInfo?.KNCLAddress || '')
  useEffect(() => {
    // Check if too many decimals
    try {
      parseUnits(value, 18)
    } catch {
      setError(t`Invalid amount`)
      return
    }
    if (!value || isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
      setError(t`Invalid amount`)
    } else if (!oldKNCBalance.value.gte(parseUnits(value, 18))) {
      setError(t`Insufficient KNCL balance!`)
      return
    } else {
      setError('')
    }
  }, [value, oldKNCBalance?.value])
  const { switchToEthereum } = useSwitchToEthereum()

  const handleMigrate = () => {
    setError('')
    switchToEthereum().then(() => {
      try {
        setPendingText(t`Migrating ${value} KNCL to KNC`)
        setShowConfirm(true)
        setAttemptingTxn(true)
        toggleModal()
        migrate(parseUnits(value, 18), value)
          .then(tx => {
            setAttemptingTxn(false)
            setTxHash(tx)
          })
          .catch(error => {
            setTransactionError(error?.message)
            setAttemptingTxn(false)
          })
      } catch (error) {
        setError(error)
      }
    })
  }

  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal} minHeight={false} maxHeight={664} maxWidth={420}>
      <Wrapper>
        <AutoColumn gap="20px">
          <RowBetween>
            <Text fontSize={20} color={theme.text}>
              <Trans>KNC Migration</Trans>
            </Text>
            <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleModal}>
              <X onClick={toggleModal} size={20} color={theme.subText} />
            </Flex>
          </RowBetween>
          <Text fontSize={12} lineHeight="16px" color={theme.subText}>
            <Trans>
              Click Migrate to start the migration process from KNC Legacy to the new KNC. You will receive the new KNC
              tokens in your wallet once the transaction has been confirmed. Conversion rate is 1:1. Read about the KNC{' '}
              migration{' '}
              <ExternalLink href="https://blog.kyber.network/knc-token-migration-guide-fda08bfe62c2">
                {' '}
                here ↗
              </ExternalLink>
            </Trans>
          </Text>
          <CurrencyInputForStake
            value={value}
            setValue={setValue}
            tokenAddress={kyberDAOInfo?.KNCLAddress || ''}
            tokenName="KNCL"
          />
          <RowBetween>
            <Text fontSize={12} color={theme.subText}>
              1KNCL = 1KNC
            </Text>
            <AutoRow
              style={{
                height: '44px',
                width: '44px',
                borderRadius: '50%',
                background: theme.buttonBlack,
                padding: '10px',
              }}
            >
              <ArrowDown />
            </AutoRow>
          </RowBetween>
          <CurrencyInputForStake
            value={value}
            setValue={setValue}
            tokenAddress={kyberDAOInfo?.KNCAddress || ''}
            tokenName="KNC"
            disabled
          />
          <Row gap="12px">
            {(approval === ApprovalState.NOT_APPROVED || approval === ApprovalState.PENDING) && !error && (
              <ButtonPrimary onClick={approveCallback} disabled={approval === ApprovalState.PENDING}>
                {approval === ApprovalState.PENDING ? 'Approving...' : 'Approve'}
              </ButtonPrimary>
            )}
            <ButtonPrimary disabled={approval !== ApprovalState.APPROVED || !!error} onClick={handleMigrate}>
              <Text fontSize={14}>{error || <Trans>Migrate</Trans>}</Text>
            </ButtonPrimary>
          </Row>
        </AutoColumn>
      </Wrapper>
    </Modal>
  )
}
