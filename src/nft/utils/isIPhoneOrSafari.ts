const iOSDevices = ['iPhone', 'iPad', 'iPod', 'iPhone Simulator', 'iPod Simulator', 'iPad Simulator']

export const isIPhoneOrSafari = () => {
  const uA = navigator.userAgent
  const vendor = navigator.vendor
  const platform = navigator.platform

  return (
    iOSDevices.includes(platform) || (/Safari/i.test(uA) && /Apple Computer/.test(vendor) && !/Mobi|Android/i.test(uA))
  )
}
