<script>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";

// Throttle function for performance
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export default {
  name: "App",
  setup() {
    const zoom = ref(1);
    const selectedNode = ref(null);
    const isDragging = ref(false);
    const dragOffset = reactive({ x: 0, y: 0 });

    const availableComponents = ref([
      { id: "start", name: "Start", icon: "▶️", type: "start" },
      { id: "process", name: "Process", icon: "⚙️", type: "process" },
      { id: "decision", name: "Decision", icon: "❓", type: "decision" },
      { id: "action", name: "Action", icon: "🔧", type: "action" },
      { id: "end", name: "End", icon: "⏹️", type: "end" },
      { id: "data", name: "Data", icon: "📊", type: "data" },
    ]);

    const workflowNodes = ref([]);
    const connections = ref([]);
    const nextNodeId = ref(1);

    const onDragStart = (event, component) => {
      event.dataTransfer.setData("application/json", JSON.stringify(component));
    };

    const onDragOver = (event) => {
      event.preventDefault();
    };

    const onDrop = (event) => {
      event.preventDefault();
      const componentData = JSON.parse(
        event.dataTransfer.getData("application/json")
      );
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoom.value;
      const y = (event.clientY - rect.top) / zoom.value;

      addNode(componentData, x, y);
    };

    const addNode = (componentData, x, y) => {
      const newNode = {
        id: `node-${nextNodeId.value++}`,
        name: componentData.name,
        icon: componentData.icon,
        type: componentData.type,
        x: x - 75, // Center the node
        y: y - 50,
      };

      workflowNodes.value.push(newNode);

      // Connect to previous node if exists
      if (workflowNodes.value.length > 1) {
        const prevNode = workflowNodes.value[workflowNodes.value.length - 2];
        addConnectionBetweenNodes(prevNode.id, newNode.id);
      }
    };

    const addConnectionBetweenNodes = (fromId, toId) => {
      const fromNode = workflowNodes.value.find((n) => n.id === fromId);
      const toNode = workflowNodes.value.find((n) => n.id === toId);

      if (fromNode && toNode) {
        const connection = {
          from: fromId,
          to: toId,
          x1: fromNode.x + 150,
          y1: fromNode.y + 50,
          x2: toNode.x,
          y2: toNode.y + 50,
        };
        connections.value.push(connection);
      }
    };

    const selectNode = (nodeId) => {
      selectedNode.value = nodeId;
    };

    const deselectAll = () => {
      selectedNode.value = null;
    };

    const startDrag = (event, node) => {
      // Only start drag on left mouse button
      if (event.button !== 0) return;

      event.preventDefault();
      isDragging.value = true;
      selectedNode.value = node.id;

      const rect = event.currentTarget.getBoundingClientRect();
      dragOffset.x = event.clientX - rect.left;
      dragOffset.y = event.clientY - rect.top;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (event) => {
      if (!isDragging.value) return;

      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        const canvas = document.querySelector(".canvas-container");
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - dragOffset.x) / zoom.value;
        const y = (event.clientY - rect.top - dragOffset.y) / zoom.value;

        const selectedNodeData = workflowNodes.value.find(
          (n) => n.id === selectedNode.value
        );
        if (selectedNodeData) {
          selectedNodeData.x = x;
          selectedNodeData.y = y;
          // Use throttled connection update for smooth performance
          throttledUpdateConnections();
        }
      });
    };

    const onMouseUp = () => {
      if (isDragging.value) {
        // Update connections when dragging ends
        updateConnections();
        // Add a small delay to restore smooth transitions
        setTimeout(() => {
          const draggedNode = document.querySelector(".workflow-node.dragging");
          if (draggedNode) {
            draggedNode.style.transition = "all 0.2s ease";
          }
        }, 50);
      }
      isDragging.value = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    const updateConnections = () => {
      connections.value.forEach((connection) => {
        const fromNode = workflowNodes.value.find(
          (n) => n.id === connection.from
        );
        const toNode = workflowNodes.value.find((n) => n.id === connection.to);

        if (fromNode && toNode) {
          // Connect from the right edge of the source node to the left edge of the target node
          connection.x1 = fromNode.x + 150; // Right edge of source node
          connection.y1 = fromNode.y + 50; // Middle of source node
          connection.x2 = toNode.x; // Left edge of target node
          connection.y2 = toNode.y + 50; // Middle of target node
        }
      });
    };

    // Throttled version for smooth dragging
    const throttledUpdateConnections = throttle(updateConnections, 16); // ~60fps

    const deleteNode = (nodeId) => {
      workflowNodes.value = workflowNodes.value.filter((n) => n.id !== nodeId);
      connections.value = connections.value.filter(
        (c) => c.from !== nodeId && c.to !== nodeId
      );
      if (selectedNode.value === nodeId) {
        selectedNode.value = null;
      }
    };

    const zoomIn = () => {
      zoom.value = Math.min(zoom.value + 0.1, 2);
    };

    const zoomOut = () => {
      zoom.value = Math.max(zoom.value - 0.1, 0.5);
    };

    const resetZoom = () => {
      zoom.value = 1;
    };

    const saveWorkflow = () => {
      const workflow = {
        nodes: workflowNodes.value,
        connections: connections.value,
      };
      localStorage.setItem("workflow", JSON.stringify(workflow));
      alert("Workflow saved!");
    };

    const loadWorkflow = () => {
      const saved = localStorage.getItem("workflow");
      if (saved) {
        const workflow = JSON.parse(saved);
        workflowNodes.value = workflow.nodes;
        connections.value = workflow.connections;
        nextNodeId.value =
          Math.max(...workflow.nodes.map((n) => parseInt(n.id.split("-")[1]))) +
          1;
      }
    };

    const clearWorkflow = () => {
      if (confirm("Are you sure you want to clear the workflow?")) {
        workflowNodes.value = [];
        connections.value = [];
        selectedNode.value = null;
        nextNodeId.value = 1;
      }
    };

    const exportWorkflow = () => {
      const workflow = {
        nodes: workflowNodes.value,
        connections: connections.value,
      };
      const dataStr = JSON.stringify(workflow, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "workflow.json";
      link.click();
      URL.revokeObjectURL(url);
    };

    const addConnection = (nodeId, type) => {
      // This function can be extended to handle manual connection creation
      console.log(`Adding ${type} connection to node ${nodeId}`);
    };

    onUnmounted(() => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    });

    return {
      zoom,
      selectedNode,
      isDragging,
      availableComponents,
      workflowNodes,
      connections,
      onDragStart,
      onDragOver,
      onDrop,
      selectNode,
      deselectAll,
      startDrag,
      deleteNode,
      zoomIn,
      zoomOut,
      resetZoom,
      saveWorkflow,
      loadWorkflow,
      clearWorkflow,
      exportWorkflow,
      throttledUpdateConnections,
    };
  },
};
</script>

