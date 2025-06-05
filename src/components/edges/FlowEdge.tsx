// Basic Flow Edge Component
// Example implementation for custom edge rendering

import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { FlowEdgeData } from '@/models/cfv_models_generated';

const FlowEdge: React.FC<EdgeProps<FlowEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  label,
  labelStyle
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Create an offset path for the label that's parallel to the main edge but shifted up
  const [labelPath] = getBezierPath({
    sourceX,
    sourceY: sourceY - 10, // Offset source Y by 10px up
    sourcePosition,
    targetX,
    targetY: targetY - 10, // Offset target Y by 10px up
    targetPosition,
  });

  const getEdgeStyle = () => {
    const baseStyle = {
      strokeWidth: selected ? 3 : 2,
    };

    switch (data?.type) {
      case 'combinedDependency':
        return {
          ...baseStyle,
          stroke: '#111', // Lighter gray for combined
          strokeDasharray: 'none'
        };
      
      case 'executionOrderDependency':
        return {
          ...baseStyle,
          stroke: '#aaa', // Dark gray for execution order
          strokeDasharray: 'none'
        };
      
      case 'dataDependency':
        return {
          ...baseStyle,
          stroke: 'orange', // White for data dependencies
          strokeDasharray: '3,3'
        };
      
      case 'errorRouting':
        return {
          ...baseStyle,
          stroke: '#f44336', // Red for error routing
          strokeDasharray: '5,5'
        };
      
      case 'dataFlow':
        return {
          ...baseStyle,
          stroke: data.isExecutedPath ? '#333' : '#bbb',
          strokeDasharray: 'none'
        };
      
      case 'controlFlow':
      default:
        return {
          ...baseStyle,
          stroke: data?.isExecutedPath ? 'green' : '#666',
          strokeDasharray: 'none'
        };
    }
  };

  const getEdgeLabel = () => {
    // Use the label from the edge props if provided
    if (label) return label;
    
    switch (data?.type) {
      case 'combinedDependency':
        return data?.targetInputKey || 'data'; // Just show the data field names
      case 'executionOrderDependency':
        return undefined; // No label for execute-only edges
      case 'dataDependency':
        return data?.targetInputKey || 'data';
      case 'errorRouting':
        return data?.sourceHandle || 'error';
      default:
        return undefined;
    }
  };

  const getLabelStyle = () => {
    // Use the labelStyle from the edge props if provided
    if (labelStyle) return labelStyle;
    
    switch (data?.type) {
      case 'combinedDependency':
        return { fontSize: '10px', fill: '#6B7280' };
      case 'executionOrderDependency':
        return { fontSize: '10px', fill: '#4B5563' };
      case 'dataDependency':
        return { fontSize: '10px', fill: '#000000' }; // Black text for white edges
      case 'errorRouting':
        return { fontSize: '10px', fill: '#f44336' };
      default:
        return { fontSize: '10px', fill: '#666' };
    }
  };

  const edgeLabel = getEdgeLabel();
  const edgeLabelStyle = getLabelStyle();

  return (
    <>
      <path
        id={id}
        style={getEdgeStyle()}
        className="react-flow__edge-path"
        d={edgePath}
      />
      {edgeLabel && (
        <>
          {/* Invisible path for text alignment, offset above the main edge */}
          <path
            id={`${id}-label-path`}
            d={labelPath}
            style={{ stroke: 'none', fill: 'none' }}
          />
          <text>
            <textPath 
              href={`#${id}-label-path`} 
              style={edgeLabelStyle} 
              startOffset="50%" 
              textAnchor="middle"
            >
              {edgeLabel}
            </textPath>
          </text>
        </>
      )}
    </>
  );
};

export default React.memo(FlowEdge); 