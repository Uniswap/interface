function getEmbedIframeByYoutubeId(id: string) {
  return `
  <div style="position: relative; padding-bottom: 100%; height: 0; padding-bottom: 56.2493%;">
    <iframe src="https://www.youtube.com/embed/${id}"
      style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;"
      frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
    </iframe>
  </div>
`
}

// CKEditor oembed -> youtube embed iframe
export default function oembed2iframe(html: string) {
  let i = 0
  while (true) {
    while (i < html.length && html.substring(i, i + 7) !== '<oembed') {
      i++
    }
    if (i >= html.length - 1) break
    const startIndex = i
    while (i < html.length && html.substring(i, i + 9) !== `</oembed>`) {
      i++
    }
    const endIndex = i + 9
    const youtubeId = html.substring(startIndex, endIndex).split(/url="/)[1].split(/"></)[0].split('?v=')[1]
    html = html.substring(0, startIndex) + getEmbedIframeByYoutubeId(youtubeId) + html.substring(endIndex, html.length)
    i++
  }

  return html
}
