# Systemique

Systemique is a systems design tool that involves linkning blocks together to form systems.
Each block is a component of the system, supports inputs and outputs, and can be 'drilled down' into, where subsystems can be built.
Components can be predefined and presented in a drag-and-drop pallete, and properties can be modified.
Linked blocks can be grouped into components themselves, then re-used.
Rules are set on component interfaces to ensure that only connections can be made that actually make sense.

The whole design can then be exported to form a bill of materials, and automated documents on how the system goes together.

The tool is HTML5 based and uses vue (with vite) and the vue-flow library for its main design canvas.

The tool does not need any server apart from to serve the static files and store predefined components.

I've supplied a vue-flow template application as a starter, but it's very barebones. We can iterate upon it.