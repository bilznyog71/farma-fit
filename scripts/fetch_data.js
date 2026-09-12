const fs = require('fs');
const path = require('path');

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return await res.json();
}

function parsePriceHtml(html, pricesObj) {
  let usd = null, pyg = null, brl = null;

  // Authoritative USD price from WooCommerce store API (price is in cents)
  if (pricesObj && pricesObj.price) {
    usd = parseInt(pricesObj.price, 10) / 100;
  }

  if (html) {
    // USD fallback from HTML
    const usdMatch = html.match(/currencySymbol">\s*(?:&#036;|\$)\s*<\/span>\s*([\d,.]+)/);
    if (usdMatch && !usd) {
      usd = parseFloat(usdMatch[1].replace(',', ''));
    }

    // PYG: e.g. <div class="bf-price-row pyg"...>G$ 90.000</div>
    const pygMatch = html.match(/bf-price-row pyg[^>]*>G\$\s*([\d.]+)/);
    if (pygMatch) {
      pyg = pygMatch[1].trim();
    }

    // BRL: e.g. <div class="bf-price-row brl"...>R$ 78,60</div>
    const brlMatch = html.match(/bf-price-row brl[^>]*>R\$\s*([\d,.]+)/);
    if (brlMatch) {
      brl = brlMatch[1].trim();
    }
  }

  usd = usd || 0;
  pyg = pyg || Math.round(usd * 6000).toLocaleString('es-PY');
  brl = brl || (usd * 5.24).toFixed(2).replace('.', ',');

  return { usd, pyg, brl };
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
}

async function run() {
  console.log('Buscando categorias...');
  const excludedSlugs = new Set(['caramelo', 'panettone', 'barrinha', 'molhos', 'acessorios', 'bebida', 'alfajor', 'chicle']);
  const categories = rawCategories
    .filter(c => !excludedSlugs.has(c.slug.toLowerCase()))
    .map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: c.count
    })).sort((a, b) => b.count - a.count);

  console.log(`Encontradas ${categories.length} categorias.`);

  const allProducts = [];
  // Fetch all pages (1178 products, approx 12 pages)
  let page = 1;
  while (true) {
    console.log(`Buscando produtos página ${page}...`);
    try {
      const pageProducts = await fetchJson(`https://farma.fit/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
      if (!pageProducts || pageProducts.length === 0) break;
      allProducts.push(...pageProducts);
      console.log(`Página ${page}: ${pageProducts.length} produtos obtidos. Total acumulado: ${allProducts.length}`);
      if (pageProducts.length < 100) break;
      page++;
    } catch (e) {
      console.error(`Erro na página ${page}:`, e.message);
      break;
    }
  }

  console.log(`Total de produtos brutos obtidos: ${allProducts.length}`);

  const filteredProducts = allProducts.filter(p => {
    const pCats = p.categories || [];
    return !pCats.some(c => excludedSlugs.has(c.slug.toLowerCase()));
  });

  const cleanedProducts = filteredProducts.map(p => {
    const prices = parsePriceHtml(p.price_html, p.prices);
    const usd = prices.usd;
    const pygFormatted = prices.pyg;
    const brlFormatted = prices.brl;

    const primaryImage = (p.images && p.images[0]) ? p.images[0].src : '';
    const thumbnail = (p.images && p.images[0]) ? (p.images[0].thumbnail || p.images[0].src) : '';
    const gallery = (p.images || []).map(img => img.src);

    const cats = (p.categories || []).map(c => ({ id: c.id, name: c.name, slug: c.slug }));
    const brands = (p.brands || []).map(b => ({ id: b.id, name: b.name, slug: b.slug }));

    return {
      id: p.id,
      name: stripHtml(p.name),
      slug: p.slug || p.id.toString(),
      permalink: p.permalink,
      description: stripHtml(p.description),
      short_description: stripHtml(p.short_description),
      price_usd: usd,
      price_pyg: pygFormatted,
      price_brl: brlFormatted,
      image: primaryImage,
      thumbnail: thumbnail,
      gallery: gallery,
      categories: cats,
      category: cats[0] ? cats[0].name : 'Geral',
      category_slug: cats[0] ? cats[0].slug : 'geral',
      brands: brands,
      brand: (brands[0] && brands[0].name !== 'Farma.fit') ? brands[0].name : 'Farma Fit',
      is_in_stock: p.is_in_stock,
      on_sale: p.on_sale || false
    };
  });

  const outputJs = `// Catálogo Oficial Farma Fit - Dados Reais
window.FARMA_DATA = {
  store: {
    name: "Farma Fit",
    subtitle: "A Única Farmácia Fitness no Paraguay",
    country: "Paraguay 🇵🇾",
    currency_default: "USD",
    phone: "+55 45 98808-5189",
    whatsapp: "5545988085189",
    whatsapp_display: "+55 45 98808-5189",
    email: "contato@farmafit.com",
    address: "Av. Carlos Antonio López com Monseñor Rodríguez, Galería Jebai Center – Entrada 1 – Piso 3, Loja 2208, Microcentro, Ciudad del Este, Paraguay",
    hours: "Segunda a sábado, das 7h30 às 16h",
    google_maps_url: "https://maps.app.goo.gl/HL9xFWUP4epCThgk6"
  },
  categories: ${JSON.stringify(categories, null, 2)},
  products: ${JSON.stringify(cleanedProducts, null, 2)}
};
`;

  const outputPath = path.join(__dirname, '..', 'js', 'products-data.js');
  fs.writeFileSync(outputPath, outputJs, 'utf8');
  console.log(`Catálogo completo (${cleanedProducts.length} produtos) salvo com sucesso em: ${outputPath}`);
}

run().catch(console.error);
