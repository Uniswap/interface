type DeviceDimensions = { fullHeight: number; fullWidth: number }

export const useDeviceDimensions = (): DeviceDimensions => {
  const fullHeight = window.innerHeight

  const fullWidth = window.innerWidth

  return { fullHeight, fullWidth }
}
