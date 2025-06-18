# Build Guide - Cascade Visualizer Monorepo

## Package Structure

This monorepo contains multiple packages that depend on each other:

- `@cascade/graph` - Core graph visualization library
- `@cascade/client` - Client utilities and types
- `@cascade/chat` - Chat components (future)
- `cascade-workspace` - Next.js application that uses the above packages

## Working with TypeScript Packages

### Option 1: Automatic Build Management (Recommended)

The build system automatically handles dependencies for you:

```bash
# Development - builds dependencies once, then starts Next.js
pnpm run dev

# Development with watch mode - rebuilds dependencies on changes
pnpm run dev:watch

# Production build - automatically builds dependencies first
pnpm run build
```

### Option 2: Manual Build Control

If you prefer manual control over the build process:

```bash
# Build all dependencies first
pnpm run build:deps

# Then run your development server
cd packages/cascade-workspace
pnpm run dev

# Or build the workspace
pnpm run build
```

### Option 3: Direct TypeScript Imports (Advanced)

For direct TypeScript imports without build steps, you would need:

1. Configure Next.js to transpile source files
2. Set up proper path aliases across packages
3. Handle CSS imports differently

This approach has limitations:
- Path aliases (`@/`) don't work across package boundaries
- More complex webpack configuration required
- Potential issues with CSS and asset imports
- Harder to debug build issues

## Why We Use Built Packages

**Advantages:**
- ✅ Reliable module resolution
- ✅ Proper CSS bundling
- ✅ Better error messages
- ✅ Works with all deployment platforms
- ✅ Consistent build artifacts

**Disadvantages:**
- ⏱️ Requires build step for changes
- 💾 Additional disk space for dist files

## Development Workflow

1. **Start development**: `pnpm run dev` or `pnpm run dev:watch`
2. **Make changes** to any package
3. **For immediate feedback**: Use `dev:watch` mode
4. **For production deployment**: `pnpm run build`

## Deployment

For platforms like Vercel, use the root-level build command:

```bash
pnpm run build
```

This automatically:
1. Builds all dependency packages
2. Builds the Next.js application
3. Creates optimized production artifacts

## Troubleshooting

**Build fails with "Module not found":**
- Run `pnpm run build:deps` to ensure all packages are built
- Check that package.json exports are correct

**Changes not reflected in development:**
- Use `pnpm run dev:watch` for automatic rebuilds
- Or manually run `pnpm run build:deps` after changes

**Vercel deployment fails:**
- Ensure the build command is set to `pnpm run build`
- Check that all dependencies are properly listed in package.json
- Run `pnpm install` locally to update the lockfile if you've added dependencies
- Verify that the dependency build order is correct (client → chat → graph) 