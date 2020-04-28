import React from 'react'

import { Link } from '../../theme/components'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'

import { useWeb3React } from '../../hooks'
import { getEtherscanLink } from '../../utils'

export default function TxnPopup({ hash, success, summary }) {
  const { chainId } = useWeb3React()

  return (
    <AutoColumn gap="12px">
      <TYPE.body>Transaction {success ? 'confirmed.' : 'failed.'}</TYPE.body>
      <TYPE.green>{summary ? summary : 'Hash: ' + hash.slice(0, 8) + '...' + hash.slice(58, 65)}</TYPE.green>
      <Link href={getEtherscanLink(chainId, hash, 'transaction')}>View on Etherscan</Link>
    </AutoColumn>
  )
}
