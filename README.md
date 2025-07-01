# DragUI - Image Processing Workflow Builder

A responsive Vue 3 + Vite application for creating image processing workflows with drag and drop functionality, featuring ComfyUI integration for AI-powered image processing.

## Features

- **Drag & Drop Interface**: Drag components from the left panel to the main workspace
- **Image Upload**: Drag and drop images directly into upload components with preview
- **Image Processing Components**: 
  - **Upload**: Drag-and-drop image upload with metadata extraction
  - **Filter**: Adjust white balance and exposure
  - **Repair**: Enhance image details
  - **Preview**: View processed image with metadata and settings
- **Automatic Connections**: New components are automatically connected in sequence
- **Interactive Nodes**: Click to select, drag to move, expand/collapse, and delete nodes
- **Real-time Preview**: See image preview and processing settings in real-time
- **Zoom Controls**: Zoom in/out and reset zoom level
- **Save/Load**: Save workflows to localStorage and load them back
- **Export**: Export workflows as JSON files
- **ComfyUI Integration**: Execute workflows on ComfyUI for AI-powered processing
- **Validation**: Workflow validation ensures proper component order and dependencies
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- ComfyUI (optional, for AI processing)

### Installation

1. Clone the repository or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Deployment

#### GitHub Pages (Recommended)

1. Push your code to GitHub
2. Enable GitHub Pages in your repository settings
3. Set the source to "GitHub Actions"
4. The workflow will automatically build and deploy on every push to main

#### Manual Deployment

Deploy to GitHub Pages manually:
```bash
npm run deploy
```

## Live Demo

Visit the live demo: [https://yourusername.github.io/dragui/](https://yourusername.github.io/dragui/)

## How to Use

### Creating an Image Processing Workflow

1. **Upload Image**: Drag the "Upload Image" component to the workspace, then drag an image file into it
2. **Add Processing Steps**: Drag "Image Filter" and/or "Image Repair" components between upload and preview
3. **Configure Settings**: Adjust filter settings (white balance, exposure) and repair settings (detail level)
4. **Preview Results**: The preview component shows the processed image, metadata, and all applied settings
5. **Execute Workflow**: Click "Run Workflow" to process the image through ComfyUI (requires ComfyUI running)

### Available Components

- **Upload Image** (📁): Drag-and-drop image upload with metadata extraction
- **Image Filter** (🎨): Adjust white balance (-100 to 100) and exposure (-100 to 100)
- **Image Repair** (🔧): Enhance image details (0 to 100)
- **Preview** (🖼️): View processed image with metadata and processing settings

### Workflow Rules

- **Upload is required**: Must be the first component
- **Preview is required**: Must be the last component
- **Filter/Repair are optional**: Can be added between upload and preview
- **Processing steps require upload**: Filter and repair components only work after an image is uploaded

### Controls

- **Save**: Save the current workflow to browser localStorage
- **Load**: Load the previously saved workflow
- **Clear**: Clear all components from the workspace
- **Export**: Download the workflow as a JSON file
- **Run Workflow**: Execute the workflow on ComfyUI (requires ComfyUI connection)
- **Zoom Controls**: Use +, -, and Reset buttons to control zoom level

### Image Upload Features

- **Drag & Drop**: Drag image files directly into the upload component
- **File Selection**: Click to select image files from your computer
- **Supported Formats**: JPG, PNG, GIF, WebP
- **Metadata Extraction**: Automatically extracts file name, size, dimensions, and type
- **Image Preview**: Shows thumbnail of uploaded image

### Preview Component Features

- **Image Display**: Shows the processed image
- **Metadata Display**: Shows file information (name, size, dimensions, type)
- **Settings Summary**: Lists all applied filter and repair settings with values
- **Real-time Updates**: Updates automatically when settings change

## ComfyUI Integration

### Setup

1. Install and run ComfyUI on your local machine
2. Ensure ComfyUI is running on `http://127.0.0.1:8188`
3. The app will automatically detect the connection and show "Connected" status

### Workflow Execution

1. Create your image processing workflow
2. Upload an image
3. Configure filter and repair settings
4. Click "Run Workflow" to execute on ComfyUI
5. Check ComfyUI for the processed results

### Supported ComfyUI Nodes

- **LoadImage**: For image upload
- **ImageFilter**: For filter operations
- **ImageRepair**: For repair operations
- **PreviewImage**: For final preview

## Technical Details

### Tech Stack

- **Vue 3**: Progressive JavaScript framework with Composition API
- **Vite**: Fast build tool and development server
- **ComfyUI API**: Integration with ComfyUI for AI processing
- **File API**: Drag and drop file handling
- **Canvas API**: Image processing and preview

### Architecture

- **Component-based**: Modular Vue components
- **Composition API**: Modern Vue 3 composition API
- **Dynamic Forms**: Configurable form components based on JSON configuration
- **Responsive CSS**: Flexbox and CSS Grid for layout
- **SVG Graphics**: Connection lines drawn with SVG
- **State Management**: Reactive state with Vue 3 refs and computed properties

### File Structure

```
src/
├── App.vue                    # Main application component
├── main.js                    # Application entry point
├── style.css                  # Global styles
├── components/
│   ├── DynamicForm.vue        # Dynamic form component
│   └── HelloWorld.vue         # Example component
├── config/
│   └── components.js          # Component configuration
└── services/
    └── comfyui.js             # ComfyUI API service
```

### Component Configuration

Components are defined in `src/config/components.js` with:
- **Fields**: Form fields with types (file, range, textarea, object, image, settings-list)
- **Validation**: Dependencies and requirements
- **Order**: Processing order constraints
- **Metadata**: Icons, descriptions, and behavior

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

### Adding New Components

1. Define the component in `src/config/components.js`
2. Add form fields with appropriate types
3. Define validation rules and dependencies
4. The DynamicForm component will automatically render the form

### Adding New Field Types

1. Add the field type to the DynamicForm component
2. Add corresponding CSS styles
3. Update the component configuration to use the new field type

## License

This project is open source and available under the MIT License.
