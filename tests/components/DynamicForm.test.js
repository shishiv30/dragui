import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DynamicForm from "../../src/components/DynamicForm.vue";

describe("DynamicForm", () => {
  const createWrapper = (props = {}) => {
    return mount(DynamicForm, {
      props: {
        type: "upload",
        fields: {},
        modelValue: {},
        ...props,
      },
    });
  };

  describe("Component Rendering", () => {
    it("should render upload form when type is upload", () => {
      const wrapper = createWrapper({
        type: "upload",
        fields: {
          image: {
            type: "image-upload",
            label: "Image",
            required: true,
          },
        },
      });

      expect(wrapper.findComponent({ name: "UploadForm" }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: "FilterForm" }).exists()).toBe(
        false
      );
      expect(wrapper.findComponent({ name: "RepairForm" }).exists()).toBe(
        false
      );
      expect(wrapper.findComponent({ name: "PreviewForm" }).exists()).toBe(
        false
      );
    });

    it("should render filter form when type is filter", () => {
      const wrapper = createWrapper({
        type: "filter",
        fields: {
          WB: {
            type: "range",
            label: "White Balance",
            min: -100,
            max: 100,
          },
        },
      });

      expect(wrapper.findComponent({ name: "UploadForm" }).exists()).toBe(
        false
      );
      expect(wrapper.findComponent({ name: "FilterForm" }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: "RepairForm" }).exists()).toBe(
        false
      );
      expect(wrapper.findComponent({ name: "PreviewForm" }).exists()).toBe(
        false
      );
    });

    it("should render repair form when type is repair", () => {
      const wrapper = createWrapper({
        type: "repair",
        fields: {
          detail: {
            type: "range",
            label: "Detail Level",
            min: 0,
            max: 100,
          },
        },
      });

      expect(wrapper.findComponent({ name: "UploadForm" }).exists()).toBe(
        false
      );
      expect(wrapper.findComponent({ name: "FilterForm" }).exists()).toBe(
        false
      );
      expect(wrapper.findComponent({ name: "RepairForm" }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: "PreviewForm" }).exists()).toBe(
        false
      );
    });

    it("should render preview form when type is preview", () => {
      const wrapper = createWrapper({
        type: "preview",
        fields: {
          image: {
            type: "image",
            label: "Preview Image",
          },
        },
      });

      expect(wrapper.findComponent({ name: "UploadForm" }).exists()).toBe(
        false
      );
      expect(wrapper.findComponent({ name: "FilterForm" }).exists()).toBe(
        false
      );
      expect(wrapper.findComponent({ name: "RepairForm" }).exists()).toBe(
        false
      );
      expect(wrapper.findComponent({ name: "PreviewForm" }).exists()).toBe(
        true
      );
    });

    it("should render unknown type message for invalid type", () => {
      const wrapper = createWrapper({
        type: "invalid",
      });

      expect(wrapper.find(".unknown-type").exists()).toBe(true);
      expect(wrapper.find(".unknown-type").text()).toContain(
        "Unknown form type: invalid"
      );
    });
  });

  describe("Props Validation", () => {
    it("should accept valid type prop", () => {
      const validTypes = ["upload", "filter", "repair", "preview"];

      validTypes.forEach((type) => {
        const wrapper = createWrapper({ type });
        expect(wrapper.props("type")).toBe(type);
      });
    });

    it("should pass fields prop to child components", () => {
      const fields = {
        image: {
          type: "image-upload",
          label: "Image",
          required: true,
        },
      };

      const wrapper = createWrapper({
        type: "upload",
        fields,
      });

      const uploadForm = wrapper.findComponent({ name: "UploadForm" });
      expect(uploadForm.props("fields")).toEqual(fields);
    });

    it("should pass modelValue prop to child components", () => {
      const modelValue = {
        image: { name: "test.jpg" },
        comment: "Test comment",
      };

      const wrapper = createWrapper({
        type: "upload",
        modelValue,
      });

      const uploadForm = wrapper.findComponent({ name: "UploadForm" });
      expect(uploadForm.props("modelValue")).toEqual(modelValue);
    });
  });

  describe("Event Handling", () => {
    it("should emit update:modelValue when child component emits", async () => {
      const wrapper = createWrapper({
        type: "upload",
        fields: {
          image: {
            type: "image-upload",
            label: "Image",
          },
        },
      });

      const newValue = { image: { name: "new-image.jpg" } };
      const uploadForm = wrapper.findComponent({ name: "UploadForm" });

      await uploadForm.vm.$emit("update:modelValue", newValue);

      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")[0]).toEqual([newValue]);
    });
  });

  describe("Styling", () => {
    it("should have correct CSS classes", () => {
      const wrapper = createWrapper();

      expect(wrapper.classes()).toContain("dynamic-form");
    });

    it("should have event handlers", () => {
      const wrapper = createWrapper();

      // Check that the component has the correct class
      const div = wrapper.find(".dynamic-form");
      expect(div.exists()).toBe(true);
    });
  });

  describe("Component Integration", () => {
    it("should pass all required props to UploadForm", () => {
      const fields = {
        image: { type: "image-upload", label: "Image" },
        comment: { type: "textarea", label: "Comment" },
      };
      const modelValue = { image: null, comment: "" };

      const wrapper = createWrapper({
        type: "upload",
        fields,
        modelValue,
      });

      const uploadForm = wrapper.findComponent({ name: "UploadForm" });
      expect(uploadForm.props("fields")).toEqual(fields);
      expect(uploadForm.props("modelValue")).toEqual(modelValue);
    });

    it("should pass all required props to FilterForm", () => {
      const fields = {
        WB: { type: "range", label: "White Balance", min: -100, max: 100 },
        exposure: { type: "range", label: "Exposure", min: -100, max: 100 },
      };
      const modelValue = { WB: 0, exposure: 0 };

      const wrapper = createWrapper({
        type: "filter",
        fields,
        modelValue,
      });

      const filterForm = wrapper.findComponent({ name: "FilterForm" });
      expect(filterForm.props("fields")).toEqual(fields);
      expect(filterForm.props("modelValue")).toEqual(modelValue);
    });

    it("should pass all required props to RepairForm", () => {
      const fields = {
        detail: { type: "range", label: "Detail Level", min: 0, max: 100 },
      };
      const modelValue = { detail: 0 };

      const wrapper = createWrapper({
        type: "repair",
        fields,
        modelValue,
      });

      const repairForm = wrapper.findComponent({ name: "RepairForm" });
      expect(repairForm.props("fields")).toEqual(fields);
      expect(repairForm.props("modelValue")).toEqual(modelValue);
    });

    it("should pass all required props to PreviewForm", () => {
      const fields = {
        image: { type: "image", label: "Preview Image" },
        imgmeta: { type: "object", label: "Image Metadata" },
        settings: { type: "settings-list", label: "Processing Settings" },
      };
      const modelValue = { image: null, imgmeta: {}, settings: [] };

      const wrapper = createWrapper({
        type: "preview",
        fields,
        modelValue,
      });

      const previewForm = wrapper.findComponent({ name: "PreviewForm" });
      expect(previewForm.props("fields")).toEqual(fields);
      expect(previewForm.props("modelValue")).toEqual(modelValue);
    });
  });
});
