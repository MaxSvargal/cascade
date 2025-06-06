// Enhanced Step Node Component
// Updated for white backgrounds, transparent borders, and compact status indicators
// Now uses BaseNode for consistent styling and width calculation

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StepNodeData } from '@/models/cfv_models_generated';
import { getComponentStyle, componentStylingService } from '../../services/componentStylingService';
import BaseNode, { DynamicWidthConfig } from './BaseNode';

// Step-specific width configuration
const STEP_WIDTH_CONFIG: DynamicWidthConfig = {
  baseWidth: 200,
  maxWidth: 260,
  scalingFactor: 6,
  contentThreshold: 20
};

const StepNode: React.FC<NodeProps<StepNodeData>> = ({ data, selected }) => {
  // Get component-specific styling and information
  const componentFqn = data.resolvedComponentFqn;
  const componentStyle = componentFqn ? getComponentStyle(componentFqn) : null;
  const isExternalServiceAdapter = componentFqn === 'Integration.ExternalServiceAdapter';
  const dslObject = data.dslObject || {};
  const config = dslObject.config || {};

  // Prepare additional content for width calculation
  const additionalContent = [
    data.resolvedComponentFqn || '',
    ...(data.contextVarUsages || []),
    data.error?.message || ''
  ];

  // For ExternalServiceAdapter, also consider config content
  if (isExternalServiceAdapter) {
    const adapterType = config.adapterType || '';
    const operation = config.operation || '';
    additionalContent.push(adapterType, operation);
  }

  // Get custom style based on component and execution status
  const getCustomStyle = () => {
    // Apply component-specific styling properties
    const borderRadius = componentStyle?.borderRadius || 8;
    const borderWidth = componentStyle?.borderWidth || 1;
    const borderStyle = componentStyle?.borderStyle || 'solid';
    
    if (!data.executionStatus) {
      // Clean design mode - use component-specific colors or fallback to white
      const backgroundColor = componentStyle?.backgroundColor || '#FFFFFF';
      const borderColor = componentStyle?.primaryColor || 'transparent';
      
      return {
        backgroundColor,
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        borderRadius: `${borderRadius}px`,
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
        backgroundColor,
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        borderRadius: `${borderRadius}px`,
        boxShadow: selected 
          ? `0 6px 20px ${componentStyle?.primaryColor ? componentStyle.primaryColor + '40' : 'rgba(59, 130, 246, 0.4)'}` 
          : '0 4px 12px rgba(0, 0, 0, 0.15)'
      };
    }
  };

  return (
    <BaseNode
      widthConfig={STEP_WIDTH_CONFIG}
      label={data.label}
      fqn={data.resolvedComponentFqn}
      selected={selected}
      executionStatus={data.executionStatus}
      additionalContent={additionalContent}
      customStyle={getCustomStyle()}
    >
      {/* Left handle for inputs (from previous steps) */}
      <Handle type="target" position={Position.Left} />
      
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
    </BaseNode>
  );
};

export default React.memo(StepNode); 