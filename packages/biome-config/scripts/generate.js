#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const { deepMergeWithNullRemove: deepMerge } = require('utilities/src/primitives/objects')

const CONFIG_DIR = path.join(__dirname, '..', 'configs')
const BASE_FILE = path.join(__dirname, '..', 'base.json')
const OUTPUT_DIR = path.join(__dirname, '..', 'compiled')

/**
 * Generates compiled Biome configs by merging per-environment configs with a common base.
 *
 * Step-by-step:
 * 1) Resolve key paths:
 *    - CONFIG_DIR: the directory containing override JSON configs (configs/).
 *    - BASE_FILE: the base JSON config (base.json) that every environment extends.
 *    - OUTPUT_DIR: the directory where merged configs will be written (compiled/).
 * 2) Validate inputs and outputs:
 *    - Ensure base.json exists; exit non-zero if missing.
 *    - Ensure configs/ exists; exit non-zero if missing.
 *    - Clean compiled/ directory if it exists; create it if necessary.
 * 3) Parse base.json safely:
 *    - Read base.json and JSON.parse it.
 *    - If parsing fails, log a helpful error and exit non-zero.
 * 4) Discover config files:
 *    - Read configs/ for all files ending with .json.
 *    - If none are present, return early (nothing to compile).
 * 5) For each config in configs/:
 *    - Read and parse the JSON file.
 *    - Deep-merge it with the already-parsed base config using deepMerge().
 *    - Serialize the merged result with stable spacing and write to compiled/{filename}.json.
 *    - If any read/parse/write step fails, log the filename and exit non-zero.
 *
 * This ensures that each environment-specific config inherits defaults from base.json while allowing
 * targeted overrides, producing ready-to-consume compiled configs for downstream tooling.
 */
function generate() {
  if (!fs.existsSync(BASE_FILE)) {
    console.error('Base config file not found:', BASE_FILE)
    process.exit(1)
  }

  if (!fs.existsSync(CONFIG_DIR)) {
    console.error('Config directory not found:', CONFIG_DIR)
    process.exit(1)
  }

  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const baseContent = fs.readFileSync(BASE_FILE, 'utf8')
  let baseConfig
  try {
    baseConfig = JSON.parse(baseContent)
  } catch (error) {
    console.error('Failed to parse base config file:', BASE_FILE, error.message)
    process.exit(1)
  }

  const configFiles = fs.readdirSync(CONFIG_DIR).filter((file) => {
    return file.endsWith('.json')
  })

  if (configFiles.length === 0) {
    return
  }

  configFiles.forEach((file) => {
    try {
      const configPath = path.join(CONFIG_DIR, file)
      const configContent = fs.readFileSync(configPath, 'utf8')

      const config = JSON.parse(configContent)
      const merged = deepMerge(baseConfig, config)

      const outputPath = path.join(OUTPUT_DIR, file)

      fs.writeFileSync(outputPath, `${JSON.stringify(merged, null, 2)}\n`)
    } catch (error) {
      console.error('Failed to process config file:', file, error.message)
      process.exit(1)
    }
  })
}

generate()
