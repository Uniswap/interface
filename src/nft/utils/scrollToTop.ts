export const scrollToTop = () => {
  window.document.getElementById('nft-anchor')?.scrollIntoView({
    behavior: 'smooth',
  })
}
