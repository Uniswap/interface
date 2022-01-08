import useTokenList, { DEFAULT_TOKEN_LIST } from 'lib/hooks/useTokenList'

import { Modal } from './Dialog'
import { TokenSelectDialog } from './TokenSelect'

export default function Fixture() {
  useTokenList(DEFAULT_TOKEN_LIST)

  return (
    <Modal color="module">
      <TokenSelectDialog onSelect={() => void 0} />
    </Modal>
  )
}
