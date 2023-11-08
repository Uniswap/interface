package com.uniswap.theme

import androidx.compose.material.darkColors
import androidx.compose.material.lightColors
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

object UniswapColors {
  val White = Color(0xFFFFFFFF)
  val Black = Color(0xFF000000)
  val Gray50 = Color(0xFFF5F6FC)
  val Gray100 = Color(0xFFE8ECFB)
  val Gray150 = Color(0xFFD2D9EE)
  val Gray200 = Color(0xFFB8C0DC)
  val Gray250 = Color(0xFFA6AFCA)
  val Gray300 = Color(0xFF98A1C0)
  val Gray350 = Color(0xFF888FAB)
  val Gray400 = Color(0xFF7780A0)
  val Gray450 = Color(0xFF6B7594)
  val Gray500 = Color(0xFF5D6785)
  val Gray550 = Color(0xFF505A78)
  val Gray600 = Color(0xFF404A67)
  val Gray650 = Color(0xFF333D59)
  val Gray700 = Color(0xFF293249)
  val Gray750 = Color(0xFF1B2236)
  val Gray800 = Color(0xFF131A2A)
  val Gray850 = Color(0xFF0E1524)
  val Gray900 = Color(0xFF0D111C)
  val Pink50 = Color(0xFFFFF2F7)
  val Pink100 = Color(0xFFFFD9E4)
  val Pink200 = Color(0xFFFBA4C0)
  val Pink300 = Color(0xFFFF6FA3)
  val Pink400 = Color(0xFFFB118E)
  val Pink500 = Color(0xFFC41A69)
  val Pink600 = Color(0xFF8C0F49)
  val Pink700 = Color(0xFF55072A)
  val Pink800 = Color(0xFF39061B)
  val Pink900 = Color(0xFF2B000B)
  val PinkVibrant = Color(0xFFF51A70)
  val Red50 = Color(0xFFFEF0EE)
  val Red100 = Color(0xFFFED5CF)
  val Red200 = Color(0xFFFEA79B)
  val Red300 = Color(0xFFFD766B)
  val Red400 = Color(0xFFFA2B39)
  val Red500 = Color(0xFFC4292F)
  val Red600 = Color(0xFF891E20)
  val Red700 = Color(0xFF530F0F)
  val Red800 = Color(0xFF380A03)
  val Red900 = Color(0xFF240800)
  val RedVibrant = Color(0xFFF14544)
  val Yellow50 = Color(0xFFFEF8C4)
  val Yellow100 = Color(0xFFF0E49A)
  val Yellow200 = Color(0xFFDBBC19)
  val Yellow300 = Color(0xFFBB9F13)
  val Yellow400 = Color(0xFFA08116)
  val Yellow500 = Color(0xFF866311)
  val Yellow600 = Color(0xFF5D4204)
  val Yellow700 = Color(0xFF3E2B04)
  val Yellow800 = Color(0xFF231902)
  val Yellow900 = Color(0xFF180F02)
  val YellowVibrant = Color(0xFFFAF40A)
  val Gold50 = Color(0xFFFFF5E8)
  val Gold100 = Color(0xFFF8DEB6)
  val Gold200 = Color(0xFFEEB317)
  val Gold300 = Color(0xFFDB900B)
  val Gold400 = Color(0xFFB17900)
  val Gold500 = Color(0xFF905C10)
  val Gold600 = Color(0xFF643F07)
  val Gold700 = Color(0xFF3F2208)
  val Gold800 = Color(0xFF29160F)
  val Gold900 = Color(0xFF161007)
  val GoldVibrant = Color(0xFFFEB239)
  val Green50 = Color(0xFFEDFDF0)
  val Green100 = Color(0xFFBFEECA)
  val Green200 = Color(0xFF76D191)
  val Green300 = Color(0xFF40B66B)
  val Green400 = Color(0xFF209853)
  val Green500 = Color(0xFF0B783E)
  val Green600 = Color(0xFF0C522A)
  val Green700 = Color(0xFF053117)
  val Green800 = Color(0xFF091F10)
  val Green900 = Color(0xFF09130B)
  val GreenVibrant = Color(0xFF5CFE9D)
  val Blue50 = Color(0xFFF3F5FE)
  val Blue100 = Color(0xFFDEE1FF)
  val Blue200 = Color(0xFFADBCFF)
  val Blue300 = Color(0xFF869EFF)
  val Blue400 = Color(0xFF4C82FB)
  val Blue500 = Color(0xFF1267D6)
  val Blue600 = Color(0xFF1D4294)
  val Blue700 = Color(0xFF09265E)
  val Blue800 = Color(0xFF0B193F)
  val Blue900 = Color(0xFF040E34)
  val BlueVibrant = Color(0xFF587BFF)
  val Lime50 = Color(0xFFF2FEDB)
  val Lime100 = Color(0xFFD3EBA3)
  val Lime200 = Color(0xFF9BCD46)
  val Lime300 = Color(0xFF7BB10C)
  val Lime400 = Color(0xFF649205)
  val Lime500 = Color(0xFF527318)
  val Lime600 = Color(0xFF344F00)
  val Lime700 = Color(0xFF233401)
  val Lime800 = Color(0xFF171D00)
  val Lime900 = Color(0xFF0E1300)
  val LimeVibrant = Color(0xFFB1F13C)
  val Orange50 = Color(0xFFFEEDE5)
  val Orange100 = Color(0xFFFCD9C8)
  val Orange200 = Color(0xFFFBAA7F)
  val Orange300 = Color(0xFFF67E3E)
  val Orange400 = Color(0xFFDC5B14)
  val Orange500 = Color(0xFFAF460A)
  val Orange600 = Color(0xFF76330F)
  val Orange700 = Color(0xFF4D220B)
  val Orange800 = Color(0xFF2A1505)
  val Orange900 = Color(0xFF1C0E03)
  val OrangeVibrant = Color(0xFFFF6F1E)
  val Magenta50 = Color(0xFFFFF1FE)
  val Magenta100 = Color(0xFFFAD8F8)
  val Magenta200 = Color(0xFFF5A1F5)
  val Magenta300 = Color(0xFFF06DF3)
  val Magenta400 = Color(0xFFDC39E3)
  val Magenta500 = Color(0xFFAF2EB4)
  val Magenta600 = Color(0xFF7A1C7D)
  val Magenta700 = Color(0xFF550D56)
  val Magenta800 = Color(0xFF330733)
  val Magenta900 = Color(0xFF250225)
  val MagentaVibrant = Color(0xFFFC72FF)
  val Violet50 = Color(0xFFF1EFFE)
  val Violet100 = Color(0xFFE2DEFD)
  val Violet200 = Color(0xFFBDB8FA)
  val Violet300 = Color(0xFF9D99F5)
  val Violet400 = Color(0xFF7A7BEB)
  val Violet500 = Color(0xFF515EDC)
  val Violet600 = Color(0xFF343F9E)
  val Violet700 = Color(0xFF232969)
  val Violet800 = Color(0xFF121643)
  val Violet900 = Color(0xFF0E0D30)
  val VioletVibrant = Color(0xFF5065FD)
  val Cyan50 = Color(0xFFD6F5FE)
  val Cyan100 = Color(0xFFB0EDFE)
  val Cyan200 = Color(0xFF63CDE8)
  val Cyan300 = Color(0xFF2FB0CC)
  val Cyan400 = Color(0xFF2092AB)
  val Cyan500 = Color(0xFF117489)
  val Cyan600 = Color(0xFF014F5F)
  val Cyan700 = Color(0xFF003540)
  val Cyan800 = Color(0xFF011E26)
  val Cyan900 = Color(0xFF011418)
  val CyanVibrant = Color(0xFF36DBFF)
  val Slate50 = Color(0xFFF1FCEF)
  val Slate100 = Color(0xFFDAE6D8)
  val Slate200 = Color(0xFFB8C3B7)
  val Slate300 = Color(0xFF9AA498)
  val Slate400 = Color(0xFF7E887D)
  val Slate500 = Color(0xFF646B62)
  val Slate600 = Color(0xFF434942)
  val Slate700 = Color(0xFF2C302C)
  val Slate800 = Color(0xFF181B18)
  val Slate900 = Color(0xFF0F120E)
  val SlateVibrant = Color(0xFF7E887D)
  val Transparent = Color.Transparent
}

