// Component Styling Service
// Implements ComponentStyleRegistry for managing component-specific styling
// Uses OKLCH color space for perceptually uniform and accessible colors

import { 
  ComponentStyleDefinition, 
  ComponentCategoryEnum, 
  ComponentStyleRegistry,
  ComponentColorRegistry 
} from '../models/cfv_models_generated';

// Default OKLCH-based color registry for perceptual uniformity - More pastel colors
const defaultComponentColorRegistry: ComponentColorRegistry = {
  // Data Processing Components (Blue range: 200-240°) - More pastel, lighter backgrounds
  dataProcessingColor: "oklch(0.75 0.08 220)",
  dataProcessingBackgroundColor: "oklch(0.99 0.01 220)",
  dataProcessingAccentColor: "oklch(0.65 0.12 220)",

  // Control Flow Components (Purple range: 270-300°) - More pastel, lighter backgrounds
  controlFlowColor: "oklch(0.75 0.08 280)",
  controlFlowBackgroundColor: "oklch(0.99 0.01 280)",
  controlFlowAccentColor: "oklch(0.65 0.12 280)",

  // External Communication Components (Green range: 120-150°) - Changed to green for HttpCall, lighter backgrounds
  communicationColor: "oklch(0.75 0.08 135)",
  communicationBackgroundColor: "oklch(0.99 0.01 135)",
  communicationAccentColor: "oklch(0.65 0.12 135)",

  // Integration Components (Orange range: 30-60°) - More pastel, lighter backgrounds
  integrationColor: "oklch(0.75 0.08 45)",
  integrationBackgroundColor: "oklch(0.99 0.01 45)",
  integrationAccentColor: "oklch(0.65 0.12 45)",

  // Security Components (Gray range: 0°) - Changed from red to neutral gray
  securityColor: "oklch(0.75 0.02 0)",
  securityBackgroundColor: "oklch(0.99 0.005 0)",
  securityAccentColor: "oklch(0.65 0.04 0)",

  // Flow Control Components (Purple range: 270-300°) - SubFlowInvoker should be violet, lighter backgrounds
  flowControlColor: "oklch(0.75 0.08 280)",
  flowControlBackgroundColor: "oklch(0.99 0.01 280)",
  flowControlAccentColor: "oklch(0.65 0.12 280)",

  // Validation Components (Magenta range: 300-330°) - More pastel, lighter backgrounds
  validationColor: "oklch(0.75 0.08 315)",
  validationBackgroundColor: "oklch(0.99 0.01 315)",
  validationAccentColor: "oklch(0.65 0.12 315)"
};

// Component FQN to category mapping
const componentCategoryMapping: Record<string, ComponentCategoryEnum> = {
  // Data Processing
  'StdLib:MapData': 'dataProcessing',
  'StdLib:FilterData': 'dataProcessing',
  'StdLib:JsonSchemaValidator': 'dataProcessing',
  'StdLib:TransformData': 'dataProcessing',
  'StdLib:AggregateData': 'dataProcessing',
  'StdLib:SortData': 'dataProcessing',

  // Control Flow
  'StdLib:Fork': 'controlFlow',
  'StdLib:Switch': 'controlFlow',
  'StdLib:MergeStreams': 'controlFlow',
  'StdLib:ConditionalBranch': 'controlFlow',
  'StdLib:Loop': 'controlFlow',
  'StdLib:Parallel': 'controlFlow',

  // External Communication (HttpCall is green)
  'StdLib:HttpCall': 'communication',
  'Communication.SendEmail': 'integration',
  'Communication.SendNotification': 'integration',
  'Communication.SendSMS': 'integration',
  'Communication.WebhookCall': 'communication',
  'StdLib:RestApiCall': 'communication',

  // Integration
  'Integration.ExternalServiceAdapter': 'integration',
  'Integration.DatabaseAdapter': 'integration',
  'Integration.FileSystemAdapter': 'integration',
  'Integration.MessageQueueAdapter': 'integration',
  'Integration.CacheAdapter': 'integration',

  // Security
  'Security.Authorize': 'controlFlow',
  'Security.Authenticate': 'security',
  'Security.ValidateToken': 'security',
  'Security.EncryptData': 'security',
  'Security.DecryptData': 'security',

  // Flow Control (FailFlow is red, SubFlowInvoker is violet)
  'StdLib:SubFlowInvoker': 'flowControl',
  'StdLib:FailFlow': 'security',
  'StdLib:RetryFlow': 'flowControl',
  'StdLib:DelayExecution': 'flowControl',
  'StdLib:ScheduleFlow': 'flowControl',

  // Validation (when used specifically for validation)
  'Validation.SchemaValidator': 'validation',
  'Validation.BusinessRuleValidator': 'validation',
  'Validation.DataIntegrityCheck': 'validation'
};

