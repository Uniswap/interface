import { useSelector } from 'react-redux'
import { DappInfo, dappStore } from 'src/app/features/dapp/store'
import { selectMostRecent5792DappUrl } from 'src/app/features/dappRequests/slice'

export function useGet5792DappInfo(): (DappInfo & { url: string }) | undefined {
  const dappUrl = useSelector(selectMostRecent5792DappUrl)

  const dappInfo = dappUrl ? dappStore.getDappInfo(dappUrl) : undefined

  return dappUrl && dappInfo ? { ...dappInfo, url: dappUrl } : undefined
}
