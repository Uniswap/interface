/**
 * PR Body Cleaner
 *
 * Intelligently removes unnecessary content from PR bodies while preserving
 * important technical details, code blocks, and CURSOR_SUMMARY blocks.
 */

/**
 * Cleans a PR body by removing unnecessary content while preserving valuable information
 * @param body The raw PR body text
 * @returns Cleaned PR body with unnecessary content removed
 */
export function cleanPRBody(body: string): string {
  if (!body || body.trim().length === 0) {
    return body
  }

  let cleaned = body

  // Step 1: Extract CURSOR_SUMMARY content and remove all HTML comment markers
  cleaned = removeHTMLCommentsExceptCursorSummary(cleaned)

  // Step 1.5: Remove Cursor Bugbot footer notes (may appear outside CURSOR_SUMMARY blocks)
  cleaned = removeCursorBugbotFooters(cleaned)

  // Step 2: Remove image/video markdown
  cleaned = removeImageVideoMarkdown(cleaned)

  // Step 3: Clean tables (remove if only images/videos)
  cleaned = cleanTables(cleaned)

  // Step 4: Clean external links (keep text, remove long URLs)
  cleaned = cleanExternalLinks(cleaned)

  // Step 5: Remove empty sections
  cleaned = removeEmptySections(cleaned)

  // Step 6: Remove minimal value sections
  cleaned = removeMinimalValueSections(cleaned)

  // Step 7: Remove redundant sections (screen captures, testing)
  cleaned = removeRedundantSections(cleaned)

  // Step 8: Remove redundant headers
  cleaned = removeRedundantHeaders(cleaned)

  // Step 9: Aggressive whitespace normalization (max 1 blank line)
  cleaned = normalizeWhitespace(cleaned)

  return cleaned
}

/**
 * Extract CURSOR_SUMMARY content and remove all HTML comment markers
 */
function removeHTMLCommentsExceptCursorSummary(text: string): string {
  // Extract CURSOR_SUMMARY content (without the comment markers)
  const cursorSummaryPlaceholder = '___CURSOR_SUMMARY_PLACEHOLDER___'
  const cursorSummaryRegex = /<!--\s*CURSOR_SUMMARY\s*-->([\s\S]*?)<!--\s*\/CURSOR_SUMMARY\s*-->/gi
  const summaries: string[] = []
  let matchIndex = 0

  // Extract just the content between the markers
  let textWithProtection = text.replace(cursorSummaryRegex, (match, content) => {
    // Clean the content before storing: remove Cursor Bugbot footer notes
    let cleanedContent = content.trim()

    // Remove Cursor Bugbot footer notes (metadata lines)
    cleanedContent = cleanedContent.replace(
      />\s*\[!NOTE\]\s*\n\s*>\s*<sup>\[Cursor Bugbot\].*?Configure \[here\].*?<\/sup>/gi,
      '',
    )
    cleanedContent = cleanedContent.replace(
      />\s*<sup>Written by \[Cursor Bugbot\].*?Configure \[here\].*?<\/sup>/gi,
      '',
    )
    cleanedContent = cleanedContent.replace(
      />\s*<sup>\[Cursor Bugbot\].*?is generating a summary.*?Configure \[here\].*?<\/sup>/gi,
      '',
    )

    // Clean up any leftover "> " prefixes from blockquotes
    cleanedContent = cleanedContent.replace(/^>\s*/gm, '')

    summaries.push(cleanedContent.trim()) // Store cleaned content
    return `${cursorSummaryPlaceholder}${matchIndex++}`
  })

  // Remove all other HTML comments
  textWithProtection = textWithProtection.replace(/<!--[\s\S]*?-->/g, '')

  // Restore CURSOR_SUMMARY content (without comment markers and footers)
  summaries.forEach((summary, index) => {
    textWithProtection = textWithProtection.replace(`${cursorSummaryPlaceholder}${index}`, summary)
  })

  return textWithProtection
}

/**
 * Remove Cursor Bugbot footer notes (metadata lines)
 */
