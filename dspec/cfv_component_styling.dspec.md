# Component Styling System Specification

## Overview

The Component Styling System provides a comprehensive, accessible, and extensible framework for visually distinguishing different component types in the Cascade Flow Visualizer. It uses perceptually uniform OKLCH color space for accessibility and implements a category-based styling approach with component-specific overrides.

## Design Principles

### 1. Perceptual Uniformity
- **OKLCH Color Space**: All colors use OKLCH (Oklch Lightness Chroma Hue) for perceptually uniform color differences
- **Accessibility**: Ensures consistent visual weight and contrast across different hues
- **Predictable Variations**: Color modifications maintain perceptual relationships

### 2. Semantic Color Mapping
- **Meaningful Associations**: Colors reflect component purpose and behavior
- **Consistent Categories**: Related components share similar color families
- **Intuitive Recognition**: Visual cues align with user mental models

### 3. Scalable Architecture
- **Category-Based System**: Components grouped by functional similarity
- **Component-Specific Overrides**: Individual components can have unique styling
- **Extensible Registry**: Easy addition of new component types and categories

## Color Categories and Semantic Mapping

### Data Processing (Blue Family: 180-240°)
**Purpose**: Components that transform, filter, or process data
**Color Range**: Cyan-Blue spectrum
**Components**:
- `StdLib:MapData` - Cyan-Blue (200°) - Data transformation
- `StdLib:FilterData` - Blue-Purple (240°) - Data filtering  
- `StdLib:JsonSchemaValidator` - Default Blue (220°) - Data validation
- `StdLib:TransformData`, `StdLib:AggregateData`, `StdLib:SortData`

**Color Values**:
```
Primary: oklch(0.75 0.08 220)
Background: oklch(0.99 0.01 220)  
Accent: oklch(0.65 0.12 220)
```

### Control Flow (Purple Family: 270-300°)
**Purpose**: Components that control execution flow and branching
**Color Range**: Purple spectrum
**Components**:
- `StdLib:Fork` - Parallel execution splitting
- `StdLib:Switch` - Conditional routing
- `StdLib:MergeStreams` - Stream combination
- `Security.Authorize` - Access control (moved from security for better semantics)

**Color Values**:
```
Primary: oklch(0.75 0.08 280)
Background: oklch(0.99 0.01 280)
Accent: oklch(0.65 0.12 280)
```

### External Communication (Green Family: 120-150°)
**Purpose**: Components that communicate with external systems via protocols
**Color Range**: Green spectrum
**Components**:
- `StdLib:HttpCall` - HTTP requests
- `Communication.WebhookCall` - Webhook calls
- `StdLib:RestApiCall` - REST API interactions

**Color Values**:
```
Primary: oklch(0.75 0.08 135)
Background: oklch(0.99 0.01 135)
Accent: oklch(0.65 0.12 135)
```

### Integration (Orange Family: 30-60°)
**Purpose**: Components that integrate with external services and systems
**Color Range**: Orange spectrum
**Components**:
- `Integration.ExternalServiceAdapter` - External service integration
- `Communication.SendEmail` - Email service integration
- `Communication.SendNotification` - Notification service integration
- `Integration.DatabaseAdapter`, `Integration.FileSystemAdapter`

**Color Values**:
```
Primary: oklch(0.75 0.08 45)
Background: oklch(0.99 0.01 45)
Accent: oklch(0.65 0.12 45)
```

### Security (Gray Family: 0°)
**Purpose**: Components handling security, encryption, and failure scenarios
**Color Range**: Neutral gray (low chroma)
**Components**:
- `StdLib:FailFlow` - Flow termination (moved from flow control for semantic clarity)
- `Security.Authenticate` - Authentication
- `Security.ValidateToken` - Token validation
- `Security.EncryptData`, `Security.DecryptData`

**Color Values**:
```
Primary: oklch(0.75 0.02 0)
Background: oklch(0.99 0.005 0)
Accent: oklch(0.65 0.04 0)
```

