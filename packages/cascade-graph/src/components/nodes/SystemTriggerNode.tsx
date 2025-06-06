// Enhanced System Trigger Node Component
// Updated to use BaseNode with dynamic width

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SystemGraphNodeData } from '@/models/cfv_models_generated';
import BaseNode, { DynamicWidthConfig } from './BaseNode';

// SystemTrigger-specific width configuration
const SYSTEM_TRIGGER_WIDTH_CONFIG: DynamicWidthConfig = {
  baseWidth: 100,
  maxWidth: 200,
  scalingFactor: 6,
  contentThreshold: 20
};

const SystemTriggerNode: React.FC<NodeProps<SystemGraphNodeData>> = ({ data, selected }) => {
  // Prepare additional content for width calculation
  const additionalContent = [
    data.fqn || '',
    ...(data.contextVarUsages || []),
    data.error?.message || ''
  ];

  return (
    <BaseNode
      widthConfig={SYSTEM_TRIGGER_WIDTH_CONFIG}
      label={data.label}
      fqn={data.fqn}
      selected={selected}
      additionalContent={additionalContent}
      customStyle={{
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        minHeight: '80px',
        justifyContent: 'center'
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
    </BaseNode>
  );
};

export default React.memo(SystemTriggerNode); 