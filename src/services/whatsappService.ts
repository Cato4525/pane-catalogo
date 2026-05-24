import { Product, Reserva, Cliente } from '../types'

const WHATSAPP_NUMBER = '593999999999'

export const abrirWhatsAppConsulta = (producto: Product) => {
  const mensaje = encodeURIComponent(
    `Hola, deseo consultar el producto ${producto.modelo || producto.id} - ${producto.name}`
  )
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank')
}

export const abrirWhatsAppReserva = (
  cliente: Cliente,
  reserva: Reserva,
  items: { nombre: string; cantidad: number; precio: number }[]
) => {
  const productosList = items
    .map(item => `• ${item.nombre} x${item.cantidad} = $${item.precio * item.cantidad}`)
    .join('\n')

  const mensaje = encodeURIComponent(
    `Hola, acabo de realizar una reserva desde el catálogo.\n\n` +
    `*Nombre:* ${cliente.nombre}\n` +
    `*Teléfono:* ${cliente.telefono}\n\n` +
    `*Productos:*\n${productosList}\n\n` +
    `*Total:* $${reserva.total}\n` +
    `*Abono:* $${reserva.abono}\n` +
    `*Saldo:* $${reserva.saldo}\n\n` +
    `Gracias por atender mi pedido.`
  )

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank')
}

export const abrirWhatsAppMensaje = (mensaje: string) => {
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`, '_blank')
}
