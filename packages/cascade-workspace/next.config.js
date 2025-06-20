/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'reactflow', 
    '@reactflow/core', 
    '@reactflow/controls', 
    '@reactflow/background', 
    '@reactflow/minimap',
    '@cascade/graph',
    '@cascade/client',
    '@cascade/chat'
  ],
  output: 'export'
}

module.exports = nextConfig 