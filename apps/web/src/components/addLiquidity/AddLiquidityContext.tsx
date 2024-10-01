import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { PositionInfo, useModalLiquidityPositionInfo } from 'components/Liquidity/utils'
import { useDerivedAddLiquidityInfo } from 'components/addLiquidity/hooks'
import { Dispatch, PropsWithChildren, SetStateAction, createContext, useContext, useMemo, useState } from 'react'
import { PositionField } from 'types/position'

export interface AddLiquidityState {
  position?: PositionInfo
  exactField: PositionField
  exactAmount?: string
}
const DEFAULT_ADD_LIQUIDITY_STATE = {
  exactField: PositionField.TOKEN0,
}

export interface AddLiquidityInfo {
  formattedAmounts?: { [field in PositionField]?: string }
  currencyBalances?: { [field in PositionField]?: CurrencyAmount<Currency> }
  currencyAmounts?: { [field in PositionField]?: CurrencyAmount<Currency> }
  currencyAmountsUSDValue?: { [field in PositionField]?: CurrencyAmount<Currency> }
}

interface AddLiquidityContextType {
  addLiquidityState: AddLiquidityState
  derivedAddLiquidityInfo: AddLiquidityInfo
  setAddLiquidityState: Dispatch<SetStateAction<AddLiquidityState>>
}

const AddLiquidityContext = createContext<AddLiquidityContextType>({
  addLiquidityState: DEFAULT_ADD_LIQUIDITY_STATE,
  derivedAddLiquidityInfo: {},
  setAddLiquidityState: () => undefined,
})

export function useAddLiquidityContext() {
  return useContext(AddLiquidityContext)
}

export function AddLiquidityContextProvider({ children }: PropsWithChildren) {
  const positionInfo = useModalLiquidityPositionInfo()

  const [addLiquidityState, setAddLiquidityState] = useState<AddLiquidityState>({
    ...DEFAULT_ADD_LIQUIDITY_STATE,
    position: positionInfo,
  })

  const derivedAddLiquidityInfo = useDerivedAddLiquidityInfo(addLiquidityState)

  const value = useMemo(
    () => ({
      addLiquidityState,
      setAddLiquidityState,
      derivedAddLiquidityInfo,
    }),
    [addLiquidityState, derivedAddLiquidityInfo],
  )

  return <AddLiquidityContext.Provider value={value}>{children}</AddLiquidityContext.Provider>
}
