// Smoke test to verify Vitest + jsdom + @testing-library/jest-dom setup
import { describe, it, expect } from 'vitest'

describe('test environment', () => {
  it('runs in jsdom', () => {
    expect(typeof document).toBe('object')
  })

  it('has jest-dom matchers', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    document.body.appendChild(el)
    expect(el).toBeInTheDocument()
    document.body.removeChild(el)
  })
})
