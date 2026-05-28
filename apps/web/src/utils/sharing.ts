const TWITTER_WINDOW_WIDTH = 560
const TWITTER_WINDOW_HEIGHT = 480

interface ShareToTwitterParams {
  text: string
  url: string
}

/**
 * Opens a Twitter/X share window with the given text and URL
 */
export function openTwitterShareWindow({ text, url }: ShareToTwitterParams): void {
  const positionX = (window.screen.width - TWITTER_WINDOW_WIDTH) / 2
  const positionY = (window.screen.height - TWITTER_WINDOW_HEIGHT) / 2
  const encodedText = encodeURIComponent(`${text} ${url} via @Uniswap`)

  window.open(
    `https://twitter.com/intent/tweet?text=${encodedText}`,
    'newwindow',
    `left=${positionX}, top=${positionY}, width=${TWITTER_WINDOW_WIDTH}, height=${TWITTER_WINDOW_HEIGHT}`,
  )
}
