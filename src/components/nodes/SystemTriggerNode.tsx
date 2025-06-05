// Enhanced System Trigger Node Component
// Updated for left-to-right layout and improved styling

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SystemGraphNodeData } from '@/models/cfv_models_generated';

const SystemTriggerNode: React.FC<NodeProps<SystemGraphNodeData>> = ({ data, selected }) => {
  return (
    <div
      style={{
        padding: '12px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: 'transparent',
        minWidth: '120px',
        maxWidth: '200px',
        minHeight: '80px', // Same as flow nodes
        boxShadow: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '6px', 
        color: '#2E7D32', 
        fontSize: '14px',
        textAlign: 'center',
        wordWrap: 'break-word',
        lineHeight: '1.2'
      }}>
        ⚡ {data.label}
      </div>
      
      <div style={{ 
        fontSize: '11px', 
        color: '#4CAF50',
        marginBottom: '4px',
        textAlign: 'center',
        wordWrap: 'break-word'
      }}>
        {data.fqn}
      </div>
      
      {data.contextVarUsages && data.contextVarUsages.length > 0 && (
        <div style={{ 
          fontSize: '10px', 
          color: '#666',
          textAlign: 'center',
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
          marginTop: '4px',
          textAlign: 'center',
          backgroundColor: '#FFEBEE',
          padding: '2px 4px',
          borderRadius: '3px',
          border: '1px solid #FFCDD2',
          wordWrap: 'break-word'
        }}>
          ⚠️ {data.error.message}
        </div>
      )}
      
      {/* Right handle for outputs (to flows) - for horizontal layout */}
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
};

export default React.memo(SystemTriggerNode); 