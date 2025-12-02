import { useEffect } from 'react'
import { assertWebElement, TamaguiElement, useSporeColors } from 'ui/src'

export function useApplyChartTextureEffects({
  chartDivElement,
  showDottedBackground,
  showLeftFadeOverlay,
}: {
  chartDivElement: TamaguiElement | null
  showDottedBackground: boolean
  showLeftFadeOverlay: boolean
}) {
  const colors = useSporeColors()

  // Track the chart td element position for scoped overlays
  useEffect(() => {
    if (!chartDivElement || (!showDottedBackground && !showLeftFadeOverlay)) {
      return undefined
    }

    assertWebElement(chartDivElement)

    const applyBackgroundTexture = (): void => {
      // Find the second td in the first tr - this is the actual chart area
      // Lightweight-charts structure: chartDivElement > div > table > tr:first-child > td:nth-child(2)
      const chartTd = chartDivElement.querySelector(
        ':scope > div > table > tr:first-child > td:nth-child(2)',
      ) as HTMLTableCellElement | null

      if (!chartTd) {
        return
      }

      // Ensure td has position relative for absolute positioning of overlay
      chartTd.style.position = 'relative'

      // Apply dotted background
      if (showDottedBackground) {
        chartTd.style.backgroundImage = `radial-gradient(circle, ${colors.surface3Hovered.val} 1px, transparent 1px)`
        chartTd.style.backgroundSize = '20px 20px'
        chartTd.style.backgroundPosition = '0 0'
      } else {
        // Clear styles when disabled
        chartTd.style.backgroundImage = ''
        chartTd.style.backgroundSize = ''
        chartTd.style.backgroundPosition = ''
      }

      // Handle left fade overlay
      const existingOverlay = chartTd.querySelector('[data-chart-fade-overlay]') as HTMLElement | null
      if (showLeftFadeOverlay) {
        if (existingOverlay) {
          // Update existing overlay
          existingOverlay.style.background = `linear-gradient(to right, ${colors.surface1.val} 0%, transparent 100%)`
        } else {
          // Create new overlay element
          const overlay = document.createElement('div')
          overlay.setAttribute('data-chart-fade-overlay', 'true')
          overlay.style.position = 'absolute'
          overlay.style.top = '0'
          overlay.style.left = '0'
          overlay.style.bottom = '0'
          overlay.style.width = '40px'
          overlay.style.height = '100%'
          overlay.style.background = `linear-gradient(to right, ${colors.surface1.val} 0%, transparent 100%)`
          overlay.style.pointerEvents = 'none'
          overlay.style.zIndex = '1'
          chartTd.appendChild(overlay)
        }
      } else if (existingOverlay) {
        // Remove overlay when disabled
        existingOverlay.remove()
      }
    }

    applyBackgroundTexture()

    // Use observers to update when chart layout changes (chart renders asynchronously)
    const mutationObserver = new MutationObserver(applyBackgroundTexture)
    mutationObserver.observe(chartDivElement, { childList: true, subtree: true })

    const resizeObserver = new ResizeObserver(applyBackgroundTexture)
    resizeObserver.observe(chartDivElement)

    return () => {
      mutationObserver.disconnect()
      resizeObserver.disconnect()
    }
  }, [chartDivElement, showDottedBackground, showLeftFadeOverlay, colors.surface3Hovered.val, colors.surface1.val])
}
