// System Edge Component
// Used in system overview for connections between flows and triggers

import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { SystemEdgeData } from '@/models/cfv_models_generated';

const SystemEdge: React.FC<EdgeProps<SystemEdgeData>> = ({
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
      strokeWidth: selected ? 4 : 3,
    };

    if (data?.type === 'invocationEdge') {
      return {
        ...baseStyle,
        stroke: '#FF9800',
        strokeDasharray: '8,4'
      };
    } else if (data?.type === 'triggerLinkEdge') {
      return {
        ...baseStyle,
        stroke: '#4CAF50',
      };
    } else {
      return {
        ...baseStyle,
        stroke: '#666',
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
      {data?.type === 'invocationEdge' && (
        <text>
          <textPath href={`#${id}`} style={{ fontSize: '11px', fill: '#E65100', fontWeight: 'bold' }} startOffset="50%" textAnchor="middle">
            invokes
          </textPath>
        </text>
      )}
      {data?.type === 'triggerLinkEdge' && (
        <text>
          <textPath href={`#${id}`} style={{ fontSize: '10px', fill: '#2E7D32' }} startOffset="50%" textAnchor="middle">
            triggers
          </textPath>
        </text>
      )}
    </>
  );
};

export default React.memo(SystemEdge); 