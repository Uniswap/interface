import { breakpoints } from 'nft/css/sprinkles.css'
const isClient = typeof window !== 'undefined'

function getIsMobile() {
  return isClient ? window.innerWidth < breakpoints.sm : false
}

export const scrollToTop = () => {
  const isMobile = getIsMobile()
  const anchorElement = isMobile ? 'nft-anchor-mobile' : 'nft-anchor'

  window.document.getElementById(anchorElement)?.scrollIntoView({
    behavior: 'smooth',
  })
}
