// Enhanced Step Node Component
// Updated for left-to-right layout and improved styling

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StepNodeData } from '@/models/cfv_models_generated';

const StepNode: React.FC<NodeProps<StepNodeData>> = ({ data, selected }) => {
  const getStatusColor = () => {
    switch (data.executionStatus) {
      case 'SUCCESS': return '#4CAF50';
      case 'FAILURE': return '#F44336';
      case 'RUNNING': return '#FF9800';
      case 'SKIPPED': return '#9E9E9E';
      default: return '#2196F3';
    }
  };

  const getStatusIcon = () => {
    switch (data.executionStatus) {
      case 'SUCCESS': return '✅';
      case 'FAILURE': return '❌';
      case 'RUNNING': return '⏳';
      case 'SKIPPED': return '⏭️';
      default: return '⚪';
    }
  };

  // Enhanced styling for clean design mode vs execution mode
  const getNodeStyle = () => {
    const baseStyle = {
      padding: '12px 16px',
      borderRadius: '12px',
      minWidth: '180px',
      maxWidth: '280px',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box' as const,
      overflow: 'hidden' as const,
      display: 'flex' as const,
      flexDirection: 'column' as const,
      position: 'relative' as const
    };

    if (!data.executionStatus) {
      // Clean design mode - no execution status
      return {
        ...baseStyle,
        border: `2px solid ${selected ? '#1976D2' : '#E0E0E0'}`,
        backgroundColor: 'white',
        color: '#333',
        boxShadow: selected 
          ? '0 4px 12px rgba(25, 118, 210, 0.3)' 
          : '0 2px 8px rgba(0,0,0,0.1)'
      };
    } else {
      // Has execution status - show execution styling
      return {
        ...baseStyle,
        border: `2px solid ${selected ? '#1976D2' : getStatusColor()}`,
        backgroundColor: 'white',
        boxShadow: selected 
          ? '0 4px 12px rgba(25, 118, 210, 0.3)' 
          : `0 2px 8px ${getStatusColor()}20`
      };
    }
  };

  return (
    <div style={getNodeStyle()}>
      {/* Left handle for inputs (from previous steps) */}
      <Handle type="target" position={Position.Left} />
      
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '8px',
        color: '#333',
        fontSize: '14px',
        textAlign: 'center',
        wordWrap: 'break-word',
        lineHeight: '1.2'
      }}>
        🔧 {data.label}
      </div>
      
      {data.resolvedComponentFqn && (
        <div style={{ 
          fontSize: '11px', 
          color: '#666',
          marginBottom: '6px',
          textAlign: 'center',
          wordWrap: 'break-word',
          fontFamily: 'monospace',
          backgroundColor: '#F5F5F5',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          {data.resolvedComponentFqn}
        </div>
      )}
      
      {data.executionStatus && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '6px'
        }}>
          <div 
            style={{ 
              fontSize: '10px', 
              color: 'white',
              backgroundColor: getStatusColor(),
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: '500'
            }}
          >
            <span>{getStatusIcon()}</span>
            <span>{data.executionStatus}</span>
          </div>
        </div>
      )}

      {data.executionDurationMs && (
        <div style={{ 
          fontSize: '10px', 
          color: '#888',
          textAlign: 'center',
          marginBottom: '4px'
        }}>
          ⏱️ {data.executionDurationMs}ms
        </div>
      )}

      {data.contextVarUsages && data.contextVarUsages.length > 0 && (
        <div style={{ 
          fontSize: '9px', 
          color: '#999',
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
          fontSize: '10px', 
          color: '#F44336', 
          marginTop: '6px',
          textAlign: 'center',
          backgroundColor: '#FFEBEE',
          padding: '4px 6px',
          borderRadius: '4px',
          border: '1px solid #FFCDD2',
          wordWrap: 'break-word'
        }}>
          ⚠️ {data.error.message}
        </div>
      )}
      
      {/* Right handle for outputs (to next steps) */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default React.memo(StepNode); 