function removeCursorBugbotFooters(text: string): string {
  let cleaned = text

  // Remove standalone footer notes (outside CURSOR_SUMMARY blocks)
  // Pattern 1: > [!NOTE]\n> <sup>[Cursor Bugbot]...Configure [here]...</sup>
  cleaned = cleaned.replace(
    />\s*\[!NOTE\]\s*\n\s*>\s*<sup>\[Cursor Bugbot\][\s\S]*?Configure \[here\][\s\S]*?<\/sup>\s*/gi,
    '',
  )

  // Pattern 2: > <sup>Written by [Cursor Bugbot]...Configure [here]...</sup>
  cleaned = cleaned.replace(/>\s*<sup>Written by \[Cursor Bugbot\][\s\S]*?Configure \[here\][\s\S]*?<\/sup>\s*/gi, '')

  // Pattern 3: > <sup>[Cursor Bugbot]...is generating a summary...Configure [here]...</sup>
  cleaned = cleaned.replace(
    />\s*<sup>\[Cursor Bugbot\][\s\S]*?is generating a summary[\s\S]*?Configure \[here\][\s\S]*?<\/sup>\s*/gi,
    '',
  )

  // Pattern 4: Standalone note blocks with Cursor Bugbot (any variant)
  cleaned = cleaned.replace(/>\s*\[!NOTE\]\s*\n\s*>\s*<sup>\[Cursor Bugbot\][\s\S]*?<\/sup>\s*/gi, '')

  // Pattern 5: Any blockquote line containing Cursor Bugbot footer
  cleaned = cleaned.replace(/>\s*<sup>\[Cursor Bugbot\][\s\S]*?<\/sup>\s*/gi, '')

  return cleaned
}

/**
 * Remove image and video markdown links
 */
function removeImageVideoMarkdown(text: string): string {
  // Remove image markdown: ![alt](url) or ![alt](url "title")
  let cleaned = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')

  // Remove video markdown patterns like [Screen Recording ...](url)
  cleaned = cleaned.replace(/\[Screen Recording[^\]]*\]\([^)]+\)/gi, '')
  cleaned = cleaned.replace(/\[Screen Recording[^\]]*\]\([^)]+\)/gi, '')

  // Remove <img> tags
  cleaned = cleaned.replace(/<img[^>]*>/gi, '')

  // Remove video links that look like markdown
  cleaned = cleaned.replace(/\[.*\.mov.*\]\([^)]+\)/gi, '')
  cleaned = cleaned.replace(/\[.*\.mp4.*\]\([^)]+\)/gi, '')

  return cleaned
}

/**
 * Remove tables that only contain images/videos
 */
function cleanTables(text: string): string {
  // Match table blocks - split into parts to avoid unsafe regex
  const lines = text.split('\n')
  const result: string[] = []
  let inTable = false
  let tableLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) {
      result.push('')
      continue
    }

    const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|')

    if (isTableRow) {
      if (!inTable) {
        inTable = true
        tableLines = []
      }
      tableLines.push(line)
    } else {
      if (inTable) {
        // Process accumulated table
        const tableMatch = tableLines.join('\n')
        if (shouldRemoveTable(tableMatch)) {
          // Skip this table
        } else {
          result.push(...tableLines)
        }
        inTable = false
        tableLines = []
      }
      result.push(line)
    }
  }

  // Handle table at end of text
  if (inTable && tableLines.length > 0) {
    const tableMatch = tableLines.join('\n')
    if (!shouldRemoveTable(tableMatch)) {
      result.push(...tableLines)
    }
  }

  return result.join('\n')
}

function shouldRemoveTable(tableMatch: string): boolean {
  // Remove empty tables (only separators like | --- | --- |)
  const cleanedForEmpty = tableMatch.replace(/[\s|:-]/g, '')
  if (cleanedForEmpty.length === 0) {
    return true
  }

  // Check if table only contains image/video links or empty cells
  const imageVideoPattern = /!\[|\]\([^)]+\)|Screen Recording|\.mov|\.mp4|\.png|\.jpg|\.jpeg|\.gif|\.webp/gi
  const hasOnlyImagesOrVideos = imageVideoPattern.test(tableMatch)
  const textPattern = /[a-zA-Z]{3,}/
  const cleanedTable = tableMatch.replace(/!\[|\]\([^)]+\)|Screen Recording/gi, '')
  const hasTextContent = textPattern.test(cleanedTable)

  // If table only has images/videos and no substantial text, remove it
  return hasOnlyImagesOrVideos && !hasTextContent
}

/**
 * Clean external links - keep text but remove long URLs
 */
