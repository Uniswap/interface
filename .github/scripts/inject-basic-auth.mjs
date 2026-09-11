#!/usr/bin/env node
// Injects a basic-auth edge middleware into a Vercel Build Output API v3
// bundle (.vercel/output) after the build, so the demo deployment is gated
// without touching any app code. The gate only engages when the Vercel
// project defines BASIC_AUTH_CREDENTIALS ("user:pass"); without it the
// middleware passes every request through.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const outputDir = process.argv[2]
if (!outputDir) {
  console.error('Usage: inject-basic-auth.mjs <path to .vercel/output>')
  process.exit(1)
}

const configPath = resolve(outputDir, 'config.json')
const config = JSON.parse(readFileSync(configPath, 'utf8'))

// The middleware route must come first so it runs before the static
// filesystem handler and the serverless function routes.
if (!config.routes?.some((route) => route.middlewarePath === '_middleware')) {
  config.routes = [
    { src: '/(.*)', middlewarePath: '_middleware', continue: true },
    ...(config.routes ?? []),
  ]
}
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)

const middlewareSource = `export default function middleware(request) {
  const credentials = process.env.BASIC_AUTH_CREDENTIALS
  if (!credentials) {
    return new Response(null, { headers: { 'x-middleware-next': '1' } })
  }
  const header = request.headers.get('authorization') ?? ''
  const [scheme, token, ...rest] = header.split(' ')
  const authorized =
    Boolean(scheme && token) &&
    rest.length === 0 &&
    scheme.toLowerCase() === 'basic' &&
    token === btoa(credentials)
  if (authorized) {
    return new Response(null, { headers: { 'x-middleware-next': '1' } })
  }
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="uniswap-zkpassport-demo"' },
  })
}
`

const funcDir = resolve(outputDir, 'functions/_middleware.func')
mkdirSync(funcDir, { recursive: true })
writeFileSync(
  resolve(funcDir, '.vc-config.json'),
  `${JSON.stringify(
    { runtime: 'edge', entrypoint: 'index.js', envVarsInUse: ['BASIC_AUTH_CREDENTIALS'] },
    null,
    2,
  )}\n`,
)
writeFileSync(resolve(funcDir, 'index.js'), middlewareSource)

console.log(`[inject-basic-auth] Edge middleware injected into ${outputDir}`)
