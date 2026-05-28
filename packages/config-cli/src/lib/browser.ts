import { switchOS } from './os'

// Fire-and-forget browser open. Never throws — caller has already printed the URL,
// so failure here is non-fatal (SSH sessions, headless boxes, missing GUI, unsupported OS).
export const openBrowser = (url: string): void => {
  try {
    Bun.spawn(resolveOpenCommand(url), { stdout: 'ignore', stderr: 'ignore' })
  } catch {
    // Ignore — the user can copy the URL manually.
  }
}

const resolveOpenCommand = (url: string): string[] =>
  switchOS({
    macos: () => ['open', url],
    windows: () => ['cmd', '/c', 'start', '', `"${url}"`],
    // WSL (set on every WSL2 distro): hand off to the Windows host so the URL opens
    // in the user's actual browser instead of a non-existent X11 session.
    linux: () => (process.env['WSL_DISTRO_NAME'] ? ['cmd.exe', '/c', 'start', '', `"${url}"`] : ['xdg-open', url]),
  })
