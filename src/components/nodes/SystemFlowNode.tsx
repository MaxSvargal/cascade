// System Flow Node Component
// Used in system overview to represent entire flows

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SystemGraphNodeData } from '@/models/cfv_models_generated';

const SystemFlowNode: React.FC<NodeProps<SystemGraphNodeData>> = ({ data, selected }) => {
  const handleClick = () => {
    if (data.navigatable && data.onFlowNodeClick && data.targetFlowFqn) {
      data.onFlowNodeClick(data.targetFlowFqn);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        padding: '12px',
        border: `2px solid ${selected ? '#1976D2' : '#666'}`,
        borderRadius: '8px',
        backgroundColor: 'white',
        minWidth: '160px',
        maxWidth: '280px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        cursor: data.navigatable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (data.navigatable) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          e.currentTarget.style.borderColor = '#1976D2';
        }
      }}
      onMouseLeave={(e) => {
        if (data.navigatable) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
          e.currentTarget.style.borderColor = selected ? '#1976D2' : '#666';
        }
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '6px', 
        color: '#333', 
        fontSize: '14px',
        textAlign: 'center',
        wordWrap: 'break-word'
      }}>
        📋 {data.label}
      </div>
      
      <div style={{ 
        fontSize: '11px', 
        color: '#666', 
        marginBottom: '4px',
        textAlign: 'center',
        wordWrap: 'break-word'
      }}>
        {data.fqn}
      </div>
      
      {data.contextVarUsages && data.contextVarUsages.length > 0 && (
        <div style={{ 
          fontSize: '10px', 
          color: '#888',
          textAlign: 'center',
          wordWrap: 'break-word'
        }}>
          Context: {data.contextVarUsages.slice(0, 3).join(', ')}
          {data.contextVarUsages.length > 3 && '...'}
        </div>
      )}
      
      {data.error && (
        <div style={{ 
          fontSize: '10px', 
          color: 'red', 
          marginTop: '4px',
          textAlign: 'center',
          wordWrap: 'break-word'
        }}>
          ⚠ {data.error.message}
        </div>
      )}

      {data.navigatable && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          fontSize: '10px',
          color: '#1976D2',
          fontWeight: 'bold'
        }}>
          →
        </div>
      )}
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default React.memo(SystemFlowNode); 