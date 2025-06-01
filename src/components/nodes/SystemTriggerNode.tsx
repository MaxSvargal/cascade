// Enhanced System Trigger Node Component
// Updated for left-to-right layout and improved styling

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SystemGraphNodeData } from '@/models/cfv_models_generated';

const SystemTriggerNode: React.FC<NodeProps<SystemGraphNodeData>> = ({ data, selected }) => {
  return (
    <div
      style={{
        padding: '12px 16px',
        border: `2px solid ${selected ? '#1976D2' : '#4CAF50'}`,
        borderRadius: '20px',
        backgroundColor: '#E8F5E8',
        minWidth: '140px',
        maxWidth: '240px',
        boxShadow: selected 
          ? '0 4px 12px rgba(25, 118, 210, 0.3)' 
          : '0 2px 8px rgba(76, 175, 80, 0.2)',
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
        marginBottom: '6px', 
        color: '#2E7D32', 
        fontSize: '13px',
        textAlign: 'center',
        wordWrap: 'break-word',
        lineHeight: '1.2'
      }}>
        ⚡ {data.label}
      </div>
      
      {data.contextVarUsages && data.contextVarUsages.length > 0 && (
        <div style={{ 
          fontSize: '9px', 
          color: '#4CAF50',
          textAlign: 'center',
          backgroundColor: '#C8E6C9',
          padding: '2px 6px',
          borderRadius: '4px',
          wordWrap: 'break-word'
        }}>
          Context: {data.contextVarUsages.slice(0, 2).join(', ')}
          {data.contextVarUsages.length > 2 && '...'}
        </div>
      )}
      
      {data.error && (
        <div style={{ 
          fontSize: '9px', 
          color: '#F44336', 
          marginTop: '4px',
          textAlign: 'center',
          backgroundColor: '#FFEBEE',
          padding: '2px 4px',
          borderRadius: '4px',
          border: '1px solid #FFCDD2',
          wordWrap: 'break-word'
        }}>
          ⚠️ {data.error.message}
        </div>
      )}
      
      {/* Right handle for outputs (to flows) */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default React.memo(SystemTriggerNode); 