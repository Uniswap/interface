import * as haptics from 'expo-haptics'
import { invokeImpact } from 'src/utils/haptic'

const ImpactFeedbackStyle = haptics.ImpactFeedbackStyle
const mockedImpactAsync = jest.spyOn(haptics, 'impactAsync')

describe('impact', () => {
  it('triggers impactAsync', async () => {
    const impactLight = invokeImpact[ImpactFeedbackStyle.Light]
    const impactMedium = invokeImpact[ImpactFeedbackStyle.Medium]
    const impactHeavy = invokeImpact[ImpactFeedbackStyle.Heavy]

    await impactLight()
    await impactMedium()
    await impactHeavy()
    await impactLight()

    expect(mockedImpactAsync).toHaveBeenCalledWith(ImpactFeedbackStyle.Light)
    expect(mockedImpactAsync).toHaveBeenCalledWith(ImpactFeedbackStyle.Medium)
    expect(mockedImpactAsync).toHaveBeenCalledWith(ImpactFeedbackStyle.Heavy)
    expect(mockedImpactAsync).toHaveBeenCalledWith(ImpactFeedbackStyle.Light)
  })
})
