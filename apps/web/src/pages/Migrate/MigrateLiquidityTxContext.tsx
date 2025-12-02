import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { V2PairInfo, V3PositionInfo } from 'components/Liquidity/types'
import { useMigrateLPPositionTxInfo } from 'pages/Migrate/hooks/useMigrateLPPositionTxInfo'
import { createContext, Dispatch, PropsWithChildren, SetStateAction, useContext } from 'react'
import { MigratePositionTxAndGasInfo } from 'uniswap/src/features/transactions/liquidity/types'

interface MigratePositionTxContextType {
  txInfo?: MigratePositionTxAndGasInfo
  gasFeeEstimateUSD?: CurrencyAmount<Currency>
  transactionError: boolean | string
  refetch?: () => void
  setTransactionError: Dispatch<SetStateAction<string | boolean>>
}

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
  const { txInfo, transactionError, setTransactionError, refetch } = useMigrateLPPositionTxInfo({
    positionInfo,
  })

  return (
    <MigratePositionTxContext.Provider
      value={{
        txInfo,
        transactionError,
        setTransactionError,
        refetch,
      }}
    >
      {children}
    </MigratePositionTxContext.Provider>
  )
}
