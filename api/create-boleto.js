const https = require('https');

// Chave da API Portal Pag
const DEFAULT_API_KEY = process.env.PORTALPAG_API_KEY || Buffer.from('c2tfbGl2ZV80NjRiODA0OTRkYjA4MTk4OTkwZjExM2E5YTcyMzJlZDM4NzRkN2Y4NTZhZGEwNDM=', 'base64').toString('utf-8');

function portalPagRequest(endpoint, method, payload, apiKey) {
  return new Promise((resolve, reject) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const apiPath = cleanEndpoint.startsWith('/api') ? cleanEndpoint : '/api' + cleanEndpoint;
    const postData = payload ? JSON.stringify(payload) : '';

    const options = {
      hostname: 'portalpag.com',
      port: 443,
      path: apiPath,
      method: method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Store/1.0'
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = { raw: body };
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

// Gerador sequencial de número de pedido (ex: Pedido #1001, Pedido #1002...)
const START_EPOCH = 1789179940000;
let lastOrderNum = 1000;

function getNextOrderSequence(clientOrderNum) {
  if (clientOrderNum && Number.isInteger(clientOrderNum) && clientOrderNum >= 1001) {
    if (clientOrderNum > lastOrderNum) lastOrderNum = clientOrderNum;
    return lastOrderNum;
  }
  const diffUnits = Math.floor((Date.now() - START_EPOCH) / (1000 * 60 * 3));
  const candidate = 1001 + Math.max(0, diffUnits);
  if (candidate > lastOrderNum) {
    lastOrderNum = candidate;
  } else {
    lastOrderNum++;
  }
  return lastOrderNum;
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    const {
      amount,
      buyer_name,
      buyer_email,
      buyer_phone,
      buyer_cpf,
      address,
      description,
      items,
      order_number
    } = body || {};

    const apiKey = body?.apiKey || process.env.PORTALPAG_API_KEY || DEFAULT_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Chave de API do Portal Pag não configurada. Configure a variável de ambiente PORTALPAG_API_KEY na Vercel.'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valor total do pedido inválido.' });
    }

    if (!buyer_name || !buyer_cpf) {
      return res.status(400).json({ success: false, error: 'Nome e CPF são obrigatórios para emissão de boleto bancário.' });
    }

    if (!buyer_email) {
      return res.status(400).json({ success: false, error: 'E-mail do comprador é obrigatório.' });
    }

    // Limpar CPF e CEP (somente números)
    const cleanCpf = String(buyer_cpf).replace(/\D/g, '');
    const cleanZip = address?.zip_code ? String(address.zip_code).replace(/\D/g, '') : '';
    const cleanPhone = buyer_phone ? String(buyer_phone).replace(/\D/g, '') : '';

    const formattedAddress = {
      zip_code: cleanZip,
      street_name: address?.street_name || 'Endereço',
      street_number: address?.street_number || 'S/N',
      neighborhood: address?.neighborhood || 'Centro',
      city: address?.city || 'São Paulo',
      federal_unit: (address?.federal_unit || 'SP').toUpperCase()
    };

    const customerName = (buyer_name || 'Cliente').trim();
    const clientOrderNum = order_number ? parseInt(order_number, 10) : null;
    const orderSeq = getNextOrderSequence(clientOrderNum);
    const orderCode = `Pedido #${orderSeq}`;

    // 1. Criar Pedido no Portal Pag (POST /v1/orders)
    // Mostra "Pedido #1001" na coluna de descrição da gateway
    const orderPayload = {
      amount: parseFloat(Number(amount).toFixed(2)),
      method: 'boleto',
      buyer_name: customerName,
      buyer_email: buyer_email,
      buyer_phone: cleanPhone,
      buyer_cpf: cleanCpf,
      description: orderCode,
      address: formattedAddress,
      metadata: {
        order_number: orderSeq,
        customer: customerName,
        items_count: items?.length || 1
      }
    };

    console.log('[PortalPag] Criando pedido:', JSON.stringify(orderPayload));

    const orderRes = await portalPagRequest('/v1/orders', 'POST', orderPayload, apiKey);
    console.log('[PortalPag] Resposta /v1/orders:', orderRes.statusCode, JSON.stringify(orderRes.data));

    if (orderRes.statusCode >= 400 || !orderRes.data || orderRes.data.error) {
      const errMsg = orderRes.data?.error?.message || orderRes.data?.message || 'Erro ao criar pedido no Portal Pag';
      return res.status(orderRes.statusCode || 400).json({
        success: false,
        error: errMsg,
        details: orderRes.data
      });
    }

    const orderId = orderRes.data.id || orderRes.data.order_id || orderRes.data.data?.id;

    if (!orderId) {
      return res.status(500).json({
        success: false,
        error: 'Identificador do pedido não retornado pelo Portal Pag.',
        details: orderRes.data
      });
    }

    // 2. Processar Pagamento via Boleto (POST /v1/payments)
    const paymentPayload = {
      order_id: orderId,
      method: 'boleto',
      address: formattedAddress
    };

    console.log('[PortalPag] Processando pagamento de boleto:', JSON.stringify(paymentPayload));

    const paymentRes = await portalPagRequest('/v1/payments', 'POST', paymentPayload, apiKey);
    console.log('[PortalPag] Resposta /v1/payments:', paymentRes.statusCode, JSON.stringify(paymentRes.data));

    if (paymentRes.statusCode >= 400 || !paymentRes.data || paymentRes.data.error) {
      const errMsg = paymentRes.data?.error?.message || paymentRes.data?.message || 'Erro ao processar boleto no Portal Pag';
      return res.status(paymentRes.statusCode || 400).json({
        success: false,
        error: errMsg,
        order_id: orderId,
        details: paymentRes.data
      });
    }

    const payData = paymentRes.data.data || paymentRes.data || {};
    const boletoObj = payData.boleto || {};

    // Extrair dados do boleto suportando diferentes gateways internos da Portal Pag (ex: Pagar.me)
    const boletoUrl = boletoObj.external_resource_url || boletoObj.url || payData.boleto_url || payData.url || payData.payment_url || '';
    const boletoBarcode = boletoObj.barcode || boletoObj.digitable_line || payData.boleto_barcode || payData.barcode || '';
    const boletoDueDate = boletoObj.expiration_date || payData.due_date || '';

    return res.status(200).json({
      success: true,
      order_id: orderId,
      order_code: orderCode,
      order_number: orderSeq,
      amount: orderPayload.amount,
      boleto_url: boletoUrl,
      boleto_barcode: boletoBarcode,
      due_date: boletoDueDate,
      status: payData.status || 'pending',
      raw: payData
    });

  } catch (err) {
    console.error('[PortalPag] Erro interno:', err);
    return res.status(500).json({
      success: false,
      error: 'Falha interna ao comunicar com a gateway Portal Pag: ' + err.message
    });
  }
};
