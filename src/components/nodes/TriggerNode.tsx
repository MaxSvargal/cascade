// Enhanced Trigger Node Component
// Updated for left-to-right layout and improved styling

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TriggerEntryPointNodeData } from '@/models/cfv_models_generated';

const TriggerNode: React.FC<NodeProps<TriggerEntryPointNodeData>> = ({ data, selected }) => {
  const getStatusColor = () => {
    switch (data.executionStatus) {
      case 'SUCCESS': return '#10B981'; // Softer green
      case 'FAILURE': return '#EF4444'; // Softer red
      case 'RUNNING': return '#F59E0B'; // Softer amber
      case 'SKIPPED': return '#6B7280'; // Softer gray
      default: return '#059669'; // Softer emerald for triggers
    }
  };

  const getStatusIcon = () => {
    switch (data.executionStatus) {
      case 'SUCCESS': return '●';
      case 'FAILURE': return '●';
      case 'RUNNING': return '●';
      case 'SKIPPED': return '○';
      default: return '○';
    }
  };

  const getStatusBadgeStyle = () => {
    const color = getStatusColor();
    return {
      fontSize: '8px',
      color: color,
      backgroundColor: `${color}15`, // Very light background
      border: `1px solid ${color}30`, // Subtle border
      padding: '2px 6px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
      fontWeight: '500',
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const
    };
  };

  const getNodeStyle = () => {
    const baseStyle = {
      padding: '14px 18px',
      borderRadius: '8px',
      minWidth: '160px',
      maxWidth: '260px',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box' as const,
      overflow: 'hidden' as const,
      display: 'flex' as const,
      flexDirection: 'column' as const,
      position: 'relative' as const,
    };

    if (!data.executionStatus) {
      // Clean design mode - light green background for pending
      return {
        ...baseStyle,
        backgroundColor: '#F7FEF7', // Very light green
        border: '1px solid #D1FAE5', // Subtle green border
        boxShadow: selected 
          ? '0 6px 20px rgba(5, 150, 105, 0.4)' 
          : '0 4px 12px rgba(5, 150, 105, 0.15)'
      };
    } else {
      // Debug mode - colored backgrounds and borders based on execution status
      let backgroundColor = '';
      let borderColor = '';
      switch (data.executionStatus) {
        case 'SUCCESS':
          backgroundColor = '#F0FDF4'; // Light green background
          borderColor = '#10B981'; // Subtle emerald border
          break;
        case 'FAILURE':
          backgroundColor = '#FEF2F2'; // Light red background
          borderColor = '#EF4444'; // Subtle red border
          break;
        case 'RUNNING':
          backgroundColor = '#FFFBEB'; // Light amber background
          borderColor = '#F59E0B'; // Subtle amber border
          break;
        case 'SKIPPED':
          backgroundColor = '#F8FAFC'; // Light gray background
          borderColor = '#94A3B8'; // Subtle gray border
          break;
        default:
          backgroundColor = '#F0FDF4'; // Light green background
          borderColor = '#10B981'; // Subtle emerald border
      }
      
      return {
        ...baseStyle,
        backgroundColor,
        border: `1px solid ${borderColor}`,
        boxShadow: selected 
          ? '0 6px 20px rgba(5, 150, 105, 0.4)' 
          : '0 4px 12px rgba(5, 150, 105, 0.2)'
      };
    }
  };

  return (
    <div style={getNodeStyle()}>
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
        ⚡ {data.triggerType}
      </div>

      {data.executionStatus && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '8px'
        }}>
          <div style={getStatusBadgeStyle()}>
            <span>{getStatusIcon()}</span>
            <span>{data.executionStatus.toLowerCase()}</span>
          </div>
        </div>
      )}

      {data.executionDurationMs && (
        <div style={{ 
          fontSize: '9px', 
          color: '#9CA3AF',
          textAlign: 'center',
          marginBottom: '4px',
          fontFamily: 'ui-monospace, monospace'
        }}>
          {data.executionDurationMs}ms
        </div>
      )}

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
      
      {/* Right handle for outputs (to first steps) */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default React.memo(TriggerNode); 