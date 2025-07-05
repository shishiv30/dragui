import { vi } from "vitest";

// Test helper utilities for DragUI

/**
 * Create a mock workflow node
 */
export const createMockNode = (overrides = {}) => {
  return {
    id: Math.floor(Math.random() * 1000),
    type: "upload",
    x: 100,
    y: 200,
    name: "Test Node",
    formData: {},
    ...overrides,
  };
};

/**
 * Create a mock workflow with nodes
 */
export const createMockWorkflow = (nodeTypes = ["upload"]) => {
  const nodes = nodeTypes.map((type, index) =>
    createMockNode({
      id: index + 1,
      type: type,
      x: 100 + index * 200,
      y: 200,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
    })
  );

  const connections = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    connections.push({
      from: nodes[i].id,
      to: nodes[i + 1].id,
    });
  }

  return { nodes, connections };
};

/**
 * Create a mock file for testing
 */
export const createMockFile = (
  name = "test.jpg",
  type = "image/jpeg",
  size = 1024
) => {
  return new File(["test content"], name, { type });
};

/**
 * Create a mock image with metadata
 */
export const createMockImage = (overrides = {}) => {
  return {
    name: "test.jpg",
    size: 1024,
    type: "image/jpeg",
    width: 1920,
    height: 1080,
    lastModified: Date.now(),
    ...overrides,
  };
};

/**
 * Mock ComfyUI service responses
 */
export const mockComfyUIResponses = {
  connection: {
    success: { ok: true },
    failure: { ok: false },
  },
  workflow: {
    success: { prompt_id: "test-123" },
    error: { error: "Workflow execution failed" },
  },
  upload: {
    success: { name: "test.jpg" },
    error: { error: "Upload failed" },
  },
  history: {
    success: [
      { id: "1", prompt: {} },
      { id: "2", prompt: {} },
    ],
  },
};

/**
 * Setup fetch mock for ComfyUI API
 */
export const setupComfyUIMock = (responses = {}) => {
  const defaultResponses = {
    "http://127.0.0.1:8188/system_stats":
      mockComfyUIResponses.connection.success,
    "http://127.0.0.1:8188/prompt": mockComfyUIResponses.workflow.success,
    "http://127.0.0.1:8188/upload/image": mockComfyUIResponses.upload.success,
    "http://127.0.0.1:8188/history": mockComfyUIResponses.history.success,
  };

  const mockResponses = { ...defaultResponses, ...responses };

  global.fetch = vi.fn((url) => {
    const response = mockResponses[url];
    if (response) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response),
      });
    }
    return Promise.resolve({
      ok: false,
      status: 404,
    });
  });
};

/**
 * Create mock drag event
 */
export const createMockDragEvent = (data = null, files = null) => {
  return {
    preventDefault: vi.fn(),
    dataTransfer: {
      getData: vi.fn().mockReturnValue(data),
      setData: vi.fn(),
      types: files ? ["Files"] : ["application/json"],
      files: files || [],
    },
    clientX: 150,
    clientY: 250,
    currentTarget: {
      getBoundingClientRect: vi.fn().mockReturnValue({ left: 0, top: 0 }),
    },
  };
};

/**
 * Create mock touch event
 */
export const createMockTouchEvent = (type, x = 150, y = 250) => {
  return {
    preventDefault: vi.fn(),
    touches: [{ clientX: x, clientY: y }],
    changedTouches: [{ clientX: x, clientY: y }],
    currentTarget: {
      style: {},
      getBoundingClientRect: vi.fn().mockReturnValue({ left: 0, top: 0 }),
    },
    type,
  };
};

/**
 * Wait for async operations
 */
export const waitFor = (ms = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock localStorage
 */
export const mockLocalStorage = () => {
  const store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
};

/**
 * Create mock component configuration
 */
export const createMockComponentConfig = (type = "test") => {
  return {
    name: "Test Component",
    icon: "🧪",
    type,
    description: "Test component for testing",
    order: 1,
    validation: {
      requires: [],
      requiredBy: [],
    },
    fields: {
      testField: {
        type: "range",
        label: "Test Field",
        min: 0,
        max: 100,
        defaultValue: 50,
      },
    },
  };
};

/**
 * Validate workflow structure
 */
export const validateWorkflowStructure = (workflow) => {
  const { nodes, connections } = workflow;

  // Check nodes
  expect(Array.isArray(nodes)).toBe(true);
  nodes.forEach((node) => {
    expect(node).toHaveProperty("id");
    expect(node).toHaveProperty("type");
    expect(node).toHaveProperty("x");
    expect(node).toHaveProperty("y");
    expect(node).toHaveProperty("name");
    expect(node).toHaveProperty("formData");
  });

  // Check connections
  expect(Array.isArray(connections)).toBe(true);
  connections.forEach((connection) => {
    expect(connection).toHaveProperty("from");
    expect(connection).toHaveProperty("to");
  });

  return true;
};

/**
 * Test workflow validation scenarios
 */
export const testWorkflowValidation = (validateFunction) => {
  describe("Workflow Validation", () => {
    it("should validate complete workflow", () => {
      const workflow = createMockWorkflow(["upload", "filter", "preview"]);
      const errors = validateFunction(workflow.nodes);
      expect(errors).toEqual([]);
    });

    it("should show error when upload is missing", () => {
      const workflow = createMockWorkflow(["filter", "preview"]);
      const errors = validateFunction(workflow.nodes);
      expect(errors).toContain("Upload component is required");
    });

    it("should show error when preview is missing", () => {
      const workflow = createMockWorkflow(["upload", "filter"]);
      const errors = validateFunction(workflow.nodes);
      expect(errors).toContain("Preview component is required");
    });

    it("should show error when components are in wrong order", () => {
      const workflow = createMockWorkflow(["filter", "upload", "preview"]);
      const errors = validateFunction(workflow.nodes);
      expect(errors.some((error) => error.includes("must come after"))).toBe(
        true
      );
    });
  });
};

/**
 * Test component addition scenarios
 */
export const testComponentAddition = (canAddFunction) => {
  describe("Component Addition", () => {
    it("should allow adding upload to empty workflow", () => {
      const result = canAddFunction("upload", []);
      expect(result.allowed).toBe(true);
    });

    it("should allow adding filter after upload", () => {
      const workflow = [createMockNode({ type: "upload" })];
      const result = canAddFunction("filter", workflow);
      expect(result.allowed).toBe(true);
    });

    it("should not allow adding filter without upload", () => {
      const result = canAddFunction("filter", []);
      expect(result.allowed).toBe(false);
    });

    it("should not allow adding repair without upload", () => {
      const result = canAddFunction("repair", []);
      expect(result.allowed).toBe(false);
    });
  });
};

export default {
  createMockNode,
  createMockWorkflow,
  createMockFile,
  createMockImage,
  mockComfyUIResponses,
  setupComfyUIMock,
  createMockDragEvent,
  createMockTouchEvent,
  waitFor,
  mockLocalStorage,
  createMockComponentConfig,
  validateWorkflowStructure,
  testWorkflowValidation,
  testComponentAddition,
};
