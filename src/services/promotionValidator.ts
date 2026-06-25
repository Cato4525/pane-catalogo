import { PromotionRules, ColorPair, ALL_COLOR_PAIRS } from '../types/marketing'

const COLOR_TIPO_DARK = 'oscuro'
const COLOR_TIPO_COLOR = 'color'
const COLOR_TIPO_BLACK = 'negro'

export interface ValidatePromotionItem {
  productId: string
  price: number
  quantity: number
  colorTipo?: string
  colorName?: string
}

export interface ValidatePromotionResult {
  valid: boolean
  message: string | null
  discountAmount?: number
}

function getColorTipoCategory(tipo: string | undefined): string {
  if (!tipo) return ''
  const t = tipo.toLowerCase()
  if (t === COLOR_TIPO_COLOR || t === COLOR_TIPO_DARK || t === COLOR_TIPO_BLACK) return t
  if (t === 'claro' || t === 'blanco' || t === 'beige') return 'claro'
  return t
}

function buildPair(a: string, b: string): ColorPair {
  const pair = [a, b].sort() as [string, string]
  if (pair[0] === 'color' && pair[1] === 'color') return 'color+color'
  if (pair[0] === 'color' && pair[1] === 'negro') return 'color+negro'
  if (pair[0] === 'color' && pair[1] === 'oscuro') return 'color+oscuro'
  if (pair[0] === 'negro' && pair[1] === 'negro') return 'negro+negro'
  if (pair[0] === 'negro' && pair[1] === 'oscuro') return 'oscuro+negro'
  if (pair[0] === 'oscuro' && pair[1] === 'oscuro') return 'oscuro+oscuro'
  return `${pair[0]}+${pair[1]}` as ColorPair
}

function calculateDiscountFor2x28(
  items: ValidatePromotionItem[],
  flat: ValidatePromotionItem[]
): number {
  const sumPrices = flat.reduce((s, i) => s + i.price, 0)
  return Math.max(0, sumPrices - 28)
}

export function validatePromotionRules(
  rules: PromotionRules | null | undefined,
  items: ValidatePromotionItem[]
): ValidatePromotionResult {
  if (!rules || !rules.colorCombinationMode) {
    return { valid: true, message: null }
  }

  const totalQty = items.reduce((s, i) => s + i.quantity, 0)
  if (totalQty < 2) {
    return { valid: false, message: 'Agrega al menos 2 productos para aplicar la promoción.' }
  }

  const flat: ValidatePromotionItem[] = []
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      flat.push({ ...item, quantity: 1 })
    }
  }

  const tipos = flat.map(i => getColorTipoCategory(i.colorTipo))
  const sinTipo = tipos.filter(t => !t).length

  if (sinTipo > 0) {
    return { valid: false, message: 'Todos los productos deben tener un tipo de color asignado.' }
  }

  const { colorCombinationMode, allowedCombinations, blockedCombinations } = rules

  switch (colorCombinationMode) {
    case 'different': {
      const tiposSet = new Set(tipos)
      const colorCount = tipos.filter(t => t === COLOR_TIPO_COLOR).length
      const darkCount = tipos.filter(t => t === COLOR_TIPO_DARK).length
      const blackCount = tipos.filter(t => t === COLOR_TIPO_BLACK).length

      if (tiposSet.size < 2) {
        const soloTipo = [...tiposSet][0]
        const label = soloTipo === COLOR_TIPO_COLOR ? 'color'
          : soloTipo === COLOR_TIPO_DARK ? 'oscuro'
          : soloTipo === COLOR_TIPO_BLACK ? 'negro'
          : soloTipo
        return {
          valid: false,
          message: `Son productos con el mismo tipo de color (${label}), no aplica a la promoción. Cambie cualquier producto por un color diferente para aplicar a la promoción.`,
        }
      }

      if (colorCount > 0 && darkCount > 0 && blackCount === 0) {
        if (colorCount === darkCount) {
          return { valid: true, message: null }
        }
        return {
          valid: false,
          message: `Debe haber la misma cantidad de prendas de color y oscuras. Tienes ${colorCount} color(es) y ${darkCount} oscura(s).`,
        }
      }

      if (colorCount > 0 && blackCount > 0 && darkCount === 0) {
        if (colorCount === blackCount) {
          return { valid: true, message: null }
        }
        return {
          valid: false,
          message: `Debe haber la misma cantidad de prendas de color y negras. Tienes ${colorCount} color(es) y ${blackCount} negra(s).`,
        }
      }

      return {
        valid: false,
        message: 'Esta promoción requiere combinaciones de tipos de color diferentes (color + oscuro, color + negro).',
      }
    }

    case 'same': {
      const uniqueTipos = new Set(tipos)
      if (uniqueTipos.size === 1) {
        return { valid: true, message: null }
      }
      return {
        valid: false,
        message: 'Esta promoción solo aplica para productos del mismo grupo de color.',
      }
    }

    case 'custom': {
      if (flat.length < 2) {
        return {
          valid: false,
          message: 'Agrega al menos 2 productos para evaluar las combinaciones.',
        }
      }

      for (let i = 0; i < flat.length; i += 2) {
        if (i + 1 >= flat.length) {
          if (flat.length % 2 !== 0) {
            return {
              valid: false,
              message: 'La cantidad de productos debe ser par para formar pares.',
            }
          }
          break
        }

        const tipoA = tipos[i]
        const tipoB = tipos[i + 1]
        const pair = buildPair(tipoA, tipoB)

        if (blockedCombinations && blockedCombinations.includes(pair)) {
          return {
            valid: false,
            message: `Combinación no permitida: ${pair.replace('+', ' + ')}.`,
          }
        }

        if (allowedCombinations && allowedCombinations.length > 0 && !allowedCombinations.includes(pair)) {
          return {
            valid: false,
            message: `Combinación no permitida: ${pair.replace('+', ' + ')}.`,
          }
        }
      }

      return { valid: true, message: null }
    }

    default:
      return { valid: true, message: null }
  }
}

