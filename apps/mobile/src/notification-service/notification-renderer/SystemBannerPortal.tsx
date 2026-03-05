import { createContext, memo, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { View } from 'react-native'

/**
 * Context for the system banner portal.
 * Allows notification components to render system banners at the app root level.
 */
interface SystemBannerPortalContextValue {
  /**
   * Set the content to render in the portal.
   * Pass null to clear the portal.
   */
  setContent: (content: ReactNode) => void
}

const SystemBannerPortalContext = createContext<SystemBannerPortalContextValue | null>(null)

/**
 * Hook to access the system banner portal.
 * Used by NotificationContainer to render system banners at the app root.
 */
export function useSystemBannerPortal(): SystemBannerPortalContextValue {
  const context = useContext(SystemBannerPortalContext)
  if (!context) {
    throw new Error('useSystemBannerPortal must be used within a SystemBannerPortalProvider')
  }
  return context
}

/**
 * Provider for the system banner portal. Place this at the app root.
 *
 * System banners (like the offline banner) use position: absolute with bottom: 0,
 * so they need to be rendered at the root level to position correctly on screen.
 *
 * Usage in App.tsx:
 * ```tsx
 * <SystemBannerPortalProvider>
 *   <YourAppContent />
 * </SystemBannerPortalProvider>
 * ```
 *
 * Then in NotificationContainer:
 * ```tsx
 * const { setContent } = useSystemBannerPortal()
 * useEffect(() => {
 *   setContent(<OfflineBannerRenderer ... />)
 *   return () => setContent(null)
 * }, [])
 * ```
 */
export const SystemBannerPortalProvider = memo(function SystemBannerPortalProvider({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  const [portalContent, setPortalContent] = useState<ReactNode>(null)

  const setContent = useCallback((content: ReactNode) => {
    setPortalContent(content)
  }, [])

  // Memoize context value to prevent unnecessary consumer re-renders
  const contextValue = useMemo(() => ({ setContent }), [setContent])

  return (
    <SystemBannerPortalContext.Provider value={contextValue}>
      {children}
      {/* Portal host - renders at app root level */}
      {portalContent && <View pointerEvents="box-none">{portalContent}</View>}
    </SystemBannerPortalContext.Provider>
  )
})
