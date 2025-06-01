// System Trigger Node Component
// Used in system overview to represent trigger sources

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SystemGraphNodeData } from '@/models/cfv_models_generated';

const SystemTriggerNode: React.FC<NodeProps<SystemGraphNodeData>> = ({ data, selected }) => {
  return (
    <div
      style={{
        padding: '10px',
        border: `2px solid ${selected ? '#1976D2' : '#4CAF50'}`,
        borderRadius: '20px',
        backgroundColor: '#E8F5E8',
        minWidth: '120px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#2E7D32', fontSize: '12px' }}>
        ⚡ {data.label}
      </div>
      
      {data.contextVarUsages && data.contextVarUsages.length > 0 && (
        <div style={{ fontSize: '9px', color: '#666' }}>
          Context: {data.contextVarUsages.join(', ')}
        </div>
      )}
      
      {data.error && (
        <div style={{ fontSize: '9px', color: 'red', marginTop: '2px' }}>
          ⚠ {data.error.message}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default React.memo(SystemTriggerNode); 