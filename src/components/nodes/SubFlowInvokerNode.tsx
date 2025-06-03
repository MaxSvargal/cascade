// Enhanced SubFlowInvoker Node Component
// Updated for left-to-right layout and improved styling

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SubFlowInvokerNodeData } from '@/models/cfv_models_generated';

const SubFlowInvokerNode: React.FC<NodeProps<SubFlowInvokerNodeData>> = ({ data, selected }) => {
  const getStatusColor = () => {
    switch (data.executionStatus) {
      case 'SUCCESS': return '#4CAF50';
      case 'FAILURE': return '#F44336';
      case 'RUNNING': return '#FF9800';
      case 'SKIPPED': return '#9E9E9E';
      default: return '#9C27B0'; // Purple for sub-flow invokers
    }
  };

  const getStatusIcon = () => {
    switch (data.executionStatus) {
      case 'SUCCESS': return '✅';
      case 'FAILURE': return '❌';
      case 'RUNNING': return '⏳';
      case 'SKIPPED': return '⏭️';
      default: return '🔗';
    }
  };

  // Enhanced styling for clean design mode vs execution mode
  const getNodeStyle = () => {
    const baseStyle = {
      padding: '12px 16px',
      borderRadius: '12px',
      minWidth: '200px',
      maxWidth: '320px',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box' as const,
      overflow: 'hidden' as const,
      display: 'flex' as const,
      flexDirection: 'column' as const,
      position: 'relative' as const,
      cursor: 'pointer' as const // Indicate it's clickable for navigation
    };

    if (!data.executionStatus) {
      // Clean design mode - no execution status
      return {
        ...baseStyle,
        border: `2px solid ${selected ? '#1976D2' : '#9C27B0'}`,
        backgroundColor: '#F3E5F5',
        color: '#7B1FA2',
        boxShadow: selected 
          ? '0 4px 12px rgba(25, 118, 210, 0.3)' 
          : '0 2px 8px rgba(156, 39, 176, 0.2)'
      };
    } else {
      // Has execution status - show execution styling
      return {
        ...baseStyle,
        border: `2px solid ${selected ? '#1976D2' : getStatusColor()}`,
        backgroundColor: '#F3E5F5',
        boxShadow: selected 
          ? '0 4px 12px rgba(25, 118, 210, 0.3)' 
          : `0 2px 8px ${getStatusColor()}20`
      };
    }
  };

  return (
    <div 
      style={getNodeStyle()}
      title="Double-click to navigate to invoked flow"
    >
      {/* Left handle for inputs (from previous steps) */}
      <Handle type="target" position={Position.Left} />
      
      {/* Navigation indicator */}
      <div style={{
        position: 'absolute',
        top: '4px',
        right: '4px',
        fontSize: '12px',
        color: '#9C27B0',
        fontWeight: 'bold'
      }}>
        ⤴
      </div>
      
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '8px', 
        color: '#7B1FA2',
        fontSize: '14px',
        textAlign: 'center',
        wordWrap: 'break-word',
        lineHeight: '1.2'
      }}>
        🔗 {data.label}
      </div>
      
      <div style={{ 
        fontSize: '11px', 
        color: '#9C27B0',
        marginBottom: '8px',
        textAlign: 'center',
        fontWeight: '500',
        backgroundColor: '#E1BEE7',
        padding: '4px 8px',
        borderRadius: '6px',
        wordWrap: 'break-word'
      }}>
        Invokes: {data.invokedFlowFqn}
      </div>
      
      {data.resolvedComponentFqn && (
        <div style={{ 
          fontSize: '10px', 
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

export default React.memo(SubFlowInvokerNode); 