import { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [AppStoreLogo, AnimatedAppStoreLogo] = createIcon({
  name: 'AppStoreLogo',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 25" fill="none" {...props}>
      <G id="AppStore" clipPath="url(#clip0_1393_26724)">
        <Path
          id="Vector"
          d="M19.152 0.5H4.848C2.169 0.5 0 2.669 0 5.348V19.655C0 22.331 2.169 24.5 4.848 24.5H19.155C21.831 24.5 24.003 22.331 24.003 19.652V5.348C24 2.669 21.831 0.5 19.152 0.5Z"
          fill="url(#paint0_linear_1393_26724)"
        />
        <Path
          id="Vector_2"
          d="M11.898 6.01385L12.384 5.17385C12.684 4.64885 13.353 4.47185 13.878 4.77185C14.403 5.07185 14.58 5.74085 14.28 6.26585L9.597 14.3718H12.984C14.082 14.3718 14.697 15.6618 14.22 16.5558H4.29C3.684 16.5558 3.198 16.0698 3.198 15.4638C3.198 14.8578 3.684 14.3718 4.29 14.3718H7.074L10.638 8.19485L9.525 6.26285C9.225 5.73785 9.402 5.07485 9.927 4.76885C10.452 4.46885 11.115 4.64585 11.421 5.17085L11.898 6.01385ZM7.686 17.6808L6.636 19.5018C6.336 20.0268 5.667 20.2038 5.142 19.9038C4.617 19.6038 4.44 18.9348 4.74 18.4098L5.52 17.0598C6.402 16.7868 7.119 16.9968 7.686 17.6808ZM16.728 14.3778H19.569C20.175 14.3778 20.661 14.8638 20.661 15.4698C20.661 16.0758 20.175 16.5618 19.569 16.5618H17.991L19.056 18.4098C19.356 18.9348 19.179 19.5978 18.654 19.9038C18.129 20.2038 17.466 20.0268 17.16 19.5018C15.366 16.3908 14.019 14.0628 13.125 12.5118C12.21 10.9338 12.864 9.34985 13.509 8.81285C14.226 10.0428 15.297 11.8998 16.728 14.3778Z"
          fill="white"
        />
      </G>
      <Defs>
        <LinearGradient
          id="paint0_linear_1393_26724"
          x1="12.0015"
          y1="0.5"
          x2="12.0015"
          y2="24.5"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#18BFFB" />
          <Stop offset="1" stopColor="#2072F3" />
        </LinearGradient>
        <ClipPath id="clip0_1393_26724">
          <Rect width="24" height="24" fill="white" transform="translate(0 0.5)" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
})
