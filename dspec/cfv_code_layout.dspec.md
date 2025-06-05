code cfv_code.LayoutService_LayoutNodes {
    title: "Main Layout Service Function (ELK.js)"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/LayoutServiceLogic.ts",
        entry_point_name: "layoutNodesWithELK",
        entry_point_type: "async_function"
    }
    signature: "(params: { nodes: cfv_models.ReactFlowNode[], edges: cfv_models.ReactFlowEdge[], options?: cfv_models.LayoutOptions, elkInstance: any }) => Promise<{ nodes: cfv_models.ReactFlowNode[]; edges: cfv_models.ReactFlowEdge[] }>"
    detailed_behavior: `
        // Human Review Focus: ELK options construction, graph conversion, error handling.
        // AI Agent Target: Generate ELK layout function.

        DECLARE nodes = params.nodes
        DECLARE edges = params.edges
        DECLARE options = params.options
        DECLARE elkInstance = params.elkInstance

        IF nodes.length IS_ZERO THEN
            RETURN_VALUE { nodes: nodes, edges: edges }
        END_IF

        // 1. Determine ELK options
        DECLARE presets = CALL cfv_code.LayoutService_GetLayoutPresets
        DECLARE defaultPreset = presets.flowDetail // Default to flowDetail preset

        IF options.algorithm EQUALS "layered" AND options.direction EQUALS "DOWN" AND (nodes.length > 7 OR options.squareLayout?.enabled) THEN
             ASSIGN defaultPreset = presets.flowDetailSquare
        ELSE_IF options.algorithm EQUALS "layered" AND options.direction EQUALS "RIGHT" AND nodes.length > 7 THEN
             // If it's a long flow but not square, use default flowDetail but adaptive spacing will kick in.
             // No specific preset change here, adaptive spacing handles it.
        END_IF


        DECLARE baseSpacing AS cfv_models.LayoutSpacing
        IF options.spacing IS_PRESENT THEN
            ASSIGN baseSpacing = options.spacing
        ELSE
            ASSIGN baseSpacing = defaultPreset.spacing
        END_IF

        DECLARE adaptiveSpacing = CALL cfv_code.LayoutService_CalculateAdaptiveSpacingWithWidthCompensation WITH { nodes: nodes, baseSpacing: baseSpacing }

        DECLARE elkLayoutOptions = {
            'elk.algorithm': options.algorithm OR defaultPreset.algorithm OR 'layered',
            'elk.direction': options.direction OR defaultPreset.direction OR 'RIGHT',
            'elk.spacing.nodeNode': adaptiveSpacing.nodeNode.toString(),
            'elk.layered.spacing.nodeNodeBetweenLayers': adaptiveSpacing.layerSpacing.toString(), // ELK uses this for layer spacing in 'layered'
            'elk.spacing.edgeNode': adaptiveSpacing.edgeNode.toString(),
            'elk.spacing.edgeEdge': adaptiveSpacing.edgeEdge.toString(), // Added for completeness
            'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
             // Add more ELK options from cfv_internal_code.LayoutServiceEnhancedSpacing.enhanced_fork_handling if relevant
            'elk.layered.compaction.postCompaction.strategy': 'NONE',
            'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
            'elk.layered.spacing.inLayerSpacingFactor': '9.0', // For fork handling
            'elk.layered.spacing.edgeNodeBetweenLayers': (CALL Math.max WITH { values: [(adaptiveSpacing.edgeNode OR 20) * 2, 40]}).toString(),
        }

        IF options.elkSpecificOptions IS_PRESENT THEN
            ASSIGN elkLayoutOptions = { ...elkLayoutOptions, ...options.elkSpecificOptions }
        END_IF

        // 2. Convert React Flow nodes/edges to ELK graph format
        CALL cfv_code.LayoutService_ConvertToElkGraph WITH { nodes: nodes, edges: edges, elkOptions: elkLayoutOptions, nodeSizeOptions: options.nodeSize OR defaultPreset.nodeSize } ASSIGN_TO elkGraphInput

        // 3. Run ELK layout
        DECLARE layoutedElkGraph
        TRY
            CALL AbstractELKEngine.layout WITH { elkInstance: elkInstance, elkGraphInput: elkGraphInput } ASSIGN_TO layoutedElkGraph
        CATCH_ERROR e
            CALL AbstractLogger.logError WITH { message: "ELK layout failed: " + e.message + ". Input graph: " + JSON.stringify(elkGraphInput) }
            RETURN_VALUE { nodes: nodes, edges: edges } // Fallback
        END_TRY

        // 4. Convert layouted ELK graph back to React Flow format
        CALL cfv_code.LayoutService_ConvertFromElkGraph WITH { layoutedElkGraph: layoutedElkGraph, originalNodes: nodes, originalEdges: edges } ASSIGN_TO result

        RETURN_VALUE result
    `
    dependencies: [
        "cfv_models.ReactFlowNode",
        "cfv_models.ReactFlowEdge",
        "cfv_models.LayoutOptions",
        "AbstractELKEngine.layout",
        "cfv_code.LayoutService_GetLayoutPresets",
        "cfv_code.LayoutService_CalculateAdaptiveSpacingWithWidthCompensation",
        "cfv_code.LayoutService_ConvertToElkGraph",
        "cfv_code.LayoutService_ConvertFromElkGraph",
        "AbstractLogger.logError",
        "JSON.stringify",
        "Math.max"
    ]
}