### Flow Control (Purple Family: 270-300°)
**Purpose**: Components that manage sub-flows and flow lifecycle
**Color Range**: Purple spectrum (same as control flow for semantic grouping)
**Components**:
- `StdLib:SubFlowInvoker` - Sub-flow execution
- `StdLib:RetryFlow` - Flow retry logic
- `StdLib:DelayExecution` - Execution timing
- `StdLib:ScheduleFlow` - Flow scheduling

**Color Values**:
```
Primary: oklch(0.75 0.08 280)
Background: oklch(0.99 0.01 280)
Accent: oklch(0.65 0.12 280)
```

### Validation (Magenta Family: 300-330°)
**Purpose**: Components specifically for validation and rule checking
**Color Range**: Magenta spectrum
**Components**:
- `Validation.SchemaValidator` - Schema validation
- `Validation.BusinessRuleValidator` - Business rule validation
- `Validation.DataIntegrityCheck` - Data integrity validation

**Color Values**:
```
Primary: oklch(0.75 0.08 315)
Background: oklch(0.99 0.01 315)
Accent: oklch(0.65 0.12 315)
```

## Component-Specific Styling Features

### Icons and Visual Identity
Each component type has a specific Unicode emoji icon for immediate visual recognition:

```typescript
'StdLib:MapData': '🔄'           // Data transformation
'StdLib:FilterData': '🔍'        // Data filtering
'StdLib:JsonSchemaValidator': '📋' // Validation checklist
'StdLib:Fork': '🔀'              // Path splitting
'StdLib:HttpCall': '🌐'          // Web communication
'Integration.ExternalServiceAdapter': '🔌' // External connection
'StdLib:SubFlowInvoker': '📋'    // Sub-process
'StdLib:FailFlow': '❌'          // Failure/termination
```

### Configuration Preview
Components can display configuration previews directly in the node:

```typescript
showConfigPreview: true
maxConfigPreviewLines: 2-3
```

**Enabled for**:
- Data processing components (MapData, FilterData, JsonSchemaValidator)
- Communication components (HttpCall)
- Integration components (ExternalServiceAdapter)
- Control flow components with complex configuration (Switch)

### Priority Styling
High-priority components receive enhanced visual treatment:

```typescript
isHighPriority: true
borderWidth: 2
```

**Applied to**:
- Critical control flow components (Fork, Switch, MergeStreams)
- Security components (Authorize)
- Integration components (ExternalServiceAdapter)
- Flow control components (SubFlowInvoker, FailFlow)

## Implementation Architecture

### ComponentStylingService
Central service implementing the `ComponentStyleRegistry` interface:

```typescript
class ComponentStylingService implements ComponentStyleRegistry {
  // Style resolution with fallbacks
  getStyleForComponent(componentFqn: string): ComponentStyleDefinition | null
  
  // Category-based styling
  getCategoryStyle(category: ComponentCategoryEnum): ComponentStyleDefinition
  
  // Dynamic registration
  registerComponentStyle(style: ComponentStyleDefinition): void
  
  // Color management
  getColorRegistry(): ComponentColorRegistry
  updateColorRegistry(updates: Partial<ComponentColorRegistry>): void
}
```

### Style Resolution Hierarchy
1. **Component-specific overrides** (highest priority)
2. **Category-based defaults** 
3. **System fallbacks** (lowest priority)

### Color Resolution
Colors are resolved dynamically based on category with component-specific overrides:

```typescript
private resolveStyleColors(style: ComponentStyleDefinition): ComponentStyleDefinition {
  return {
    ...style,
    primaryColor: style.primaryColor || this.getColorForCategory(style.category, 'primary'),
    backgroundColor: style.backgroundColor || this.getColorForCategory(style.category, 'background'),
    accentColor: style.accentColor || this.getColorForCategory(style.category, 'accent')
  };
}
```

## Node Integration

### Shadow Styling
- **Standard nodes**: `0 4px 12px rgba(0, 0, 0, 0.15)`
- **SubFlow nodes**: `0 4px 12px rgba(75, 85, 99, 0.15)` (dark grey purple)
- **Selected state**: Component-specific colored shadows with increased intensity

