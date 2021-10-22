import { Modal } from './Dialog'
import { TransactionsDialog } from './Wallet'
import Widget from './Widget'

export default (
  <Widget>
    <Modal color="module">
      <TransactionsDialog onClose={() => void 0} />
    </Modal>
  </Widget>
)
