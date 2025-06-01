// Basic Step Node Component
// Example implementation for custom node rendering

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

  return (
    <div
      style={{
        padding: '10px',
        border: `2px solid ${selected ? '#1976D2' : '#ccc'}`,
        borderRadius: '8px',
        backgroundColor: 'white',
        minWidth: '120px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {data.label}
      </div>
      
      {data.resolvedComponentFqn && (
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
          {data.resolvedComponentFqn}
        </div>
      )}
      
      {data.executionStatus && (
        <div 
          style={{ 
            fontSize: '10px', 
            color: 'white',
            backgroundColor: getStatusColor(),
            padding: '2px 6px',
            borderRadius: '4px',
            display: 'inline-block'
          }}
        >
          {data.executionStatus}
        </div>
      )}
      
      {data.error && (
        <div style={{ fontSize: '10px', color: 'red', marginTop: '4px' }}>
          ⚠ {data.error.message}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default React.memo(StepNode); 