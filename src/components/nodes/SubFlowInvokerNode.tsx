// SubFlowInvoker Node Component
// Specialized node for steps that invoke other flows

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

  return (
    <div
      style={{
        padding: '10px',
        border: `2px solid ${selected ? '#1976D2' : '#9C27B0'}`,
        borderRadius: '8px',
        backgroundColor: '#F3E5F5',
        minWidth: '140px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#7B1FA2' }}>
        🔗 {data.label}
      </div>
      
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
        Invokes: {data.invokedFlowFqn}
      </div>
      
      {data.resolvedComponentFqn && (
        <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
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

export default React.memo(SubFlowInvokerNode); 