import DEFAULT_TOKEN_LIST from '@uniswap/default-token-list'
import useTokenList from 'lib/hooks/useTokenList'

import { Modal } from './Dialog'
import { TokenSelectDialog } from './TokenSelect'

export default function Fixture() {
  useTokenList(DEFAULT_TOKEN_LIST.tokens)

  return (
    <Modal color="module">
      <TokenSelectDialog onSelect={() => void 0} />
    </Modal>
  )
}
