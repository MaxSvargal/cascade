// System Flow Node Component
// Used in system overview to represent entire flows

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SystemGraphNodeData } from '@/models/cfv_models_generated';

const SystemFlowNode: React.FC<NodeProps<SystemGraphNodeData>> = ({ data, selected }) => {
  return (
    <div
      style={{
        padding: '12px',
        border: `2px solid ${selected ? '#1976D2' : '#FF9800'}`,
        borderRadius: '12px',
        backgroundColor: '#FFF3E0',
        minWidth: '160px',
        boxShadow: '0 3px 6px rgba(0,0,0,0.15)'
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#E65100', fontSize: '14px' }}>
        📋 {data.label}
      </div>
      
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
        Flow: {data.fqn}
      </div>
      
      {data.contextVarUsages && data.contextVarUsages.length > 0 && (
        <div style={{ fontSize: '10px', color: '#888' }}>
          Context vars: {data.contextVarUsages.join(', ')}
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

export default React.memo(SystemFlowNode); 