/**
 * Icon Library - Maps icon names to Material Design Icons
 */
import {
  mdiServer,
  mdiRouterNetwork,
  mdiDatabase,
  mdiPowerSocket,
  mdiPowerSocketUs,
  mdiPowerSocketEu,
  mdiPowerSocketUk,
  mdiPowerPlug,
  mdiServerNetwork,
  mdiApi,
  mdiApplicationBraces,
  mdiNetworkOutline,
  mdiCubeOutline,
  mdiServerPlus,
  mdiServerMinus,
  mdiServerSecurity,
  mdiCloudOutline,
  mdiCog,
  mdiMemory,
  mdiArrowExpandVertical,
  mdiEthernet,
  mdiEthernetCable,
  mdiTable,
  mdiTableRow,
  mdiTableColumn,
  mdiHarddisk,
  mdiLanConnect,
  mdiLanPending,
  mdiPowerPlugOutline,
  mdiUsb,
  mdiHdmiPort,
  mdiVideoInputHdmi,
  mdiMicroSd,
  mdiUsbCPort,
  mdiLaserPointer,
  mdiIp,
  mdiWeb,
  mdiCodeBraces,
  mdiQrcode,
  mdiKey,
  mdiKeyboard,
  mdiMouse,
  mdiPrinter,
  mdiScanner,
  mdiSpeaker,
  mdiBarcode,
  mdiDoor,
  mdiTestTube,
  mdiCarBattery,
  mdiWifi,
  mdiAccessPoint,
  mdiBluetooth,
  mdiFolderKey,
  mdiFolderKeyNetwork,
  mdiOfficeBuilding,
  mdiWallFire,
  mdiDisc,
  mdiApps,
  mdiAccount,
  mdiAccountMultiple,
  mdiEmoticon,
  mdiExpansionCard,
  mdiExpansionCardVariant,
  mdiNas,
  mdiApplication,
  mdiPackage,
  mdiPackageVariant,
  mdiPackageVariantClosed,
  mdiEngine,
  mdiCheckboxIntermediate,
  mdiDesktopTower,
  mdiCircleBox
} from '@mdi/js'

/**
 * Icon registry - maps simple names to MDI icon paths
 */
export const iconRegistry = {
  // Server & Infrastructure
  'server': mdiServer,
  'rack': mdiServer, // Using server icon for rack
  'server-rack': mdiServer,
  'server-network': mdiServerNetwork,
  'server-plus': mdiServerPlus,
  'server-minus': mdiServerMinus,
  'server-security': mdiServerSecurity,
  'desktop-tower': mdiDesktopTower,
  
  // Network
  'switch': mdiRouterNetwork,
  'network': mdiNetworkOutline,
  'router': mdiRouterNetwork,
  'ethernet': mdiEthernet,
  'ethernet-cable': mdiEthernetCable,
  'cable': mdiEthernetCable,
  'lan-cable': mdiLanConnect,
  'fiber': mdiLanPending,
  'fiber-cable': mdiLanPending,
  'wall-fire': mdiWallFire,
  'wifi': mdiWifi,
  'access-point': mdiAccessPoint,
  'bluetooth': mdiBluetooth,
  
  // Storage & Data
  'database': mdiDatabase,
  'storage': mdiCubeOutline,
  'table': mdiTable,
  'table-row': mdiTableRow,
  'table-column': mdiTableColumn,
  'harddisk': mdiHarddisk,
  'microsd': mdiMicroSd,
  'folder-key': mdiFolderKey,
  'folder-key-network': mdiFolderKeyNetwork,
  'nas': mdiNas,
  
  // Power
  'pdu': mdiPowerSocket,
  'power-socket-us': mdiPowerSocketUs,
  'power-socket-eu': mdiPowerSocketEu,
  'power-socket-uk': mdiPowerSocketUk,
  'power-plug': mdiPowerPlug,
  'power-cable': mdiPowerPlugOutline,
  
  // USB & Connectors
  'usb': mdiUsb,
  'usb-cable': mdiUsb,
  'hdmi': mdiHdmiPort,
  'hdmi-cable': mdiVideoInputHdmi,
  'usb-c-port': mdiUsbCPort,
  'laser-pointer': mdiLaserPointer,

  // Services & Software
  'api': mdiApi,
  'api-service': mdiApi,
  'application': mdiApplication,
  'cloud': mdiCloudOutline,
  'cog': mdiCog,
  'ip': mdiIp,
  'web': mdiWeb,
  'code-braces': mdiCodeBraces,
  'disc': mdiDisc,
  'apps': mdiApps,
  'application-braces': mdiApplicationBraces,
  'account': mdiAccount,
  'account-multiple': mdiAccountMultiple,
  'emoticon': mdiEmoticon,
  'package': mdiPackage,
  'package-variant': mdiPackageVariant,
  'package-variant-closed': mdiPackageVariantClosed,
  'engine': mdiEngine,
  'checkbox-intermediate': mdiCheckboxIntermediate,
  
  // Hardware
  'memory': mdiMemory,
  'component': mdiCubeOutline,
  'rack-unit': mdiArrowExpandVertical,
  'expansion-card': mdiExpansionCard,
  'expansion-card-variant': mdiExpansionCardVariant,

  // Physical
  'physical': mdiCubeOutline,
  'office-building': mdiOfficeBuilding,
  'door': mdiDoor,
  'test-tube': mdiTestTube,
  'car-battery': mdiCarBattery,
  'qrcode': mdiQrcode,
  'key': mdiKey,
  'keyboard': mdiKeyboard,
  'mouse': mdiMouse,
  'printer': mdiPrinter,
  'scanner': mdiScanner,
  'speaker': mdiSpeaker,
  'barcode': mdiBarcode,
  'circle-box': mdiCircleBox

}

/**
 * Get icon path by name
 * @param {string} iconName - The icon name (e.g., 'server', 'database')
 * @returns {string|null} - The SVG path data or null if not found
 */
export function getIconPath(iconName) {
  if (!iconName) return null
  return iconRegistry[iconName.toLowerCase()] || null
}

/**
 * Check if an icon exists
 * @param {string} iconName - The icon name
 * @returns {boolean}
 */
export function hasIcon(iconName) {
  return iconName && iconRegistry.hasOwnProperty(iconName.toLowerCase())
}

/**
 * Get all available icon names
 * @returns {string[]}
 */
export function getAvailableIcons() {
  return Object.keys(iconRegistry)
}

