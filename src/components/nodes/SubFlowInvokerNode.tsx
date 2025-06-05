// Enhanced SubFlowInvoker Node Component
// Updated for white backgrounds, transparent borders, and compact status indicators

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SubFlowInvokerNodeData } from '@/models/cfv_models_generated';
import { getComponentStyle, componentStylingService } from '../../services/componentStylingService';

const SubFlowInvokerNode: React.FC<NodeProps<SubFlowInvokerNodeData>> = ({ data, selected }) => {
  const [isStatusHovered, setIsStatusHovered] = useState(false);

  const getStatusColor = () => {
    switch (data.executionStatus) {
      case 'SUCCESS': return '#10B981'; // Softer green
      case 'FAILURE': return '#EF4444'; // Softer red
      case 'RUNNING': return '#F59E0B'; // Softer amber
      case 'SKIPPED': return '#6B7280'; // Softer gray
      default: return '#8B5CF6'; // Softer purple for sub-flow invokers
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
    // Get component-specific styling for SubFlowInvoker
    const componentStyle = getComponentStyle('StdLib:SubFlowInvoker');
    
    // DYNAMIC WIDTH: Calculate width based on content length
    const labelLength = data.label?.length || 0;
    const fqnLength = data.invokedFlowFqn?.length || 0;
    const maxContentLength = Math.max(labelLength, fqnLength);
    
    // ADAPTIVE WIDTH: Scale based on content length
    let dynamicWidth = 160; // Base width
    if (maxContentLength > 20) {
      dynamicWidth = Math.min(400, 160 + (maxContentLength - 20) * 8); // 8px per extra character, max 400px
    }
    
    // Apply component-specific styling properties
    const borderRadius = componentStyle?.borderRadius || 8;
    const borderWidth = componentStyle?.borderWidth || 1;
    const borderStyle = componentStyle?.borderStyle || 'solid';
    
    const baseStyle = {
      padding: data.executionStatus ? '20px 16px 12px 16px' : '12px 16px',
      borderRadius: `${borderRadius}px`,
      width: `${dynamicWidth}px`, // FIXED: Use calculated dynamic width instead of min/max
      transition: 'all 0.2s ease',
      boxSizing: 'border-box' as const,
      overflow: 'visible' as const, // CHANGED: Allow content to be visible instead of hidden
      display: 'flex' as const,
      flexDirection: 'column' as const,
      position: 'relative' as const,
      cursor: 'pointer' as const,
    };

    if (!data.executionStatus) {
      // Clean design mode - use component-specific colors
      const backgroundColor = componentStyle?.backgroundColor || '#FFFFFF';
      const borderColor = componentStyle?.primaryColor || 'transparent';
      
      return {
        ...baseStyle,
        backgroundColor,
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        boxShadow: selected 
          ? `0 6px 20px ${componentStyle?.primaryColor ? componentStyle.primaryColor + '40' : 'rgba(139, 92, 246, 0.4)'}` 
          : '0 4px 12px rgba(75, 85, 99, 0.15)' // Dark grey purple shadow like other nodes
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
        ...baseStyle,
        backgroundColor,
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        boxShadow: selected 
          ? `0 6px 20px ${componentStyle?.primaryColor ? componentStyle.primaryColor + '40' : 'rgba(139, 92, 246, 0.4)'}` 
          : '0 4px 12px rgba(75, 85, 99, 0.15)' // Dark grey purple shadow like other nodes
      };
    }
  };

  // Get component-specific styling for display
  const componentStyle = getComponentStyle('StdLib:SubFlowInvoker');

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
        {data.invokedFlowFqn !== 'unknown' && (
          <span style={{ 
            marginLeft: '4px', 
            fontSize: '8px',
            opacity: 0.7
          }}>
            ⤴
          </span>
        )}
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
    </div>
  );
};

export default React.memo(SubFlowInvokerNode); 