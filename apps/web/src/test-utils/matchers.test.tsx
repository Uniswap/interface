import { render, screen } from 'test-utils/render'

describe('matchers', () => {
  describe('toBeVisible', () => {
    it('should return true if element is visible', () => {
      render(<>test</>)
      expect(screen.getByText('test')).toBeVisible()
    })
    it('should return false if element is hidden', () => {
      render(<div style={{ height: 0 }}>test</div>)
      expect(screen.getByText('test')).not.toBeVisible()
    })
    it('should return false if parent element is hidden', () => {
      render(
        <div style={{ height: 0 }}>
          <>test</>
        </div>,
      )
      expect(screen.getByText('test')).not.toBeVisible()
    })
  })
})
