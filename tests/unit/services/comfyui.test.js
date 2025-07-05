import { describe, it, expect, beforeEach, vi } from "vitest";
import ComfyUIService from "../../../src/services/comfyui.js";

describe("ComfyUI Service", () => {
  let comfyUIService;
  let mockFetch;

  beforeEach(() => {
    comfyUIService = new ComfyUIService();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  describe("constructor", () => {
    it("should create service with default base URL", () => {
      const service = new ComfyUIService();
      expect(service.baseURL).toBe("http://127.0.0.1:8188");
    });

    it("should create service with custom base URL", () => {
      const service = new ComfyUIService("http://localhost:3000");
      expect(service.baseURL).toBe("http://localhost:3000");
    });
  });

  describe("mapNodeTypeToComfyUI", () => {
    it("should map upload to LoadImage", () => {
      const result = comfyUIService.mapNodeTypeToComfyUI("upload");
      expect(result).toBe("LoadImage");
    });

    it("should map filter to ImageFilter", () => {
      const result = comfyUIService.mapNodeTypeToComfyUI("filter");
      expect(result).toBe("ImageFilter");
    });

    it("should map repair to ImageRepair", () => {
      const result = comfyUIService.mapNodeTypeToComfyUI("repair");
      expect(result).toBe("ImageRepair");
    });

    it("should map preview to PreviewImage", () => {
      const result = comfyUIService.mapNodeTypeToComfyUI("preview");
      expect(result).toBe("PreviewImage");
    });

    it("should return Comment for unknown type", () => {
      const result = comfyUIService.mapNodeTypeToComfyUI("unknown");
      expect(result).toBe("Comment");
    });
  });

  describe("convertNodeToComfyUI", () => {
    it("should convert upload node correctly", () => {
      const node = {
        id: 1,
        type: "upload",
        x: 100,
        y: 200,
        name: "Upload Image",
        formData: {
          image: { name: "test.jpg" },
        },
      };

      const result = comfyUIService.convertNodeToComfyUI(node);

      expect(result).toEqual({
        id: 1,
        type: "LoadImage",
        pos: [100, 200],
        size: { width: 300, height: 200 },
        flags: {},
        order: 0,
        mode: 0,
        title: "Upload Image",
        properties: {},
        widgets_values: ["test.jpg", "image"],
      });
    });

    it("should convert filter node correctly", () => {
      const node = {
        id: 2,
        type: "filter",
        x: 300,
        y: 200,
        name: "Image Filter",
        formData: {
          WB: 50,
          exposure: -25,
        },
      };

      const result = comfyUIService.convertNodeToComfyUI(node);

      expect(result).toEqual({
        id: 2,
        type: "ImageFilter",
        pos: [300, 200],
        size: { width: 300, height: 200 },
        flags: {},
        order: 0,
        mode: 0,
        title: "Image Filter",
        properties: {},
        widgets_values: [50, -25],
      });
    });

    it("should convert repair node correctly", () => {
      const node = {
        id: 3,
        type: "repair",
        x: 500,
        y: 200,
        name: "Image Repair",
        formData: {
          detail: 75,
        },
      };

      const result = comfyUIService.convertNodeToComfyUI(node);

      expect(result).toEqual({
        id: 3,
        type: "ImageRepair",
        pos: [500, 200],
        size: { width: 300, height: 200 },
        flags: {},
        order: 0,
        mode: 0,
        title: "Image Repair",
        properties: {},
        widgets_values: [75],
      });
    });

    it("should convert preview node correctly", () => {
      const metadata = { width: 1920, height: 1080 };
      const node = {
        id: 4,
        type: "preview",
        x: 700,
        y: 200,
        name: "Preview",
        formData: {
          imgmeta: metadata,
        },
      };

      const result = comfyUIService.convertNodeToComfyUI(node);

      expect(result).toEqual({
        id: 4,
        type: "PreviewImage",
        pos: [700, 200],
        size: { width: 300, height: 200 },
        flags: {},
        order: 0,
        mode: 0,
        title: "Preview",
        properties: {
          metadata: metadata,
        },
        widgets_values: [],
      });
    });

    it("should handle missing form data gracefully", () => {
      const node = {
        id: 1,
        type: "upload",
        x: 100,
        y: 200,
        name: "Upload Image",
        formData: {},
      };

      const result = comfyUIService.convertNodeToComfyUI(node);

      expect(result.widgets_values).toEqual(["", "image"]);
    });
  });

  describe("convertWorkflowToComfyUI", () => {
    it("should convert complete workflow correctly", () => {
      const workflowNodes = [
        {
          id: 1,
          type: "upload",
          x: 100,
          y: 200,
          name: "Upload Image",
          formData: { image: { name: "test.jpg" } },
        },
        {
          id: 2,
          type: "filter",
          x: 300,
          y: 200,
          name: "Image Filter",
          formData: { WB: 50, exposure: -25 },
        },
      ];

      const connections = [{ from: 1, to: 2 }];

      const result = comfyUIService.convertWorkflowToComfyUI(
        workflowNodes,
        connections
      );

      expect(result).toEqual({
        nodes: {
          1: expect.objectContaining({
            id: 1,
            type: "LoadImage",
            widgets_values: ["test.jpg", "image"],
          }),
          2: expect.objectContaining({
            id: 2,
            type: "ImageFilter",
            widgets_values: [50, -25],
          }),
        },
        connections: {
          1: { 2: [0] },
        },
      });
    });
  });

  describe("executeWorkflow", () => {
    it("should execute workflow successfully", async () => {
      const mockResponse = { prompt_id: "test-123" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const workflowNodes = [
        {
          id: 1,
          type: "upload",
          x: 100,
          y: 200,
          name: "Upload Image",
          formData: { image: { name: "test.jpg" } },
        },
      ];

      const connections = [];

      const result = await comfyUIService.executeWorkflow(
        workflowNodes,
        connections
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:8188/prompt",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining("LoadImage"),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it("should handle HTTP errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const workflowNodes = [];
      const connections = [];

      await expect(
        comfyUIService.executeWorkflow(workflowNodes, connections)
      ).rejects.toThrow("HTTP error! status: 500");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const workflowNodes = [];
      const connections = [];

      await expect(
        comfyUIService.executeWorkflow(workflowNodes, connections)
      ).rejects.toThrow("Network error");
    });
  });

  describe("getHistory", () => {
    it("should fetch history successfully", async () => {
      const mockHistory = [{ id: "1", prompt: {} }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      const result = await comfyUIService.getHistory();

      expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8188/history");
      expect(result).toEqual(mockHistory);
    });

    it("should handle HTTP errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(comfyUIService.getHistory()).rejects.toThrow(
        "HTTP error! status: 404"
      );
    });
  });

  describe("uploadImage", () => {
    it("should upload image successfully", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockResponse = { name: "test.jpg" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await comfyUIService.uploadImage(mockFile);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:8188/upload/image",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it("should handle upload errors", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 413,
      });

      await expect(comfyUIService.uploadImage(mockFile)).rejects.toThrow(
        "HTTP error! status: 413"
      );
    });
  });

  describe("checkConnection", () => {
    it("should return true when ComfyUI is running", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await comfyUIService.checkConnection();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:8188/system_stats"
      );
      expect(result).toBe(true);
    });

    it("should return false when ComfyUI is not running", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const result = await comfyUIService.checkConnection();

      expect(result).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await comfyUIService.checkConnection();

      expect(result).toBe(false);
    });
  });
});
