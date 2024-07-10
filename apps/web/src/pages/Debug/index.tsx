export const DebugPage: React.FC = () => {
  const isEthExists = !!window.ethereum
  let isMetamask = false
  let isBraveWallet = false
  let isRabby = false
  let isTrust = false
  let isLedgerConnect = false
  let ethKeys: string[] = []
  if (isEthExists) {
    isMetamask = Boolean(window.ethereum!.isMetaMask)
    isBraveWallet = Boolean(window.ethereum!.isBraveWallet)
    isRabby = Boolean(window.ethereum!.isRabby)
    isTrust = Boolean(window.ethereum!.isTrust)
    isLedgerConnect = Boolean(window.ethereum!.isLedgerConnect)
    ethKeys = Object.keys(window.ethereum!)
  }
  const ua = (navigator && navigator.userAgent) || ''
  return (
    <>
      <table>
        <tr>
          <td>window.ethereum exists</td>
          <td>{isEthExists.toString()}</td>
        </tr>
        <tr>
          <td>isMetamask</td>
          <td>{isMetamask.toString()}</td>
        </tr>
        <tr>
          <td>isBraveWallet</td>
          <td>{isBraveWallet.toString()}</td>
        </tr>
        <tr>
          <td>isRabby</td>
          <td>{isRabby.toString()}</td>
        </tr>
        <tr>
          <td>isTrust</td>
          <td>{isTrust.toString()}</td>
        </tr>
        <tr>
          <td>isLedgerConnect</td>
          <td>{isLedgerConnect.toString()}</td>
        </tr>
        <tr>
          <td>ethereum keys</td>
          <td>{ethKeys.join(', ')}</td>
        </tr>
        <tr>
          <td>user agent</td>
          <td>{ua}</td>
        </tr>
      </table>
    </>
  )
}

export default DebugPage
