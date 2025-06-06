// System Flow Node Component
// Updated to use BaseNode with dynamic width

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SystemGraphNodeData } from '@/models/cfv_models_generated';
import BaseNode, { DynamicWidthConfig } from './BaseNode';

// SystemFlow-specific width configuration
const SYSTEM_FLOW_WIDTH_CONFIG: DynamicWidthConfig = {
  baseWidth: 160,
  maxWidth: 280,
  scalingFactor: 6,
  contentThreshold: 20
};

const SystemFlowNode: React.FC<NodeProps<SystemGraphNodeData>> = ({ data, selected }) => {
  const handleClick = () => {
    if (data.navigatable && data.onFlowNodeClick && data.targetFlowFqn) {
      data.onFlowNodeClick(data.targetFlowFqn);
    }
  };

  // Prepare additional content for width calculation
  const additionalContent = [
    data.fqn || '',
    ...(data.contextVarUsages || []),
    data.error?.message || ''
  ];

  return (
    <BaseNode
      widthConfig={SYSTEM_FLOW_WIDTH_CONFIG}
      label={data.label}
      fqn={data.fqn}
      selected={selected}
      additionalContent={additionalContent}
      onClick={handleClick}
      customStyle={{
        cursor: data.navigatable ? 'pointer' : 'default',
        border: `2px solid ${selected ? '#1976D2' : '#ddd'}`,
        backgroundColor: 'white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
      }}
    >
      {/* Left handle for inputs (from triggers and other flows) - for horizontal layout */}
      <Handle type="target" position={Position.Left} id="left" />
      
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '6px', 
        color: '#333', 
        fontSize: '14px',
        textAlign: 'center',
        wordWrap: 'break-word'
      }}>
        📋 {data.label}
      </div>
      
      <div style={{ 
        fontSize: '11px', 
        color: '#666', 
        marginBottom: '4px',
        textAlign: 'center',
        wordWrap: 'break-word'
      }}>
        {data.fqn}
      </div>
      
      {data.contextVarUsages && data.contextVarUsages.length > 0 && (
        <div style={{ 
          fontSize: '10px', 
          color: '#888',
          textAlign: 'center',
          wordWrap: 'break-word'
        }}>
          Context: {data.contextVarUsages.slice(0, 3).join(', ')}
          {data.contextVarUsages.length > 3 && '...'}
        </div>
      )}
      
      {data.error && (
        <div style={{ 
          fontSize: '10px', 
          color: 'red', 
          marginTop: '4px',
          textAlign: 'center',
          wordWrap: 'break-word'
        }}>
          ⚠ {data.error.message}
        </div>
      )}

      {data.navigatable && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          fontSize: '10px',
          color: '#1976D2',
          fontWeight: 'bold'
        }}>
          →
        </div>
      )}
      
      {/* Right handle for outputs (to other flows) - for horizontal layout */}
      <Handle type="source" position={Position.Right} id="right" />
    </BaseNode>
  );
};

export default React.memo(SystemFlowNode); 