import { ClipPath, Defs, G, Path, Rect, Svg, Circle as _Circle } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [LoadingPriceCurve, AnimatedLoadingPriceCurve] = createIcon({
  name: 'LoadingPriceCurve',
  getIcon: (props) => (
    <Svg viewBox="0 0 224 52" fill="none" {...props}>
      <G clipPath="url(#clip0_6507_58835)">
        <mask id="mask0_6507_58835" mask="alpha" maskUnits="userSpaceOnUse" x="-1" y="9" width="229" height="35">
          <Path
            d="M0 26.3223L2.27128 24.3383L4.54257 22.3855L6.81385 20.4949L9.08514 18.6961L11.3564 17.0176L13.6277 15.4859L15.899 14.125L18.1703 12.9565L20.4416 11.9988L22.7128 11.267L24.9841 10.7726L27.2554 10.5234H29.5267L31.798 10.7726L34.0693 11.267L36.3406 11.9988L38.6118 12.9565L40.8831 14.125L43.1544 15.4859L45.4257 17.0176L47.697 18.6961L49.9683 20.4949L52.2396 22.3855L54.5108 24.3383L56.7821 26.3223L59.0534 28.3064L61.3247 30.2591L63.596 32.1498L65.8673 33.9485L68.1385 35.627L70.4098 37.1588L72.6811 38.5196L74.9524 39.6881L77.2237 40.6458L79.495 41.3777L81.7663 41.872L84.0375 42.1212H86.3088L88.5801 41.872L90.8514 41.3777L93.1227 40.6458L95.394 39.6881L97.6653 38.5196L99.9365 37.1588L102.208 35.627L104.479 33.9485L106.75 32.1498L109.022 30.2591L111.293 28.3064L113.564 26.3223L115.836 24.3383L118.107 22.3855L120.378 20.4949L122.649 18.6961L124.921 17.0176L127.192 15.4859L129.463 14.125L131.735 12.9565L134.006 11.9988L136.277 11.267L138.548 10.7726L140.82 10.5234L143.091 10.5234L145.362 10.7726L147.634 11.267L149.905 11.9988L152.176 12.9565L154.447 14.125L156.719 15.4859L158.99 17.0176L161.261 18.6961L163.533 20.4949L165.804 22.3855L168.075 24.3383L170.346 26.3223L172.618 28.3064L174.889 30.2591L177.16 32.1498L179.432 33.9485L181.703 35.627L183.974 37.1588L186.245 38.5196L188.517 39.6881L190.788 40.6458L193.059 41.3777L195.331 41.872L197.602 42.1212H199.873L202.144 41.872L204.416 41.3777L206.687 40.6458L208.958 39.6881L211.229 38.5196L213.501 37.1588L215.772 35.627L218.043 33.9485L220.315 32.1498L222.586 30.2591L224.857 28.3064L227.128 26.3223"
            stroke="currentColor"
            strokeWidth="2"
          />
        </mask>
        <G mask="url(#mask0_6507_58835)">
          <Rect width="224" height="76.9609" rx="1.2514" fill="currentColor" fillOpacity="0.12" />
          <G filter="url(#filter0_f_6507_58835)">
            <_Circle cx="-0.156054" cy="28.1994" r="17.676" fill="currentColor" fillOpacity="0.24" />
          </G>
        </G>
      </G>
      <Defs>
        <filter
          id="filter0_f_6507_58835"
          x="-20.9605"
          y="7.39495"
          width="41.6085"
          height="41.6085"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood result="BackgroundImageFix" floodOpacity="0" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="1.56425" result="effect1_foregroundBlur_6507_58835" />
        </filter>
        <ClipPath id="clip0_6507_58835">
          <Rect width="224" height="52" fill="currentColor" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
})
