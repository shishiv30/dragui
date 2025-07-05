import { describe, it, expect } from "vitest";
import {
  componentConfig,
  getComponentByType,
  getAvailableComponents,
  validateWorkflow,
  canAddComponent,
} from "../../../src/config/components.js";

describe("Component Configuration", () => {
  describe("componentConfig", () => {
    it("should have all required component types", () => {
      expect(componentConfig).toHaveProperty("upload");
      expect(componentConfig).toHaveProperty("filter");
      expect(componentConfig).toHaveProperty("repair");
      expect(componentConfig).toHaveProperty("preview");
    });

    it("should have correct upload component configuration", () => {
      const upload = componentConfig.upload;
      expect(upload.name).toBe("Upload Image");
      expect(upload.icon).toBe("📁");
      expect(upload.type).toBe("upload");
      expect(upload.order).toBe(1);
      expect(upload.required).toBe(true);
      expect(upload.validation.requires).toEqual([]);
      expect(upload.validation.requiredBy).toEqual(["filter", "repair"]);
    });

    it("should have correct filter component configuration", () => {
      const filter = componentConfig.filter;
      expect(filter.name).toBe("Image Filter");
      expect(filter.icon).toBe("🎨");
      expect(filter.type).toBe("filter");
      expect(filter.order).toBe(2);
      expect(filter.optional).toBe(true);
      expect(filter.validation.requires).toEqual(["upload"]);
      expect(filter.validation.requiredBy).toEqual([]);
    });

    it("should have correct repair component configuration", () => {
      const repair = componentConfig.repair;
      expect(repair.name).toBe("Image Repair");
      expect(repair.icon).toBe("🔧");
      expect(repair.type).toBe("repair");
      expect(repair.order).toBe(3);
      expect(repair.optional).toBe(true);
      expect(repair.validation.requires).toEqual(["upload"]);
      expect(repair.validation.requiredBy).toEqual([]);
    });

    it("should have correct preview component configuration", () => {
      const preview = componentConfig.preview;
      expect(preview.name).toBe("Preview");
      expect(preview.icon).toBe("🖼️");
      expect(preview.type).toBe("preview");
      expect(preview.order).toBe(4);
      expect(preview.isFinal).toBe(true);
      expect(preview.validation.requires).toEqual([["filter", "repair"]]);
      expect(preview.validation.requiredBy).toEqual([]);
    });
  });

  describe("getComponentByType", () => {
    it("should return component config for valid type", () => {
      const upload = getComponentByType("upload");
      expect(upload).toEqual(componentConfig.upload);
    });

    it("should return null for invalid type", () => {
      const invalid = getComponentByType("invalid");
      expect(invalid).toBeNull();
    });
  });

  describe("getAvailableComponents", () => {
    it("should return all available components", () => {
      const components = getAvailableComponents();
      expect(components).toHaveLength(4);
      expect(components.map((c) => c.id)).toEqual([
        "upload",
        "filter",
        "repair",
        "preview",
      ]);
    });

    it("should exclude auto-added components", () => {
      // Add a mock auto-added component
      const originalConfig = { ...componentConfig };
      componentConfig.autoAdded = {
        name: "Auto Added",
        icon: "🤖",
        type: "auto-added",
        autoAdded: true,
      };

      const components = getAvailableComponents();
      expect(components.find((c) => c.id === "autoAdded")).toBeUndefined();

      // Restore original config
      Object.assign(componentConfig, originalConfig);
    });
  });

  describe("validateWorkflow", () => {
    it("should return empty array for valid workflow", () => {
      const validWorkflow = [
        { type: "upload" },
        { type: "filter" },
        { type: "preview" },
      ];
      const errors = validateWorkflow(validWorkflow);
      expect(errors).toEqual([]);
    });

    it("should return error when upload is missing", () => {
      const invalidWorkflow = [{ type: "filter" }, { type: "preview" }];
      const errors = validateWorkflow(invalidWorkflow);
      expect(errors).toContain("Upload component is required");
    });

    it("should return error when preview is missing", () => {
      const invalidWorkflow = [{ type: "upload" }, { type: "filter" }];
      const errors = validateWorkflow(invalidWorkflow);
      expect(errors).toContain(
        "Preview component is required (will be auto-added after image upload)"
      );
    });

    it("should return error when components are in wrong order", () => {
      const invalidWorkflow = [
        { type: "filter" },
        { type: "upload" },
        { type: "preview" },
      ];
      const errors = validateWorkflow(invalidWorkflow);
      expect(errors).toContain("Image Filter must come after Upload Image");
    });

    it("should return error when preview is missing required components", () => {
      const invalidWorkflow = [{ type: "upload" }, { type: "preview" }];
      // Preview requires either filter or repair
      const errors = validateWorkflow(invalidWorkflow);
      expect(errors).toContain(
        "Preview requires one of: Image Filter, Image Repair"
      );
    });
  });

  describe("canAddComponent", () => {
    it("should allow adding upload component to empty workflow", () => {
      const result = canAddComponent("upload", []);
      expect(result.allowed).toBe(true);
    });

    it("should allow adding filter after upload", () => {
      const workflow = [{ type: "upload" }];
      const result = canAddComponent("filter", workflow);
      expect(result.allowed).toBe(true);
    });

    it("should not allow adding filter without upload", () => {
      const workflow = [];
      const result = canAddComponent("filter", workflow);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Upload Image");
    });

    it("should not allow adding repair without upload", () => {
      const workflow = [];
      const result = canAddComponent("repair", workflow);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Upload Image");
    });

    it("should allow adding preview with upload and repair", () => {
      const workflow = [{ type: "upload" }, { type: "repair" }];
      const result = canAddComponent("preview", workflow);
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

    it("should return allowed true for unknown component type", () => {
      const result = canAddComponent("unknown", []);
      expect(result.allowed).toBe(true);
    });
  });
});
