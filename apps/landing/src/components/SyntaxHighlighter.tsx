import React, { useEffect } from 'react';
import hljs from 'highlight.js/lib/core';
import yaml from 'highlight.js/lib/languages/yaml';
import 'highlight.js/styles/github-dark.css';

// Custom Cascade Flow language definition
const cascadeFlow = function(hljs: any) {
  return {
    name: 'cascade-flow',
    case_insensitive: false,
    contains: [
      // Template variables (must come first to have priority)
      {
        className: 'cascade-template-var',
        begin: /\{\{[^}]+\}\}/
      },
      // Step ID key (high priority to override default YAML attr)
      {
        className: 'cascade-step-id',
        begin: /^(\s*)(step_id)(\s*:)/m,
        beginScope: {
          2: 'cascade-step-id'
        }
      },
      // Specific step type values
      {
        className: 'cascade-step-type',
        begin: /(Integration\.ExternalServiceAdapter|Billing\.ProcessPayment|Communication\.SendEmail|StdLib\.Trigger:Http)/
      },
      // Flow structure keywords (only trigger and steps)
      {
        className: 'cascade-flow-structure',
        begin: /^(\s*)(trigger|steps)(\s*:)/,
        beginScope: {
          2: 'cascade-flow-structure'
        }
      },
      // YAML strings
      {
        className: 'string',
        variants: [
          { begin: /"/, end: /"/ },
          { begin: /'/, end: /'/ }
        ]
      },
      // YAML numbers
      {
        className: 'number',
        begin: /\b\d+(\.\d+)?\b/
      },
      // YAML keys
      {
        className: 'attr',
        begin: /^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/,
        end: /:/,
        excludeEnd: true
      },
      // Comments
      {
        className: 'comment',
        begin: /#/,
        end: /$/
      }
    ]
  };
};

// Custom CSS styles for Cascade flow highlighting
const cascadeFlowStyles = `
  .hljs-cascade-step-type {
    color: #A78BFA !important;
    font-weight: 600;
  }
  .hljs-cascade-step-id {
    color: #F59E0B !important;
    font-weight: 600;
  }
  .hljs-cascade-template-var {
    color: #22D3EE !important;
    font-weight: 500;
  }
  .hljs-cascade-flow-structure {
    color: #10B981 !important;
    font-weight: 600;
  }
`;

// Initialize highlight.js with languages
let isInitialized = false;

const initializeHighlightJS = () => {
  if (!isInitialized) {
    hljs.registerLanguage('yaml', yaml);
    hljs.registerLanguage('cascade-flow', cascadeFlow);
    isInitialized = true;
  }
};

interface SyntaxHighlighterProps {
  children: React.ReactNode;
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({ children }) => {
  useEffect(() => {
    // Initialize highlight.js languages
    initializeHighlightJS();

    // Add custom CSS styles for Cascade flow highlighting
    const styleId = 'cascade-flow-styles';
    let style = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      style.textContent = cascadeFlowStyles;
      document.head.appendChild(style);
    }

    // Highlight all code blocks on component mount and updates
    hljs.highlightAll();

    return () => {
      // Cleanup: remove styles when component unmounts
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  return <>{children}</>;
};

// Export utility functions for manual highlighting if needed
export const highlightCode = (code: string, language: string): string => {
  initializeHighlightJS();
  try {
    return hljs.highlight(code, { language }).value;
  } catch (error) {
    console.warn('Failed to highlight code:', error);
    return code;
  }
};

export const highlightElement = (element: HTMLElement): void => {
  initializeHighlightJS();
  hljs.highlightElement(element);
}; 