// Component-specific style definitions with icons and enhanced properties
const componentStyleDefinitions: Record<string, ComponentStyleDefinition> = {
  // Data Processing Components
  'StdLib:MapData': {
    componentFqn: 'StdLib:MapData',
    category: 'dataProcessing',
    icon: '🔄',
    description: 'Transform data structure using mapping rules',
    showConfigPreview: true,
    maxConfigPreviewLines: 2,
    // Custom colors for MapData (Cyan-Blue: 200°)
    primaryColor: "oklch(0.75 0.08 200)",
    backgroundColor: "oklch(0.99 0.01 200)",
    accentColor: "oklch(0.65 0.12 200)"
  },
  'StdLib:FilterData': {
    componentFqn: 'StdLib:FilterData',
    category: 'dataProcessing',
    icon: '🔍',
    description: 'Filter data based on specified criteria',
    showConfigPreview: true,
    maxConfigPreviewLines: 2,
    // Custom colors for FilterData (Blue-Purple: 240°)
    primaryColor: "oklch(0.75 0.08 240)",
    backgroundColor: "oklch(0.99 0.01 240)",
    accentColor: "oklch(0.65 0.12 240)"
  },
  'StdLib:JsonSchemaValidator': {
    componentFqn: 'StdLib:JsonSchemaValidator',
    category: 'dataProcessing',
    icon: '📋',
    description: 'Validate data against JSON schema',
    isHighPriority: true,
    showConfigPreview: true
  },

  // Control Flow Components
  'StdLib:Fork': {
    componentFqn: 'StdLib:Fork',
    category: 'controlFlow',
    icon: '🔀',
    description: 'Split execution into multiple parallel paths',
    isHighPriority: true,
    borderWidth: 2
  },
  'StdLib:Switch': {
    componentFqn: 'StdLib:Switch',
    category: 'controlFlow',
    icon: '🔀',
    description: 'Route execution based on conditions',
    isHighPriority: true,
    showConfigPreview: true,
    maxConfigPreviewLines: 3
  },
  'StdLib:MergeStreams': {
    componentFqn: 'StdLib:MergeStreams',
    category: 'controlFlow',
    icon: '🔗',
    description: 'Combine multiple execution streams',
    isHighPriority: true
  },

  // External Communication Components
  'StdLib:HttpCall': {
    componentFqn: 'StdLib:HttpCall',
    category: 'communication',
    icon: '🌐',
    description: 'Make HTTP requests to external services',
    showConfigPreview: true,
    maxConfigPreviewLines: 2
  },
  'Communication.SendEmail': {
    componentFqn: 'Communication.SendEmail',
    category: 'integration',
    icon: '📧',
    description: 'Send email notifications'
  },
  'Communication.SendNotification': {
    componentFqn: 'Communication.SendNotification',
    category: 'integration',
    icon: '🔔',
    description: 'Send push notifications'
  },

  // Integration Components
  'Integration.ExternalServiceAdapter': {
    componentFqn: 'Integration.ExternalServiceAdapter',
    category: 'integration',
    icon: '🔌',
    description: 'Integrate with external services',
    showConfigPreview: true,
    maxConfigPreviewLines: 3,
    isHighPriority: true
  },

  // Security Components
  'Security.Authorize': {
    componentFqn: 'Security.Authorize',
    category: 'controlFlow',
    icon: '🔐',
    description: 'Authorize user access',
    isHighPriority: true,
    borderWidth: 2
  },

  // Flow Control Components
  'StdLib:SubFlowInvoker': {
    componentFqn: 'StdLib:SubFlowInvoker',
    category: 'flowControl',
    icon: '📋',
    description: 'Invoke another flow as a sub-process',
    showConfigPreview: true,
    isHighPriority: true
  },
  'StdLib:FailFlow': {
    componentFqn: 'StdLib:FailFlow',
    category: 'security',
    icon: '❌',
    description: 'Terminate flow execution with failure',
    isHighPriority: true,
    borderWidth: 2
  }
};

// Default category styles
const defaultCategoryStyles: Record<string, ComponentStyleDefinition> = {
  dataProcessing: {
    componentFqn: '',
    category: 'dataProcessing',
    icon: '📊',
    description: 'Components for data transformation and processing'
  },
  controlFlow: {
    componentFqn: '',
    category: 'controlFlow',
    icon: '🔀',
    description: 'Components for controlling execution flow'
  },
  communication: {
    componentFqn: '',
    category: 'communication',
    icon: '📡',
    description: 'Components for external communication'
  },
  integration: {
    componentFqn: '',
    category: 'integration',
    icon: '🔗',
    description: 'Components for system integration'
  },
  security: {
    componentFqn: '',
    category: 'security',
    icon: '🔒',
    description: 'Components for security and authorization'
  },
  flowControl: {
    componentFqn: '',
    category: 'flowControl',
    icon: '⚙️',
    description: 'Components for flow lifecycle management'
  },
  validation: {
    componentFqn: '',
    category: 'validation',
    icon: '✔️',
    description: 'Components for data validation'
  },
  custom: {
    componentFqn: '',
    category: 'custom',
    icon: '🔧',
    description: 'Custom components'
  }
};

export class ComponentStylingService implements ComponentStyleRegistry {
  public styles: Record<string, ComponentStyleDefinition> = { ...componentStyleDefinitions };
  private colorRegistry: ComponentColorRegistry = { ...defaultComponentColorRegistry };
  
