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
  selected
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getEdgeStyle = () => {
    const baseStyle = {
      strokeWidth: selected ? 3 : 2,
    };

    if (data?.type === 'dataFlow') {
      return {
        ...baseStyle,
        stroke: data.isExecutedPath ? '#4CAF50' : '#2196F3',
        strokeDasharray: '5,5'
      };
    } else {
      return {
        ...baseStyle,
        stroke: data?.isExecutedPath ? '#4CAF50' : '#666',
      };
    }
  };

  return (
    <>
      <path
        id={id}
        style={getEdgeStyle()}
        className="react-flow__edge-path"
        d={edgePath}
      />
      {data?.type === 'dataFlow' && (
        <text>
          <textPath href={`#${id}`} style={{ fontSize: '10px', fill: '#666' }} startOffset="50%" textAnchor="middle">
            data
          </textPath>
        </text>
      )}
    </>
  );
};

export default React.memo(FlowEdge); 