// Legacy 2x$28 validator (kept for backward compatibility)
export interface Validate2x28Item {
  productId: string
  price: number
  quantity: number
  colorTipo?: string
  colorName?: string
}

export interface Validate2x28Result {
  valid: boolean
  message?: string
  discountAmount?: number
}

export function getCartColorTypesTip(
  items: ValidatePromotionItem[],
  rules: PromotionRules | null | undefined
): string | null {
  if (!rules || rules.colorCombinationMode !== 'different') return null

  const flat: ValidatePromotionItem[] = []
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      flat.push({ ...item, quantity: 1 })
    }
  }

  const tipos = [...new Set(flat.map(i => getColorTipoCategory(i.colorTipo)).filter(Boolean))]

  if (tipos.length === 0) return null
  if (tipos.length >= 2) return null

  const soloTipo = tipos[0]
  const label = soloTipo === COLOR_TIPO_COLOR ? 'color'
    : soloTipo === COLOR_TIPO_DARK ? 'oscuro'
    : soloTipo === COLOR_TIPO_BLACK ? 'negro'
    : soloTipo

  const suggestions = [COLOR_TIPO_COLOR, COLOR_TIPO_DARK, COLOR_TIPO_BLACK]
    .filter(t => t !== soloTipo)
    .map(t => t === COLOR_TIPO_COLOR ? 'color' : t === COLOR_TIPO_DARK ? 'oscuro' : 'negro')
    .join(' o ')

  return `Ya agregaste un producto ${label}. Elige un producto de diferente tipo (${suggestions}) para aplicar la promoción.`
}

export function validate2x28Promotion(items: Validate2x28Item[]): Validate2x28Result {
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  if (totalQty < 2) {
    return {
      valid: false,
      message: 'La promoción 2x$28 requiere exactamente 2 prendas.',
    }
  }

  if (totalQty > 2) {
    return {
      valid: false,
      message: 'La promoción 2x$28 requiere exactamente 2 prendas.',
    }
  }

  const flat: Validate2x28Item[] = []
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      flat.push({ ...item, quantity: 1 })
    }
  }

  const dark = flat.filter(i => i.colorTipo === COLOR_TIPO_DARK)
  const color = flat.filter(i => i.colorTipo === COLOR_TIPO_COLOR)
  const sinTipo = flat.filter(i => i.colorTipo !== COLOR_TIPO_DARK && i.colorTipo !== COLOR_TIPO_COLOR)

  if (sinTipo.length > 0) {
    return {
      valid: false,
      message: 'La promoción 2x$28 requiere exactamente una prenda oscura y una prenda de color.',
    }
  }

  if (dark.length !== 1 || color.length !== 1) {
    return {
      valid: false,
      message: 'La promoción 2x$28 requiere exactamente una prenda oscura y una prenda de color.',
    }
  }

  if (dark[0].colorName && color[0].colorName && dark[0].colorName === color[0].colorName) {
    return {
      valid: false,
      message: 'No se permite aplicar la promoción con dos prendas del mismo color.',
    }
  }

  const sumPrices = flat.reduce((s, i) => s + i.price, 0)
  const discountAmount = Math.max(0, sumPrices - 28)

  return { valid: true, discountAmount }
}
