import { matchPath, To, useLocation, useNavigate } from 'react-router-dom'
import { AnyAction, Dispatch } from 'redux'
import { useAppDispatch } from 'src/background/store'
import { openTab } from 'src/background/utils/navigationSaga'

export function useRouteMatch(pathToMatch: string): boolean {
  const { pathname } = useLocation()

  return !!matchPath(pathToMatch, pathname)
}

export const useExtensionNavigation = (): {
  navigateTo: (path: To) => void
  navigateBack: () => void
} => {
  const navigate = useNavigate()
  const navigateTo = (path: To): void => navigate(path)
  const navigateBack = (): void => navigate(-1)

  return { navigateTo, navigateBack }
}

export async function focusOrCreateOnboardingTab({
  dispatch,
}: {
  dispatch: Dispatch<AnyAction> | ReturnType<typeof useAppDispatch>
}): Promise<void> {
  const extension = await chrome.management.getSelf()

  const tabs = await chrome.tabs.query({ url: `chrome-extension://${extension.id}/*` })

  const tabIndex = tabs[0]?.index
  const windowId = tabs[0]?.windowId

  if (tabIndex !== undefined && windowId) {
    await chrome.tabs.highlight({ windowId, tabs: tabIndex })
    await chrome.windows.update(windowId, { focused: true })
    return
  }

  await dispatch(openTab({ url: 'index.html#/onboarding' }))
}
