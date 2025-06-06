// Base Node Component with Dynamic Width Logic
// Abstract component that accepts width configuration from specific node types

import React, { ReactNode } from 'react';

export interface DynamicWidthConfig {
  baseWidth: number;
  maxWidth: number;
  scalingFactor: number;
  contentThreshold: number;
}

export interface BaseNodeProps {
  label: string;
  fqn?: string;
  selected?: boolean;
  executionStatus?: string;
  children?: ReactNode;
  widthConfig: DynamicWidthConfig;
  additionalContent?: string[]; // Additional content to consider for width calculation
  customStyle?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Calculate dynamic width based on content length and configuration
 */
export function calculateDynamicWidth(
  widthConfig: DynamicWidthConfig,
  label: string,
  fqn?: string,
  additionalContent?: string[]
): number {
  // Calculate content lengths
  const labelLength = label?.length || 0;
  const fqnLength = fqn?.length || 0;
  const additionalContentLength = additionalContent?.reduce((max, content) => 
    Math.max(max, content?.length || 0), 0) || 0;
  
  // Find the maximum content length
  const maxContentLength = Math.max(labelLength, fqnLength, additionalContentLength);
  
  // Calculate dynamic width
  let dynamicWidth = widthConfig.baseWidth;
  if (maxContentLength > widthConfig.contentThreshold) {
    dynamicWidth = Math.min(
      widthConfig.maxWidth, 
      widthConfig.baseWidth + (maxContentLength - widthConfig.contentThreshold) * widthConfig.scalingFactor
    );
  }
  
  return dynamicWidth;
}

/**
 * Get base node styles with dynamic width
 */
export function getBaseNodeStyle(
  widthConfig: DynamicWidthConfig,
  label: string,
  fqn?: string,
  additionalContent?: string[],
  selected?: boolean,
  executionStatus?: string,
  customStyle?: React.CSSProperties
): React.CSSProperties {
  const dynamicWidth = calculateDynamicWidth(widthConfig, label, fqn, additionalContent);
  
  const baseStyle: React.CSSProperties = {
    padding: executionStatus ? '24px 28px 14px 28px' : '14px 18px',
    borderRadius: '8px',
    width: `${dynamicWidth}px`,
    height: 'auto',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    overflow: 'visible',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    ...customStyle
  };

  return baseStyle;
}

/**
 * Get execution status colors
 */
export function getStatusColors(status?: string) {
  switch (status) {
    case 'SUCCESS': 
      return {
        color: '#10B981',
        backgroundColor: '#FAFFFE',
        borderColor: '#E6FFFA'
      };
    case 'FAILURE': 
      return {
        color: '#EF4444',
        backgroundColor: '#FFFAFA',
        borderColor: '#FFE6E6'
      };
    case 'RUNNING': 
      return {
        color: '#F59E0B',
        backgroundColor: '#FFFEF9',
        borderColor: '#FFF4E6'
      };
    case 'SKIPPED': 
      return {
        color: '#6B7280',
        backgroundColor: '#FAFAFA',
        borderColor: '#F0F0F0'
      };
    default: 
      return {
        color: '#3B82F6',
        backgroundColor: '#FFFFFF',
        borderColor: 'transparent'
      };
  }
}

/**
 * Get compact status indicator style
 */
export function getCompactStatusStyle(
  status?: string,
  isHovered?: boolean
): React.CSSProperties {
  const colors = getStatusColors(status);
  
  return {
    position: 'absolute',
    top: '4px',
    left: '4px',
    fontSize: '8px',
    color: colors.color,
    backgroundColor: `${colors.color}10`,
    border: `1px solid ${colors.color}20`,
    padding: '2px 4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    cursor: 'default',
    zIndex: 10,
    maxWidth: isHovered ? '120px' : '40px',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  };
}

/**
 * Get status icon
 */
export function getStatusIcon(status?: string): string {
  switch (status) {
    case 'SUCCESS':
    case 'FAILURE':
    case 'RUNNING':
      return '●';
    case 'SKIPPED':
      return '○';
    default:
      return '○';
  }
}

/**
 * Base Node Component - Abstract component for all node types
 */
const BaseNode: React.FC<BaseNodeProps> = ({
  label,
  fqn,
  selected,
  executionStatus,
  children,
  widthConfig,
  additionalContent,
  customStyle,
  onClick
}) => {
  const [isStatusHovered, setIsStatusHovered] = React.useState(false);
  
  const nodeStyle = getBaseNodeStyle(
    widthConfig,
    label,
    fqn,
    additionalContent,
    selected,
    executionStatus,
    customStyle
  );
  
  const statusColors = getStatusColors(executionStatus);
  const finalStyle = {
    ...nodeStyle,
    backgroundColor: customStyle?.backgroundColor || statusColors.backgroundColor,
    border: `1px solid ${statusColors.borderColor}`,
    cursor: onClick ? 'pointer' : 'default'
  };

  return (
    <div style={finalStyle} onClick={onClick}>
      {/* Compact status indicator */}
      {executionStatus && (
        <div 
          style={getCompactStatusStyle(executionStatus, isStatusHovered)}
          onMouseEnter={() => setIsStatusHovered(true)}
          onMouseLeave={() => setIsStatusHovered(false)}
        >
          <span>{getStatusIcon(executionStatus)}</span>
          {isStatusHovered && (
            <span style={{ marginLeft: '4px', fontSize: '7px' }}>
              {executionStatus.toLowerCase()}
            </span>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
};

export default BaseNode; 