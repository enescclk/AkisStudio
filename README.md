# Akış Studio

**Akış Studio is a free desktop diagram editor for creating flowcharts, system diagrams, electronics diagrams, and electrical schematics.**

It works locally on your computer, requires no account, and does not depend on an online diagram service. Projects can be saved as editable `.akis` files or exported as SVG, PNG, JPEG, and PDF.

## Features

### Diagram editing

- Drag and resize diagram elements directly on the canvas
- Double-click any existing or newly added box to edit its text
- Press `Enter` to save text, `Shift + Enter` for a new line, or `Esc` to cancel
- Drag across an empty area to select multiple items
- Hold `Shift` and click to add or remove items from the current selection
- Move, duplicate, copy, paste, or delete multiple selected items together
- Undo and redo support
- Automatic layout for connected diagrams

### Connections

- Hold `Ctrl` and click the source and target boxes to create a connection automatically
- Connections attach to the center of the most suitable box edges
- Create connections manually from the connection handles on a selected box
- Move either endpoint of an existing connection to another box
- Straight, curved, and orthogonal connection routing
- Solid, dashed, dotted, and dash-dot line styles
- Configurable start and end arrowheads
- Adjustable connection color, thickness, corner radius, and endpoint size
- VCC connections automatically use red
- GND connections automatically use black

### Shape library

- Standard diagram and flowchart shapes
- Text, boxes, notes, tables, documents, databases, decisions, and arrows
- Electronics symbols such as resistors, capacitors, inductors, diodes, LEDs, transistors, op-amps, VCC, and GND
- Electrical symbols such as motors, lamps, fuses, relays, transformers, meters, and AC/DC sources
- Searchable shape library
- Save selected elements as reusable custom shapes
- Scrollable and resizable sidebar
- Shape sizes remain fixed while additional items fill the available row space

### Canvas and appearance

- Adaptive three-level grid that remains readable at different zoom levels
- Optional grid snapping
- Zoom controls and fit-to-diagram
- Pan the canvas with the middle mouse button or by holding `Space`
- Light, dark, and system themes
- Font family, font size, bold, italic, underline, text color, and alignment controls
- Fill color, border color, border thickness, and corner radius controls

### Saving and export

- Automatic local backup
- Native editable `.akis` project files
- Export to SVG
- Export to PNG
- Export to JPEG
- Export to PDF

## Installation

### Requirements

- [Node.js LTS](https://nodejs.org/)
- npm, which is included with Node.js

### Run from source

```bash
git clone https://github.com/enescclk/AkisStudio.git
cd AkisStudio
npm install
npm start