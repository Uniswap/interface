import React from 'react'

import { Link } from '../../theme/components'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'

import { useWeb3React } from '../../hooks'
import { getEtherscanLink } from '../../utils'

export default function TxnPopup({ hash, success }) {
  const { chainId } = useWeb3React()
  if (success) {
    return (
      <AutoColumn gap="12px">
        <TYPE.body>Transaction Confirmed</TYPE.body>
        <TYPE.green>Hash: {hash.slice(0, 8) + '...' + hash.slice(58, 65)}</TYPE.green>
        <Link href={getEtherscanLink(chainId, hash, 'transaction')}>View on Etherscan</Link>
      </AutoColumn>
    )
  } else {
    return (
      <AutoColumn gap="12px">
        <TYPE.body>Transaction Failed</TYPE.body>
        <TYPE.green>Hash: {hash.slice(0, 8) + '...' + hash.slice(58, 65)}</TYPE.green>
        <Link href={getEtherscanLink(chainId, hash, 'transaction')}>View on Etherscan</Link>
      </AutoColumn>
    )
  }
}
