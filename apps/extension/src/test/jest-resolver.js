const fs = require('fs')
const path = require('path')

const platformExtensions = ['native', 'ios', 'android']
const targetExtensions = ['web', '']

module.exports = (request, options) => {
  const { defaultResolver } = options
  const resolvedPath = defaultResolver(request, options)

  const parsedPath = path.parse(resolvedPath)
  const isPlatformSpecific = platformExtensions.some((ext) => parsedPath.name.endsWith(`.${ext}`))

  if (isPlatformSpecific) {
    const index = parsedPath.name.lastIndexOf('.')
    const strippedName = parsedPath.name.slice(0, index)

    for (const targetExt of targetExtensions) {
      const candidatePath = path.format({
        dir: parsedPath.dir,
        name: targetExt ? `${strippedName}.${targetExt}` : strippedName,
        ext: parsedPath.ext,
      })

      if (fs.existsSync(candidatePath)) {
        return candidatePath
      }
    }
  }

  // Return default resolved path if no replacement is found
  return resolvedPath
}
