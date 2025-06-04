// Enhanced Step Node Component
// Updated for white backgrounds, transparent borders, and compact status indicators

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StepNodeData } from '@/models/cfv_models_generated';

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

  // Enhanced styling for clean design mode vs execution mode
  const getNodeStyle = () => {
    const baseStyle = {
      padding: data.executionStatus ? '24px 28px 14px 28px' : '14px 18px', // Debug mode padding vs design mode
      borderRadius: '8px',
      minWidth: '180px',
      maxWidth: '280px',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box' as const,
      overflow: 'hidden' as const,
      display: 'flex' as const,
      flexDirection: 'column' as const,
      position: 'relative' as const,
    };

    if (!data.executionStatus) {
      // Clean design mode - white background with transparent border
      return {
        ...baseStyle,
        backgroundColor: '#FFFFFF', // Pure white background
        border: '1px solid transparent', // Transparent border for pending nodes
        boxShadow: selected 
          ? '0 6px 20px rgba(59, 130, 246, 0.4)' 
          : '0 4px 12px rgba(0, 0, 0, 0.15)'
      };
    } else {
      // Debug mode - very light pastel backgrounds with subtle borders
      let backgroundColor = '';
      let borderColor = '';
      switch (data.executionStatus) {
        case 'SUCCESS':
          backgroundColor = '#FAFFFE'; // Very light green background
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
          ? '0 6px 20px rgba(59, 130, 246, 0.4)' 
          : '0 4px 12px rgba(0, 0, 0, 0.15)'
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
      
      {data.resolvedComponentFqn && (
        <div style={{ 
          fontSize: '10px', 
          color: '#6B7280',
          marginBottom: '8px',
          textAlign: 'center',
          wordWrap: 'break-word',
          fontFamily: 'ui-monospace, monospace',
          backgroundColor: '#F9FAFB',
          padding: '3px 6px',
          borderRadius: '4px',
          border: '1px solid #F3F4F6'
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