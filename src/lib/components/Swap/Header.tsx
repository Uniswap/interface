import WidgetHeader from '../Widget/Header'
import Settings from './Settings'

export default function Header() {
  return (
    <WidgetHeader path="swap" title="Swap">
      {/* TODO: Wallet integration (from web3-react context) */}
      {/* TODO: Info */ <></>}
      <Settings />
    </WidgetHeader>
  )
}
