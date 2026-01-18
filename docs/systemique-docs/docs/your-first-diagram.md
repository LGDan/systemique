# Your First Diagram

This guide will walk you through creating your first system diagram in Systemique by adding components and editing their properties.

## The Interface

When you first open Systemique, you'll see three main areas:

![Systemique Interface](@site/static/img/systemique-empty-canvas.png)

1. **Component Library (Left Panel)**: A scrollable list of available components you can add to your system
2. **Design Canvas (Center)**: The main workspace where you'll build your system diagram
3. **Properties Panel (Right Panel)**: Shows properties of the selected component

## Adding Your First Component

### Step 1: Browse the Component Library

The Component Library on the left shows all available components. Each component displays:

- An icon (or the first letter of its type if no icon is set)
- The component name
- The component type
- The number of input and output interfaces (e.g., "9 in / 1 out")

You can:

- **Search** for components using the search box at the top
- **Filter by category** using the dropdown menu
- **Scroll** through the list to find what you need

### Step 2: Drag and Drop a Component

To add a component to your diagram:

1. **Click and hold** on any component in the Component Library (e.g., "Rackmount Server")
2. **Drag** it to the center canvas area
3. **Release** the mouse button to drop the component

The component will appear on the canvas at the position where you dropped it. You can drag it around to reposition it as needed.

## Editing Component Properties

Once you've added a component to the canvas, you can customize its properties.

### Step 1: Select a Component

**Click** on the component on the canvas to select it. When selected, the component will be highlighted, and the Properties Panel on the right will update to show the component's details.

### Step 2: Edit Basic Properties

In the Properties Panel, you can edit:

- **Name**: The display name of the component (e.g., "Web Server 01")
- **Type**: The component type (e.g., "server", "switch", "database")
- **Description**: A detailed description of what the component does
- **Icon**: Choose an icon to represent the component visually
- **Category**: The category this component belongs to

### Example: Renaming a Component

1. Select the component on the canvas
2. In the Properties Panel, find the "Name" field
3. Click in the field and type a new name (e.g., "Production Web Server")
4. The name will update on the canvas automatically

### Example: Adding a Description

1. With the component selected, scroll down in the Properties Panel
2. Find the "Description" text area
3. Enter a description like: "Main web server handling HTTP requests for the production environment"
4. The description will be saved with the component

## Tips

- **Multiple Components**: You can add as many components as you need by repeating the drag-and-drop process
- **Repositioning**: Click and drag components on the canvas to rearrange them
- **Selection**: Click anywhere on the canvas (not on a component) to deselect the current component
- **Undo/Redo**: Use `Ctrl+Z` (or `Cmd+Z` on Mac) to undo and `Ctrl+Shift+Z` (or `Cmd+Shift+Z` on Mac) to redo actions

## Next Steps

Now that you know how to add components and edit their properties, you're ready to:

- **[Connect Components](./connecting-components)**: Learn how to link components together using interfaces
- **[Add Interfaces](./interfaces)**: Add custom input and output ports to your components
- **[Create Nested Systems](./nested-systems)**: Design subsystems within components
