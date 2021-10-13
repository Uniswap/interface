import Wallet from '../Wallet'
import WidgetHeader from '../Widget/Header'
import Settings from './Settings'
import ShowDetails from './ShowDetails'

export default function Header() {
  return (
    <WidgetHeader path="swap" title="Swap">
      <Wallet />
      <ShowDetails />
      <Settings />
    </WidgetHeader>
  )
}
