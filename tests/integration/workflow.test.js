import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import App from "../../src/App.vue";
import {
  componentConfig,
  canAddComponent,
} from "../../src/config/components.js";
import ComfyUIService from "../../src/services/comfyui.js";

// Mock ComfyUI service
vi.mock("../../src/services/comfyui.js", () => ({
  default: vi.fn().mockImplementation(() => ({
    checkConnection: vi.fn().mockResolvedValue(true),
    executeWorkflow: vi.fn().mockResolvedValue({ prompt_id: "test-123" }),
    uploadImage: vi.fn().mockResolvedValue({ name: "test.jpg" }),
  })),
}));

describe("Workflow Integration", () => {
  let wrapper;
  let mockComfyUIService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create fresh wrapper
    wrapper = mount(App);
    mockComfyUIService = new ComfyUIService();
  });

  describe("Component Management", () => {
    it("should initialize with empty workflow", () => {
      expect(wrapper.vm.workflowNodes).toEqual([]);
      expect(wrapper.vm.connections).toEqual([]);
      expect(wrapper.vm.validationErrors).toEqual([]);
    });

    it("should load available components", () => {
      const availableComponents = wrapper.vm.availableComponents;
      expect(availableComponents).toHaveLength(4);
      expect(availableComponents.map((c) => c.id)).toEqual([
        "upload",
        "filter",
        "repair",
        "preview",
      ]);
    });

    it("should have zoom controls", () => {
      expect(wrapper.vm.zoom).toBe(1);
      expect(typeof wrapper.vm.zoomIn).toBe("function");
      expect(typeof wrapper.vm.zoomOut).toBe("function");
      expect(typeof wrapper.vm.resetZoom).toBe("function");
    });

    it("should have workflow persistence methods", () => {
      expect(typeof wrapper.vm.saveWorkflow).toBe("function");
      expect(typeof wrapper.vm.loadWorkflow).toBe("function");
      expect(typeof wrapper.vm.clearWorkflow).toBe("function");
    });
  });

  describe("Validation System", () => {
    it("should prevent adding filter without upload", () => {
      const filterComponent = componentConfig.filter;
      const result = canAddComponent("filter", []);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Upload Image");
    });

    it("should allow adding filter after upload", () => {
      const filterComponent = componentConfig.filter;
      const workflow = [{ type: "upload" }];
      const result = canAddComponent("filter", workflow);

      expect(result.allowed).toBe(true);
    });

    it("should not allow adding preview with only upload", () => {
      const workflow = [{ type: "upload" }];
      const result = canAddComponent("preview", workflow);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Image Filter");
      expect(result.reason).toContain("Image Repair");
    });

    it("should allow adding preview with upload and filter", () => {
      const workflow = [{ type: "upload" }, { type: "filter" }];
      const result = canAddComponent("preview", workflow);

      expect(result.allowed).toBe(true);
    });
  });

  describe("Drag and Drop", () => {
    it("should handle component drag start", async () => {
      const uploadComponent = componentConfig.upload;
      const event = {
        dataTransfer: {
          setData: vi.fn(),
        },
      };

      await wrapper.vm.onDragStart(event, uploadComponent);

      expect(event.dataTransfer.setData).toHaveBeenCalledWith(
        "application/json",
        JSON.stringify(uploadComponent)
      );
    });

    it("should handle component drop", async () => {
      const uploadComponent = componentConfig.upload;
      const event = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue(JSON.stringify(uploadComponent)),
        },
        clientX: 150,
        clientY: 250,
        currentTarget: {
          getBoundingClientRect: vi.fn().mockReturnValue({ left: 0, top: 0 }),
        },
      };

      await wrapper.vm.onDrop(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe("Zoom Controls", () => {
    it("should zoom in", async () => {
      const initialZoom = wrapper.vm.zoom;

      await wrapper.vm.zoomIn();

      expect(wrapper.vm.zoom).toBeGreaterThan(initialZoom);
    });

    it("should zoom out", async () => {
      const initialZoom = wrapper.vm.zoom;

      await wrapper.vm.zoomOut();

      expect(wrapper.vm.zoom).toBeLessThan(initialZoom);
    });

    it("should reset zoom", async () => {
      // Set custom zoom
      wrapper.vm.zoom = 2.0;

      await wrapper.vm.resetZoom();

      expect(wrapper.vm.zoom).toBe(1);
    });
  });

  describe("Workflow Persistence", () => {
    it("should clear workflow", async () => {
      // Set up some workflow data
      wrapper.vm.workflowNodes = [{ id: 1, type: "upload" }];
      wrapper.vm.connections = [{ from: 1, to: 2 }];

      // Clear workflow
      await wrapper.vm.clearWorkflow();

      expect(wrapper.vm.workflowNodes).toEqual([]);
      expect(wrapper.vm.connections).toEqual([]);
    });

    it("should save workflow to localStorage", async () => {
      // Set up some workflow data
      wrapper.vm.workflowNodes = [{ id: 1, type: "upload" }];
      wrapper.vm.connections = [];

      // Save workflow
      await wrapper.vm.saveWorkflow();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "workflow",
        expect.stringContaining("upload")
      );
    });
  });

  describe("Component Utilities", () => {
    it("should have getComponentByType function", () => {
      expect(typeof wrapper.vm.getComponentByType).toBe("function");

      const uploadComponent = wrapper.vm.getComponentByType("upload");
      expect(uploadComponent).toBeTruthy();
      expect(uploadComponent.name).toBe("Upload Image");
    });

    it("should have hasImageUploaded computed property", () => {
      expect(typeof wrapper.vm.hasImageUploaded).toBe("boolean");
    });

    it("should have isComponentDisabled function", () => {
      expect(typeof wrapper.vm.isComponentDisabled).toBe("function");
    });
  });
});