code cfv_code.LayoutService_CalculateNodeSizeWithStyling {
    title: "Calculate Node Size with Styling Considerations"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/LayoutServiceLogic.ts",
        entry_point_name: "calculateNodeSizeWithStyling",
        entry_point_type: "function"
    }
    signature: "(params: { node: cfv_models.ReactFlowNode, sizeOptions: cfv_models.NodeSizeOptions }) => { width: number; height: number; style: object }"
    detailed_behavior: `
        DECLARE node = params.node
        DECLARE sizeOptions = params.sizeOptions

        DECLARE baseWidth = sizeOptions.width OR 200
        DECLARE baseHeight = sizeOptions.height OR 80
        DECLARE padding
        IF sizeOptions.padding IS_PRESENT THEN ASSIGN padding = sizeOptions.padding ELSE ASSIGN padding = { top: 12, right: 16, bottom: 12, left: 16 } END_IF // Default from preset

        DECLARE finalWidth = baseWidth
        DECLARE finalHeight = baseHeight

        IF sizeOptions.calculateFromContent AND node.data.label IS_PRESENT THEN
            // Simplified text width calculation for DSpec. Real implementation might use canvas measureText.
            DECLARE textLength = node.data.label.length
            DECLARE estimatedTextWidth = (textLength * 8) + padding.left + padding.right // Approx 8px per char
            ASSIGN finalWidth = CALL Math.max WITH { values: [baseWidth, estimatedTextWidth] }

            // Height adjustments based on content
            DECLARE contentHeight = 20 // For label line
            IF node.data.resolvedComponentFqn THEN ASSIGN contentHeight = contentHeight + 18 END_IF
            IF node.data.executionStatus THEN ASSIGN contentHeight = contentHeight + 18 END_IF
            IF node.data.error THEN ASSIGN contentHeight = contentHeight + 18 END_IF
            IF node.type EQUALS "subFlowInvokerNode" AND node.data.invokedFlowFqn AND node.data.invokedFlowFqn !== "unknown" THEN ASSIGN contentHeight = contentHeight + 25 END_IF // From SubFlowInvokerNodeStyling

            ASSIGN finalHeight = CALL Math.max WITH { values: [baseHeight, contentHeight + padding.top + padding.bottom] }
        END_IF

        DECLARE minW = sizeOptions.minWidth OR 150
        DECLARE maxW = sizeOptions.maxWidth OR 300 // Adjusted from 280 to allow wider nodes for subflows
        DECLARE minH = sizeOptions.minHeight OR 60
        DECLARE maxH = sizeOptions.maxHeight OR 150 // Adjusted for SubFlowInvoker

        ASSIGN finalWidth = CALL Math.min WITH { values: [maxW, (CALL Math.max WITH { values: [minW, finalWidth] })] }
        ASSIGN finalHeight = CALL Math.min WITH { values: [maxH, (CALL Math.max WITH { values: [minH, finalHeight] })] }

        DECLARE nodeStyle = {
            width: finalWidth,
            height: finalHeight,
            padding: padding.top + "px " + padding.right + "px " + padding.bottom + "px " + padding.left + "px",
            boxSizing: "border-box",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center"
        }
        RETURN_VALUE { width: finalWidth, height: finalHeight, style: nodeStyle }
    `
    dependencies: ["cfv_models.ReactFlowNode", "cfv_models.NodeSizeOptions", "Math.max", "Math.min"]
}

