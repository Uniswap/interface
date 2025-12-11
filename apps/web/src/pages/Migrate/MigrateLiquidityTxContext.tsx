import { V2PairInfo, V3PositionInfo } from 'components/Liquidity/types'
import {
  MigratePositionTxContextType,
  useMigrateLPPositionTxInfo,
} from 'pages/Migrate/hooks/useMigrateLPPositionTxInfo'
import { createContext, PropsWithChildren, useContext } from 'react'

const MigratePositionTxContext = createContext<MigratePositionTxContextType | undefined>(undefined)

export function useMigrateTxContext() {
  const context = useContext(MigratePositionTxContext)
  if (!context) {
    throw new Error('useMigrateTxContext must be used within a MigratePositionTxContextProvider')
  }
  return context
}

export function MigratePositionTxContextProvider({
  children,
  positionInfo,
}: PropsWithChildren<{ positionInfo: V2PairInfo | V3PositionInfo }>): JSX.Element {
  const { txInfo, transactionError, setTransactionError, refetch, refundedAmounts } = useMigrateLPPositionTxInfo({
    positionInfo,
  })

  return (
    <MigratePositionTxContext.Provider
      value={{
        txInfo,
        refundedAmounts,
        transactionError,
        setTransactionError,
        refetch,
      }}
    >
      {children}
    </MigratePositionTxContext.Provider>
  )
}
