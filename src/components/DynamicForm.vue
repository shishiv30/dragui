<template>
  <div class="dynamic-form" @mousedown.stop @click.stop>
    <!-- Upload Form -->
    <UploadForm
      v-if="type === 'upload'"
      :fields="fields"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Filter Form -->
    <FilterForm
      v-else-if="type === 'filter'"
      :fields="fields"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Repair Form -->
    <RepairForm
      v-else-if="type === 'repair'"
      :fields="fields"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Preview Form -->
    <PreviewForm
      v-else-if="type === 'preview'"
      :fields="fields"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Fallback for unknown types -->
    <div v-else class="unknown-type">Unknown form type: {{ type }}</div>
  </div>
</template>

<script>
import UploadForm from "./UploadForm.vue";
import FilterForm from "./FilterForm.vue";
import RepairForm from "./RepairForm.vue";
import PreviewForm from "./PreviewForm.vue";

export default {
  name: "DynamicForm",
  components: {
    UploadForm,
    FilterForm,
    RepairForm,
    PreviewForm,
  },
  props: {
    type: {
      type: String,
      required: true,
      validator: (value) =>
        ["upload", "filter", "repair", "preview"].includes(value),
    },
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
};
</script>

<style scoped>
.dynamic-form {
  padding: 1rem;
  pointer-events: auto;
  position: relative;
  z-index: 10;
}

.unknown-type {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}
</style> 