data class CustomColors(
  val white: Color = UniswapColors.White,
  val black: Color = UniswapColors.Black,
  val surface1: Color,
  val surface2: Color,
  val surface3: Color,
  val surface4: Color,
  val surface5: Color,
  val scrim: Color,
  val neutral1: Color,
  val neutral2: Color,
  val neutral3: Color,
  val accent1: Color,
  val accent2: Color,
  val statusActive: Color,
  val statusSuccess: Color,
  val statusCritical: Color,
)

val lightCustomColors = CustomColors(
  surface1 = Color(0xFFFFFFFF),
  surface2 = Color(0xFFF9F9F9),
  surface3 = Color(0x0D222222),
  surface4 = Color(0xA3FFFFFF),
  surface5 = Color(0x0A000000),

  scrim = Color(0x99000000),

  neutral1 = Color(0xFF222222),
  neutral2 = Color(0xFF7D7D7D),
  neutral3 = Color(0xFFCECECE),

  accent1 = Color(0xFFFC72FF),
  accent2 = Color(0xFFFFEFFF),

  statusActive = Color(0xFF236EFF),
  statusSuccess = Color(0xFF40B66B),
  statusCritical = Color(0xFFFF5F52),
)

val darkCustomColors = CustomColors(
  surface1 = Color(0xFF131313),
  surface2 = Color(0xFF1B1B1B),
  surface3 = Color(0x1FFFFFFF),
  surface4 = Color(0x33FFFFFF),
  surface5 = Color(0x0A000000),

  scrim = Color(0x99000000),

  neutral1 = Color(0xFFFFFFFF),
  neutral2 = Color(0xFF9B9B9B),
  neutral3 = Color(0xFF5E5E5E),

  accent1 = Color(0xFFFC72FF),
  accent2 = Color(0xFF311C31),

  statusActive = Color(0xFF236EFF),
  statusSuccess = Color(0xFF40B66B),
  statusCritical = Color(0xFFFF5F52),
)

val LightColors = lightColors(
  primary = lightCustomColors.accent1,
  background = lightCustomColors.surface1,
  surface = lightCustomColors.surface1,
  error = lightCustomColors.statusCritical,
  onPrimary = lightCustomColors.white,
  onBackground = lightCustomColors.neutral1,
  onSurface = lightCustomColors.neutral1,
  onError = lightCustomColors.white,
)

val DarkColors = darkColors(
  primary = darkCustomColors.accent1,
  background = darkCustomColors.surface1,
  surface = darkCustomColors.surface1,
  error = darkCustomColors.statusCritical,
  onPrimary = darkCustomColors.white,
  onBackground = darkCustomColors.neutral1,
  onSurface = darkCustomColors.neutral1,
  onError = darkCustomColors.white,
)

val LocalCustomColors = staticCompositionLocalOf {
  lightCustomColors
}
