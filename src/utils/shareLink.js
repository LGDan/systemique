/**
 * Share model via link: pako-compressed payload in URL param.
 * Payload format matches PersistenceService export (system + interfaceTypes + interfaceRules).
 */

import pako from 'pako'

const PARAM_NAME = 'data'

function base64urlEncode(uint8Array) {
  let binary = ''
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i])
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad) base64 += '===='.slice(0, 4 - pad)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Build export-style payload and return base64url-encoded compressed string.
 * @param {{ system: object, interfaceTypes?: array, interfaceRules?: object }} payload - Same shape as PersistenceService export (system = system.toJSON()).
 * @returns {string}
 */
export function encodeSharePayload(payload) {
  const obj = {
    version: '1.0',
    system: payload.system,
    interfaceTypes: payload.interfaceTypes ?? null,
    interfaceRules: payload.interfaceRules ?? null
  }
  const json = JSON.stringify(obj)
  const bytes = new TextEncoder().encode(json)
  const compressed = pako.deflate(bytes)
  return base64urlEncode(compressed)
}

/**
 * Decompress and parse a base64url-encoded share payload.
 * @param {string} base64urlString
 * @returns {{ system: object, interfaceTypes?: array, interfaceRules?: object }}
 * @throws if invalid or missing system
 */
export function decodeSharePayload(base64urlString) {
  const compressed = base64urlDecode(base64urlString)
  const inflated = pako.inflate(compressed)
  const json = new TextDecoder().decode(inflated)
  const data = JSON.parse(json)
  if (!data || !data.system) {
    throw new Error('Invalid share payload: missing system')
  }
  return {
    system: data.system,
    interfaceTypes: data.interfaceTypes ?? null,
    interfaceRules: data.interfaceRules ?? null
  }
}

/**
 * Build the full shareable URL for the given encoded payload.
 * Uses current origin + pathname so it works with base path (e.g. GitHub Pages).
 */
export function getShareUrl(encodedPayload) {
  if (typeof globalThis.window === 'undefined' || !globalThis.window.location) {
    return ''
  }
  const { origin, pathname, search } = globalThis.window.location
  const base = origin + pathname + (search || '')
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}${PARAM_NAME}=${encodedPayload}`
}

/**
 * Read and decode shared model from current URL if present.
 * @returns {{ system: object, interfaceTypes?, interfaceRules? } | null}
 */
export function getSharedDataFromUrl() {
  if (typeof globalThis.window === 'undefined' || !globalThis.window.location?.search) {
    return null
  }
  const params = new URLSearchParams(globalThis.window.location.search)
  const value = params.get(PARAM_NAME)
  if (!value || value.trim() === '') return null
  try {
    return decodeSharePayload(value.trim())
  } catch {
    return null
  }
}

/**
 * Remove the share data param from the current URL without reload.
 */
export function clearSharedDataFromUrl() {
  if (typeof globalThis.window === 'undefined' || !globalThis.window.history) return
  const url = new URL(globalThis.window.location.href)
  url.searchParams.delete(PARAM_NAME)
  const newUrl = url.pathname + (url.search || '') + (url.hash || '')
  globalThis.window.history.replaceState({}, '', newUrl)
}

export { PARAM_NAME }
