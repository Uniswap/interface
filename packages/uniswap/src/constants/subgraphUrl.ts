/**
 * 获取 HSK Subgraph URL
 * 
 * 优先级：
 * 1. 环境变量 REACT_APP_HSK_SUBGRAPH_URL 或 VITE_HSK_SUBGRAPH_URL
 * 2. 开发环境（localhost 或内网 IP）：使用 Vite 代理路径
 * 3. 默认生产环境 URL
 * 
 * @returns subgraph URL
 */
export function getHSKSubgraphUrl(): string {
  // 优先使用环境变量
  const envUrl =
    (typeof process !== 'undefined' && process.env?.REACT_APP_HSK_SUBGRAPH_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_HSK_SUBGRAPH_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_HSK_SUBGRAPH_URL)

  if (envUrl) {
    return envUrl
  }

  // 判断是否为开发环境（localhost 或内网 IP）
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
    
    // 判断是否为内网 IP（私有 IP 地址范围）
    // 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12
    const isPrivateIP =
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname)

    // 开发环境或内网环境：使用 Vite 代理
    if (isLocalhost || isPrivateIP) {
      return '/hsk-subgraph'
    }
  }

  // 默认生产环境 URL
  return 'https://graphnode-testnet.hashkeychain.net/subgraphs/name/uniswap-v3/hsk-test'
}
