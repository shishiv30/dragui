<template>
  <div class="upload-form" @mousedown.stop @click.stop>
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

      <div v-if="field.description" class="field-description">
        {{ field.description }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "UploadForm",
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
.upload-form {
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

.field-description {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.25rem;
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
</style> 