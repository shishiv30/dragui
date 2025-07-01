export const componentConfig = {
  upload: {
    name: "Upload Image",
    icon: "📁",
    type: "upload",
    description: "Upload and configure image input",
    order: 1, // Must be first
    required: true, // Required in workflow
    validation: {
      requires: [], // No prerequisites
      requiredBy: ["filter", "repair"], // Required by these components
    },
    fields: {
      image: {
        type: "image-upload",
        label: "Image",
        placeholder: "Click to select or drag image here",
        required: true,
        accept: "image/*",
      },
      comment: {
        type: "textarea",
        label: "Description",
        placeholder: "Describe the photo...",
        required: false,
        rows: 3,
      },
    },
  },
  filter: {
    name: "Image Filter",
    icon: "🎨",
    type: "filter",
    description: "Apply color and exposure filters",
    order: 2,
    optional: true, // This component is optional
    validation: {
      requires: ["upload"], // Requires upload component
      requiredBy: [], // Not required by anything
    },
    fields: {
      WB: {
        type: "range",
        label: "White Balance",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        required: false,
      },
      exposure: {
        type: "range",
        label: "Exposure",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        required: false,
      },
    },
  },
  repair: {
    name: "Image Repair",
    icon: "🔧",
    type: "repair",
    description: "Repair and enhance image details",
    order: 3,
    optional: true, // This component is optional
    validation: {
      requires: ["upload"], // Requires upload component
      requiredBy: [], // Not required by anything
    },
    fields: {
      detail: {
        type: "range",
        label: "Detail Level",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
        required: false,
      },
    },
  },
  preview: {
    name: "Preview",
    icon: "🖼️",
    type: "preview",
    description: "Preview the processed image",
    order: 4, // Must be last
    isFinal: true, // This is the final step
    validation: {
      requires: ["upload"], // Only requires upload
      requiredBy: [], // Nothing comes after preview
    },
    fields: {
      image: {
        type: "image",
        label: "Preview Image",
        placeholder: "Image will appear here after processing",
        readonly: true,
      },
      imgmeta: {
        type: "object",
        label: "Image Metadata",
        placeholder: "Image metadata (auto-generated)",
        readonly: true,
      },
      settings: {
        type: "settings-list",
        label: "Processing Settings",
        placeholder: "No processing settings applied",
        readonly: true,
      },
    },
  },
};

// Helper function to get component by type
export const getComponentByType = (type) => {
  return componentConfig[type] || null;
};

// Helper function to get all available components
export const getAvailableComponents = () => {
  return Object.keys(componentConfig)
    .filter((key) => !componentConfig[key].autoAdded) // Hide auto-added components
    .map((key) => ({
      id: key,
      name: componentConfig[key].name,
      icon: componentConfig[key].icon,
      type: componentConfig[key].type,
      description: componentConfig[key].description,
      order: componentConfig[key].order,
      optional: componentConfig[key].optional,
      validation: componentConfig[key].validation,
      isFinal: componentConfig[key].isFinal,
    }));
};

// Validation helper functions
export const validateWorkflow = (workflowNodes) => {
  const errors = [];
  const nodeTypes = workflowNodes.map((node) => node.componentType);

  // Check if upload component exists
  if (!nodeTypes.includes("upload")) {
    errors.push("Upload component is required");
  }

  // Check if preview component exists (should be auto-added)
  if (!nodeTypes.includes("preview")) {
    errors.push(
      "Preview component is required (will be auto-added after image upload)"
    );
  }

  // Check component order and dependencies
  workflowNodes.forEach((node, index) => {
    const config = componentConfig[node.componentType];
    if (config && config.validation) {
      // Check if required components come before this one
      config.validation.requires.forEach((requiredType) => {
        const requiredIndex = nodeTypes.indexOf(requiredType);
        if (requiredIndex === -1) {
          errors.push(
            `${config.name} requires ${
              componentConfig[requiredType]?.name || requiredType
            }`
          );
        } else if (requiredIndex > index) {
          errors.push(
            `${config.name} must come after ${
              componentConfig[requiredType]?.name || requiredType
            }`
          );
        }
      });
    }
  });

  return errors;
};

export const canAddComponent = (componentType, existingNodes) => {
  const config = componentConfig[componentType];
  if (!config || !config.validation) return true;

  const existingTypes = existingNodes.map((node) => node.componentType);

  // Only block if preview is the last node and user is trying to add at the end
  const lastNode = existingNodes[existingNodes.length - 1];
  if (
    lastNode &&
    componentConfig[lastNode.componentType]?.isFinal &&
    // Only block if not inserting before preview (i.e., only if adding at the end)
    componentType !== "preview"
  ) {
    return {
      allowed: false,
      reason: "Cannot add components after the final preview step",
    };
  }

  // Check if all required components exist
  const missingRequirements = config.validation.requires.filter(
    (requiredType) => !existingTypes.includes(requiredType)
  );

  if (missingRequirements.length > 0) {
    return {
      allowed: false,
      reason: `Requires: ${missingRequirements
        .map((type) => componentConfig[type]?.name || type)
        .join(", ")}`,
    };
  }

  return { allowed: true };
};
