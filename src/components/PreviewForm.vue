<template>
  <div class="preview-form" @mousedown.stop @click.stop>
    <div v-for="(field, key) in fields" :key="key" class="form-field">
      <label :for="key" class="field-label">
        {{ field.label }}
        <span v-if="field.required" class="required">*</span>
      </label>

      <!-- Image Preview -->
      <div
        v-if="field.type === 'image'"
        class="image-preview"
        @dragover="handleDragOver"
        @drop="handleImageDrop($event, key)"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        :class="{ 'drag-over': isDragOver }"
      >
        <img
          v-if="modelValue[key]"
          :src="modelValue[key]"
          :alt="field.label"
          class="preview-image"
        />
        <div v-else class="no-image">
          {{ field.placeholder }}
        </div>
        <div v-if="isDragOver" class="drop-overlay">
          <div class="drop-overlay-content">
            <span class="drop-icon">📁</span>
            <span>Drop new image here</span>
          </div>
        </div>
      </div>

      <!-- Object Display (Read-only) -->
      <div v-else-if="field.type === 'object'" class="object-display">
        <pre>{{ JSON.stringify(modelValue[key] || {}, null, 2) }}</pre>
      </div>

      <!-- Settings List Display -->
      <div v-else-if="field.type === 'settings-list'" class="settings-list">
        <div
          v-if="modelValue[key] && modelValue[key].length > 0"
          class="settings-container"
        >
          <div
            v-for="setting in modelValue[key]"
            :key="`${setting.type}-${setting.key}`"
            class="setting-item"
          >
            <div class="setting-header">
              <span class="setting-type">{{
                setting.type === "filter" ? "🎨 Filter" : "🔧 Repair"
              }}</span>
              <span class="setting-label">{{ setting.label }}</span>
            </div>
            <div class="setting-value">{{ setting.value }}</div>
          </div>
        </div>
        <div v-else class="no-settings">
          {{ field.placeholder }}
        </div>
      </div>

      <!-- Textarea (Read-only for preview) -->
      <textarea
        v-else-if="field.type === 'textarea'"
        :id="key"
        :placeholder="field.placeholder"
        :required="field.required"
        :rows="field.rows || 3"
        :value="modelValue[key]"
        @input="handleInputChange($event, key)"
        @mousedown.stop
        @click.stop
        class="form-input textarea"
        :readonly="field.readonly || true"
      ></textarea>

      <!-- Default Text Input (Read-only for preview) -->
      <input
        v-else
        :id="key"
        type="text"
        :placeholder="field.placeholder"
        :required="field.required"
        :value="modelValue[key]"
        @input="handleInputChange($event, key)"
        @mousedown.stop
        @click.stop
        class="form-input"
        :readonly="field.readonly || true"
      />

      <div v-if="field.description" class="field-description">
        {{ field.description }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PreviewForm",
  props: {
    fields: {
      type: Object,
      required: true,
    },
    modelValue: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      isDragOver: false,
    };
  },
  methods: {
    handleInputChange(event, key) {
      const newValue = { ...this.modelValue };
      newValue[key] = event.target.value;
      this.$emit("update:modelValue", newValue);
    },

    handleDragOver(event) {
      event.preventDefault();
      event.stopPropagation();
    },

    handleDragEnter(event) {
      event.preventDefault();
      event.stopPropagation();
      this.isDragOver = true;
    },

    handleDragLeave(event) {
      event.preventDefault();
      event.stopPropagation();
      // Only set to false if we're leaving the drop zone entirely
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.isDragOver = false;
      }
    },

    handleImageDrop(event, key) {
      event.preventDefault();
      event.stopPropagation();
      this.isDragOver = false;

      const files = event.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        // Check if it's an image file
        if (file.type.startsWith("image/")) {
          // For image preview, we just update the preview
          const reader = new FileReader();
          reader.onload = (e) => {
            const newValue = { ...this.modelValue };
            newValue[key] = e.target.result;
            this.$emit("update:modelValue", newValue);
          };
          reader.readAsDataURL(file);
        } else {
          alert("Please drop an image file (JPG, PNG, GIF, WebP)");
        }
      }
    },
  },
};
</script>

<style scoped>
.preview-form {
  padding: 1rem;
  pointer-events: auto;
  position: relative;
  z-index: 10;
}

.form-field {
  margin-bottom: 1rem;
}

.field-label {
  display: block;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.required {
  color: #dc3545;
  margin-left: 0.25rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.field-description {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

/* Read-only styling */
.form-input[readonly] {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.image-preview {
  border: 2px dashed #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
  background: #f8f9fa;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  z-index: 20;
}

.image-preview.drag-over {
  border-color: #667eea;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-image {
  color: #6c757d;
  font-style: italic;
}

.drop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(102, 126, 234, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  z-index: 10;
}

.drop-overlay-content {
  color: white;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.drop-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: white;
}

.object-display {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.8rem;
  font-family: "Courier New", monospace;
  max-height: 100px;
  overflow-y: auto;
}

.settings-list {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.5rem;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.5rem;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.setting-type {
  font-size: 0.8rem;
  font-weight: 600;
  color: #495057;
}

.setting-label {
  font-size: 0.8rem;
  color: #6c757d;
}

.setting-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #667eea;
}

.no-settings {
  color: #6c757d;
  font-style: italic;
  text-align: center;
  padding: 0.5rem;
}
</style> 