  constructor(
    customColorRegistry?: Partial<ComponentColorRegistry>,
    customStyles?: Record<string, ComponentStyleDefinition>
  ) {
    if (customColorRegistry) {
      this.colorRegistry = { ...this.colorRegistry, ...customColorRegistry };
    }
    if (customStyles) {
      this.styles = { ...this.styles, ...customStyles };
    }
  }

  get defaultCategoryStyles(): Record<string, ComponentStyleDefinition> {
    return { ...defaultCategoryStyles };
  }

  getStyleForComponent(componentFqn: string): ComponentStyleDefinition | null {
    // First check for exact component match
    if (this.styles[componentFqn]) {
      return this.resolveStyleColors(this.styles[componentFqn]);
    }

    // If no exact match, create a style based on category
    const category = this.getCategoryForComponent(componentFqn);
    if (category) {
      const categoryStyle = this.getCategoryStyle(category);
      return {
        ...categoryStyle,
        componentFqn,
        displayName: this.getDisplayNameFromFqn(componentFqn)
      };
    }

    return null;
  }

  getCategoryStyle(category: ComponentCategoryEnum): ComponentStyleDefinition {
    const baseStyle = defaultCategoryStyles[category] || defaultCategoryStyles.custom;
    return this.resolveStyleColors(baseStyle);
  }

  registerComponentStyle(style: ComponentStyleDefinition): void {
    this.styles[style.componentFqn] = style;
  }

  getCategoryForComponent(componentFqn: string): ComponentCategoryEnum | null {
    return componentCategoryMapping[componentFqn] || null;
  }

  getColorRegistry(): ComponentColorRegistry {
    return { ...this.colorRegistry };
  }

  updateColorRegistry(updates: Partial<ComponentColorRegistry>): void {
    this.colorRegistry = { ...this.colorRegistry, ...updates };
  }

  getAllComponentStyles(): Record<string, ComponentStyleDefinition> {
    const resolvedStyles: Record<string, ComponentStyleDefinition> = {};
    for (const [fqn, style] of Object.entries(this.styles)) {
      resolvedStyles[fqn] = this.resolveStyleColors(style);
    }
    return resolvedStyles;
  }

  private resolveStyleColors(style: ComponentStyleDefinition): ComponentStyleDefinition {
    const category = style.category;
    const resolvedStyle = { ...style };

    // Resolve colors from registry if not explicitly set
    if (!resolvedStyle.primaryColor) {
      resolvedStyle.primaryColor = this.getColorForCategory(category, 'primary');
    }
    if (!resolvedStyle.backgroundColor) {
      resolvedStyle.backgroundColor = this.getColorForCategory(category, 'background');
    }
    if (!resolvedStyle.accentColor) {
      resolvedStyle.accentColor = this.getColorForCategory(category, 'accent');
    }

    return resolvedStyle;
  }

  private getColorForCategory(category: ComponentCategoryEnum, colorType: 'primary' | 'background' | 'accent'): string {
    const suffix = colorType === 'primary' ? 'Color' : `${colorType}Color`;
    const colorKey = `${category}${suffix.charAt(0).toUpperCase() + suffix.slice(1)}` as keyof ComponentColorRegistry;
    return this.colorRegistry[colorKey] || '#6B7280'; // Default gray
  }

  private getDisplayNameFromFqn(componentFqn: string): string {
    // Extract component name from FQN (e.g., "StdLib:MapData" -> "Map Data")
    const parts = componentFqn.split(':');
    const componentName = parts[parts.length - 1];
    
    // Convert camelCase/PascalCase to space-separated words
    return componentName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // Utility method for generating accessible color variations
  generateColorVariation(baseColor: string, lightness: number, chroma: number): string {
    // Parse OKLCH color and generate variation
    const oklchMatch = baseColor.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/);
    if (oklchMatch) {
      const [, , , hue] = oklchMatch;
      return `oklch(${lightness} ${chroma} ${hue})`;
    }
    return baseColor; // Fallback to original color if not OKLCH
  }

  // Method to get execution status colors (for backward compatibility)
  getExecutionStatusColors() {
    return {
      SUCCESS: '#22C55E',
      FAILURE: '#EF4444', 
      RUNNING: '#F59E0B',
      SKIPPED: '#94A3B8',
      PENDING: '#94A3B8'
    };
  }

  // Method to get execution status background colors
  getExecutionStatusBackgroundColors() {
    return {
      SUCCESS: '#F0FDF4',
      FAILURE: '#FEF2F2',
      RUNNING: '#FFFBEB', 
      SKIPPED: '#F8FAFC',
      PENDING: '#F8FAFC'
    };
  }
}

// Create default instance
export const componentStylingService = new ComponentStylingService();

// Export utility functions
export const getComponentStyle = (componentFqn: string): ComponentStyleDefinition | null => {
  return componentStylingService.getStyleForComponent(componentFqn);
};

export const getComponentCategory = (componentFqn: string): ComponentCategoryEnum | null => {
  return componentStylingService.getCategoryForComponent(componentFqn);
};

export const registerComponentStyle = (style: ComponentStyleDefinition): void => {
  componentStylingService.registerComponentStyle(style);
}; 