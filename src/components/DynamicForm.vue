<template>
  <div class="dynamic-form" @mousedown.stop @click.stop>
    <div v-for="(field, key) in fields" :key="key" class="form-field">
      <label :for="key" class="field-label">
        {{ field.label }}
        <span v-if="field.required" class="required">*</span>
      </label>

      <!-- File Input -->
      <div
        v-if="field.type === 'file'"
        class="file-drop-zone"
        @dragover="handleDragOver"
        @drop="handleFileDrop($event, key)"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        :class="{ 'drag-over': isDragOver }"
      >
        <input
          :id="key"
          type="file"
          :accept="field.accept"
          :required="field.required"
          @change="handleFileChange($event, key)"
          @mousedown.stop
          @click.stop
          class="form-input file-input"
        />
        <div class="drop-zone-content">
          <div class="drop-icon">📁</div>
          <div class="drop-text">
            <span>Click to select or drag image here</span>
            <span class="drop-hint">Supports: JPG, PNG, GIF, WebP</span>
          </div>
        </div>
      </div>

      <!-- Image Upload (Combined File + Preview) -->
      <div
        v-else-if="field.type === 'image-upload'"
        class="image-upload-zone"
        @dragover="handleDragOver"
        @drop="handleImageUploadDrop($event, key)"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        :class="{ 'drag-over': isDragOver }"
      >
        <input
          :id="key"
          type="file"
          :accept="field.accept"
          :required="field.required"
          @change="handleImageUploadChange($event, key)"
          @mousedown.stop
          @click.stop
          class="form-input file-input"
        />

        <!-- Show file path before upload -->
        <div v-if="!hasImage(key)" class="upload-content">
          <div class="drop-icon">📁</div>
          <div class="drop-text">
            <span>{{ field.placeholder }}</span>
            <span class="drop-hint">Supports: JPG, PNG, GIF, WebP</span>
          </div>
        </div>

        <!-- Show image preview after upload -->
        <div v-else class="image-preview-content">
          <img
            :src="getImagePreview(key)"
            :alt="field.label"
            class="upload-preview-image"
          />
          <div class="image-overlay">
            <div class="overlay-content">
              <span class="overlay-icon">🔄</span>
              <span>Drop new image to replace</span>
            </div>
          </div>
        </div>

        <!-- Show file path below preview -->
        <div v-if="hasImage(key)" class="file-path">
          {{ getFilePath(key) }}
        </div>
      </div>

      <!-- Range Input -->
      <div v-else-if="field.type === 'range'" class="range-container">
        <input
          :id="key"
          type="range"
          :min="field.min"
          :max="field.max"
          :step="field.step"
          :value="modelValue[key] || field.defaultValue"
          @input="handleRangeChange($event, key)"
          @mousedown.stop
          @click.stop
          class="range-slider"
        />
        <span class="range-value">{{
          modelValue[key] || field.defaultValue
        }}</span>
      </div>

      <!-- Textarea -->
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
        :readonly="field.readonly"
      ></textarea>

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

      <!-- Image Preview -->
      <div
        v-else-if="field.type === 'image'"
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

      <!-- Default Text Input -->
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
        :readonly="field.readonly"
      />

      <div v-if="field.description" class="field-description">
        {{ field.description }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "DynamicForm",
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

    handleRangeChange(event, key) {
      const newValue = { ...this.modelValue };
      newValue[key] = parseInt(event.target.value);
      this.$emit("update:modelValue", newValue);
    },

    handleFileChange(event, key) {
      const file = event.target.files[0];
      this.processFile(file, key);
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

    handleFileDrop(event, key) {
      event.preventDefault();
      event.stopPropagation();
      this.isDragOver = false;

      const files = event.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        // Check if it's an image file
        if (file.type.startsWith("image/")) {
          this.processFile(file, key);
        } else {
          alert("Please drop an image file (JPG, PNG, GIF, WebP)");
        }
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

    handleImageUploadChange(event, key) {
      const file = event.target.files[0];
      this.processImageUpload(file, key);
    },

    handleImageUploadDrop(event, key) {
      event.preventDefault();
      event.stopPropagation();
      this.isDragOver = false;

      const files = event.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          this.processImageUpload(file, key);
        } else {
          alert("Please drop an image file (JPG, PNG, GIF, WebP)");
        }
      }
    },

    processImageUpload(file, key) {
      if (file) {
        const newValue = { ...this.modelValue };

        // Store the file object
        newValue[key] = file;

        // Store the file path
        newValue[`${key}_path`] = file.name;

        // Auto-generate metadata and preview for image files
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              newValue[`${key}_meta`] = {
                name: file.name,
                size: file.size,
                type: file.type,
                width: img.width,
                height: img.height,
                lastModified: file.lastModified,
              };
              // Set preview image
              newValue[`${key}_preview`] = e.target.result;
              this.$emit("update:modelValue", newValue);
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        }

        this.$emit("update:modelValue", newValue);
      }
    },

    hasImage(key) {
      return this.modelValue[key] && this.modelValue[`${key}_preview`];
    },

    getImagePreview(key) {
      return this.modelValue[`${key}_preview`] || "";
    },

    getFilePath(key) {
      return this.modelValue[`${key}_path`] || "";
    },

    processFile(file, key) {
      if (file) {
        const newValue = { ...this.modelValue };
        newValue[key] = file;

        // Auto-generate metadata and preview for image files
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              newValue.imgmeta = {
                name: file.name,
                size: file.size,
                type: file.type,
                width: img.width,
                height: img.height,
                lastModified: file.lastModified,
              };
              // Set preview image
              newValue.preview = e.target.result;
              this.$emit("update:modelValue", newValue);
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        }

        this.$emit("update:modelValue", newValue);
      }
    },
  },
};
</script>

<style scoped>
.dynamic-form {
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

.file-drop-zone {
  position: relative;
  border: 2px dashed #e9ecef;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: #f8f9fa;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.file-drop-zone:hover {
  border-color: #667eea;
  background: #f0f2ff;
}

.file-drop-zone.drag-over {
  border-color: #667eea;
  background: #e8f0ff;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.drop-zone-content {
  pointer-events: none;
  z-index: 1;
}

.drop-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #6c757d;
}

.drop-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #495057;
  font-weight: 500;
}

.drop-hint {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: normal;
}

.range-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.range-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e9ecef;
  outline: none;
  -webkit-appearance: none;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
}

.range-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: none;
}

.range-value {
  min-width: 40px;
  text-align: center;
  font-weight: 600;
  color: #667eea;
  font-size: 0.9rem;
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

.image-upload-zone {
  position: relative;
  border: 2px dashed #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  background: #f8f9fa;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.image-upload-zone:hover {
  border-color: #667eea;
  background: #f0f2ff;
}

.image-upload-zone.drag-over {
  border-color: #667eea;
  background: #e8f0ff;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.upload-content {
  pointer-events: none;
  z-index: 1;
}

.image-preview-content {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100px;
}

.upload-preview-image {
  max-width: 100%;
  max-height: 150px;
  border-radius: 4px;
  object-fit: contain;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 4px;
}

.image-preview-content:hover .image-overlay {
  opacity: 1;
}

.overlay-content {
  text-align: center;
  color: white;
}

.overlay-icon {
  font-size: 1.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.file-path {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #6c757d;
  word-break: break-all;
  max-width: 100%;
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
</style> 