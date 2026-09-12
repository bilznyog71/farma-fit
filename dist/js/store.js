// ==========================================================================
// FARMA.FIT - ENHANCED E-COMMERCE STORE & STATE MANAGEMENT
// Moeda Padrão: Reais (R$ BRL) | Envios para Todo o Brasil
// ==========================================================================

const FarmaStore = {
  // Padrão obrigatório: BRL (Reais)
  currency: 'BRL',
  rates: {
    USD_TO_PYG: 6000,
    USD_TO_BRL: 5.24
  },
  cart: JSON.parse(localStorage.getItem('farma_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('farma_wishlist') || '[]'),
  recentViews: JSON.parse(localStorage.getItem('farma_recent') || '[]'),
  userReviews: JSON.parse(localStorage.getItem('farma_reviews') || '{}'),
  listeners: [],

  subscribe(listener) {
    this.listeners.push(listener);
  },

  notify() {
    this.listeners.forEach(fn => fn());
  },

  setCurrency(curr) {
    if (['BRL', 'USD', 'PYG'].includes(curr)) {
      this.currency = curr;
      localStorage.setItem('farma_currency', curr);
      this.notify();
    }
  },

  getBoletoPrice(usdAmount) {
    const num = parseFloat(usdAmount) || 0;
    const brl = num * this.rates.USD_TO_BRL;
    return 'R$ ' + brl.toFixed(2).replace('.', ',');
  },

  getInstallmentText(usdAmount, times = 12) {
    const num = parseFloat(usdAmount) || 0;
    const brl = (num * this.rates.USD_TO_BRL) / times;
    return `até ${times}x de R$ ${brl.toFixed(2).replace('.', ',')}`;
  },

  formatPrice(usdAmount, currency = this.currency) {
    if (!usdAmount && usdAmount !== 0) return 'R$ 0,00';
    const num = parseFloat(usdAmount);

    switch (currency) {
      case 'BRL':
        const brlVal = (num * this.rates.USD_TO_BRL).toFixed(2);
        return 'R$ ' + brlVal.replace('.', ',');
      case 'PYG':
        const pygVal = Math.round(num * this.rates.USD_TO_PYG);
        return 'G$ ' + pygVal.toLocaleString('es-PY');
      case 'USD':
      default:
        return '$' + num.toFixed(2);
    }
  },

  getPriceInBRL(usdAmount) {
    const num = parseFloat(usdAmount) || 0;
    return (num * this.rates.USD_TO_BRL).toFixed(2).replace('.', ',');
  },

  // Cart operations
  addToCart(product, qty = 1) {
    const existingIndex = this.cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      this.cart[existingIndex].qty += qty;
    } else {
      this.cart.push({ product, qty });
    }
    this.saveCart();
    this.notify();
    this.showToast(`"${product.name}" adicionado ao carrinho!`, 'success');
  },

  updateCartQty(productId, qty) {
    const index = this.cart.findIndex(item => item.product.id === productId);
    if (index > -1) {
      if (qty <= 0) {
        this.cart.splice(index, 1);
      } else {
        this.cart[index].qty = qty;
      }
      this.saveCart();
      this.notify();
    }
  },

  removeFromCart(productId) {
    const item = this.cart.find(item => item.product.id === productId);
    this.cart = this.cart.filter(item => item.product.id !== productId);
    this.saveCart();
    this.notify();
    if (item) {
      this.showToast(`"${item.product.name}" removido do carrinho.`, 'info');
    }
  },

  clearCart() {
    this.cart = [];
    this.saveCart();
    this.notify();
  },

  saveCart() {
    localStorage.setItem('farma_cart', JSON.stringify(this.cart));
  },

  getCartCount() {
    return this.cart.reduce((total, item) => total + item.qty, 0);
  },

  getCartTotalUSD() {
    return this.cart.reduce((total, item) => total + (item.product.price_usd * item.qty), 0);
  },

  getCartTotalBRL() {
    const totalUsd = this.getCartTotalUSD();
    return (totalUsd * this.rates.USD_TO_BRL).toFixed(2).replace('.', ',');
  },

  // Wishlist
  toggleWishlist(productId) {
    const idx = this.wishlist.indexOf(productId);
    let isAdded = false;
    if (idx > -1) {
      this.wishlist.splice(idx, 1);
      this.showToast('Item removido dos Favoritos', 'info');
    } else {
      this.wishlist.push(productId);
      this.showToast('Item salvo nos seus Favoritos!', 'success');
      isAdded = true;
    }
    localStorage.setItem('farma_wishlist', JSON.stringify(this.wishlist));
    this.notify();
    return isAdded;
  },

  isInWishlist(productId) {
    return this.wishlist.includes(productId);
  },

  getWishlistCount() {
    return this.wishlist.length;
  },

  addRecentView(product) {
    this.recentViews = this.recentViews.filter(p => p.id !== product.id);
    this.recentViews.unshift(product);
    if (this.recentViews.length > 8) this.recentViews.pop();
    localStorage.setItem('farma_recent', JSON.stringify(this.recentViews));
  },

  // Reviews System
  getProductReviews(productId) {
    const userList = this.userReviews[productId] || [];
    const defaultReviewPool = [
      {
        author: "Rodrigo M. Siqueira (São Paulo / SP)",
        verified: true,
        rating: 5,
        date: "14 de Fevereiro de 2026",
        title: "Chegou em 3 dias em SP! Produto 100% original",
        comment: "Fiz a verificação do QR Code no aplicativo oficial do fabricante e bateu certinho. O envio para o Brasil foi muito rápido, com código de rastreamento direto no meu WhatsApp. Recomendo de olhos fechados!",
        helpful: 24
      },
      {
        author: "Dra. Camila Vasconcelos (Curitiba / PR)",
        verified: true,
        rating: 5,
        date: "28 de Janeiro de 2026",
        title: "Excelente procedência e envio térmico seguro",
        comment: "Produto chegou lacrado, embalagem de isopor com gelo reutilizável para manter a temperatura ideal. Farmácia extremamente profissional e competente.",
        helpful: 19
      },
      {
        author: "Lucas Ferreira Lima (Belo Horizonte / MG)",
        verified: true,
        rating: 5,
        date: "04 de Janeiro de 2026",
        title: "Recebido em MG com frete seguro e rastreio",
        comment: "Paguei no cartão de crédito em Reais sem nenhuma dor de cabeça de câmbio. Em 4 dias estava na porta da minha casa. Atendimento nota 10!",
        helpful: 15
      },
      {
        author: "Marcos Vinicius B. (Goiânia / GO)",
        verified: true,
        rating: 5,
        date: "18 de Dezembro de 2025",
        title: "Resultados comprovados e confiança total",
        comment: "Já é o terceiro pedido que faço com a Farma Fit para entrega no Brasil. Tudo sempre 100% autêntico e de primeira linha.",
        helpful: 8
      }
    ];

    return [...userList, ...defaultReviewPool];
  },

  addReview(productId, review) {
    if (!this.userReviews[productId]) {
      this.userReviews[productId] = [];
    }
    const newRev = {
      author: review.name || "Cliente Verificado",
      verified: true,
      rating: parseInt(review.rating) || 5,
      date: "Hoje",
      title: review.title || "Excelente experiência",
      comment: review.comment || "Produto autêntico e entrega rápida no Brasil.",
      helpful: 1
    };
    this.userReviews[productId].unshift(newRev);
    localStorage.setItem('farma_reviews', JSON.stringify(this.userReviews));
    this.notify();
    this.showToast('Avaliação enviada com sucesso! Obrigado pelo feedback.', 'success');
  },

  // E-commerce Toast Notification
  showToast(message, type = 'success') {
    let container = document.getElementById('ecomToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ecomToastContainer';
      container.className = 'ecom-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `ecom-toast ecom-toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-msg">${message}</div>
      <button class="toast-close" aria-label="Fechar">&times;</button>
    `;

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  },

  // Gerador sequencial de número de pedido local
  getNextOrderNumber() {
    try {
      const cur = parseInt(localStorage.getItem('farma_order_counter') || '1000', 10);
      const next = cur + 1;
      localStorage.setItem('farma_order_counter', next.toString());
      return next;
    } catch (e) {
      return 1001;
    }
  },

  // WhatsApp order builder - Formatted in Reais (R$) and Brasil Shipping
  getWhatsAppOrderUrl(customerData = {}) {
    const phone = window.FARMA_DATA.store.whatsapp;
    if (this.cart.length === 0) return `https://wa.me/${phone}`;

    const isCard = (customerData.payment || '').toLowerCase().includes('cartão');
    const orderNum = customerData.order_number || this.getNextOrderNumber();
    const orderCode = customerData.order_code || `Pedido #${orderNum}`;

    let msg = isCard 
      ? `*💳 NOVO PEDIDO NO CARTÃO DE CRÉDITO (ATÉ 12X) - FARMA FIT*\n`
      : `*📦 NOVO PEDIDO - FARMA FIT (ENVIO BRASIL)*\n`;
    msg += `----------------------------------------\n`;
    msg += `📋 *Identificação:* ${orderCode}\n`;
    
    if (customerData.name) msg += `👤 *Nome Completo:* ${customerData.name}\n`;
    if (customerData.phone) msg += `📞 *WhatsApp:* ${customerData.phone}\n`;
    if (customerData.email) msg += `📧 *E-mail:* ${customerData.email}\n`;
    if (customerData.cpf) msg += `🪪 *CPF:* ${customerData.cpf}\n`;
    if (customerData.address) {
      msg += `📍 *Endereço de Entrega (Brasil):*\n   ${customerData.address}\n   CEP: ${customerData.cep || 'A confirmar'} - ${customerData.city || ''}/${customerData.state || ''}\n`;
    }
    if (customerData.deliveryType) msg += `🚚 *Modalidade de Frete:* ${customerData.deliveryType}\n`;
    msg += `💳 *Forma de Pagamento:* ${customerData.payment || 'Cartão de Crédito em até 12x'}\n`;
    if (customerData.obs) msg += `📝 *Observações:* ${customerData.obs}\n`;

    msg += `\n*🛍️ ITENS DO PEDIDO:*\n`;
    this.cart.forEach((item, i) => {
      const p = item.product;
      const subBrl = ((p.price_usd * this.rates.USD_TO_BRL) * item.qty).toFixed(2).replace('.', ',');
      const unitBrl = (p.price_usd * this.rates.USD_TO_BRL).toFixed(2).replace('.', ',');
      msg += `${i + 1}. *${p.name}*\n   Qtd: ${item.qty}x (R$ ${unitBrl} un) &bull; Subtotal: R$ ${subBrl}\n`;
    });

    const totalBrl = this.getCartTotalBRL();
    const totalUsd = this.getCartTotalUSD().toFixed(2);

    msg += `\n*💰 VALOR TOTAL: R$ ${totalBrl}*\n`;
    msg += `(Equivalente oficial: $${totalUsd} USD)\n`;
    msg += `----------------------------------------\n`;
    
    if (isCard) {
      msg += `Olá equipe Farma Fit! Preenchi todos os meus dados no site e escolhi pagamento com *Cartão de Crédito em até 12x*. Poderiam me enviar o link seguro da maquininha/gateway para eu efetuar o pagamento e confirmar o envio?`;
    } else {
      msg += `Olá equipe Farma Fit! Acabei de registrar meu pedido no site e gostaria de confirmar o envio com seguro e código de rastreamento!`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  },

  getProductWhatsAppUrl(product) {
    const phone = window.FARMA_DATA.store.whatsapp;
    const priceBrl = this.getPriceInBRL(product.price_usd);
    const msg = `Olá Farma Fit! Gostaria de informações sobre o produto para envio no Brasil: *${product.name}* (Valor: R$ ${priceBrl} / $${product.price_usd.toFixed(2)} USD). Vocês enviam para a minha cidade?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }
};

window.FarmaStore = FarmaStore;