code cfv_code.LayoutService_GetLayoutPresets {
    title: "Get Predefined Layout Presets with Square Layout Support"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/LayoutServiceLogic.ts",
        entry_point_name: "getLayoutPresets",
        entry_point_type: "function"
    }
    signature: "() => Record<string, cfv_models.LayoutOptions>"
    detailed_behavior: `
        // Based on cfv_internal_code.LayoutService_LayoutPresets
        DECLARE layoutPresets = {
            flowDetail: {
                algorithm: "layered",
                direction: "RIGHT",
                spacing: { nodeNode: 80, edgeNode: 20, layerSpacing: 100, edgeEdge: 10 }, // layerSpacing adjusted
                nodeSize: { calculateFromContent: true, minWidth: 180, maxWidth: 280, minHeight: 70, maxHeight: 120, padding: { top: 12, right: 16, bottom: 12, left: 16 } }
            },
            flowDetailSquare: { // For grid-like layout of long flows
                algorithm: "layered",
                direction: "DOWN", // Top-to-bottom for square arrangement
                spacing: { nodeNode: 100, edgeNode: 30, layerSpacing: 140, edgeEdge: 15 },
                nodeSize: { calculateFromContent: true, minWidth: 160, maxWidth: 240, minHeight: 60, maxHeight: 100, padding: { top: 10, right: 14, bottom: 10, left: 14 } },
                squareLayout: { enabled: true, maxNodesPerLayer: 5 } // Custom property interpreted by layoutNodes
            },
            systemOverview: {
                algorithm: "layered",
                direction: "RIGHT",
                spacing: { nodeNode: 100, edgeNode: 30, layerSpacing: 150, edgeEdge: 15 },
                nodeSize: { calculateFromContent: true, minWidth: 200, maxWidth: 300, minHeight: 80, maxHeight: 130, padding: { top: 16, right: 20, bottom: 16, left: 20 } }
            }
            // Other presets can be added here (e.g., compact)
        }
        RETURN_VALUE layoutPresets
    `
    dependencies: ["cfv_models.LayoutOptions"]
}

