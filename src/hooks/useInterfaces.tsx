import { Interface } from "ethers/lib/utils"
import { useMemo } from "react"
import BorrowManagerJson from "perpspotContracts/BorrowManager.json"
import LeverageManagerJson from "perpspotContracts/LeverageManager.json"


export const BorrowManagerInterface = new Interface(BorrowManagerJson.abi)
export const LeverageManagerInterface = new Interface(LeverageManagerJson.abi)