// Thin wrapper that delegates to the root vercel-ignore script.
async function main(): Promise<void> {
  const forwardedArgs = process.argv.slice(2)
  const rootScriptPath = new URL('../../../scripts/vercel-ignore.ts', import.meta.url).pathname
  // @ts-ignore - Global bun types are not available in this context
  const processRef = Bun.spawn(['bun', rootScriptPath, ...forwardedArgs], {
    stdio: ['inherit', 'inherit', 'inherit'],
  })
  const exitCode = await processRef.exited
  process.exit(exitCode)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