<template>
  <div id="app">
    <!-- Top Menu -->
    <header class="top-menu">
      <div class="menu-content">
        <h1 class="logo">Workflow Builder</h1>
        <nav class="menu-items">
          <button class="menu-btn" @click="saveWorkflow">Save</button>
          <button class="menu-btn" @click="loadWorkflow">Load</button>
          <button class="menu-btn" @click="clearWorkflow">Clear</button>
          <button class="menu-btn" @click="exportWorkflow">Export</button>
        </nav>
      </div>
    </header>

    <!-- Main Container -->
    <div class="main-container">
      <!-- Left Component List -->
      <aside class="component-list">
        <h3>Components</h3>
        <div class="component-items">
          <div
            v-for="component in availableComponents"
            :key="component.id"
            class="component-item"
            draggable="true"
            @dragstart="onDragStart($event, component)"
          >
            <div class="component-icon">{{ component.icon }}</div>
            <span class="component-name">{{ component.name }}</span>
          </div>
        </div>
      </aside>

      <!-- Main Workspace -->
      <main class="workspace">
        <div class="workspace-header">
          <h2>Workflow Canvas</h2>
          <div class="workspace-controls">
            <button class="control-btn" @click="zoomIn">+</button>
            <button class="control-btn" @click="zoomOut">-</button>
            <button class="control-btn" @click="resetZoom">Reset</button>
          </div>
        </div>

        <div
          class="canvas-container"
          @dragover="onDragOver"
          @drop="onDrop"
          @click="deselectAll"
        >
          <svg
            class="connection-lines"
            :style="{ transform: `scale(${zoom})` }"
          >
            <line
              v-for="connection in connections"
              :key="`${connection.from}-${connection.to}`"
              :x1="connection.x1"
              :y1="connection.y1"
              :x2="connection.x2"
              :y2="connection.y2"
              stroke="#666"
              stroke-width="2"
              marker-end="url(#arrowhead)"
            />
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
              </marker>
            </defs>
          </svg>

          <div
            v-for="node in workflowNodes"
            :key="node.id"
            class="workflow-node"
            :class="{
              selected: selectedNode === node.id,
              dragging: isDragging && selectedNode === node.id,
            }"
            :style="{
              left: `${node.x}px`,
              top: `${node.y}px`,
              transform: `scale(${zoom})`,
            }"
            @click.stop="selectNode(node.id)"
            @mousedown="startDrag($event, node)"
          >
            <div class="node-header">
              <span class="node-icon">{{ node.icon }}</span>
              <span class="node-title">{{ node.name }}</span>
              <button class="node-delete" @click.stop="deleteNode(node.id)">
                ×
              </button>
            </div>
            <div class="node-content">
              <div
                class="node-input"
                @click.stop="addConnection(node.id, 'input')"
              >
                Input
              </div>
              <div
                class="node-output"
                @click.stop="addConnection(node.id, 'output')"
              >
                Output
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.top-menu {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.menu-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.menu-items {
  display: flex;
  gap: 0.5rem;
}

.menu-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.component-list {
  width: 250px;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  padding: 1rem;
  overflow-y: auto;
}

.component-list h3 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.component-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.component-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.component-item:active {
  cursor: grabbing;
}

.component-icon {
  font-size: 1.2rem;
}

.component-name {
  font-weight: 500;
  color: #495057;
}

.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.workspace-header h2 {
  margin: 0;
  color: #495057;
}

.workspace-controls {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: auto;
  background: radial-gradient(circle at 20px 20px, #e9ecef 2px, transparent 2px),
    radial-gradient(circle at 40px 40px, #e9ecef 2px, transparent 2px);
  background-size: 40px 40px;
  cursor: default;
}

.connection-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.workflow-node {
  position: absolute;
  width: 150px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: move;
  transition: all 0.2s ease;
  z-index: 10;
  will-change: transform;
  transform: translateZ(0);
}

.workflow-node:hover {
  border-color: #667eea;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.2);
}

.workflow-node.selected {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
}

.workflow-node.dragging {
  border-color: #667eea;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  transform: scale(1.05) !important;
  z-index: 100;
  cursor: grabbing;
  transition: none !important;
  will-change: transform, left, top;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  border-radius: 10px 10px 0 0;
}

.node-icon {
  font-size: 1.2rem;
}

.node-title {
  flex: 1;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.node-delete {
  background: #dc3545;
  color: white;
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.node-delete:hover {
  background: #c82333;
  transform: scale(1.1);
}

.node-content {
  padding: 0.75rem;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.node-input,
.node-output {
  flex: 1;
  padding: 0.5rem;
  background: #e9ecef;
  border-radius: 6px;
  text-align: center;
  font-size: 0.8rem;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
}

.node-input:hover,
.node-output:hover {
  background: #667eea;
  color: white;
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }

  .component-list {
    width: 100%;
    height: 120px;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }

  .component-items {
    flex-direction: row;
    overflow-x: auto;
  }

  .component-item {
    min-width: 120px;
    flex-shrink: 0;
  }

  .menu-content {
    flex-direction: column;
    gap: 0.5rem;
  }

  .menu-items {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .workspace-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .workspace-controls {
    justify-content: center;
  }
}
</style>