code cfv_code.LayoutService_CalculateAdaptiveSpacingWithWidthCompensation {
    title: "Calculate Adaptive Spacing with Width Compensation"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/LayoutServiceLogic.ts",
        entry_point_name: "calculateAdaptiveSpacingWithWidthCompensation",
        entry_point_type: "function"
    }
    signature: "(params: { nodes: cfv_models.ReactFlowNode[], baseSpacing: cfv_models.LayoutSpacing }) => cfv_models.LayoutSpacing"
    detailed_behavior: `
        // Merged logic from cfv_internal_code.LayoutServiceWidthCompensation and enhanced spacing.
        DECLARE nodes = params.nodes
        DECLARE baseSpacing = params.baseSpacing

        IF nodes.length EQUALS 0 THEN
            RETURN_VALUE baseSpacing
        END_IF

        // 1. Calculate max node width (actual calculation might involve calling calculateNodeSizeWithStyling for each node)
        DECLARE maxWidth = 150 // Default assumption
        DECLARE hasSubFlowNodes = false
        FOR_EACH node IN nodes
            // Simplified: assume node.width is pre-calculated or use a fixed estimate for this DSpec
            DECLARE currentWidth = node.width OR (node.data.label.length * 8 + 32) // Rough estimate
            IF currentWidth > maxWidth THEN ASSIGN maxWidth = currentWidth END_IF
            IF node.type EQUALS "subFlowInvokerNode" THEN ASSIGN hasSubFlowNodes = true END_IF
        END_FOR

        // 2. Calculate width compensation factors (from LayoutServiceWidthCompensation)
        DECLARE standardWidth = 200 // Standard reference width for comparison
        DECLARE widthOverflow = CALL Math.max WITH { values: [0, maxWidth - standardWidth] }
        DECLARE widthCompensationFactor = widthOverflow * 0.7 // 70% of overflow as compensation
        DECLARE bufferSpace = 25 // Additional buffer

        // Ensure compensatedLayerSpacing does not shrink excessively if baseSpacing.layerSpacing is large
        DECLARE compensatedLayerSpacing = (baseSpacing.layerSpacing OR 100) + widthCompensationFactor + bufferSpace

        // 3. Apply adaptive spacing (from EnhancedLayoutService & cfv_internal_code.LayoutServiceEnhancedSpacing)
        DECLARE nodeCount = nodes.length
        DECLARE isLongFlow = nodeCount > 7

        DECLARE finalNodeNodeSpacing, finalEdgeNodeSpacing, finalEdgeEdgeSpacing, finalLayerSpacing

        IF isLongFlow THEN // Reduced spacing for long flows
            ASSIGN finalNodeNodeSpacing = CALL Math.round WITH { value: (baseSpacing.nodeNode OR 80) * 0.5 } // 50%
            ASSIGN finalEdgeNodeSpacing = CALL Math.round WITH { value: (baseSpacing.edgeNode OR 20) * 0.5 }
            ASSIGN finalEdgeEdgeSpacing = CALL Math.round WITH { value: (baseSpacing.edgeEdge OR 10) * 0.4 }
            ASSIGN finalLayerSpacing = CALL Math.round WITH { value: (baseSpacing.layerSpacing OR 100) * 0.5 }
        ELSE
            ASSIGN finalNodeNodeSpacing = baseSpacing.nodeNode OR 80
            ASSIGN finalEdgeNodeSpacing = baseSpacing.edgeNode OR 20
            ASSIGN finalEdgeEdgeSpacing = baseSpacing.edgeEdge OR 10
            ASSIGN finalLayerSpacing = baseSpacing.layerSpacing OR 100
        END_IF

        // Apply width compensation specifically to layer spacing
        ASSIGN finalLayerSpacing = CALL Math.max WITH { values: [finalLayerSpacing, compensatedLayerSpacing] }


        DECLARE adaptiveSpacing AS cfv_models.LayoutSpacing
        CREATE_INSTANCE cfv_models.LayoutSpacing WITH {
            nodeNode: finalNodeNodeSpacing,
            edgeNode: finalEdgeNodeSpacing,
            edgeEdge: finalEdgeEdgeSpacing,
            layerSpacing: finalLayerSpacing
        } ASSIGN_TO adaptiveSpacing

        CALL AbstractLogger.logInfo WITH { message: "LayoutService: Adaptive spacing calculated. MaxWidth: " + maxWidth + ", Overflow: " + widthOverflow + ", Compensation: " + widthCompensationFactor + ", Final Spacing: " + JSON.stringify(adaptiveSpacing) }

        RETURN_VALUE adaptiveSpacing
    `
    dependencies: [
        "cfv_models.ReactFlowNode",
        "cfv_models.LayoutSpacing",
        "Math.max", "Math.round",
        "AbstractLogger.logInfo",
        "JSON.stringify"
    ]
}

