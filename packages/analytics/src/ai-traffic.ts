/**
 * AI Traffic Classification & Tracking
 *
 * Classifies incoming requests into traffic types (crawler, signed-agent, ai-tool, human)
 * and fires Amplitude events for non-human traffic.
 *
 * Three detection layers:
 * 1. User-Agent matching for known AI crawlers (ClaudeBot, GPTBot, etc.)
 * 2. RFC 9421 HTTP Message Signatures (ChatGPT browser agent)
 * 3. Heuristic signals (Accept: text/markdown, non-browser UAs like axios/curl)
 */

import type { AnalyticsService, ServerEventContext } from './service'

export type TrafficType = 'crawler' | 'signed-agent' | 'ai-tool' | 'human'

export interface TrafficClassification {
  type: TrafficType
  agent?: string
  signals: string[]
}

const CRAWLER_PATTERNS: Record<string, string> = {
  ClaudeBot: 'anthropic-training',
  'Claude-User': 'anthropic-user-fetch',
  'Claude-SearchBot': 'anthropic-search',
  'Claude-Web': 'anthropic-web',
  'anthropic-ai': 'anthropic',
  GPTBot: 'openai-training',
  'ChatGPT-User': 'openai-user-fetch',
  'OAI-SearchBot': 'openai-search',
  PerplexityBot: 'perplexity',
  'Perplexity-User': 'perplexity-user',
  'Google-Extended': 'google-ai',
  CCBot: 'common-crawl',
  Bytespider: 'bytedance',
}

export function classifyTraffic(request: Request): TrafficClassification {
  const ua = request.headers.get('user-agent') ?? ''
  const accept = request.headers.get('accept') ?? ''
  const signatureAgent = request.headers.get('signature-agent')

  // Layer 1: Known AI crawlers (self-identifying via User-Agent)
  for (const [pattern, agent] of Object.entries(CRAWLER_PATTERNS)) {
    if (ua.includes(pattern)) {
      return { type: 'crawler', agent, signals: [pattern] }
    }
  }

  // Layer 2: Signed agents (RFC 9421 — ChatGPT browser agent)
  if (signatureAgent) {
    return {
      type: 'signed-agent',
      agent: signatureAgent.replace(/^"|"$/g, ''),
      signals: ['signature-agent'],
    }
  }

  // Layer 3: Heuristic signals for AI tools / non-browser clients
  const signals: string[] = []

  if (accept.includes('text/markdown') || accept.includes('text/x-markdown')) {
    signals.push('accept-markdown')
  }

  if (ua.startsWith('curl/')) {
    signals.push('curl')
  }
  if (ua.startsWith('Wget/')) {
    signals.push('wget')
  }
  if (ua.includes('HTTPie/')) {
    signals.push('httpie')
  }
  if (ua.startsWith('node-fetch') || ua.startsWith('undici')) {
    signals.push('node-http')
  }
  if (ua.startsWith('python-requests') || ua.startsWith('python-httpx')) {
    signals.push('python-http')
  }
  if (ua.startsWith('axios/')) {
    signals.push('axios')
  }
  if (!ua) {
    signals.push('no-ua')
  }

  if (signals.length > 0) {
    return { type: 'ai-tool', signals }
  }

  return { type: 'human', signals: [] }
}

interface AITrafficTrackerDeps {
  analyticsService: AnalyticsService
  serverContext: ServerEventContext
  eventName: string
}

interface AITrafficInput {
  classification: TrafficClassification
  path: string
  request: Request
}

/**
 * Create a tracker for non-human traffic events.
 *
 * Dependencies are bound once at the boundary (Hono middleware); the returned
 * function only takes per-request input. Fire-and-forget — never throws.
 */
export function createAITrafficTracker({ analyticsService, serverContext, eventName }: AITrafficTrackerDeps) {
  return ({ classification, path, request }: AITrafficInput): void => {
    if (classification.type === 'human') {
      return
    }

    try {
      analyticsService.track(
        eventName,
        {
          traffic_type: classification.type,
          agent: classification.agent,
          signals: classification.signals.join(','),
          path,
          user_agent: request.headers.get('user-agent') ?? '',
          accept_header: request.headers.get('accept') ?? '',
        },
        serverContext,
      )
    } catch {
      // Fire and forget — tracking failures must never affect request handling
    }
  }
}
