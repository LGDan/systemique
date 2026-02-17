/**
 * Draw.io export: convert a Systemique system to draw.io uncompressed XML.
 * Structure: grouped shapes (component = group with bg rect + interface ellipses), edges between interface cells.
 */

const DEFAULT_GROUP_WIDTH = 240
const DEFAULT_GROUP_HEIGHT = 100
const INTERFACE_SIZE = 20
const INTERFACE_SPACING = 30
const PADDING = 10

function escapeXmlAttr(value) {
  if (value == null) return ''
  const s = String(value)
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function attr(key, value) {
  if (value == null || value === '') return ''
  const escaped = typeof value === 'object' ? escapeXmlAttr(JSON.stringify(value)) : escapeXmlAttr(value)
  return ` ${key}="${escaped}"`
}

function partitionInterfaces(interfaces) {
  const left = []
  const right = []
  const top = []
  const bottom = []
  for (const iface of interfaces) {
    const pos = (iface.position || '').toLowerCase()
    if (pos === 'left') left.push(iface)
    else if (pos === 'right') right.push(iface)
    else if (pos === 'top') top.push(iface)
    else if (pos === 'bottom') bottom.push(iface)
    else left.push(iface)
  }
  return { left, right, top, bottom }
}

function computeGroupSize(interfaces) {
  const { left, right, top, bottom } = partitionInterfaces(interfaces)
  const vertCount = Math.max(left.length, right.length, 1)
  const horzCount = Math.max(top.length, bottom.length, 1)
  const width = Math.max(DEFAULT_GROUP_WIDTH, 60 + INTERFACE_SPACING * horzCount)
  const height = Math.max(DEFAULT_GROUP_HEIGHT, 40 + INTERFACE_SPACING * vertCount)
  return { width, height }
}

function buildInterfaceLayout(interfaces, width, height) {
  const { left, right, top, bottom } = partitionInterfaces(interfaces)
  const layout = []
  left.forEach((iface, i) => {
    layout.push({ iface, x: PADDING, y: PADDING + INTERFACE_SPACING * i })
  })
  right.forEach((iface, i) => {
    layout.push({ iface, x: width - PADDING - INTERFACE_SIZE, y: PADDING + INTERFACE_SPACING * i })
  })
  top.forEach((iface, i) => {
    layout.push({ iface, x: PADDING + INTERFACE_SPACING * i, y: PADDING })
  })
  bottom.forEach((iface, i) => {
    layout.push({ iface, x: PADDING + INTERFACE_SPACING * i, y: height - PADDING - INTERFACE_SIZE })
  })
  return layout
}

function ellipseStyleForPosition(position) {
  const pos = (position || 'left').toLowerCase()
  if (pos === 'left') {
    return 'ellipse;html=1;aspect=fixed;labelPosition=left;verticalLabelPosition=middle;align=right;verticalAlign=middle;spacing=20;labelBackgroundColor=default;'
  }
  if (pos === 'right') {
    return 'ellipse;html=1;aspect=fixed;labelPosition=right;verticalLabelPosition=middle;align=left;verticalAlign=middle;spacing=20;labelBackgroundColor=default;'
  }
  if (pos === 'top') {
    return 'ellipse;html=1;aspect=fixed;labelPosition=center;verticalLabelPosition=top;align=center;verticalAlign=bottom;spacing=20;labelBackgroundColor=default;'
  }
  if (pos === 'bottom') {
    return 'ellipse;html=1;aspect=fixed;labelPosition=center;verticalLabelPosition=bottom;align=center;verticalAlign=top;spacing=20;labelBackgroundColor=default;'
  }
  return 'ellipse;html=1;aspect=fixed;labelPosition=left;verticalLabelPosition=middle;align=right;verticalAlign=middle;spacing=20;labelBackgroundColor=default;'
}

function buildComponentCells(component, width, height) {
  const x = component.position?.x ?? 0
  const y = component.position?.y ?? 0
  const cid = escapeXmlAttr(component.id)
  const name = escapeXmlAttr(component.name)
  const type = escapeXmlAttr(component.type)
  const properties = escapeXmlAttr(JSON.stringify(component.properties || {}))
  const nestedSystemId = escapeXmlAttr(component.nestedSystemId ?? '')
  const metadata = escapeXmlAttr(JSON.stringify(component.metadata || {}))
  const icon = escapeXmlAttr(component.icon ?? '')
  const categories = escapeXmlAttr(JSON.stringify(component.categories || []))
  const description = escapeXmlAttr(component.description ?? '')
  const trust = escapeXmlAttr(component.trust ?? '')

  let out = ''
  out += `<object label="" placeholders="1" name="${name}" type="${type}" properties="${properties}" nestedSystemId="${nestedSystemId}" metadata="${metadata}" icon="${icon}" categories="${categories}" description="${description}" trust="${trust}" id="${cid}">\n`
  out += `          <mxCell connectable="0" parent="1" style="group" vertex="1">\n`
  out += `            <mxGeometry height="${height}" width="${width}" x="${x}" y="${y}" as="geometry" />\n`
  out += `          </mxCell>\n`
  out += `        </object>\n`

  const bgrectLabel = '%name%<div><i><font style="font-size: 10px;">%type%</font></i></div>'
  out += `        <object label="${escapeXmlAttr(bgrectLabel)}" placeholders="1" id="${cid}-bgrect">\n`
  out += `          <mxCell parent="${cid}" style="rounded=1;whiteSpace=wrap;html=1;align=center;" vertex="1">\n`
  out += `            <mxGeometry height="${height}" width="${width}" as="geometry" />\n`
  out += `          </mxCell>\n`
  out += `        </object>\n`

  const layout = buildInterfaceLayout(component.interfaces || [], width, height)
  for (const { iface, x: ix, y: iy } of layout) {
    const iid = escapeXmlAttr(iface.id)
    const iname = escapeXmlAttr(iface.name)
    const itype = escapeXmlAttr(iface.type)
    const idir = escapeXmlAttr(iface.direction ?? '')
    const ipos = escapeXmlAttr(iface.position ?? '')
    const iicon = escapeXmlAttr(iface.icon ?? '')
    const iaccess = escapeXmlAttr(iface.access ?? '')
    const irules = escapeXmlAttr(JSON.stringify(iface.validationRules || {}))
    const imeta = escapeXmlAttr(JSON.stringify(iface.metadata || {}))
    const style = ellipseStyleForPosition(iface.position)
    out += `        <object label="%name%" placeholders="1" name="${iname}" type="${itype}" direction="${idir}" position="${ipos}" icon="${iicon}" access="${iaccess}" validationRules="${irules}" metadata="${imeta}" id="${iid}">\n`
    out += `          <mxCell parent="${cid}" style="${style}" vertex="1">\n`
    out += `            <mxGeometry height="${INTERFACE_SIZE}" width="${INTERFACE_SIZE}" x="${ix}" y="${iy}" as="geometry" />\n`
    out += `          </mxCell>\n`
    out += `        </object>\n`
  }

  return out
}

function buildEdgeCells(connections) {
  let out = ''
  const edgeStyle = 'rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=none;endFill=0;'
  connections.forEach((conn, idx) => {
    const eid = escapeXmlAttr(conn.id || `edge-${idx}`)
    const src = escapeXmlAttr(conn.sourceInterfaceId)
    const tgt = escapeXmlAttr(conn.targetInterfaceId)
    out += `        <mxCell id="${eid}" edge="1" parent="1" source="${src}" target="${tgt}" style="${edgeStyle}">\n`
    out += `          <mxGeometry relative="1" as="geometry" />\n`
    out += `        </mxCell>\n`
  })
  return out
}

/**
 * Export a Systemique system to draw.io uncompressed XML string.
 * @param {import('../models/System.js').System} system
 * @returns {string}
 */
export function exportToDrawio(system) {
  const diagramId = 'systemique-export-' + Date.now()
  let rootContent = ''
  rootContent += '        <mxCell id="0" />\n'
  rootContent += '        <mxCell id="1" parent="0" />\n'

  const components = system.components || []
  const connections = system.connections || []

  for (const comp of components) {
    const { width, height } = computeGroupSize(comp.interfaces || [])
    rootContent += buildComponentCells(comp, width, height)
  }

  rootContent += buildEdgeCells(connections)

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" agent="Systemique" version="29.4.0">
  <diagram name="Page-1" id="${escapeXmlAttr(diagramId)}">
    <mxGraphModel dx="2583" dy="1351" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
${rootContent}      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`
}
