import { createContext, type ReactNode, useContext } from 'react'

interface ImageSettings {
  enableExpoImage: boolean
}

const ImageSettingsContext = createContext<ImageSettings>({ enableExpoImage: false })

export function ImageSettingsProvider({
  enableExpoImage,
  children,
}: ImageSettings & { children: ReactNode }): JSX.Element {
  return <ImageSettingsContext.Provider value={{ enableExpoImage }}>{children}</ImageSettingsContext.Provider>
}

export function useImageSettings(): ImageSettings {
  return useContext(ImageSettingsContext)
}
