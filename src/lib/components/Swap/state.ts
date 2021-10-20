import { atomWithReset } from 'jotai/utils'
import { Customizable, pickAtom, setCustomizable, setTogglable } from 'lib/utils/atoms'

import Settings from './Settings'

/** Gas price, in gwei. Indexes into chain-specific gas price arrays. */
export enum GasPrice {
  FAST = 0,
  TRADER = 1,
  // Members to satisfy CustomizableEnum; see setCustomizable
  CUSTOM = -1,
  DEFAULT = TRADER,
}

/** Max slippage, as a percentage. */
export enum MaxSlippage {
  P01 = 0.1,
  P05 = 0.5,
  // Members to satisfy CustomizableEnum; see setCustomizable
  CUSTOM = -1,
  DEFAULT = P05,
}

export interface Settings {
  gasPrice: Customizable<GasPrice>
  maxSlippage: Customizable<MaxSlippage>
  transactionTtl: number
  simplifyUi: boolean
}

const initialSettings: Settings = {
  gasPrice: { value: GasPrice.DEFAULT },
  maxSlippage: { value: MaxSlippage.DEFAULT },
  transactionTtl: 40,
  simplifyUi: true,
}

export const settingsAtom = atomWithReset(initialSettings)
export const gasPriceAtom = pickAtom(settingsAtom, 'gasPrice', setCustomizable(GasPrice))
export const maxSlippageAtom = pickAtom(settingsAtom, 'maxSlippage', setCustomizable(MaxSlippage))
export const transactionTtlAtom = pickAtom(settingsAtom, 'transactionTtl')
export const simplifyUiAtom = pickAtom(settingsAtom, 'simplifyUi', setTogglable)
