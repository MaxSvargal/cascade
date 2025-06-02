// Enhanced System Trigger Node Component
// Updated for left-to-right layout and improved styling

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SystemGraphNodeData } from '@/models/cfv_models_generated';

const SystemTriggerNode: React.FC<NodeProps<SystemGraphNodeData>> = ({ data, selected }) => {
  return (
    <div
      style={{
        padding: '6px 10px',
        border: 'none',
        borderRadius: '12px',
        backgroundColor: 'transparent',
        minWidth: '100px',
        maxWidth: '180px',
        boxShadow: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '2px', 
        color: '#2E7D32', 
        fontSize: '11px',
        textAlign: 'center',
        wordWrap: 'break-word',
        lineHeight: '1.2'
      }}>
        ⚡ {data.label}
      </div>
      
      {data.contextVarUsages && data.contextVarUsages.length > 0 && (
        <div style={{ 
          fontSize: '8px', 
          color: '#4CAF50',
          textAlign: 'center',
          wordWrap: 'break-word'
        }}>
          Context: {data.contextVarUsages.slice(0, 2).join(', ')}
          {data.contextVarUsages.length > 2 && '...'}
        </div>
      )}
      
      {data.error && (
        <div style={{ 
          fontSize: '8px', 
          color: '#F44336', 
          marginTop: '2px',
          textAlign: 'center',
          backgroundColor: '#FFEBEE',
          padding: '1px 3px',
          borderRadius: '3px',
          border: '1px solid #FFCDD2',
          wordWrap: 'break-word'
        }}>
          ⚠️ {data.error.message}
        </div>
      )}
      
      {/* Bottom handle for outputs (to flows) */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default React.memo(SystemTriggerNode); 