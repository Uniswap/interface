/**
 * universe-custom/no-tamagui-styling — extracted from universe-custom.js
 * because of its size (rule + baseline/exemption loaders). Registered by
 * universe-custom.js; colocated tests in no-tamagui-styling.test.ts drive the
 * real oxlint binary over fixtures.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Bans NEW Tamagui styling while the Tamagui → Tailwind migration runs:
//   - styled() factory calls (styled imported from ui/src or tamagui)
//   - animation preset props: animation / animateEnter / animateExit
//     (animateOnly is deliberately excluded — it's a flash-prevention modifier
//     that only appears alongside an already-flagged `animation` prop)
//   - $group-* props
// Plain Flex/Text/View layout usage stays silent. Existing sites are
// grandfathered via a generated per-file count baseline; the rule fires only
// on sites beyond a file's baseline count (in document order), so line drift
// within a file never false-positives.
//
// Baseline resolution (TAMAGUI_BASELINE env var):
//   unset  → config/oxlint-plugins/tamagui-baseline.json
//   'off'  → empty baseline, every site reports (used by the generator)
//   <path> → alternate baseline file (used by tests)
// Regenerate: bun scripts/tamagui-migration/generate-tamagui-baseline.ts

const __tamaguiPluginDir = dirname(fileURLToPath(import.meta.url))
const TAMAGUI_REPO_ROOT = join(__tamaguiPluginDir, '..', '..').split('\\').join('/')
const TAMAGUI_STYLED_IMPORT_SOURCE_RE = /^(?:ui\/src|tamagui|@tamagui\/.+)$/
const TAMAGUI_ANIMATION_PROPS = new Set(['animation', 'animateEnter', 'animateExit'])
// Sibling keys that mark an object literal as Tamagui animation config rather
// than CSS `animation` shorthand or a react-navigation screen-options object.
const TAMAGUI_ANIMATION_FAMILY_KEYS = new Set([
  'animation',
  'animateEnter',
  'animateExit',
  'animateOnly',
  'enterStyle',
  'exitStyle',
])
const TAMAGUI_GROUP_PROP_PREFIX = '$group-'

function tamaguiPropertyKeyName(node) {
  return node.key.type === 'Literal' && typeof node.key.value === 'string'
    ? node.key.value
    : node.key.type === 'Identifier'
      ? node.key.name
      : undefined
}

function loadTamaguiBaseline() {
  const override = process.env.TAMAGUI_BASELINE
  if (override === 'off') {
    return {}
  }
  const baselinePath = override || join(__tamaguiPluginDir, 'tamagui-baseline.json')
  const { files } = JSON.parse(readFileSync(baselinePath, 'utf8'))
  return files ?? {}
}

const tamaguiBaselineFiles = loadTamaguiBaseline()

// Migration tooling (codemod/census fixtures, ratchet probes) legitimately
// contains Tamagui styling text; shared with the generator and dangerfile.
// Missing/unreadable list degrades to no exemptions (keep linting), matching
// the Danger leg. Entries are normalized to directory prefixes (trailing `/`)
// so `scripts/tamagui-census` never exempts siblings like
// `scripts/tamagui-census-foo/` — same semantics in all three legs.
function loadTamaguiExemptPathPrefixes() {
  try {
    const { pathPrefixes } = JSON.parse(
      readFileSync(join(__tamaguiPluginDir, 'tamagui-migration-exempt-paths.json'), 'utf8'),
    )
    return Array.isArray(pathPrefixes)
      ? pathPrefixes.map((prefix) => (prefix.endsWith('/') ? prefix : `${prefix}/`))
      : []
  } catch {
    return []
  }
}

const tamaguiExemptPathPrefixes = loadTamaguiExemptPathPrefixes()

const noTamaguiStyling = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow new Tamagui styling (styled(), animation presets, $group-* props) beyond the generated baseline.',
    },
    schema: [],
    messages: {
      newStyled:
        'New Tamagui styled() calls are banned (Tamagui → Tailwind migration). Use Tailwind via @universe/mycelium for web, or compose existing primitives with plain layout props. Grandfathered sites: config/oxlint-plugins/tamagui-baseline.json (regenerate with `bun scripts/tamagui-migration/generate-tamagui-baseline.ts` when moving existing code).',
      newAnimationPreset:
        'New Tamagui animation preset prop "{{name}}" is banned (Tamagui → Tailwind migration). Use CSS transitions / Tailwind animation utilities. Grandfathered sites: config/oxlint-plugins/tamagui-baseline.json (regenerate with `bun scripts/tamagui-migration/generate-tamagui-baseline.ts` when moving existing code).',
      newGroupProp:
        'New Tamagui $group-* prop "{{name}}" is banned (Tamagui → Tailwind migration). Use Tailwind group variants. Grandfathered sites: config/oxlint-plugins/tamagui-baseline.json (regenerate with `bun scripts/tamagui-migration/generate-tamagui-baseline.ts` when moving existing code).',
    },
  },
  create(context) {
    const fn = context.filename ?? context.getFilename?.()
    const physicalPath = typeof fn === 'string' ? fn.split('\\').join('/') : ''
    const rootPrefix = `${TAMAGUI_REPO_ROOT}/`
    const relPath = physicalPath.startsWith(rootPrefix) ? physicalPath.slice(rootPrefix.length) : physicalPath
    if (tamaguiExemptPathPrefixes.some((prefix) => relPath.startsWith(prefix))) {
      return {}
    }
    const baseline = tamaguiBaselineFiles[relPath] ?? {}
    const allowed = {
      styled: baseline.styled ?? 0,
      animation: baseline.animation ?? 0,
      group: baseline.group ?? 0,
    }
    const seen = { styled: 0, animation: 0, group: 0 }
    const styledLocalNames = new Set()

    return {
      ImportDeclaration(node) {
        if (!TAMAGUI_STYLED_IMPORT_SOURCE_RE.test(node.source?.value)) {
          return
        }
        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            specifier.imported.name === 'styled'
          ) {
            styledLocalNames.add(specifier.local.name)
          }
        }
      },
      CallExpression(node) {
        if (node.callee?.type !== 'Identifier' || !styledLocalNames.has(node.callee.name)) {
          return
        }
        seen.styled += 1
        if (seen.styled > allowed.styled) {
          context.report({ node: node.callee, messageId: 'newStyled' })
        }
      },
      JSXAttribute(node) {
        if (node.name?.type !== 'JSXIdentifier') {
          return
        }
        const name = node.name.name
        if (TAMAGUI_ANIMATION_PROPS.has(name)) {
          seen.animation += 1
          if (seen.animation > allowed.animation) {
            context.report({ node: node.name, messageId: 'newAnimationPreset', data: { name } })
          }
        } else if (name.startsWith(TAMAGUI_GROUP_PROP_PREFIX)) {
          seen.group += 1
          if (seen.group > allowed.group) {
            context.report({ node: node.name, messageId: 'newGroupProp', data: { name } })
          }
        }
      },
      // Object-key form, e.g. `'$group-hover': { opacity: 1 }` in style objects.
      // ObjectExpression only — destructuring (ObjectPattern) reads an existing
      // prop and type positions (Pick<..., '$group-hover'>) aren't styling.
      Property(node) {
        if (node.parent?.type !== 'ObjectExpression') {
          return
        }
        const name = tamaguiPropertyKeyName(node)
        if (!name) {
          return
        }
        if (name.startsWith(TAMAGUI_GROUP_PROP_PREFIX)) {
          seen.group += 1
          if (seen.group > allowed.group) {
            context.report({ node: node.key, messageId: 'newGroupProp', data: { name } })
          }
          return
        }
        // Object-form animation config (spread onto a component or styled()
        // config). Only fires when a sibling key from the animation family is
        // present, so CSS `animation` shorthand objects and react-navigation
        // screen-option objects stay silent.
        if (!TAMAGUI_ANIMATION_PROPS.has(name)) {
          return
        }
        const hasAnimationFamilySibling = node.parent.properties.some(
          (sibling) =>
            sibling !== node &&
            sibling.type === 'Property' &&
            TAMAGUI_ANIMATION_FAMILY_KEYS.has(tamaguiPropertyKeyName(sibling)),
        )
        if (!hasAnimationFamilySibling) {
          return
        }
        seen.animation += 1
        if (seen.animation > allowed.animation) {
          context.report({ node: node.key, messageId: 'newAnimationPreset', data: { name } })
        }
      },
    }
  },
}

export default noTamaguiStyling