code cfv_code.LayoutService_ConvertToElkGraph {
    title: "Convert React Flow Graph to ELK Graph Format"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/LayoutServiceLogic.ts",
        entry_point_name: "convertToElkGraph",
        entry_point_type: "function"
    }
    signature: "(params: { nodes: cfv_models.ReactFlowNode[], edges: cfv_models.ReactFlowEdge[], elkOptions: any, nodeSizeOptions?: cfv_models.NodeSizeOptions }) => any" // ELK graph type is 'any' for simplicity
    detailed_behavior: `
        // Human Review Focus: Correct mapping of node/edge properties to ELK structure.
        // AI Agent Target: Generate ELK graph conversion logic.

        DECLARE elkNodes = []
        FOR_EACH rfNode IN params.nodes
            // Calculate node size
            DECLARE nodeDimensions
            IF params.nodeSizeOptions.calculateFromContent THEN
                 CALL cfv_code.LayoutService_CalculateNodeSizeWithStyling WITH { node: rfNode, sizeOptions: params.nodeSizeOptions } ASSIGN_TO nodeDimensions
            ELSE
                 ASSIGN nodeDimensions = { width: params.nodeSizeOptions.width OR 150, height: params.nodeSizeOptions.height OR 50 }
            END_IF

            ADD {
                id: rfNode.id,
                width: nodeDimensions.width,
                height: nodeDimensions.height,
                labels: [{ text: rfNode.data.label }], // ELK uses labels array
                // Add other properties ELK might need, e.g., portConstraints
            } TO elkNodes
        END_FOR

        DECLARE elkEdges = []
        FOR_EACH rfEdge IN params.edges
            ADD {
                id: rfEdge.id,
                sources: [rfEdge.source], // ELK expects arrays
                targets: [rfEdge.target]
                // Add sourceHandle/targetHandle if relevant for ELK port mapping
            } TO elkEdges
        END_FOR

        DECLARE elkGraph = {
            id: "root",
            layoutOptions: params.elkOptions,
            children: elkNodes,
            edges: elkEdges
        }
        RETURN_VALUE elkGraph
    `
    dependencies: [
        "cfv_models.ReactFlowNode",
        "cfv_models.ReactFlowEdge",
        "cfv_models.NodeSizeOptions",
        "cfv_code.LayoutService_CalculateNodeSizeWithStyling"
    ]
}

code cfv_code.LayoutService_ConvertFromElkGraph {
    title: "Convert ELK Graph Layout Result to React Flow Format"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/LayoutServiceLogic.ts",
        entry_point_name: "convertFromElkGraph",
        entry_point_type: "function"
    }
    signature: "(params: { layoutedElkGraph: any, originalNodes: cfv_models.ReactFlowNode[], originalEdges: cfv_models.ReactFlowEdge[] }) => { nodes: cfv_models.ReactFlowNode[]; edges: cfv_models.ReactFlowEdge[] }"
    detailed_behavior: `
        // Human Review Focus: Correctly applying x, y positions and potentially edge points.
        // AI Agent Target: Generate React Flow graph conversion logic.

        DECLARE layoutedElkGraph = params.layoutedElkGraph
        DECLARE finalNodes AS List<cfv_models.ReactFlowNode> = []

        FOR_EACH originalNode IN params.originalNodes
            DECLARE elkNode = layoutedElkGraph.children.find(n => n.id === originalNode.id)
            IF elkNode IS_PRESENT THEN
                ADD {
                    ...originalNode,
                    position: { x: elkNode.x, y: elkNode.y },
                    width: elkNode.width, // Update width/height if ELK changed them
                    height: elkNode.height
                } TO finalNodes
            ELSE
                ADD originalNode TO finalNodes // Keep original if ELK didn't process it (should not happen)
            END_IF
        END_FOR

        // Edges might have points for routing, but basic conversion just returns original edges
        // as ELK positions nodes, React Flow handles edge rendering based on node positions.
        // If ELK provides edge path points, they can be mapped to React Flow edge's 'points' or similar.
        // For now, assume originalEdges are sufficient if node positions are updated.

        RETURN_VALUE { nodes: finalNodes, edges: params.originalEdges }
    `
    dependencies: ["cfv_models.ReactFlowNode", "cfv_models.ReactFlowEdge"]
}