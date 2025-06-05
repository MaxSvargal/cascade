// Enhanced Step Node Component
// Updated for white backgrounds, transparent borders, and compact status indicators
// Now includes component-specific styling with OKLCH colors

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StepNodeData } from '@/models/cfv_models_generated';
import { getComponentStyle, componentStylingService } from '../../services/componentStylingService';

const StepNode: React.FC<NodeProps<StepNodeData>> = ({ data, selected }) => {
  const [isStatusHovered, setIsStatusHovered] = useState(false);

  const getStatusColor = () => {
    switch (data.executionStatus) {
      case 'SUCCESS': return '#10B981'; // Softer green
      case 'FAILURE': return '#EF4444'; // Softer red
      case 'RUNNING': return '#F59E0B'; // Softer amber
      case 'SKIPPED': return '#6B7280'; // Softer gray
      default: return '#3B82F6'; // Softer blue
    }
  };

  const getStatusIcon = () => {
    switch (data.executionStatus) {
      case 'SUCCESS': return '●';
      case 'FAILURE': return '●';
      case 'RUNNING': return '●';
      case 'SKIPPED': return '○';
      default: return '○';
    }
  };

  // Compact status indicator with hover animation
  const getCompactStatusStyle = () => {
    const color = getStatusColor();
    return {
      position: 'absolute' as const,
      top: '4px',
      left: '4px',
      fontSize: '8px',
      color: color,
      backgroundColor: `${color}10`, // Very light background
      border: `1px solid ${color}20`, // Very subtle border
      padding: '2px 4px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      cursor: 'default',
      zIndex: 10,
      maxWidth: isStatusHovered ? '120px' : '40px',
      overflow: 'hidden',
      whiteSpace: 'nowrap' as const
    };
  };

  // Enhanced styling for clean design mode vs execution mode with component-specific colors
  const getNodeStyle = () => {
    // Get component-specific styling
    const componentFqn = data.resolvedComponentFqn;
    const componentStyle = componentFqn ? getComponentStyle(componentFqn) : null;
    
    // ENHANCED: Check if this is an Integration.ExternalServiceAdapter for dynamic sizing
    const isExternalServiceAdapter = componentFqn === 'Integration.ExternalServiceAdapter';
    const dslObject = data.dslObject || {};
    const config = dslObject.config || {};
    
    // DYNAMIC WIDTH: Calculate width based on content for ExternalServiceAdapter
    let dynamicWidth = 180; // Base width for regular step nodes
    let dynamicHeight = 'auto'; // Base height
    
    if (isExternalServiceAdapter) {
      const label = data.label || '';
      const adapterType = config.adapterType || '';
      const operation = config.operation || '';
      
      // Calculate width based on content length
      const labelLength = label.length;
      const adapterTypeLength = adapterType.length;
      const operationLength = operation.length;
      const maxContentLength = Math.max(labelLength, adapterTypeLength, operationLength);
      
      // Scale width based on content
      dynamicWidth = Math.min(450, Math.max(220, 180 + (maxContentLength - 15) * 7)); // 7px per extra character, max 450px
    }
    
    // Apply component-specific styling properties
    const borderRadius = componentStyle?.borderRadius || 8;
    const borderWidth = componentStyle?.borderWidth || 1;
    const borderStyle = componentStyle?.borderStyle || 'solid';
    
    const baseStyle = {
      padding: data.executionStatus ? '24px 28px 14px 28px' : '14px 18px', // Debug mode padding vs design mode
      borderRadius: `${borderRadius}px`,
      width: `${dynamicWidth}px`, // Use calculated dynamic width
      height: dynamicHeight,
      transition: 'all 0.2s ease',
      boxSizing: 'border-box' as const,
      overflow: 'visible' as const, // Allow content to be visible
      display: 'flex' as const,
      flexDirection: 'column' as const,
      position: 'relative' as const,
    };

    if (!data.executionStatus) {
      // Clean design mode - use component-specific colors or fallback to white
      const backgroundColor = componentStyle?.backgroundColor || '#FFFFFF';
      const borderColor = componentStyle?.primaryColor || 'transparent';
      
      return {
        ...baseStyle,
        backgroundColor,
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        boxShadow: selected 
          ? `0 6px 20px ${componentStyle?.primaryColor ? componentStyle.primaryColor + '40' : 'rgba(59, 130, 246, 0.4)'}` 
          : '0 4px 12px rgba(0, 0, 0, 0.15)'
      };
    } else {
      // Debug mode - execution status takes precedence over component colors
      const statusColors = componentStylingService.getExecutionStatusColors();
      const statusBackgroundColors = componentStylingService.getExecutionStatusBackgroundColors();
      
      let backgroundColor = '';
      let borderColor = '';
      switch (data.executionStatus) {
        case 'SUCCESS':
          backgroundColor = statusBackgroundColors.SUCCESS;
          borderColor = statusColors.SUCCESS + '30'; // Add transparency
          break;
        case 'FAILURE':
          backgroundColor = statusBackgroundColors.FAILURE;
          borderColor = statusColors.FAILURE + '30';
          break;
        case 'RUNNING':
          backgroundColor = statusBackgroundColors.RUNNING;
          borderColor = statusColors.RUNNING + '30';
          break;
        case 'SKIPPED':
          backgroundColor = statusBackgroundColors.SKIPPED;
          borderColor = statusColors.SKIPPED + '30';
          break;
        default:
          backgroundColor = statusBackgroundColors.PENDING;
          borderColor = statusColors.PENDING + '30';
      }
      
      return {
        ...baseStyle,
        backgroundColor,
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        boxShadow: selected 
          ? `0 6px 20px ${componentStyle?.primaryColor ? componentStyle.primaryColor + '40' : 'rgba(59, 130, 246, 0.4)'}` 
          : '0 4px 12px rgba(0, 0, 0, 0.15)'
      };
    }
  };

  // Get component-specific styling and information
  const componentFqn = data.resolvedComponentFqn;
  const componentStyle = componentFqn ? getComponentStyle(componentFqn) : null;
  const isExternalServiceAdapter = componentFqn === 'Integration.ExternalServiceAdapter';
  const dslObject = data.dslObject || {};
  const config = dslObject.config || {};

  return (
    <div style={getNodeStyle()}>
      {/* Left handle for inputs (from previous steps) */}
      <Handle type="target" position={Position.Left} />
      
      {/* Compact status indicator with hover animation */}
      {data.executionStatus && (
        <div 
          style={getCompactStatusStyle()}
          onMouseEnter={() => setIsStatusHovered(true)}
          onMouseLeave={() => setIsStatusHovered(false)}
        >
          <span>{getStatusIcon()}</span>
          {data.executionDurationMs ? (
            <span style={{ fontSize: '7px' }}>
              {data.executionDurationMs}ms
            </span>
          ) : ''}
          {isStatusHovered && (
            <span style={{ marginLeft: '4px', fontSize: '7px' }}>
              {data.executionStatus.toLowerCase()}
            </span>
          )}
        </div>
      )}
      
      {/* Component icon and label */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginBottom: '8px'
      }}>
        {componentStyle?.icon && (
          <span style={{ 
            fontSize: '14px',
            lineHeight: '1'
          }}>
            {componentStyle.icon}
          </span>
        )}
        <div style={{ 
          fontWeight: '600', 
          color: '#1F2937',
          fontSize: '13px',
          textAlign: 'center',
          wordWrap: 'break-word',
          lineHeight: '1.3'
        }}>
          {data.label}
        </div>
      </div>
      
      {/* ENHANCED: Display adapter configuration for Integration.ExternalServiceAdapter */}
      {isExternalServiceAdapter && config.adapterType && (
        <div style={{ 
          fontSize: '10px', 
          color: componentStyle?.accentColor || '#F59E0B',
          marginBottom: '8px',
          textAlign: 'center',
          fontFamily: 'ui-monospace, monospace',
          backgroundColor: componentStyle?.backgroundColor || '#FFF7ED',
          padding: '3px 8px',
          borderRadius: '6px',
          border: `1px solid ${componentStyle?.primaryColor ? componentStyle.primaryColor + '30' : '#FED7AA'}`,
          cursor: 'default',
          transition: 'all 0.2s ease',
          position: 'relative',
          whiteSpace: 'normal',
          overflow: 'visible',
          textOverflow: 'unset',
          wordBreak: 'break-all',
          lineHeight: '1.3',
          maxWidth: '100%'
        }}
        title={`Adapter Type: ${config.adapterType}`}
      >
        🔌 {config.adapterType}
      </div>
      )}
      
      {/* ENHANCED: Display operation for Integration.ExternalServiceAdapter */}
      {isExternalServiceAdapter && config.operation && (
        <div style={{ 
          fontSize: '10px', 
          color: componentStyle?.primaryColor || '#F59E0B',
          marginBottom: '8px',
          textAlign: 'center',
          fontFamily: 'ui-monospace, monospace',
          backgroundColor: componentStyle?.backgroundColor || '#FFF7ED',
          padding: '3px 8px',
          borderRadius: '6px',
          border: `1px solid ${componentStyle?.primaryColor ? componentStyle.primaryColor + '30' : '#FED7AA'}`,
          cursor: 'default',
          transition: 'all 0.2s ease',
          position: 'relative',
          whiteSpace: 'normal',
          overflow: 'visible',
          textOverflow: 'unset',
          wordBreak: 'break-all',
          lineHeight: '1.3',
          maxWidth: '100%'
        }}
        title={`Operation: ${config.operation}`}
      >
        ⚙️ {config.operation}
      </div>
      )}
      
      {/* Component configuration preview */}
      {componentStyle?.showConfigPreview && config && Object.keys(config).length > 0 && (
        <div style={{ 
          fontSize: '9px', 
          color: componentStyle.accentColor || '#6B7280',
          marginBottom: '8px',
          textAlign: 'center',
          fontFamily: 'ui-monospace, monospace',
          backgroundColor: componentStyle.backgroundColor ? componentStyle.backgroundColor + '20' : '#F9FAFB',
          padding: '4px 8px',
          borderRadius: '4px',
          border: `1px solid ${componentStyle.primaryColor ? componentStyle.primaryColor + '30' : '#F3F4F6'}`,
          maxHeight: `${(componentStyle.maxConfigPreviewLines || 2) * 12}px`,
          overflow: 'hidden',
          lineHeight: '1.2'
        }}>
          {Object.entries(config)
            .slice(0, componentStyle.maxConfigPreviewLines || 2)
            .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
            .join('\n')
            .substring(0, 100) + (JSON.stringify(config).length > 100 ? '...' : '')}
        </div>
      )}

      {data.resolvedComponentFqn && (
        <div style={{ 
          fontSize: '10px', 
          color: componentStyle?.primaryColor ? 
            componentStyle.primaryColor.replace('0.75', '0.45') : // Much darker text
            '#374151', // Dark gray text
          marginBottom: '8px',
          textAlign: 'center',
          wordWrap: 'break-word',
          fontFamily: 'ui-monospace, monospace',
          backgroundColor: componentStyle?.backgroundColor ? 
            componentStyle.backgroundColor.replace('0.98', '0.92') : // Much darker background
            'rgba(0, 0, 0, 0.08)', // More noticeable darkening
          padding: '2px 6px',
          borderRadius: '3px',
          opacity: 0.9
        }}>
          {data.resolvedComponentFqn}
        </div>
      )}

      {data.contextVarUsages && data.contextVarUsages.length > 0 && (
        <div style={{ 
          fontSize: '8px', 
          color: '#9CA3AF',
          textAlign: 'center',
          marginBottom: '4px',
          wordWrap: 'break-word'
        }}>
          Context: {data.contextVarUsages.slice(0, 2).join(', ')}
          {data.contextVarUsages.length > 2 && '...'}
        </div>
      )}
      
      {data.error && (
        <div style={{ 
          fontSize: '9px', 
          color: '#DC2626', 
          marginTop: '6px',
          textAlign: 'center',
          backgroundColor: '#FEF2F2',
          padding: '4px 6px',
          borderRadius: '4px',
          border: '1px solid #FECACA',
          wordWrap: 'break-word'
        }}>
          {data.error.message}
        </div>
      )}
      
      {/* Right handle for outputs (to next steps) */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default React.memo(StepNode); 