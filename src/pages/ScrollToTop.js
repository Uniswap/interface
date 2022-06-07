import { useEffect } from 'react'
import { withRouter } from 'react-router-dom'

// eslint-disable-next-line react/prop-types
function ScrollToTop({ history }) {
  useEffect(() => {
    // eslint-disable-next-line react/prop-types
    const unlisten = history.listen(() => {
      window.scrollTo(0, 0)
    })
    return () => {
      unlisten()
    }
  }, [])

  return null
}

export default withRouter(ScrollToTop)
