// 获取路由中某个参数
const getQueryVariable = variable => {
  const query = window.location.href.split('?')[1]
  if (!query) return false
  const vars = query.split('&')
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=')
    if (pair[0] == variable) return decodeURIComponent(pair[1])
  }
  return false
}

// 獲取localStorage數據
const getLocalData = key => {
  let data = localStorage.getItem(key)
  try {
    data = JSON.parse(data)
  } catch (e) {}
  return data
}

// 設置localStorage數據
const setLocalData = (key, value) => {
  localStorage.setItem(key, value ? JSON.stringify(value) : null)
}

export function setDefaultToken(onTokenSelection) {
  const fromAddressInQuery = getQueryVariable('from')
  const toAddressInQuery = getQueryVariable('to')
  if (fromAddressInQuery || toAddressInQuery) {
    setLocalData('from', fromAddressInQuery)
    setLocalData('to', toAddressInQuery)
    window.location.replace(window.location.href.split('?')[0])
  } else {
    const from = getLocalData('from')
    const to = getLocalData('to')
    if (from) {
      localStorage.removeItem('from')
      onTokenSelection('INPUT', from)
    }
    if (to) {
      localStorage.removeItem('to')
      onTokenSelection('OUTPUT', to)
    }
  }
}