const PROMO_2X28_PRICE = 28
const COLOR_TIPO_DARK = 'oscuro'
const COLOR_TIPO_COLOR = 'color'

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
  const discountAmount = Math.max(0, sumPrices - PROMO_2X28_PRICE)

  return { valid: true, discountAmount }
}
