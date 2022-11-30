import { getIsMobile } from 'nft/hooks'

export const scrollToTop = () => {
  const isMobile = getIsMobile()
  const anchorElement = isMobile ? 'nft-anchor-mobile' : 'nft-anchor'

  window.document.getElementById(anchorElement)?.scrollIntoView({
    behavior: 'smooth',
  })
}
