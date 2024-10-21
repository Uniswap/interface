/* eslint-disable-next-line no-restricted-imports */
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { DepositContextType, DepositState } from 'components/Liquidity/types'
import {
  CreatePositionContextType,
  DEFAULT_POSITION_STATE,
  PositionFlowStep,
  PriceRangeContextType,
  PriceRangeState,
} from 'pages/Pool/Positions/create/types'
import React, { useContext } from 'react'
import { PositionField } from 'types/position'
import { CreatePositionTxAndGasInfo } from 'uniswap/src/features/transactions/liquidity/types'

export const CreatePositionContext = React.createContext<CreatePositionContextType>({
  step: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
  setStep: () => undefined,
  positionState: DEFAULT_POSITION_STATE,
  setPositionState: () => undefined,
  feeTierSearchModalOpen: false,
  setFeeTierSearchModalOpen: () => undefined,
  derivedPositionInfo: {
    protocolVersion: ProtocolVersion.UNSPECIFIED,
    currencies: {},
  },
})

export const useCreatePositionContext = () => {
  return useContext(CreatePositionContext)
}

export const DEFAULT_PRICE_RANGE_STATE: PriceRangeState = {
  priceInverted: false,
  fullRange: true,
  minPrice: '',
  maxPrice: '',
}

export const PriceRangeContext = React.createContext<PriceRangeContextType>({
  priceRangeState: DEFAULT_PRICE_RANGE_STATE,
  setPriceRangeState: () => undefined,
  derivedPriceRangeInfo: {
    isSorted: false,
    ticksAtLimit: [true, true],
    invertPrice: false,
    tickSpaceLimits: [0, 0],
  },
})

export const usePriceRangeContext = () => {
  return useContext(PriceRangeContext)
}

export const DEFAULT_DEPOSIT_STATE: DepositState = {
  exactField: PositionField.TOKEN0,
}

export const DepositContext = React.createContext<DepositContextType>({
  depositState: DEFAULT_DEPOSIT_STATE,
  setDepositState: () => undefined,
  derivedDepositInfo: {},
})

export const useDepositContext = () => {
  return useContext(DepositContext)
}

export const CreateTxContext = React.createContext<CreatePositionTxAndGasInfo | undefined>(undefined)

export const useCreateTxContext = () => {
  return useContext(CreateTxContext)
}