### Component FQN Labels
- **Background**: Component-specific color with reduced lightness (`0.92` instead of `0.98`)
- **Text**: Component primary color with reduced lightness (`0.45` instead of `0.75`)
- **Opacity**: `0.9` for subtle integration

### Integration.ExternalServiceAdapter Special Handling
- **Adapter Type Display**: Shows adapter configuration with component colors
- **Operation Display**: Shows operation details with consistent styling
- **No Color Mixing**: Uses component styling system instead of hardcoded colors

## Accessibility Features

### OKLCH Color Space Benefits
- **Perceptual Uniformity**: Equal numeric differences represent equal perceptual differences
- **Predictable Lightness**: Lightness values directly correspond to perceived brightness
- **Consistent Chroma**: Saturation levels are perceptually equivalent across hues

### Contrast Requirements
- **Text Contrast**: Minimum 4.5:1 ratio for normal text
- **Background Contrast**: Subtle differentiation without overwhelming content
- **Border Contrast**: Light borders (`+ '20'` or `+ '30'` transparency) for gentle definition

### Color Differentiation
- **Hue Separation**: Minimum 30° separation between adjacent categories
- **Lightness Variation**: Different lightness levels for primary, background, and accent colors
- **Chroma Consistency**: Uniform chroma levels within categories for visual harmony

## Usage Examples

### Basic Component Styling
```typescript
import { getComponentStyle } from '@/services/componentStylingService';

const componentStyle = getComponentStyle('StdLib:MapData');
// Returns: { primaryColor: "oklch(0.75 0.08 200)", icon: "🔄", ... }
```

### Custom Component Registration
```typescript
import { registerComponentStyle } from '@/services/componentStylingService';

registerComponentStyle({
  componentFqn: 'Custom:DataProcessor',
  category: 'dataProcessing',
  icon: '⚙️',
  description: 'Custom data processing component',
  showConfigPreview: true,
  maxConfigPreviewLines: 3
});
```

### Color Registry Updates
```typescript
import { ComponentStylingService } from '@/services/componentStylingService';

const service = new ComponentStylingService();
service.updateColorRegistry({
  dataProcessingColor: "oklch(0.8 0.1 210)" // Lighter blue
});
```

## Extension Guidelines

### Adding New Categories
1. **Choose semantic hue range** (30° minimum separation)
2. **Define color values** using OKLCH format
3. **Update ComponentCategoryEnum** type
4. **Add to defaultComponentColorRegistry**
5. **Create default category style**

### Adding New Components
1. **Determine appropriate category** based on function
2. **Choose distinctive icon** (Unicode emoji preferred)
3. **Define component-specific overrides** if needed
4. **Add to componentCategoryMapping**
5. **Create ComponentStyleDefinition** entry

### Color Customization
- **Maintain OKLCH format** for consistency
- **Preserve lightness relationships** (primary < accent < background)
- **Test contrast ratios** for accessibility
- **Consider color blindness** impact

## Testing and Validation

### Visual Testing
- **Component differentiation**: Verify distinct visual identity
- **Category consistency**: Ensure related components appear similar
- **Accessibility compliance**: Test with color blindness simulators

### Integration Testing
- **Style resolution**: Verify correct fallback behavior
- **Dynamic registration**: Test runtime component addition
- **Color updates**: Validate registry modification effects

### Performance Considerations
- **Style caching**: Resolved styles are cached for performance
- **Lazy loading**: Component styles loaded on demand
- **Memory management**: Efficient storage of style definitions

## Migration and Versioning

### Backward Compatibility
- **Graceful fallbacks** for unknown component types
- **Default styling** for missing category mappings
- **Legacy color support** during transition periods

### Version Management
- **Semantic versioning** for breaking changes
- **Migration guides** for major updates
- **Deprecation warnings** for removed features

## Future Enhancements

### Planned Features
- **Theme variants** (light/dark mode support)
- **Custom icon support** (SVG icons, icon libraries)
- **Animation definitions** (hover effects, state transitions)
- **Responsive sizing** (adaptive node dimensions)

### Extensibility Roadmap
- **Plugin architecture** for third-party styling
- **Visual editor** for style customization
- **Export/import** of style configurations
- **Real-time preview** of style changes 