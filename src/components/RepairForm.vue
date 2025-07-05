<template>
  <div class="repair-form" @mousedown.stop @click.stop>
    <div v-for="(field, key) in fields" :key="key" class="form-field">
      <label :for="key" class="field-label">
        {{ field.label }}
        <span v-if="field.required" class="required">*</span>
      </label>

      <!-- Range Input -->
      <div v-if="field.type === 'range'" class="range-container">
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
          (modelValue[key] || field.defaultValue) + "%"
        }}</span>
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
  name: "RepairForm",
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
  },
};
</script>

<style scoped>
.repair-form {
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