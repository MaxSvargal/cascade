// Basic Trigger Node Component
// Example implementation for custom trigger node rendering

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TriggerEntryPointNodeData } from '@/models/cfv_models_generated';

const TriggerNode: React.FC<NodeProps<TriggerEntryPointNodeData>> = ({ data, selected }) => {
  return (
    <div
      style={{
        padding: '10px',
        border: `2px solid ${selected ? '#1976D2' : '#4CAF50'}`,
        borderRadius: '8px',
        backgroundColor: '#E8F5E8',
        minWidth: '120px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#2E7D32' }}>
        🚀 {data.label}
      </div>
      
      <div style={{ fontSize: '12px', color: '#666' }}>
        {data.triggerType}
      </div>
      
      {data.error && (
        <div style={{ fontSize: '10px', color: 'red', marginTop: '4px' }}>
          ⚠ {data.error.message}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default React.memo(TriggerNode); 