#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const { parse: parseJsonc } = require('jsonc-parser')
const { extractGlobalRuleValues } = require('../src/extractor')
const { processConfig } = require('../src/processor')

const BASE_FILE = path.join(__dirname, '..', 'base.jsonc')
const OUTPUT_DIR = path.join(__dirname, '..', 'compiled')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'base.json')

/**
 * Generic Biome Config Marker System
 *
 * This script processes base.jsonc and resolves __INCLUDE_GLOBAL_VALUES__ markers
 * by merging values from the main linter config into override sections.
 *
 * Key features:
 * - Generic rule extraction: walks main linter.rules tree to build lookup map
 * - Generic marker detection: finds __INCLUDE_GLOBAL_VALUES__ in any option key
 * - First-level merging: merges top-level keys only, not nested properties
 * - Works with any option key: paths, patterns, deniedGlobals, etc.
 *
 * Process:
 * 1. Parse base.jsonc with global restrictions in main linter config
 * 2. Extract all rule values from main linter.rules into a lookup map
 * 3. For each override with __INCLUDE_GLOBAL_VALUES__ markers:
 *    - Look up the corresponding global rule value
 *    - Merge using the appropriate strategy based on value type (object/array)
 *    - Handle special cases: "off" overrides for objects, deduplication for arrays
 * 4. Write compiled output to compiled/base.json
 */

/**
 * Main entry point - generates compiled config with markers resolved
 */
function generate() {
  // Validate base.jsonc exists
  if (!fs.existsSync(BASE_FILE)) {
    console.error('Base config file not found:', BASE_FILE)
    process.exit(1)
  }

  // Clean and create output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Read and parse base.jsonc
  const baseContent = fs.readFileSync(BASE_FILE, 'utf8')
  let baseConfig
  try {
    baseConfig = parseJsonc(baseContent)
  } catch (error) {
    console.error('Failed to parse base config file:', BASE_FILE, error.message)
    process.exit(1)
  }

  let processedConfig
  try {
    // Extract global rule values from main linter config
    const globalRules = extractGlobalRuleValues(baseConfig)
    // Process all overrides to resolve markers
    processedConfig = processConfig(baseConfig, globalRules)
  } catch (error) {
    console.error('Failed to generate biome config file:', BASE_FILE, error.message)
    process.exit(1)
  }
  // Write compiled output
  try {
    fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(processedConfig, null, 2)}\n`)
    console.log('✓ Generated biome.json')
  } catch (error) {
    console.error('Failed to write compiled config:', OUTPUT_FILE, error.message)
    process.exit(1)
  }
}

generate()
