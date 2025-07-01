// ComfyUI API Service
class ComfyUIService {
  constructor(baseURL = "http://127.0.0.1:8188") {
    this.baseURL = baseURL;
  }

  // Convert our workflow to ComfyUI format
  convertWorkflowToComfyUI(workflowNodes, connections) {
    const comfyWorkflow = {
      nodes: {},
      connections: {},
    };

    // Convert each node to ComfyUI format
    workflowNodes.forEach((node) => {
      const comfyNode = this.convertNodeToComfyUI(node);
      comfyWorkflow.nodes[node.id] = comfyNode;
    });

    // Convert connections
    connections.forEach((connection) => {
      if (!comfyWorkflow.connections[connection.from]) {
        comfyWorkflow.connections[connection.from] = {};
      }
      comfyWorkflow.connections[connection.from][connection.to] = [0]; // Default output index
    });

    return comfyWorkflow;
  }

  // Convert a single node to ComfyUI format
  convertNodeToComfyUI(node) {
    const baseNode = {
      id: node.id,
      type: this.mapNodeTypeToComfyUI(node.componentType),
      pos: [node.x, node.y],
      size: { width: 300, height: 200 },
      flags: {},
      order: 0,
      mode: 0,
      title: node.name,
      properties: {},
      widgets_values: [],
    };

    // Add specific properties based on node type
    switch (node.componentType) {
      case "upload":
        return {
          ...baseNode,
          type: "LoadImage",
          widgets_values: [node.formData.image?.name || "", "image"],
        };

      case "filter":
        return {
          ...baseNode,
          type: "ImageFilter",
          widgets_values: [node.formData.WB || 0, node.formData.exposure || 0],
        };

      case "repair":
        return {
          ...baseNode,
          type: "ImageRepair",
          widgets_values: [node.formData.detail || 0],
        };

      case "preview":
        return {
          ...baseNode,
          type: "PreviewImage",
          widgets_values: [],
          // Include metadata if available
          properties: {
            metadata: node.formData.imgmeta || {},
          },
        };

      default:
        return baseNode;
    }
  }

  // Map our node types to ComfyUI node types
  mapNodeTypeToComfyUI(componentType) {
    const typeMap = {
      upload: "LoadImage",
      filter: "ImageFilter",
      repair: "ImageRepair",
      preview: "PreviewImage",
    };
    return typeMap[componentType] || "Comment";
  }

  // Execute workflow on ComfyUI
  async executeWorkflow(workflowNodes, connections) {
    try {
      const comfyWorkflow = this.convertWorkflowToComfyUI(
        workflowNodes,
        connections
      );

      // Send workflow to ComfyUI
      const response = await fetch(`${this.baseURL}/prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: comfyWorkflow,
          client_id: "workflow-builder",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error executing workflow:", error);
      throw error;
    }
  }

  // Get workflow history
  async getHistory() {
    try {
      const response = await fetch(`${this.baseURL}/history`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching history:", error);
      throw error;
    }
  }

  // Upload image to ComfyUI
  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${this.baseURL}/upload/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  // Check if ComfyUI is running
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseURL}/system_stats`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default ComfyUIService;
