const DESKTOP_OFFSET = 540

export const scrollToTop = () => {
  // window.scrollTo({ top: DESKTOP_OFFSET })
  window.document.getElementById('nft-anchor')?.scrollIntoView({
    behavior: 'smooth',
  })
}
