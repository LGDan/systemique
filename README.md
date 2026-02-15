# Systemique

**Systemique** is a powerful, browser-based systems design tool that enables you to visually design complex systems by connecting components together. Each component supports inputs and outputs, can be nested into subsystems, and includes comprehensive validation and security features.

---

**[🟢 → Open Systemique Here 🔗](https://lgdan.github.io/systemique/)**

---

## Beware!

> [!WARNING]
> 🤖 This project is vibe-coded with a large amount of human edits due to issues with vue flow, and the need for custom components.

## Features

### 🎨 Visual Design Canvas

- **Drag-and-drop interface** built on Vue Flow for intuitive system design
- **Component palette** with predefined components that can be customized
- **Interactive canvas** with minimap, zoom controls, and background grid
- **Component positioning** with automatic layout and manual positioning

### 🔗 Component Management

- **Components** with customizable properties, icons, and descriptions
- **Interfaces** (input/output ports) on each component with type validation
- **Connection validation** ensures only compatible interfaces can be connected
- **Component grouping** - link multiple components together and group them into reusable components
- **Component library** - maintain a library of predefined components for reuse

### 🔄 Nested Systems

- **Drill-down capability** - double-click components to design nested subsystems
- **Hierarchical navigation** with breadcrumb navigation
- **System nesting** - components can contain entire subsystems
- **Multi-level system management** with support for unlimited nesting depth

### 🛡️ Interface Management & Rules

- **Interface types** - define custom interface types (e.g., "Power", "Data", "Signal")
- **Connection rules** - set rules to control which interface types can connect
- **Interface validation** - automatic validation when creating connections
- **Interface positioning** - configure interface positions (top, bottom, left, right)
- **Custom icons** - assign icons to interfaces for visual identification

### 🔒 Security Features

- **Component trust levels** - mark components as trusted, untrusted, or ignored
- **Interface access control** - set access levels on individual interfaces
- **Interface Access Audit** - comprehensive audit of interface access levels across the system
- **Boundary Audit** - analyze security boundaries and trust relationships
- **Security reporting** - identify potential security issues in system design

### 📦 Export & Documentation

- **JSON export** - export complete system designs with all metadata
- **Bill of Materials (BOM)** - automatically generate component lists
- **CSV export** - export BOM data in CSV format for external tools
- **Documentation generation** - automated documentation of system architecture
- **Import/Export** - save and load system designs with full compatibility

### 💾 Persistence

- **Local storage** - automatic saving to browser local storage
- **File import/export** - save designs as JSON files
- **System state management** - maintain system state across sessions

## Technology Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next-generation frontend build tool
- **Vue Flow** - Node-based flow diagram library
- **Pinia** - State management for Vue
- **Material Design Icons** - Icon library
- **Docker** - Containerization for deployment

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- (Optional) Docker and Docker Compose for containerized deployment

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd systemique
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173` (or the port shown in the terminal)

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory, ready to be served by any static file server.

## Usage

### Creating a System

1. **Add Components**: Drag components from the palette on the left onto the canvas
2. **Connect Components**: Click and drag from an output interface to an input interface
3. **Configure Properties**: Select a component to edit its properties in the right panel
4. **Add Interfaces**: Use the interface editor to add input/output ports to components
5. **Group Components**: Select multiple components and group them into a new component

### Working with Nested Systems

1. **Drill Down**: Double-click a component that has a nested system
2. **Design Subsystem**: Add components and connections within the nested system
3. **Navigate Back**: Use the breadcrumb navigation to return to parent systems

### Managing Interface Rules

1. Switch to the **Interface Management** tab
2. **Define Interface Types**: Create custom interface types (e.g., "Power", "Data", "Network")
3. **Set Connection Rules**: Define which interface types can connect to each other
4. **Validate Connections**: The system will automatically validate connections based on rules

### Security Auditing

1. Switch to the **Security** tab
2. **Set Trust Levels**: Mark components as trusted, untrusted, or ignored
3. **Set Interface Access**: Configure access levels on individual interfaces
4. **Run Audits**: Use Interface Access Audit and Boundary Audit tools to identify security issues

### Exporting Systems

1. **Export as JSON**: Use "Save As" in the menu to export the complete system
2. **Export BOM**: The export includes a Bill of Materials with component counts
3. **Export Documentation**: System documentation is included in the JSON export
4. **Export CSV**: BOM data can be exported separately as CSV

## Project Structure

```text
systemique/
├── src/
│   ├── components/          # Vue components
│   │   ├── SystemCanvas.vue      # Main design canvas
│   │   ├── ComponentPalette.vue  # Component library palette
│   │   ├── PropertiesPanel.vue   # Component properties editor
│   │   ├── RulesEditor.vue       # Interface rules editor
│   │   ├── SecurityPanel.vue     # Security auditing tools
│   │   └── ...
│   ├── models/              # Data models
│   │   ├── System.js            # System model
│   │   ├── Component.js         # Component model
│   │   ├── Interface.js         # Interface model
│   │   └── Connection.js         # Connection model
│   ├── stores/              # Pinia stores
│   │   ├── systemStore.js        # System state management
│   │   ├── componentLibraryStore.js
│   │   ├── interfaceTypesStore.js
│   │   └── interfaceRulesStore.js
│   ├── utils/               # Utility functions
│   │   ├── exportService.js      # Export functionality
│   │   ├── bomGenerator.js       # BOM generation
│   │   ├── documentGenerator.js  # Documentation generation
│   │   ├── connectionValidator.js # Connection validation
│   │   └── persistenceService.js # Save/load functionality
│   ├── config/              # Configuration files
│   │   ├── defaultInterfaceTypes.js
│   │   └── iconLibrary.js
│   ├── App.vue              # Main application component
│   └── main.js              # Application entry point
├── public/
│   └── component-library.json  # Predefined component library
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile              # Docker build configuration
├── nginx.conf              # Nginx configuration
└── package.json            # Project dependencies
```

## Deployment

Systemique can be deployed as a static website. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions, including:

- Docker deployment with optimized build caching
- Docker Compose setup
- Nginx configuration
- Production considerations

### Quick Docker Deployment

```bash
docker-compose up -d --build
```

The application will be available at `http://localhost:8080`.

## Development

### Key Concepts

- **System**: A container for components and connections. Systems can be nested.
- **Component**: A block in the system with interfaces, properties, and optional nested systems.
- **Interface**: An input or output port on a component with a type and validation rules.
- **Connection**: A link between two interfaces (output to input).
- **Interface Type**: A category for interfaces (e.g., "Power", "Data") that enables connection validation.
- **Connection Rule**: Defines which interface types can connect to each other.

### State Management

The application uses Pinia stores for state management:

- `systemStore`: Manages the current system, navigation, and system operations
- `componentLibraryStore`: Manages the component library
- `interfaceTypesStore`: Manages interface type definitions
- `interfaceRulesStore`: Manages connection rules

### Adding Custom Components

Components are defined in `public/component-library.json`. You can:

1. Edit the JSON file directly
2. Use the component library interface in the application
3. Import components from exported systems

## Browser Support

Systemique works in all modern browsers that support:

- ES6+ JavaScript
- CSS Grid and Flexbox
- Local Storage API

Tested browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
