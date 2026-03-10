import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../ui/button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>)
    expect(screen.getByText('Default')).toBeInTheDocument()
    
    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByText('Outline')).toBeInTheDocument()
    
    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByText('Ghost')).toBeInTheDocument()
  })

  it('should render different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByText('Small')).toBeInTheDocument()
    
    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByText('Large')).toBeInTheDocument()
    
    rerender(<Button size="icon">Icon</Button>)
    expect(screen.getByText('Icon')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    expect(screen.getByText('Custom')).toHaveClass('custom-class')
  })
})
