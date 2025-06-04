// Enhanced SubFlowInvoker Node Component
// Updated for white backgrounds, transparent borders, and compact status indicators

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SubFlowInvokerNodeData } from '@/models/cfv_models_generated';

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

  // Enhanced styling for clean design mode vs execution mode
  const getNodeStyle = () => {
    // DYNAMIC WIDTH: Calculate width based on content length
    const labelLength = data.label?.length || 0;
    const fqnLength = data.invokedFlowFqn?.length || 0;
    const maxContentLength = Math.max(labelLength, fqnLength);
    
    // ADAPTIVE WIDTH: Scale based on content length
    let dynamicWidth = 160; // Base width
    if (maxContentLength > 20) {
      dynamicWidth = Math.min(400, 160 + (maxContentLength - 20) * 8); // 8px per extra character, max 400px
    }
    
    const baseStyle = {
      padding: data.executionStatus ? '20px 16px 12px 16px' : '12px 16px',
      borderRadius: '8px',
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
      // Clean design mode - white background with transparent border
      return {
        ...baseStyle,
        backgroundColor: '#FFFFFF', // Pure white background
        border: '1px solid transparent', // Transparent border for pending nodes
        boxShadow: selected 
          ? '0 6px 20px rgba(139, 92, 246, 0.4)' 
          : '0 4px 12px rgba(139, 92, 246, 0.15)'
      };
    } else {
      // Debug mode - very light pastel backgrounds with subtle borders
      let backgroundColor = '';
      let borderColor = '';
      switch (data.executionStatus) {
        case 'SUCCESS':
          backgroundColor = '#fff'; // Very light green background
          borderColor = '#E6FFFA'; // Very subtle green border
          break;
        case 'FAILURE':
          backgroundColor = '#FFFAFA'; // Very light red background
          borderColor = '#FFE6E6'; // Very subtle red border
          break;
        case 'RUNNING':
          backgroundColor = '#FFFEF9'; // Very light amber background
          borderColor = '#FFF4E6'; // Very subtle amber border
          break;
        case 'SKIPPED':
          backgroundColor = '#FAFAFA'; // Very light gray background
          borderColor = '#F0F0F0'; // Very subtle gray border
          break;
        default:
          backgroundColor = '#FFFFFF'; // White background
          borderColor = 'transparent'; // Transparent border
      }
      
      return {
        ...baseStyle,
        backgroundColor,
        border: `1px solid ${borderColor}`,
        boxShadow: selected 
          ? '0 6px 20px rgba(139, 92, 246, 0.4)' 
          : '0 4px 12px rgba(139, 92, 246, 0.2)'
      };
    }
  };

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
      
      <div style={{ 
        fontWeight: '600', 
        marginBottom: '8px',
        color: '#1F2937',
        fontSize: '13px',
        textAlign: 'center',
        wordWrap: 'break-word',
        lineHeight: '1.3'
      }}>
        {data.label}
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
          color: '#6B7280',
          marginBottom: '8px',
          textAlign: 'center',
          fontFamily: 'ui-monospace, monospace',
          backgroundColor: '#F9FAFB',
          padding: '3px 6px',
          borderRadius: '4px',
          border: '1px solid #F3F4F6',
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