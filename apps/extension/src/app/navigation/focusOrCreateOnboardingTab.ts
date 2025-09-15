import { TopLevelRoutes } from 'src/app/navigation/constants'
import { onboardingMessageChannel } from 'src/background/messagePassing/messageChannels'
import { OnboardingMessageType } from 'src/background/messagePassing/types/ExtensionMessages'

export async function focusOrCreateOnboardingTab(page?: string): Promise<void> {
  const extension = await chrome.management.getSelf()

  const tabs = await chrome.tabs.query({ url: `chrome-extension://${extension.id}/onboarding.html*` })
  const tab = tabs[0]

  const url = 'onboarding.html#/' + (page ? page : TopLevelRoutes.Onboarding)

  if (!tab?.id) {
    await chrome.tabs.create({ url })
    return
  }

  await chrome.tabs.update(tab.id, {
    active: true,
    highlighted: true,
    // We only want to update the URL if we're navigating to a specific page.
    // Otherwise, just focus the existing tab without overriding the current URL.
    url: page ? url : undefined,
  })

  if (page) {
    // When navigating to a specific page, we need to reload the tab to ensure that the app state is reset and the store synchronization is properly initialized.
    // This is necessary to handle the edge case where the user leaves a completed onboarding tab open (with synchronization paused)
    // and then clicks on the "forgot password" link.
    await chrome.tabs.reload(tab.id)
  }

  await chrome.windows.update(tab.windowId, { focused: true })

  await onboardingMessageChannel.sendMessage({
    type: OnboardingMessageType.HighlightOnboardingTab,
  })
}
