/// <reference types="bun" />

// Shared Bun.build helpers for the ECS and Vercel server bundles.
import { cpSync, existsSync, statSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import type { BunPlugin } from 'bun'

const ROOT = resolve(import.meta.dirname, '..')

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile()
}

function resolveWithExtensions(basePath: string): string {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs']
  if (isFile(basePath)) {
    return basePath
  }
  for (const ext of extensions) {
    if (isFile(basePath + ext)) {
      return basePath + ext
    }
  }
  for (const ext of extensions) {
    if (isFile(basePath + '/index' + ext)) {
      return basePath + '/index' + ext
    }
  }
  return basePath
}

// Bun.build doesn't read tsconfig paths: ~/* -> src/*, functions/* -> functions/*.
export const tsconfigPathsPlugin: BunPlugin = {
  name: 'tsconfig-paths',
  setup(build) {
    build.onResolve({ filter: /^~\// }, (args) => {
      const suffix = args.path.slice(2)
      return { path: resolveWithExtensions(resolve(ROOT, 'src', suffix)) }
    })
    build.onResolve({ filter: /^functions\// }, (args) => {
      const suffix = args.path.slice('functions/'.length)
      return { path: resolveWithExtensions(resolve(ROOT, 'functions', suffix)) }
    })
  },
}

// Vite-style `?inline` imports (base64 data URL) — Bun has no built-in handler.
const INLINE_MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

export const inlineAssetPlugin: BunPlugin = {
  name: 'inline-asset',
  setup(build) {
    build.onResolve({ filter: /\?inline$/ }, (args) => {
      const cleanSpecifier = args.path.replace(/\?inline$/, '')
      const importerDir = args.importer ? dirname(args.importer) : ROOT
      const resolvedPath = Bun.resolveSync(cleanSpecifier, importerDir)
      return { path: resolvedPath, namespace: 'inline-asset' }
    })

    build.onLoad({ filter: /.*/, namespace: 'inline-asset' }, async (args) => {
      const ext = extname(args.path).toLowerCase()
      const mime = INLINE_MIME_TYPES[ext]
      if (!mime) {
        throw new Error(`[inline-asset] Unsupported extension ${ext} for ${args.path}`)
      }
      const buffer = await Bun.file(args.path).arrayBuffer()
      const dataUrl = `data:${mime};base64,${Buffer.from(buffer).toString('base64')}`
      return {
        loader: 'js',
        contents: `export default ${JSON.stringify(dataUrl)};`,
      }
    })
  },
}

// @vercel/og readFileSync's these next to its module at load time — they must
// sit alongside the single-file server bundle.
const OG_ASSETS = ['noto-sans-v27-latin-regular.ttf', 'yoga.wasm', 'resvg.wasm']

export function copyOgAssets(destDir: string): void {
  const ogDistDir = resolve(ROOT, '../../node_modules/@vercel/og/dist')
  for (const asset of OG_ASSETS) {
    const src = resolve(ogDistDir, asset)
    if (existsSync(src)) {
      cpSync(src, resolve(destDir, asset))
    } else {
      console.warn(`[bun-server-build] Warning: @vercel/og asset not found: ${src}`)
    }
  }
}
