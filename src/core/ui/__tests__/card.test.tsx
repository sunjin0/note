import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card'

describe('Card Component', () => {
  it('should render card with content', () => {
    render(
      <Card>
        <CardContent>Card Content</CardContent>
      </Card>
    )
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('should render complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    )
    
    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card Description')).toBeInTheDocument()
    expect(screen.getByText('Card Content')).toBeInTheDocument()
    expect(screen.getByText('Card Footer')).toBeInTheDocument()
  })

  it('should apply custom className to Card', () => {
    render(
      <Card className="custom-card-class">
        <CardContent>Content</CardContent>
      </Card>
    )
    expect(screen.getByText('Content').parentElement).toHaveClass('custom-card-class')
  })
})
