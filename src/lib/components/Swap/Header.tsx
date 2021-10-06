import Wallet from '../Wallet'
import WidgetHeader from '../Widget/Header'
import Info from './Info'
import Settings from './Settings'

export default function Header() {
  return (
    <WidgetHeader path="swap" title="Swap">
      <Wallet />
      <Info />
      <Settings />
    </WidgetHeader>
  )
}
