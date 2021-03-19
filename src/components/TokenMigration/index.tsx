import React, { useContext, useState } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Text } from 'rebass'
import { ChevronLeft, ArrowRight } from 'react-feather'
import Modal from '../Modal'
import { ButtonError, ButtonPrimary } from '../Button'
import { AutoColumn } from '../Column'
import { TYPE } from '../../theme'
import Token from './Token'
import { Currency, Token as TokenEntity } from '@fuseio/fuse-swap-sdk'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import { TOKEN_MIGRATOR_ADDRESS } from '../../constants'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useActiveWeb3React, useUpgradedTokenAddress } from '../../hooks'
import { RowBetween } from '../Row'
import { Dots } from '../swap/styleds'
import { getTokenMigrationContract, calculateGasMargin, addTokenToWallet } from '../../utils'
import { WrappedTokenInfo } from '../../state/lists/hooks'
import { useCurrency } from '../../hooks/Tokens'
import { useTransactionAdder } from '../../state/transactions/hooks'

const Wrapper = styled.div`
  width: 100%;
`

const Header = styled.div`
  padding: 1.25rem;
  border-bottom: 1px solid #2c2f36;
  position: relative;
`

const BackButton = styled.button`
  background: transparent;
  position: absolute;
  border: 0;
  left: 0;
  cursor: pointer;
  margin-left: 1rem;
`

const Body = styled.div`
  padding: 1rem 1.5rem;
`

const MigrationCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`

enum MigrationState {
  INITIAL = 0,
  PENDING = 1,
  MIGRATED = 2
}

export default function TokenMigrationModal({
  token: deprecatedToken,
  isOpen,
  onDismiss,
  listType
}: {
  token: Currency | undefined
  isOpen: boolean
  onDismiss: () => void
  listType: CurrencyListType
}) {
  const { account, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const wrappedDeprecatedToken = deprecatedToken as WrappedTokenInfo
  const upgradedTokenAddress = useUpgradedTokenAddress(wrappedDeprecatedToken)

  const upgradedToken = useCurrency(upgradedTokenAddress, listType)
  const wrappedUpgradedToken = upgradedToken as WrappedTokenInfo

  const balance = useTokenBalance(account ?? undefined, deprecatedToken as TokenEntity)
  const [approval, approveCallback] = useApproveCallback(balance, TOKEN_MIGRATOR_ADDRESS)

  const [migrationState, setMigrationState] = useState<MigrationState>(MigrationState.INITIAL)

  const addTransaction = useTransactionAdder()

  async function onMigrate() {
    if (!balance || !library || !account) return

    const tokenMigrator = getTokenMigrationContract(library, account)
    const args = [wrappedDeprecatedToken.address, balance.raw.toString()]

    try {
      setMigrationState(MigrationState.PENDING)
      const estimatedGas = await tokenMigrator.estimateGas.migrateTokens(...args)
      const response = await tokenMigrator.migrateTokens(...args, { gasLimit: calculateGasMargin(estimatedGas) })

      addTransaction(response, { summary: `Migrate ${deprecatedToken?.symbol}` })
      setMigrationState(MigrationState.MIGRATED)

      if (wrappedUpgradedToken) {
        await addTokenToWallet(wrappedUpgradedToken, library)
      }
    } catch (e) {
      setMigrationState(MigrationState.INITIAL)
      console.log(e)
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} backgroundColor={theme.bg1}>
      <Wrapper>
        <Header>
          <AutoColumn gap="md" justify="center">
            <BackButton onClick={onDismiss}>
              <ChevronLeft color="white" />
            </BackButton>
            <TYPE.mediumHeader>Migrate Token</TYPE.mediumHeader>
          </AutoColumn>
        </Header>
        <Body>
          <AutoColumn>
            <MigrationCard>
              <Token token={deprecatedToken} addressColor={theme.red1} />
              <ArrowRight />
              <Token token={upgradedToken ?? undefined} addressColor="#008fff" />
            </MigrationCard>
            <TYPE.body marginBottom={60}>
              {migrationState === MigrationState.MIGRATED ? (
                <>
                  You received {balance?.toSignificant()} {upgradedToken?.symbol} tokens. New token address is at{' '}
                  {wrappedUpgradedToken?.address}
                </>
              ) : (
                <>
                  Due to recent changes in fuse contracts architecture, the token you selected is deprecated. Please
                  migrate your token and receive a new one{' '}
                </>
              )}
            </TYPE.body>
            {(approval === ApprovalState.NOT_APPROVED || approval === ApprovalState.PENDING) && (
              <RowBetween marginBottom={20}>
                <ButtonPrimary onClick={approveCallback} disabled={approval === ApprovalState.PENDING}>
                  {approval === ApprovalState.PENDING ? (
                    <Dots>Approving {deprecatedToken?.symbol}</Dots>
                  ) : (
                    'Approve ' + deprecatedToken?.symbol
                  )}
                </ButtonPrimary>
              </RowBetween>
            )}
            <ButtonError
              onClick={() => (migrationState === MigrationState.MIGRATED ? onDismiss() : onMigrate())}
              disabled={approval !== ApprovalState.APPROVED}
              error={approval !== ApprovalState.APPROVED}
            >
              <Text fontSize={20} fontWeight={500}>
                {migrationState === MigrationState.INITIAL && 'Migrate'}
                {migrationState === MigrationState.PENDING && 'Migrating...'}
                {migrationState === MigrationState.MIGRATED && 'Done'}
              </Text>
            </ButtonError>
          </AutoColumn>
        </Body>
      </Wrapper>
    </Modal>
  )
}
