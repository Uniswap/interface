import { LDO, USDT as USDT_MAINNET } from 'constants/tokens'

// Any existing USDT or LDO allowance needs to be reset before we can approve the new amount (mainnet only).
// See the `approve` function here: https://etherscan.io/address/0xdAC17F958D2ee523a2206206994597C13D831ec7#code
export const RESET_APPROVAL_TOKENS = [USDT_MAINNET, LDO]
