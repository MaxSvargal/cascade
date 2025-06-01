import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CascadeFlowVisualizer Demo',
  description: 'A React-based library for visualizing and interacting with Cascade DSL documents',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
} 