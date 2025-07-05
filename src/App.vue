<script>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import DynamicForm from "./components/DynamicForm.vue";
import {
  getAvailableComponents,
  getComponentByType,
  validateWorkflow,
  canAddComponent,
} from "./config/components.js";
import ComfyUIService from "./services/comfyui.js";

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
  components: {
    DynamicForm,
  },
  setup() {
    const zoom = ref(1);
    const selectedNode = ref(null);
    const isDragging = ref(false);
    const dragOffset = reactive({ x: 0, y: 0 });

    const availableComponents = ref(getAvailableComponents());

    const workflowNodes = ref([]);
    const connections = ref([]);
    const nextNodeId = ref(1);
    const comfyUIService = new ComfyUIService();
    const isComfyUIConnected = ref(false);
    const isExecuting = ref(false);
    const validationErrors = ref([]);
    const isDraggingFile = ref(false);

    // Mobile drag and drop support
    const isMobileDragActive = ref(false);
    const mobileDragData = ref(null);
    const mobileDragElement = ref(null);

    const hasImageUploaded = computed(() => {
      const uploadNode = workflowNodes.value.find((n) => n.type === "upload");
      return !!(uploadNode && uploadNode.formData && uploadNode.formData.image);
    });

    const onDragStart = (event, component) => {
      event.dataTransfer.setData("application/json", JSON.stringify(component));
    };

    // Mobile touch handlers
    const onTouchStart = (event, component) => {
      // Prevent default to avoid scrolling
      event.preventDefault();

      // Check if component is disabled
      if (
        (component.id === "repair" || component.id === "filter") &&
        !hasImageUploaded.value
      ) {
        return;
      }

      isMobileDragActive.value = true;
      mobileDragData.value = component;
      mobileDragElement.value = event.currentTarget;

      // Add visual feedback
      event.currentTarget.style.opacity = "0.5";
      event.currentTarget.style.transform = "scale(1.1)";

      // Add touch move and end listeners
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    };

    const onTouchMove = (event) => {
      if (!isMobileDragActive.value) return;

      // Prevent scrolling while dragging
      event.preventDefault();

      // Update drag element position for visual feedback
      if (mobileDragElement.value) {
        const touch = event.touches[0];
        mobileDragElement.value.style.position = "fixed";
        mobileDragElement.value.style.left = touch.clientX - 75 + "px";
        mobileDragElement.value.style.top = touch.clientY - 25 + "px";
        mobileDragElement.value.style.zIndex = "9999";
        mobileDragElement.value.style.pointerEvents = "none";
      }
    };

    const onTouchEnd = (event) => {
      if (!isMobileDragActive.value) return;

      // Find drop target
      const touch = event.changedTouches[0];
      const dropTarget = document.elementFromPoint(
        touch.clientX,
        touch.clientY
      );

      // Check if dropping on canvas
      const canvasContainer = dropTarget?.closest(".canvas-container");
      if (canvasContainer && mobileDragData.value) {
        const rect = canvasContainer.getBoundingClientRect();
        const x = (touch.clientX - rect.left) / zoom.value;
        const y = (touch.clientY - rect.top) / zoom.value;

        // Check if component can be added
        const validation = canAddComponent(
          mobileDragData.value.id,
          workflowNodes.value
        );
        if (!validation.allowed) {
          alert(
            `Cannot add ${mobileDragData.value.name}: ${validation.reason}`
          );
        } else {
          addNode(mobileDragData.value, x, y);
          updateValidationErrors();
        }
      }

      // Clean up
      if (mobileDragElement.value) {
        mobileDragElement.value.style.opacity = "";
        mobileDragElement.value.style.transform = "";
        mobileDragElement.value.style.position = "";
        mobileDragElement.value.style.left = "";
        mobileDragElement.value.style.top = "";
        mobileDragElement.value.style.zIndex = "";
        mobileDragElement.value.style.pointerEvents = "";
      }

      isMobileDragActive.value = false;
      mobileDragData.value = null;
      mobileDragElement.value = null;

      // Remove event listeners
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };

    const onDragOver = (event) => {
      event.preventDefault();
    };

    const onDragEnter = (event) => {
      // Check if dragging files
      if (event.dataTransfer.types.includes("Files")) {
        isDraggingFile.value = true;
      }
    };

    const onDragLeave = (event) => {
      // Only set to false if leaving the canvas entirely
      if (!event.currentTarget.contains(event.relatedTarget)) {
        isDraggingFile.value = false;
      }
    };

    const onDrop = (event) => {
      event.preventDefault();

      // If dragging files, don't try to parse as JSON
      if (isDraggingFile.value) {
        isDraggingFile.value = false;
        return;
      }

      // Check if we have JSON data (component drag)
      const jsonData = event.dataTransfer.getData("application/json");
      if (!jsonData) {
        return; // No component data, ignore the drop
      }

      try {
        const componentData = JSON.parse(jsonData);
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / zoom.value;
        const y = (event.clientY - rect.top) / zoom.value;

        // Check if component can be added
        const validation = canAddComponent(
          componentData.id,
          workflowNodes.value
        );
        if (!validation.allowed) {
          alert(`Cannot add ${componentData.name}: ${validation.reason}`);
          return;
        }

        addNode(componentData, x, y);
        updateValidationErrors();
      } catch (error) {
        console.error("Error parsing component data:", error);
        // Silently ignore invalid drops
      }
    };

    const updatePreviewWithWorkflowData = () => {
      const previewNode = workflowNodes.value.find((n) => n.type === "preview");
      if (!previewNode) return;
      // Get upload node image and metadata
      const uploadNode = workflowNodes.value.find((n) => n.type === "upload");
      if (uploadNode && uploadNode.formData) {
        previewNode.formData = {
          ...previewNode.formData,
          image: uploadNode.formData.image_preview || "",
          imgmeta: uploadNode.formData.image_meta || {},
        };
      }
      // Gather all filter/repair settings
      const settings = [];
      for (const node of workflowNodes.value) {
        if (node.type === "filter" || node.type === "repair") {
          const config = getComponentByType(node.type);
          if (config && config.fields) {
            for (const key in config.fields) {
              if (Object.prototype.hasOwnProperty.call(node.formData, key)) {
                settings.push({
                  key,
                  value: node.formData[key],
                  label: config.fields[key].label,
                  type: node.type,
                });
              }
            }
          }
        }
      }
      previewNode.formData.settings = settings;
    };

    const addNode = (componentData, x, y) => {
      const componentConfig = getComponentByType(componentData.id);
      const initialFormData = {};
      if (componentConfig && componentConfig.fields) {
        Object.keys(componentConfig.fields).forEach((key) => {
          const field = componentConfig.fields[key];
          if (field.defaultValue !== undefined) {
            initialFormData[key] = field.defaultValue;
          } else if (field.type === "object") {
            initialFormData[key] = {};
          } else {
            initialFormData[key] = "";
          }
        });
      }
      const newNode = {
        id: `node-${nextNodeId.value++}`,
        name: componentData.name,
        icon: componentData.icon,
        type: componentData.id,
        x: x - 75,
        y: y - 50,
        formData: initialFormData,
        expanded: true,
      };
      // If adding repair/filter and preview exists, insert before preview
      if (componentData.id === "repair" || componentData.id === "filter") {
        const previewIdx = workflowNodes.value.findIndex(
          (n) => n.type === "preview"
        );
        if (previewIdx !== -1) {
          workflowNodes.value.splice(previewIdx, 0, newNode);
          // Remove all connections to preview
          connections.value = connections.value.filter(
            (c) => c.to !== workflowNodes.value[previewIdx + 1].id
          );
          // Connect new node after previous node (or upload if first)
          const prevNode = workflowNodes.value[previewIdx - 1];
          if (prevNode) {
            addConnectionBetweenNodes(prevNode.id, newNode.id);
          }
          // Connect new node to preview
          addConnectionBetweenNodes(
            newNode.id,
            workflowNodes.value[previewIdx + 1].id
          );
          return;
        }
      }
      workflowNodes.value.push(newNode);
      if (workflowNodes.value.length > 1) {
        const prevNode = workflowNodes.value[workflowNodes.value.length - 2];
        addConnectionBetweenNodes(prevNode.id, newNode.id);
      }
      // After adding node, update preview with workflow data
      setTimeout(updatePreviewWithWorkflowData, 0);
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
      // Handle both mouse and touch events
      const isTouch = event.type === "touchstart";

      // Only start drag on left mouse button for mouse events
      if (!isTouch && event.button !== 0) return;

      // Don't start drag if clicking on form elements
      if (
        event.target.closest(".dynamic-form") ||
        event.target.closest(".node-form") ||
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.tagName === "SELECT" ||
        event.target.tagName === "BUTTON"
      ) {
        return;
      }

      event.preventDefault();
      isDragging.value = true;
      selectedNode.value = node.id;

      const rect = event.currentTarget.getBoundingClientRect();
      const clientX = isTouch ? event.touches[0].clientX : event.clientX;
      const clientY = isTouch ? event.touches[0].clientY : event.clientY;

      dragOffset.x = clientX - rect.left;
      dragOffset.y = clientY - rect.top;

      if (isTouch) {
        document.addEventListener("touchmove", onTouchMoveNode, {
          passive: false,
        });
        document.addEventListener("touchend", onTouchEndNode);
      } else {
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      }
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

    const onTouchMoveNode = (event) => {
      if (!isDragging.value) return;

      // Prevent scrolling while dragging
      event.preventDefault();

      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        const canvas = document.querySelector(".canvas-container");
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches[0];
        const x = (touch.clientX - rect.left - dragOffset.x) / zoom.value;
        const y = (touch.clientY - rect.top - dragOffset.y) / zoom.value;

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

    const onTouchEndNode = () => {
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
      document.removeEventListener("touchmove", onTouchMoveNode);
      document.removeEventListener("touchend", onTouchEndNode);
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
      updateValidationErrors();
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
        validationErrors.value = [];
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

    const updateNodeFormData = (nodeId, formData) => {
      const node = workflowNodes.value.find((n) => n.id === nodeId);
      if (node) {
        node.formData = { ...node.formData, ...formData };
        // If preview, filter, or repair node is updated, update preview with workflow data
        if (
          node.type === "preview" ||
          node.type === "filter" ||
          node.type === "repair" ||
          node.type === "upload"
        ) {
          setTimeout(updatePreviewWithWorkflowData, 0);
        }
      }
    };

    const toggleNodeExpansion = (nodeId) => {
      const node = workflowNodes.value.find((n) => n.id === nodeId);
      if (node) {
        node.expanded = !node.expanded;
      }
    };

    const checkComfyUIConnection = async () => {
      try {
        isComfyUIConnected.value = await comfyUIService.checkConnection();
      } catch (error) {
        isComfyUIConnected.value = false;
      }
    };

    const updateValidationErrors = () => {
      validationErrors.value = validateWorkflow(workflowNodes.value);
    };

    const executeWorkflow = async () => {
      // Update validation errors
      updateValidationErrors();

      if (validationErrors.value.length > 0) {
        alert(
          `Workflow validation errors:\n${validationErrors.value.join("\n")}`
        );
        return;
      }

      if (workflowNodes.value.length === 0) {
        alert("Please add some nodes to the workflow first.");
        return;
      }

      if (!isComfyUIConnected.value) {
        alert(
          "ComfyUI is not connected. Please make sure ComfyUI is running on http://127.0.0.1:8188"
        );
        return;
      }

      try {
        isExecuting.value = true;
        const result = await comfyUIService.executeWorkflow(
          workflowNodes.value,
          connections.value
        );
        alert("Workflow executed successfully! Check ComfyUI for results.");
        console.log("Workflow result:", result);
      } catch (error) {
        alert(`Error executing workflow: ${error.message}`);
        console.error("Workflow execution error:", error);
      } finally {
        isExecuting.value = false;
      }
    };

    // Helper: is a component disabled for drag?
    const isComponentDisabled = (component) => {
      const result = canAddComponent(component.id, workflowNodes.value);
      return !result.allowed;
    };

    onMounted(() => {
      checkComfyUIConnection();
      // Check connection every 30 seconds
      setInterval(checkComfyUIConnection, 30000);
    });

    onUnmounted(() => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchmove", onTouchMoveNode);
      document.removeEventListener("touchend", onTouchEndNode);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    });

    return {
      zoom,
      selectedNode,
      isDragging,
      isComfyUIConnected,
      isExecuting,
      validationErrors,
      availableComponents,
      workflowNodes,
      connections,
      onDragStart,
      onTouchStart,
      onDragOver,
      onDragEnter,
      onDragLeave,
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
      executeWorkflow,
      throttledUpdateConnections,
      updateNodeFormData,
      toggleNodeExpansion,
      getComponentByType,
      hasImageUploaded,
      isComponentDisabled,
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
          <button
            class="menu-btn run-btn"
            :class="{ connected: isComfyUIConnected, executing: isExecuting }"
            @click="executeWorkflow"
            :disabled="isExecuting"
          >
            {{ isExecuting ? "Running..." : "Run Workflow" }}
          </button>
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
            :class="{
              disabled: isComponentDisabled(component),
            }"
            :draggable="!isComponentDisabled(component)"
            @dragstart="
              isComponentDisabled(component)
                ? null
                : onDragStart($event, component)
            "
            @touchstart="
              isComponentDisabled(component)
                ? null
                : onTouchStart($event, component)
            "
          >
            <div class="component-icon">{{ component.icon }}</div>
            <span class="component-name">{{ component.name }}</span>
          </div>
        </div>
      </aside>

      <!-- Main Workspace -->
      <main class="workspace">
        <div class="workspace-header">
          <div class="workspace-title">
            <h2>Workflow Canvas</h2>
            <div v-if="validationErrors.length > 0" class="validation-errors">
              <span class="error-icon">⚠️</span>
              <span class="error-count"
                >{{ validationErrors.length }} validation error(s)</span
              >
            </div>
          </div>
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
          @dragenter="onDragEnter"
          @dragleave="onDragLeave"
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
              expanded: node.expanded,
            }"
            :style="{
              left: `${node.x}px`,
              top: `${node.y}px`,
              transform: `scale(${zoom})`,
            }"
            @click.stop="selectNode(node.id)"
            @mousedown="startDrag($event, node)"
            @touchstart="startDrag($event, node)"
          >
            <div class="node-header">
              <span class="node-icon">{{ node.icon }}</span>
              <span class="node-title">{{ node.name }}</span>
              <div class="node-controls">
                <button
                  class="node-expand"
                  @click.stop="toggleNodeExpansion(node.id)"
                  :title="node.expanded ? 'Collapse' : 'Expand'"
                >
                  {{ node.expanded ? "−" : "+" }}
                </button>
                <button class="node-delete" @click.stop="deleteNode(node.id)">
                  ×
                </button>
              </div>
            </div>

            <!-- Dynamic Form -->
            <div
              v-if="node.expanded"
              class="node-form"
              @mousedown.stop
              @click.stop
            >
              <DynamicForm
                :type="node.type"
                :fields="getComponentByType(node.type)?.fields || {}"
                :model-value="node.formData"
                @update:model-value="
                  (formData) => updateNodeFormData(node.id, formData)
                "
              />
              <!-- Debug info -->
              <div
                class="debug-info"
                style="font-size: 10px; color: #666; padding: 5px"
              >
                Type: {{ node.type }} | Fields:
                {{
                  Object.keys(getComponentByType(node.type)?.fields || {})
                    .length
                }}
              </div>
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

.run-btn {
  background: rgba(220, 53, 69, 0.2);
  border-color: rgba(220, 53, 69, 0.3);
}

.run-btn.connected {
  background: rgba(40, 167, 69, 0.2);
  border-color: rgba(40, 167, 69, 0.3);
}

.run-btn.executing {
  background: rgba(255, 193, 7, 0.2);
  border-color: rgba(255, 193, 7, 0.3);
  cursor: not-allowed;
}

.run-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.workspace-title {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.workspace-header h2 {
  margin: 0;
  color: #495057;
}

.validation-errors {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #dc3545;
  font-size: 0.9rem;
  font-weight: 500;
}

.error-icon {
  font-size: 1.1rem;
}

.error-count {
  color: #dc3545;
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

.node-controls {
  display: flex;
  gap: 0.25rem;
  margin-left: auto;
}

.node-expand {
  background: #28a745;
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

.node-expand:hover {
  background: #218838;
  transform: scale(1.1);
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

.node-form {
  border-bottom: 1px solid #e9ecef;
  background: white;
  max-height: 300px;
  overflow-y: auto;
  pointer-events: auto;
}

.workflow-node.expanded {
  width: 300px;
  z-index: 20;
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

.component-item.disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}

/* Mobile touch improvements */
@media (max-width: 768px) {
  .component-item {
    touch-action: none; /* Prevent default touch behaviors */
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .component-item:active {
    transform: scale(1.05);
    transition: transform 0.1s ease;
  }

  /* Prevent text selection during drag */
  .component-list {
    -webkit-user-select: none;
    user-select: none;
  }

  /* Improve touch targets */
  .component-item {
    min-height: 60px;
    padding: 1rem;
  }

  .component-icon {
    font-size: 1.5rem;
  }

  .component-name {
    font-size: 1rem;
  }
}
</style>