function cleanExternalLinks(text: string): string {
  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  return text.replace(linkRegex, (match) => {
    const linkMatch = match.match(/\[([^\]]+)\]\(([^)]+)\)/)
    if (!linkMatch || !linkMatch[1] || !linkMatch[2]) {
      return match
    }

    const linkText = linkMatch[1]
    const url = linkMatch[2]

    // Keep GitHub links (they're short and useful)
    if (url.startsWith('https://github.com/') || url.startsWith('http://github.com/')) {
      return match
    }

    // Keep relative links
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return match
    }

    // Keep short URLs (< 50 chars)
    if (url.length <= 50) {
      return match
    }

    // For long URLs, keep only the text
    return linkText
  })
}

/**
 * Remove empty sections (headers with no content or only whitespace)
 */
function removeEmptySections(text: string): string {
  // Match sections: ## Header followed by content until next ## or end
  const sectionRegex = /(##+\s+[^\n]+)\n([\s\S]*?)(?=\n##+\s+|$)/g
  let cleaned = text

  cleaned = cleaned.replace(sectionRegex, (match) => {
    const sectionMatch = match.match(/(##+\s+[^\n]+)\n([\s\S]*?)(?=\n##+\s+|$)/)
    if (!sectionMatch) {
      return match
    }

    const content = sectionMatch[2] || ''
    // Check if content is empty or only whitespace
    const trimmedContent = content.trim()
    if (trimmedContent.length === 0) {
      return '' // Remove empty section
    }
    return match // Keep section with content
  })

  return cleaned
}

/**
 * Remove minimal value sections (very short descriptions, redundant changes lists)
 */
function removeMinimalValueSections(text: string): string {
  let cleaned = text

  // Remove "## Description" sections that are very short and redundant
  const descriptionRegex = /##\s+Description\s*\n([\s\S]*?)(?=\n## |$)/gi
  cleaned = cleaned.replace(descriptionRegex, (match) => {
    const sectionMatch = match.match(/##\s+Description\s*\n([\s\S]*?)(?=\n## |$)/i)
    if (!sectionMatch) {
      return match
    }

    const content = sectionMatch[1] || ''
    const trimmedContent = content.trim()

    // Remove if very short (< 50 chars) and doesn't add value
    if (trimmedContent.length < 50) {
      return ''
    }

    return match
  })

  // Remove "## Changes" sections that are just bullet lists without detail
  const changesRegex = /##\s+Changes\s*\n([\s\S]*?)(?=\n## |$)/gi
  cleaned = cleaned.replace(changesRegex, (match) => {
    const sectionMatch = match.match(/##\s+Changes\s*\n([\s\S]*?)(?=\n## |$)/i)
    if (!sectionMatch) {
      return match
    }

    const content = sectionMatch[1] || ''
    const trimmedContent = content.trim()

    // Check if it's just a list of very short bullets
    const lines = trimmedContent.split('\n').filter((line) => line.trim().length > 0)
    const allShortBullets = lines.every((line) => {
      const trimmed = line.trim()
      return trimmed.startsWith('-') && trimmed.length < 80
    })

    // Remove if all bullets are very short (likely redundant with CURSOR_SUMMARY)
    if (allShortBullets && lines.length < 5) {
      return ''
    }

    return match
  })

  // Remove "## Implementation Details" that are redundant with CURSOR_SUMMARY
  const implDetailsRegex = /##\s+Implementation Details\s*\n([\s\S]*?)(?=\n## |$)/gi
  cleaned = cleaned.replace(implDetailsRegex, (match) => {
    const sectionMatch = match.match(/##\s+Implementation Details\s*\n([\s\S]*?)(?=\n## |$)/i)
    if (!sectionMatch) {
      return match
    }

    const content = sectionMatch[1] || ''
    const trimmedContent = content.trim()

    // Remove if very short (< 100 chars) - likely redundant
    if (trimmedContent.length < 100) {
      return ''
    }

    return match
  })

  return cleaned
}

/**
 * Remove redundant headers (headers with no meaningful content after them)
 */
function removeRedundantHeaders(text: string): string {
  let cleaned = text

  // Match sections and check if header should be removed
  const sectionRegex = /(##+\s+[^\n]+)\n([\s\S]*?)(?=\n##+\s+|$)/g

  cleaned = cleaned.replace(sectionRegex, (match) => {
    const sectionMatch = match.match(/(##+\s+[^\n]+)\n([\s\S]*?)(?=\n##+\s+|$)/)
    if (!sectionMatch) {
      return match
    }

    const header = sectionMatch[1] || ''
    const content = sectionMatch[2] || ''
    const trimmedContent = content.trim()

    // If header is followed immediately by CURSOR_SUMMARY-like content and nothing else
    // Check if content starts with --- (CURSOR_SUMMARY marker pattern)
    if (trimmedContent.startsWith('---') && trimmedContent.length < 200) {
      // This might be redundant, but let's be conservative and keep it
      return match
    }

    // Remove headers that are redundant (e.g., "## Description" when content is minimal)
    const headerLower = header.toLowerCase()
    if (headerLower.includes('description') && trimmedContent.length < 30) {
      // Keep the content, remove the header
      return trimmedContent
    }

    return match
  })

  return cleaned
}

/**
 * Remove redundant sections
 */
function removeRedundantSections(text: string): string {
  let cleaned = text

  // Remove "Screen Captures" or "Screenshots" sections that only contain images
  // Match: ## Screen Captures / ## Screenshots followed by content ending before next ##
  const screenshotSectionRegex = /##\s+(Screen Captures|Screenshots|Screenshots?)\s*\n([\s\S]*?)(?=\n## |$)/gi
  cleaned = cleaned.replace(screenshotSectionRegex, (match) => {
    const sectionMatch = match.match(/##\s+(Screen Captures|Screenshots|Screenshots?)\s*\n([\s\S]*?)(?=\n## |$)/i)
    if (!sectionMatch) {
      return match
    }

    const content = sectionMatch[2] || ''
    // If content only has images/videos/tables with images, remove it
    const mediaPattern = /!\[|\]\([^)]+\)|Screen Recording|\.mov|\.mp4|<img|^\|/m
    const hasOnlyMedia = mediaPattern.test(content)
    const textPattern = /[a-zA-Z]{10,}/
    const cleanedContent = content.replace(/!\[|\]\([^)]+\)|Screen Recording|\.mov|\.mp4|<img|^\|/gm, '')
    const hasTextContent = textPattern.test(cleanedContent)

    if (hasOnlyMedia && !hasTextContent) {
      return ''
    }

    return match
  })

  // Remove "Testing" or "How Has This Been Tested?" sections aggressively
  const testingSectionRegex = /##\s+(Testing|How Has This Been Tested\?)\s*\n([\s\S]*?)(?=\n## |$)/gi
  cleaned = cleaned.replace(testingSectionRegex, (match) => {
    const sectionMatch = match.match(/##\s+(Testing|How Has This Been Tested\?)\s*\n([\s\S]*?)(?=\n## |$)/i)
    if (!sectionMatch) {
      return match
    }

    const content = sectionMatch[2] || ''
    const trimmedContent = content.trim()

    // Remove if empty
    if (trimmedContent.length === 0) {
      return ''
    }

    // Remove if only checkboxes with no descriptions
    const checkboxOnly = /^[\s-]*\[[ xX]\]/m.test(trimmedContent) && trimmedContent.length < 100
    if (checkboxOnly) {
      return ''
    }

    // Remove if content is just minimal phrases like "locally", "manually", "on simulator"
    const minimalPhrases =
      /^(locally|manually|on simulator|tested locally|tested manually|local|ios simulator|android sim)[\s.]*$/i
    if (minimalPhrases.test(trimmedContent)) {
      return ''
    }

    // Remove if content is very short (< 50 chars) and doesn't contain meaningful text
    const meaningfulTextPattern = /[a-zA-Z]{10,}/
    if (trimmedContent.length < 50 && !meaningfulTextPattern.test(trimmedContent)) {
      return ''
    }

    // Keep if it has meaningful content (> 100 chars of actual text)
    const textOnly = trimmedContent.replace(/[\s\-[\]xX]/g, '')
    if (textOnly.length < 100) {
      return ''
    }

    return match
  })

  return cleaned
}

/**
 * Normalize whitespace - aggressive cleanup
 */
function normalizeWhitespace(text: string): string {
  // Collapse multiple blank lines to max 1 consecutive blank line
  let cleaned = text.replace(/\n{3,}/g, '\n\n')

  // Trim trailing whitespace from lines
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')

  // Remove leading/trailing blank lines
  cleaned = cleaned.replace(/^\n+|\n+$/g, '')

  // Remove blank lines immediately after headers
  cleaned = cleaned.replace(/(##+\s+[^\n]+)\n\n+/g, '$1\n')

  return cleaned
}
