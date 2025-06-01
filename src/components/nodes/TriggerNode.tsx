// Enhanced Trigger Node Component
// Updated for left-to-right layout and improved styling

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TriggerEntryPointNodeData } from '@/models/cfv_models_generated';

const TriggerNode: React.FC<NodeProps<TriggerEntryPointNodeData>> = ({ data, selected }) => {
  return (
    <div
      style={{
        padding: '12px 16px',
        border: `2px solid ${selected ? '#1976D2' : '#4CAF50'}`,
        borderRadius: '12px',
        backgroundColor: '#E8F5E8',
        minWidth: '160px',
        maxWidth: '260px',
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
        marginBottom: '8px', 
        color: '#2E7D32',
        fontSize: '14px',
        textAlign: 'center',
        wordWrap: 'break-word',
        lineHeight: '1.2'
      }}>
        🚀 {data.label}
      </div>
      
      <div style={{ 
        fontSize: '11px', 
        color: '#4CAF50',
        textAlign: 'center',
        fontWeight: '500',
        backgroundColor: '#C8E6C9',
        padding: '4px 8px',
        borderRadius: '6px',
        marginBottom: '6px',
        wordWrap: 'break-word'
      }}>
        {data.triggerType}
      </div>

      {data.contextVarUsages && data.contextVarUsages.length > 0 && (
        <div style={{ 
          fontSize: '9px', 
          color: '#666',
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
      
      {/* Right handle for outputs (to first steps) */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default React.memo(TriggerNode); 