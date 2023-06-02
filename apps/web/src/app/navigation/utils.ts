import { To, useNavigate } from 'react-router-dom'

export const useExtensionNavigation = (): {
  navigateTo: (path: To) => void
  navigateBack: () => void
} => {
  const navigate = useNavigate()
  const navigateTo = (path: To): void => navigate(path)
  const navigateBack = (): void => navigate(-1)

  return { navigateTo, navigateBack }
}
