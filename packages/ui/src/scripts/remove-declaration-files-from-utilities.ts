/** biome-ignore-all lint/suspicious/noConsole: misc script, so it's okay */
import { promises as fs } from 'fs'
import path from 'path'

async function removeDtsFiles(dir: string): Promise<void> {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true })

    for (const file of files) {
      const fullPath = path.join(dir, file.name)

      if (file.isDirectory()) {
        await removeDtsFiles(fullPath)
      } else if (file.isFile() && (file.name.endsWith('.d.ts') || file.name.endsWith('.d.ts.map'))) {
        await fs.unlink(fullPath)
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error)
  }
}

const targetDir = path.join(__dirname, '../', '../', '../', 'utilities/src')

removeDtsFiles(targetDir)
  .then(() => {
    console.log('All .d.ts and .d.ts.map files have been removed from `utilities` after building `ui`')
  })
  .catch((error) => {
    console.error('Error removing .d.ts and .d.ts.map files from `utilities`:', error)
  })
