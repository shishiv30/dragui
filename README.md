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
- **Comprehensive Testing**: Unit, integration, component, and E2E tests

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

### Testing

The project includes comprehensive testing with multiple testing frameworks:

#### Unit and Component Tests (Vitest)

Run all tests:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests with coverage:
```bash
npm run test:coverage
```

#### End-to-End Tests (Playwright)

Run E2E tests:
```bash
npm run test:e2e
```

Run E2E tests in UI mode:
```bash
npx playwright test --ui
```

#### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── config/             # Component configuration tests
│   └── services/           # ComfyUI service tests
├── components/             # Component tests
├── integration/            # Integration tests
├── e2e/                   # End-to-end tests
├── utils/                 # Test utilities and helpers
├── fixtures/              # Test fixtures and mock data
└── setup.js               # Test environment setup
```

#### Test Coverage

The test suite covers:
- **Unit Tests**: Component configuration, validation logic, service methods
- **Component Tests**: Vue component rendering, props, events, and interactions
- **Integration Tests**: Workflow management, drag and drop, validation
- **E2E Tests**: Complete user workflows, mobile responsiveness, error handling

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

## Development

### Project Structure

```
src/
├── App.vue                    # Main application component
├── main.js                    # Application entry point
├── style.css                  # Global styles
├── components/
│   ├── DynamicForm.vue        # Form router component
│   ├── UploadForm.vue         # Image upload form
│   ├── FilterForm.vue         # Image filter form
│   ├── RepairForm.vue         # Image repair form
│   └── PreviewForm.vue        # Image preview form
├── config/
│   └── components.js          # Component configuration
└── services/
    └── comfyui.js             # ComfyUI API service
```

### Key Technologies

- **Vue 3**: Composition API for reactive components
- **Vite**: Fast build tool and development server
- **CSS Grid/Flexbox**: Responsive layout system
- **HTML5 Drag & Drop**: Native drag and drop API
- **Touch Events**: Custom mobile touch handling
- **ComfyUI API**: External AI processing integration

### Testing Strategy

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test workflow management and component interactions
- **Component Tests**: Test Vue component rendering and behavior
- **E2E Tests**: Test complete user workflows and mobile responsiveness

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
