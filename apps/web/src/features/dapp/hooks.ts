import { useEffect, useState } from 'react'
import { extractBaseUrl } from 'src/features/dappRequests/utils'

export function useDappInfo(): { dappUrl: string; dappName: string } {
  const [dappUrl, setDappUrl] = useState('')
  const [dappName, setDappName] = useState('')

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (tab) {
        setDappUrl(extractBaseUrl(tab?.url) || '')
        setDappName(tab?.title || '')
      }
    })
  }, [])

  return { dappUrl, dappName }
}
