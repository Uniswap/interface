import { memo } from 'react'
import styled from 'styled-components'

import { DirectToDefi } from './sections/DirectToDefi'
import { Footer } from './sections/Footer'
import { Hero } from './sections/Hero'
import { NewsletterEtc } from './sections/NewsletterEtc'
import { Stats } from './sections/Stats'

function Landing() {
  // const cardsRef = useRef<HTMLDivElement>(null)
  // const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  // const shouldDisableNFTRoutes = useDisableNFTRoutes()
  // const cards = useMemo(
  //   () => MAIN_CARDS.filter((card) => !(shouldDisableNFTRoutes && card.to.startsWith('/nft'))),
  //   [shouldDisableNFTRoutes]
  // )

  // const [accountDrawerOpen] = useAccountDrawer()
  // const navigate = useNavigate()
  // useEffect(() => {
  //   if (accountDrawerOpen) {
  //     setTimeout(() => {
  //       navigate('/swap')
  //     }, TRANSITION_DURATIONS.fast)
  //   }
  // }, [accountDrawerOpen, navigate])

  // const location = useLocation()
  // const queryParams = parse(location.search, { ignoreQueryPrefix: true })
  // if (selectedWallet && !queryParams.intro) {
  //   return <Navigate to={{ ...location, pathname: '/swap' }} replace />
  // }

  return (
    <Container>
      <Hero />
      <DirectToDefi />
      <Stats />
      <NewsletterEtc />
      <Footer />
    </Container>
  )
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 80px;
`

export default memo(Landing)
