// Enhanced Trigger Node Component
// Updated to use BaseNode with dynamic width

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TriggerEntryPointNodeData } from '@/models/cfv_models_generated';
import BaseNode, { DynamicWidthConfig } from './BaseNode';

// Trigger-specific width configuration
const TRIGGER_WIDTH_CONFIG: DynamicWidthConfig = {
  baseWidth: 180,
  maxWidth: 300,
  scalingFactor: 6,
  contentThreshold: 20
};

const TriggerNode: React.FC<NodeProps<TriggerEntryPointNodeData>> = ({ data, selected }) => {
  // Prepare additional content for width calculation
  const additionalContent = [
    data.triggerType?.replace('StdLib:', 'StdLib.Trigger:') || '',
    ...(data.contextVarUsages || [])
  ];

  return (
    <BaseNode
      widthConfig={TRIGGER_WIDTH_CONFIG}
      label={data.label}
      fqn={data.triggerType}
      selected={selected}
      executionStatus={data.executionStatus}
      additionalContent={additionalContent}
      customStyle={{
        // Trigger-specific styling can be added here if needed
        boxShadow: selected 
          ? '0 6px 20px rgba(5, 150, 105, 0.4)' 
          : '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}
    >
      <div style={{ 
        fontWeight: '600', 
        marginBottom: '8px', 
        color: '#1F2937',
        fontSize: '13px',
        textAlign: 'center',
        wordWrap: 'break-word',
        lineHeight: '1.3'
      }}>
        {data.label}
      </div>
      
      <div style={{ 
        fontSize: '10px', 
        color: '#059669',
        textAlign: 'center',
        fontWeight: '500',
        backgroundColor: '#ECFDF5',
        padding: '3px 8px',
        borderRadius: '6px',
        border: '1px solid #D1FAE5',
        marginBottom: '8px',
        wordWrap: 'break-word'
      }}>
        ⚡ {data.triggerType.replace('StdLib:', 'StdLib.Trigger:')}
      </div>

      {data.contextVarUsages && data.contextVarUsages.length > 0 && (
        <div style={{ 
          fontSize: '8px', 
          color: '#9CA3AF',
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
          fontSize: '9px', 
          color: '#DC2626', 
          marginTop: '6px',
          textAlign: 'center',
          backgroundColor: '#FEF2F2',
          padding: '4px 6px',
          borderRadius: '4px',
          border: '1px solid #FECACA',
          wordWrap: 'break-word'
        }}>
          {data.error.message}
        </div>
      )}
      
      {/* Right handle for outputs (to next steps) */}
      <Handle type="source" position={Position.Right} />
    </BaseNode>
  );
};

export default React.memo(TriggerNode); 