const viewBoxRegex = /viewBox="\d+ \d+ (\d+) (\d+)"/

export async function fetchSVG(
  uri: string,
  // AbortSignal is not resolved
  // eslint-disable-next-line no-undef
  signal?: AbortSignal
): Promise<{ content: string; viewboxWidth: number; viewboxHeight: number }> {
  const res = await fetch(uri, { signal })
  const text = await res.text()

  const formatted = freezeSvgAnimations(text)
  const result = viewBoxRegex.exec(text)

  const viewboxWidth = result?.[1]
  const viewbowHeight = result?.[2]

  if (formatted && viewboxWidth && viewbowHeight) {
    return { content: formatted, viewboxHeight: +viewbowHeight, viewboxWidth: +viewboxWidth }
  }

  throw new Error('Failed to fetch SVG')
}

function freezeSvgAnimations(svg: string) {
  // HACK: replaces `<animate>` tag with a 'hidden' presentation group
  //      which shouldn't affect the SVG validity
  // NOTE: `fill="freeze"` on `<animate>` tags had no effect
  return svg.replace(/<animate /g, '<group ')
}
