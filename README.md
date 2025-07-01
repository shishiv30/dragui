# Workflow Builder

A responsive Vue 3 + Vite application for creating workflows with drag and drop functionality.

## Features

- **Drag & Drop Interface**: Drag components from the left panel to the main workspace
- **Automatic Connections**: New components are automatically connected to the previous component
- **Interactive Nodes**: Click to select, drag to move, and delete nodes
- **Zoom Controls**: Zoom in/out and reset zoom level
- **Save/Load**: Save workflows to localStorage and load them back
- **Export**: Export workflows as JSON files
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

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

## How to Use

### Creating a Workflow

1. **Add Components**: Drag components from the left panel to the main workspace
2. **Move Components**: Click and drag nodes to reposition them
3. **Select Components**: Click on a node to select it (highlighted with blue border)
4. **Delete Components**: Click the "×" button on any node to delete it
5. **Automatic Connections**: New components are automatically connected to the previous component with arrows

### Available Components

- **Start** (▶️): Starting point of the workflow
- **Process** (⚙️): Processing step
- **Decision** (❓): Decision point
- **Action** (🔧): Action step
- **End** (⏹️): End point
- **Data** (📊): Data handling

### Controls

- **Save**: Save the current workflow to browser localStorage
- **Load**: Load the previously saved workflow
- **Clear**: Clear all components from the workspace
- **Export**: Download the workflow as a JSON file
- **Zoom Controls**: Use +, -, and Reset buttons to control zoom level

### Responsive Design

- **Desktop**: Full layout with sidebar and main workspace
- **Tablet**: Sidebar moves to top as a horizontal scrollable list
- **Mobile**: Optimized layout for small screens

## Technical Details

### Tech Stack

- **Vue 3**: Progressive JavaScript framework
- **Vite**: Fast build tool and development server
- **Vue Draggable Next**: Drag and drop functionality
- **VueUse**: Vue composition utilities

### Architecture

- **Component-based**: Modular Vue components
- **Composition API**: Modern Vue 3 composition API
- **Responsive CSS**: Flexbox and CSS Grid for layout
- **SVG Graphics**: Connection lines drawn with SVG

### File Structure

```
src/
├── App.vue          # Main application component
├── main.js          # Application entry point
├── style.css        # Global styles
└── components/      # Additional components (if any)
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License.
