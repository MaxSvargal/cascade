// Enhanced SubFlowInvoker Node Component
// Updated for white backgrounds, transparent borders, and compact status indicators
// Now uses BaseNode for consistent styling and width calculation

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SubFlowInvokerNodeData } from '@/models/cfv_models_generated';
import { getComponentStyle, componentStylingService } from '../../services/componentStylingService';
import BaseNode, { DynamicWidthConfig } from './BaseNode';

// SubFlowInvoker-specific width configuration
const SUBFLOW_INVOKER_WIDTH_CONFIG: DynamicWidthConfig = {
  baseWidth: 200,
  maxWidth: 400,
  scalingFactor: 6,
  contentThreshold: 20
};

const SubFlowInvokerNode: React.FC<NodeProps<SubFlowInvokerNodeData>> = ({ data, selected }) => {
  // Get component-specific styling for SubFlowInvoker
  const componentStyle = getComponentStyle('StdLib:SubFlowInvoker');

  // Prepare additional content for width calculation
  const additionalContent = [
    data.invokedFlowFqn || '',
    data.resolvedComponentFqn || '',
    ...(data.contextVarUsages || []),
    data.error?.message || ''
  ];

  // Get custom style based on component and execution status
  const getCustomStyle = () => {
    // Apply component-specific styling properties
    const borderRadius = componentStyle?.borderRadius || 8;
    const borderWidth = componentStyle?.borderWidth || 1;
    const borderStyle = componentStyle?.borderStyle || 'solid';
    
    if (!data.executionStatus) {
      // Clean design mode - use component-specific colors
      const backgroundColor = componentStyle?.backgroundColor || '#FFFFFF';
      const borderColor = componentStyle?.primaryColor || 'transparent';
      
      return {
        backgroundColor,
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        borderRadius: `${borderRadius}px`,
        cursor: 'pointer',
        boxShadow: selected 
          ? `0 6px 20px ${componentStyle?.primaryColor ? componentStyle.primaryColor + '40' : 'rgba(139, 92, 246, 0.4)'}` 
          : '0 4px 12px rgba(75, 85, 99, 0.15)'
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
          borderColor = statusColors.SUCCESS + '30';
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
        cursor: 'pointer',
        boxShadow: selected 
          ? `0 6px 20px ${componentStyle?.primaryColor ? componentStyle.primaryColor + '40' : 'rgba(139, 92, 246, 0.4)'}` 
          : '0 4px 12px rgba(75, 85, 99, 0.15)'
      };
    }
  };

  return (
    <BaseNode
      widthConfig={SUBFLOW_INVOKER_WIDTH_CONFIG}
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
        <span style={{ 
          fontSize: '14px',
          lineHeight: '1'
        }}>
          📋
        </span>
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
      
      {data.invokedFlowFqn && (
        <div style={{ 
          fontSize: '10px', 
          color: '#8B5CF6',
          marginBottom: '8px',
          textAlign: 'center',
          fontFamily: 'ui-monospace, monospace',
          backgroundColor: '#FAF5FF',
          padding: '3px 8px',
          borderRadius: '6px',
          border: '1px solid #E9D5FF',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          whiteSpace: 'normal',
          overflow: 'visible',
          textOverflow: 'unset',
          wordBreak: 'break-all',
          lineHeight: '1.3',
          maxWidth: '100%'
        }}
        title={`Double-click to navigate to ${data.invokedFlowFqn}`}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#F3E8FF';
          e.currentTarget.style.borderColor = '#C4B5FD';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#FAF5FF';
          e.currentTarget.style.borderColor = '#E9D5FF';
        }}
      >
        🔗 {data.invokedFlowFqn}
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
          fontFamily: 'ui-monospace, monospace',
          backgroundColor: componentStyle?.backgroundColor ? 
            componentStyle.backgroundColor.replace('0.98', '0.92') : // Much darker background
            'rgba(0, 0, 0, 0.08)', // More noticeable darkening
          padding: '2px 6px',
          borderRadius: '3px',
          opacity: 0.9,
          whiteSpace: 'normal',
          overflow: 'visible',
          textOverflow: 'unset',
          wordBreak: 'break-all',
          lineHeight: '1.3',
          maxWidth: '100%'
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

export default React.memo(SubFlowInvokerNode); 