export const generateWhatsAppLink = (phone, orderDetails) => {
  // Asegurar formato de teléfono (ejemplo simple para Colombia, ajustar según país)
  const cleanPhone = phone.replace(/\D/g, '');
  const prefix = cleanPhone.length === 10 ? '57' : '';
  const fullPhone = `${prefix}${cleanPhone}`;

  const message = `¡Hola! 👋 Tu pedido de Bambu Maki está confirmado. 🍣🔥\n\n` +
    `*Resumen del Pedido:*\n${orderDetails}\n\n` +
    `¡Gracias por preferirnos! Estará listo pronto.`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
};
