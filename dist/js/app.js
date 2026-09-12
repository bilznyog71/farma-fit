// ==========================================================================
// FARMA.FIT - CONTROLLER OFICIAL DE E-COMMERCE (Clean & Professional)
// Fiel ao tema oficial Farma.fit / Flatsome
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const store = window.FarmaStore;
  const data = window.FARMA_DATA;

  // App State
  const state = {
    searchQuery: '',
    selectedCategory: 'all',
    selectedBrand: 'all',
    sortBy: 'date',
    currentPage: 1,
    itemsPerPage: 16,
    activeRoute: 'shop',
    currentProduct: null,
    pdpActiveTab: 'desc'
  };

  // DOM Elements
  const appContainer = document.getElementById('app');
  const globalSearchInput = document.getElementById('globalSearchInput');
  const headerSearchForm = document.getElementById('headerSearchForm');
  const cartCountBadges = document.querySelectorAll('.cart-count-badge');
  const wishlistCountBadges = document.querySelectorAll('.wishlist-count-badge');
  const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
  const cartDrawerItems = document.getElementById('cartDrawerItems');
  const cartDrawerSubtotal = document.getElementById('cartDrawerSubtotal');
  const cartDrawerCurrencies = document.getElementById('cartDrawerCurrencies');
  const currencyBtns = document.querySelectorAll('.currency-btn');
  const deptLinks = document.querySelectorAll('.dept-link');

  // Initialize
  function init() {
    setupCurrencySwitcher();
    setupCartDrawer();
    setupSearch();
    setupMobileInteractions();
    setupRouting();

    store.subscribe(() => {
      updateBadgesUI();
      updateCartUI();
      if (['shop', 'produto', 'favoritos'].includes(state.activeRoute)) {
        renderCurrentRoute();
      }
    });

    updateBadgesUI();
    updateCartUI();
    window.dispatchEvent(new Event('hashchange'));
  }

  // ----------------- MOBILE INTERACTIONS (DRAWER & BOTTOM DOCK) -----------------
  function setupMobileInteractions() {
    const mobileToggleBtn = document.getElementById('mobileMenuToggleBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileCloseBtn = document.getElementById('mobileMenuCloseBtn');
    const botNavMenu = document.getElementById('botNavMenu');
    const botNavSearch = document.getElementById('botNavSearch');

    function openMobileMenu() {
      if (mobileMenuOverlay) {
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeMobileMenu() {
      if (mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    }

    if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', openMobileMenu);
    if (botNavMenu) botNavMenu.addEventListener('click', openMobileMenu);
    if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', closeMobileMenu);

    if (mobileMenuOverlay) {
      mobileMenuOverlay.addEventListener('click', (e) => {
        if (e.target === mobileMenuOverlay) {
          closeMobileMenu();
        }
      });
    }

    // Mobile menu navigation links
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const cat = link.getAttribute('data-cat');
        if (cat) {
          e.preventDefault();
          state.selectedCategory = cat;
          state.currentPage = 1;
          state.searchQuery = '';
          closeMobileMenu();
          if (state.activeRoute !== 'shop') {
            window.location.hash = '#/shop';
          } else {
            renderCatalogView();
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          closeMobileMenu();
        }
      });
    });

    // Mobile bottom bar search button: scrolls up and focuses search input
    if (botNavSearch) {
      botNavSearch.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          if (globalSearchInput) {
            globalSearchInput.focus();
          }
        }, 250);
      });
    }
  }

  // ----------------- CURRENCY SWITCHER -----------------
  function setupCurrencySwitcher() {
    currencyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const curr = btn.getAttribute('data-currency');
        store.setCurrency(curr);
        currencyBtns.forEach(b => b.classList.toggle('active', b === btn));
      });
      if (btn.getAttribute('data-currency') === store.currency) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // ----------------- BADGES UI -----------------
  function updateBadgesUI() {
    const cartCount = store.getCartCount();
    cartCountBadges.forEach(b => b.textContent = cartCount);

    const wishCount = store.getWishlistCount();
    wishlistCountBadges.forEach(b => b.textContent = `(${wishCount})`);
  }

  // ----------------- ROUTING -----------------
  function setupRouting() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const parts = hash.split('/');
      const route = parts[0] || 'shop';
      const param = parts[1] || null;

      state.activeRoute = route;

      deptLinks.forEach(link => {
        const href = link.getAttribute('href').replace('#/', '').replace('#', '');
        link.classList.toggle('active', href === route || (route === 'shop' && href === 'shop'));
      });

      // Update Mobile Bottom Bar active states
      const botNavShop = document.getElementById('botNavShop');
      const botNavFav = document.getElementById('botNavFav');
      if (botNavShop) botNavShop.classList.toggle('active', route === 'shop');
      if (botNavFav) botNavFav.classList.toggle('active', route === 'favoritos');

      if (route === 'produto' && param) {
        const prod = data.products.find(p => p.id == param || p.slug === param);
        if (prod) {
          state.currentProduct = prod;
          store.addRecentView(prod);
          renderProductDetailPage(prod);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      renderCurrentRoute(route, param);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function renderCurrentRoute(route = state.activeRoute) {
    switch (route) {
      case 'como-trabalhamos':
        renderComoTrabalhamosPage();
        break;
      case 'localizacao':
        renderLocalizacaoPage();
        break;
      case 'contato':
        renderContatoPage();
        break;
      case 'termos-de-uso':
        renderTermosPage();
        break;
      case 'politica-de-devolucao':
        renderDevolucaoPage();
        break;
      case 'politicas-de-privacidade':
        renderPrivacidadePage();
        break;
      case 'checkout':
        renderCheckoutPage();
        break;
      case 'favoritos':
        renderWishlistPage();
        break;
      case 'produto':
        if (state.currentProduct) {
          renderProductDetailPage(state.currentProduct);
        } else {
          renderCatalogView();
        }
        break;
      case 'shop':
      default:
        renderCatalogView();
        break;
    }
  }

  // ----------------- SEARCH & AUTOCOMPLETE -----------------
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function setupSearch() {
    if (!globalSearchInput) return;

    const searchClearBtn = document.getElementById('searchClearBtn');
    const searchDropdown = document.getElementById('searchAutocompleteDropdown');

    function searchProducts(rawQuery) {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return [];

      const startsWithName = [];
      const wordInName = [];
      const includesInName = [];
      const includesInCatOrBrand = [];

      for (const p of data.products) {
        const name = (p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();

        if (name.startsWith(q)) {
          startsWithName.push(p);
        } else if (new RegExp('\\b' + escapeRegExp(q), 'i').test(name)) {
          wordInName.push(p);
        } else if (name.includes(q)) {
          includesInName.push(p);
        } else if (cat.includes(q) || brand.includes(q)) {
          includesInCatOrBrand.push(p);
        }
      }

      return [...startsWithName, ...wordInName, ...includesInName, ...includesInCatOrBrand];
    }

    function renderDropdown(matches, query) {
      if (!searchDropdown) return;

      if (!matches || matches.length === 0) {
        searchDropdown.innerHTML = `
          <div class="search-autocomplete-header">
            <span>Produtos (0)</span>
          </div>
          <div class="search-no-results">
            Nenhum produto encontrado para "<strong>${escapeHtml(query)}</strong>"
          </div>
        `;
        searchDropdown.style.display = 'flex';
        return;
      }

      const displayList = matches.slice(0, 15);
      const itemsHtml = displayList.map(p => {
        const priceUsd = typeof p.price_usd === 'number' ? p.price_usd : parseFloat(p.price_usd) || 0;
        const priceBrl = typeof p.price_brl === 'number' ? p.price_brl : (priceUsd * 5.24);
        const formattedUsd = 'US$ ' + priceUsd.toFixed(2).replace('.', ',');
        const formattedBrl = 'R$ ' + priceBrl.toFixed(2).replace('.', ',');
        const categoryName = p.category || 'Farmácia';
        const imgUrl = p.image || 'https://farma.fit/wp-content/uploads/woocommerce-placeholder.png';

        return `
          <li class="search-autocomplete-item" data-id="${p.id}" data-slug="${escapeHtml(p.slug || p.id)}">
            <div class="search-item-left">
              <img 
                src="${escapeHtml(imgUrl)}" 
                alt="${escapeHtml(p.name)}" 
                class="search-item-thumb" 
                loading="lazy"
                onerror="this.src='https://farma.fit/wp-content/uploads/woocommerce-placeholder.png';" 
              />
              <div class="search-item-info">
                <span class="search-item-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</span>
                <span class="search-item-cat">${escapeHtml(categoryName)}</span>
              </div>
            </div>
            <div class="search-item-price-col">
              <span class="search-item-price">${formattedUsd}</span>
              <span class="search-item-price-sub">${formattedBrl}</span>
            </div>
          </li>
        `;
      }).join('');

      searchDropdown.innerHTML = `
        <div class="search-autocomplete-header">
          <span>Produtos (${matches.length})</span>
        </div>
        <ul class="search-autocomplete-list">
          ${itemsHtml}
        </ul>
        ${matches.length > 5 ? `
          <div class="search-autocomplete-footer">
            <button type="button" class="search-autocomplete-footer-btn" id="searchViewAllBtn">
              Ver todos os ${matches.length} resultados &rarr;
            </button>
          </div>
        ` : ''}
      `;

      // Attach click events to rows
      const itemRows = searchDropdown.querySelectorAll('.search-autocomplete-item');
      itemRows.forEach(row => {
        row.addEventListener('click', () => {
          const slug = row.getAttribute('data-slug');
          searchDropdown.style.display = 'none';
          window.location.hash = '#/produto/' + slug;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });

      // Attach view all button
      const viewAllBtn = searchDropdown.querySelector('#searchViewAllBtn');
      if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
          searchDropdown.style.display = 'none';
          state.searchQuery = query;
          state.currentPage = 1;
          if (state.activeRoute !== 'shop') {
            window.location.hash = '#/shop';
          } else {
            renderCatalogView();
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }

      searchDropdown.style.display = 'flex';
    }

    function handleInput() {
      const rawVal = globalSearchInput.value;
      const q = rawVal.trim();

      if (q.length >= 1) {
        if (searchClearBtn) searchClearBtn.style.display = 'flex';
        const matches = searchProducts(q);
        renderDropdown(matches, q);
      } else {
        if (searchClearBtn) searchClearBtn.style.display = 'none';
        if (searchDropdown) searchDropdown.style.display = 'none';
        if (state.searchQuery) {
          state.searchQuery = '';
          if (state.activeRoute === 'shop') renderCatalogView();
        }
      }
    }

    // Instant live search as soon as the first letter is typed
    globalSearchInput.addEventListener('input', handleInput);

    // Reopen dropdown on focus if input has characters
    globalSearchInput.addEventListener('focus', () => {
      if (globalSearchInput.value.trim().length >= 1) {
        handleInput();
      }
    });

    // Clear search button
    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        globalSearchInput.value = '';
        searchClearBtn.style.display = 'none';
        if (searchDropdown) searchDropdown.style.display = 'none';
        state.searchQuery = '';
        if (state.activeRoute === 'shop') {
          renderCatalogView();
        }
        globalSearchInput.focus();
      });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (headerSearchForm && !headerSearchForm.contains(e.target)) {
        if (searchDropdown) searchDropdown.style.display = 'none';
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchDropdown && searchDropdown.style.display !== 'none') {
        searchDropdown.style.display = 'none';
      }
    });

    // Form submit / Enter key
    if (headerSearchForm) {
      headerSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = globalSearchInput.value.trim();
        if (searchDropdown) searchDropdown.style.display = 'none';
        state.searchQuery = q;
        state.currentPage = 1;
        if (state.activeRoute !== 'shop') {
          window.location.hash = '#/shop';
        } else {
          renderCatalogView();
        }
      });
    }
  }

  // ----------------- CATALOG VIEW (LAYOUT OFICIAL FARMA.FIT) -----------------
  function renderCatalogView() {
    let filtered = [...data.products];

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    if (state.selectedCategory !== 'all') {
      filtered = filtered.filter(p => 
        p.categories.some(c => c.slug === state.selectedCategory) ||
        p.category_slug === state.selectedCategory
      );
    }

    if (state.selectedBrand !== 'all') {
      filtered = filtered.filter(p => 
        p.brands.some(b => b.slug === state.selectedBrand) ||
        p.brand.toLowerCase() === state.selectedBrand.toLowerCase()
      );
    }

    if (state.sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price_usd - b.price_usd);
    } else if (state.sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price_usd - a.price_usd);
    } else if (state.sortBy === 'name-asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage) || 1;
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, startIndex + state.itemsPerPage);

    const catCountMap = {};
    data.products.forEach(p => {
      (p.categories || []).forEach(c => {
        catCountMap[c.slug] = (catCountMap[c.slug] || 0) + 1;
      });
      if (p.category_slug && !p.categories.some(c => c.slug === p.category_slug)) {
        catCountMap[p.category_slug] = (catCountMap[p.category_slug] || 0) + 1;
      }
    });

    const uniqueBrandsMap = {};
    data.products.forEach(p => {
      if (p.brand && p.brand !== 'Farma.fit' && p.brand !== 'Farma Fit') {
        uniqueBrandsMap[p.brand] = (uniqueBrandsMap[p.brand] || 0) + 1;
      }
    });
    const sortedBrands = Object.keys(uniqueBrandsMap).sort();

    const activeCatObj = data.categories.find(c => c.slug === state.selectedCategory);
    const categoryTitle = state.selectedCategory === 'all' ? 'Loja Online' : (activeCatObj ? activeCatObj.name : 'Produtos');

    const getPaginationPages = (current, total) => {
      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
      const pages = [1];
      if (current > 3) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push('...');
      pages.push(total);
      return pages;
    };

    appContainer.innerHTML = `
      <div class="shop-page-wrapper">
        <div class="container">
          
          <!-- Header Bar: Título e Ordenação -->
          <div class="shop-header-bar">
            <div class="shop-title-wrap">
              <h1>${escapeHtml(categoryTitle)}</h1>
              <span class="shop-results-count">
                Exibindo ${totalItems} produto(s)${state.searchQuery ? ` para "${escapeHtml(state.searchQuery)}"` : ''}
              </span>
            </div>

            <div class="shop-orderby-wrap">
              <select id="sortSelect" class="shop-orderby-select" aria-label="Ordenar produtos">
                <option value="date" ${state.sortBy === 'date' ? 'selected' : ''}>Ordenar por mais recente</option>
                <option value="price-asc" ${state.sortBy === 'price-asc' ? 'selected' : ''}>Ordenar por preço: menor para maior</option>
                <option value="price-desc" ${state.sortBy === 'price-desc' ? 'selected' : ''}>Ordenar por preço: maior para menor</option>
                <option value="name-asc" ${state.sortBy === 'name-asc' ? 'selected' : ''}>Ordenar por nome A-Z</option>
              </select>
            </div>
          </div>

          <!-- Mobile Category Touch Pills (Flatsome Style) -->
          <div class="mobile-category-pills-wrap">
            <div class="mobile-category-pills">
              <button type="button" class="mobile-cat-pill ${state.selectedCategory === 'all' ? 'active' : ''}" data-category="all">
                ✨ Todos (${data.products.length})
              </button>
              ${data.categories
                .filter(c => (catCountMap[c.slug] || 0) > 0)
                .map(c => `
                <button type="button" class="mobile-cat-pill ${state.selectedCategory === c.slug ? 'active' : ''}" data-category="${c.slug}">
                  ${escapeHtml(c.name)} (${catCountMap[c.slug] || 0})
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 2-Column Layout: Sidebar + Products -->
          <div class="shop-main-layout">
            
            <!-- Left Sidebar (Widgets WooCommerce) -->
            <aside class="shop-sidebar">
              <div class="sidebar-widget">
                <span class="widget-title">Categorias</span>
                <ul class="category-list">
                  <li class="category-item ${state.selectedCategory === 'all' ? 'active' : ''}" data-category="all">
                    <span>Todos os Produtos</span>
                    <span class="category-count">(${data.products.length})</span>
                  </li>
                  ${data.categories
                    .filter(c => (catCountMap[c.slug] || 0) > 0)
                    .map(c => `
                    <li class="category-item ${state.selectedCategory === c.slug ? 'active' : ''}" data-category="${c.slug}">
                      <span>${c.name}</span>
                      <span class="category-count">(${catCountMap[c.slug] || 0})</span>
                    </li>
                  `).join('')}
                </ul>
              </div>

              <div class="sidebar-widget">
                <span class="widget-title">Marcas</span>
                <select id="brandSelectFilter" class="brand-select" aria-label="Filtrar por marca">
                  <option value="all">Todas as marcas</option>
                  ${sortedBrands.map(b => `
                    <option value="${escapeHtml(b)}" ${state.selectedBrand === b ? 'selected' : ''}>${escapeHtml(b)} (${uniqueBrandsMap[b]})</option>
                  `).join('')}
                </select>
              </div>
            </aside>

            <!-- Right Main: Product Grid -->
            <div>
              ${paginatedItems.length === 0 ? `
                <div style="background: #ffffff; border: 1px solid #cccccc; border-radius: 8px; padding: 40px; text-align: center;">
                  <h3 style="font-size: 18px; margin-bottom: 8px;">Nenhum produto encontrado</h3>
                  <p style="color: #666666; font-size: 14px;">Tente ajustar sua pesquisa ou selecione outra categoria.</p>
                </div>
              ` : `
                <div class="products-grid-4col">
                  ${paginatedItems.map(p => renderProductCard(p)).join('')}
                </div>
              `}

              <!-- Pagination -->
              ${totalPages > 1 ? `
                <div class="shop-pagination">
                  <button class="page-btn" ${state.currentPage === 1 ? 'disabled' : ''} data-page="${state.currentPage - 1}">
                    &larr; Anterior
                  </button>
                  ${getPaginationPages(state.currentPage, totalPages).map(p => {
                    if (p === '...') {
                      return `<span style="padding: 6px 10px; color: #888; font-weight: bold;">...</span>`;
                    }
                    return `
                      <button class="page-btn ${state.currentPage === p ? 'active' : ''}" data-page="${p}">
                        ${p}
                      </button>
                    `;
                  }).join('')}
                  <button class="page-btn" ${state.currentPage === totalPages ? 'disabled' : ''} data-page="${state.currentPage + 1}">
                    Próxima &rarr;
                  </button>
                </div>
              ` : ''}
            </div>
          </div>

        </div>
      </div>
    `;

    bindCatalogEvents();
  }

  // ----------------- CARD DE PRODUTO IDÊNTICO À FARMA.FIT -----------------
  function renderProductCard(product) {
    const mainPriceBrl = product.price_brl || store.formatPrice(product.price_usd, 'BRL');
    const waUrl = `https://wa.me/5545988085189?text=Ol%C3%A1%2C%20tenho%20d%C3%BAvidas%20sobre%20${encodeURIComponent(product.name)}`;

    return `
      <div class="product-small box" data-product-id="${product.id}">
        <div class="box-image">
          <a href="#/produto/${product.slug || product.id}">
            <img 
              src="${product.thumbnail || product.image}" 
              alt="${escapeHtml(product.name)}" 
              loading="lazy" 
              onerror="this.src='https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop'"
            />
          </a>
        </div>

        <div class="box-text">
          <p class="category uppercase product-cat">${escapeHtml(product.category || 'Geral')}</p>
          <h3 class="name product-title">
            <a href="#/produto/${product.slug || product.id}" title="${escapeHtml(product.name)}">
              ${escapeHtml(product.name)}
            </a>
          </h3>

          <div class="price-wrapper">
            <span class="primary-price-brl">R$ ${mainPriceBrl}</span>
            <div class="bf-secondary-prices-container">
              <span class="bf-price-row usd">$${product.price_usd.toFixed(2)}</span>
              <span class="bf-price-row pyg">G$ ${(product.price_pyg || Math.round(product.price_usd * 6000)).toLocaleString('es-PY')}</span>
            </div>
          </div>

          <div class="pyx-buttons-container">
            <a href="#/produto/${product.slug || product.id}" class="btn-pyx-custom btn-infos">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="13" height="13" fill="currentColor"><path d="M160 112c0-35.3 28.7-64 64-64s64 28.7 64 64v48H160V112zm-48 48H48c-26.5 0-48 21.5-48 48V416c0 53 43 96 96 96H352c53 0 96-43 96-96V208c0-26.5-21.5-48-48-48H336V112C336 50.1 285.9 0 224 0S112 50.1 112 112v48zm24 48a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm152 24a24 24 0 1 1 48 0 24 24 0 1 1-48 0z"/></svg>
              <span>+infos</span>
            </a>
            <a href="${waUrl}" target="_blank" rel="noopener" class="btn-pyx-custom btn-dudas">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="13" height="13" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
              <span>Tirar dúvidas</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function bindCatalogEvents() {
    document.querySelectorAll('.category-item').forEach(item => {
      item.addEventListener('click', () => {
        state.selectedCategory = item.getAttribute('data-category');
        state.currentPage = 1;
        renderCatalogView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    document.querySelectorAll('.mobile-cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        state.selectedCategory = pill.getAttribute('data-category');
        state.currentPage = 1;
        renderCatalogView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    const brandSelect = document.getElementById('brandSelectFilter');
    if (brandSelect) {
      brandSelect.addEventListener('change', (e) => {
        state.selectedBrand = e.target.value;
        state.currentPage = 1;
        renderCatalogView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderCatalogView();
      });
    }

    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.getAttribute('data-page'));
        if (p && !btn.disabled) {
          state.currentPage = p;
          renderCatalogView();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  // ----------------- PRODUCT DETAIL PAGE (PDP) -----------------
  function renderProductDetailPage(product) {
    const mainPriceBrl = product.price_brl || store.formatPrice(product.price_usd, 'BRL');
    const waUrl = `https://wa.me/5545988085189?text=Ol%C3%A1%2C%20tenho%20d%C3%BAvidas%20sobre%20${encodeURIComponent(product.name)}`;

    const related = data.products
      .filter(p => p.id !== product.id && (p.category_slug === product.category_slug || p.brand === product.brand))
      .slice(0, 4);

    appContainer.innerHTML = `
      <div class="pdp-wrapper">
        <div class="container">
          
          <!-- Breadcrumbs -->
          <nav class="breadcrumbs-bar" aria-label="Navegação estrutural">
            <a href="#/shop">Início</a>
            <span class="sep">&rsaquo;</span>
            <a href="#/shop" class="cat-crumb" data-cat="${product.category_slug}">${escapeHtml(product.category)}</a>
            ${product.brand ? `<span class="sep">&rsaquo;</span> <span>${escapeHtml(product.brand)}</span>` : ''}
            <span class="sep">&rsaquo;</span>
            <span>${escapeHtml(product.name)}</span>
          </nav>

          <!-- 2-Column Grid -->
          <div class="pdp-main-grid">
            <!-- Left: Gallery -->
            <div class="pdp-gallery-wrap">
              <div class="pdp-image-box">
                <img id="pdpMainImg" src="${product.image || product.thumbnail}" alt="${escapeHtml(product.name)}" />
              </div>
              ${product.gallery && product.gallery.length > 1 ? `
                <div class="pdp-thumbnails">
                  ${product.gallery.map((imgUrl, idx) => `
                    <div class="pdp-thumb ${idx === 0 ? 'active' : ''}" data-src="${imgUrl}">
                      <img src="${imgUrl}" alt="Miniatura ${idx + 1}" />
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <!-- Right: Info -->
            <div class="pdp-info-content">
              <div class="pdp-meta-top">
                ${escapeHtml(product.category)} &bull; ${escapeHtml((!product.brand || product.brand === 'Farma.fit') ? 'Farma Fit' : product.brand)}
              </div>

              <h1 class="pdp-product-title">${escapeHtml(product.name)}</h1>

              <div class="pdp-price-container">
                <div class="pdp-price-main-brl">R$ ${mainPriceBrl}</div>
                <div class="pdp-secondary-row">
                  <span class="bf-price-row usd">$${product.price_usd.toFixed(2)}</span>
                  <span class="bf-price-row pyg">G$ ${(product.price_pyg || Math.round(product.price_usd * 6000)).toLocaleString('es-PY')}</span>
                </div>
              </div>

              ${product.short_description ? `
                <div class="pdp-short-desc">
                  ${escapeHtml(product.short_description)}
                </div>
              ` : ''}

              <div class="pdp-stock-label">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                Em estoque (Pronta entrega e retirada imediata)
              </div>

              <!-- Action: Qty + Add to Cart -->
              <div class="pdp-add-cart-row">
                <div class="ux-quantity">
                  <button type="button" class="qty-btn" id="pdpQtyMinus">&minus;</button>
                  <input type="number" id="pdpQtyInput" class="qty-input" value="1" min="1" max="99" readonly />
                  <button type="button" class="qty-btn" id="pdpQtyPlus">&plus;</button>
                </div>

                <button type="button" class="btn-add-cart-gold" id="pdpAddToCartBtn">
                  Adicionar ao Carrinho
                </button>
              </div>

              <!-- Farma.fit Official WhatsApp Button -->
              <a href="${waUrl}" target="_blank" rel="noopener" class="pyx-single-product-button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18" height="18" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                <span>Tirar dúvidas no WhatsApp</span>
              </a>

              <!-- Envio Brasil Box -->
              <div class="pdp-shipping-info-box">
                <div class="pdp-shipping-title">
                  🇧🇷 Envios para Todo o Brasil &bull; Calcule seu Frete
                </div>
                <div class="shipping-calc-inputs">
                  <input type="text" id="shippingCepInput" class="shipping-cep-input" placeholder="Digite seu CEP (ex: 01310-100)" maxlength="9" />
                  <button type="button" id="shippingCalcBtn" class="shipping-calc-button">Calcular Frete</button>
                </div>
                <div id="shippingResultsBox" style="margin-top: 10px; font-size: 13px; display: none;"></div>
              </div>

            </div>
          </div>

          <!-- Description Accordion / Tabs -->
          <div class="pdp-tabs-wrap">
            <div class="pdp-tab-headers">
              <button type="button" class="pdp-tab-nav-btn ${state.pdpActiveTab === 'desc' ? 'active' : ''}" data-tab="desc">
                Descrição do Produto
              </button>
              <button type="button" class="pdp-tab-nav-btn ${state.pdpActiveTab === 'reviews' ? 'active' : ''}" data-tab="reviews">
                Avaliações & Procedência
              </button>
            </div>

            <div class="pdp-tab-panel ${state.pdpActiveTab === 'desc' ? 'active' : ''}" id="tab-desc">
              <p style="white-space: pre-line;">${product.description ? escapeHtml(product.description) : 'Produto oficial importado com lacre de fábrica e registro sanitário.'}</p>
            </div>

            <div class="pdp-tab-panel ${state.pdpActiveTab === 'reviews' ? 'active' : ''}" id="tab-reviews">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px;">
                <h4 style="font-size: 16px; margin-bottom: 8px; color: #222;">Procedência e Garantia Oficial Farma Fit</h4>
                <p>Todos os produtos comercializados na Farma Fit possuem lacre holográfico original de fábrica, data de validade visível e lote auditável diretamente pelo aplicativo ou portal oficial do laboratório fabricante (Landerlan, Quimfa, GNC, etc.).</p>
                <p style="margin-top: 10px;">Para clientes do Brasil, todos os envios são efetuados com seguro total e código de rastreamento oficial via Dialog ou JadLog.</p>
              </div>
            </div>
          </div>

          <!-- Related Products -->
          ${related.length > 0 ? `
            <div style="margin-top: 40px;">
              <h3 style="font-size: 18px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; border-bottom: 2px solid #d4af37; padding-bottom: 6px;">
                Produtos Relacionados
              </h3>
              <div class="products-grid-4col">
                ${related.map(p => renderProductCard(p)).join('')}
              </div>
            </div>
          ` : ''}

        </div>
      </div>
    `;

    bindPdpEvents(product);
  }

  function bindPdpEvents(product) {
    const mainImg = document.getElementById('pdpMainImg');
    document.querySelectorAll('.pdp-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        document.querySelectorAll('.pdp-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        mainImg.src = thumb.getAttribute('data-src');
      });
    });

    const qtyInput = document.getElementById('pdpQtyInput');
    document.getElementById('pdpQtyMinus')?.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });
    document.getElementById('pdpQtyPlus')?.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      qtyInput.value = val + 1;
    });

    document.getElementById('pdpAddToCartBtn')?.addEventListener('click', () => {
      const qty = parseInt(qtyInput.value) || 1;
      store.addToCart(product, qty);
      openCartDrawer();
    });

    const shippingBtn = document.getElementById('shippingCalcBtn');
    const shippingInput = document.getElementById('shippingCepInput');
    const resultsBox = document.getElementById('shippingResultsBox');
    if (shippingBtn && shippingInput && resultsBox) {
      shippingBtn.addEventListener('click', () => {
        const cep = shippingInput.value.trim();
        if (!cep) {
          alert('Por favor, informe seu CEP.');
          return;
        }
        resultsBox.style.display = 'block';
        resultsBox.innerHTML = `
          <div style="padding: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 6px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span><strong>Dialog (Expresso Brasil):</strong> 2 a 4 dias úteis</span>
              <span style="font-weight: 700; color: #128c4a;">R$ 38,00</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span><strong>JadLog (Econômico Brasil):</strong> 5 a 8 dias úteis</span>
              <span style="font-weight: 700;">R$ 24,00</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span><strong>Retirada no Jebai Center:</strong> Loja 2208</span>
              <span style="font-weight: 700; color: #1e73be;">GRÁTIS</span>
            </div>
          </div>
        `;
      });
    }

    document.querySelectorAll('.pdp-tab-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        state.pdpActiveTab = tab;
        document.querySelectorAll('.pdp-tab-nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.pdp-tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${tab}`)?.classList.add('active');
      });
    });
  }

  // ----------------- WISHLIST PAGE -----------------
  function renderWishlistPage() {
    const wishedProducts = data.products.filter(p => store.isInWishlist(p.id));

    appContainer.innerHTML = `
      <div class="shop-page-wrapper">
        <div class="container">
          <div class="shop-header-bar">
            <div class="shop-title-wrap">
              <h1>Meus Favoritos</h1>
              <span class="shop-results-count">${wishedProducts.length} produto(s) salvo(s)</span>
            </div>
          </div>

          ${wishedProducts.length === 0 ? `
            <div style="background: #ffffff; border: 1px solid #cccccc; border-radius: 8px; padding: 40px; text-align: center;">
              <h3 style="font-size: 18px; margin-bottom: 8px;">Sua lista de favoritos está vazia</h3>
              <p style="color: #666; font-size: 14px; margin-bottom: 16px;">Navegue pelo catálogo e clique em +infos para conhecer nossos produtos.</p>
              <a href="#/shop" class="btn-proceed-checkout" style="display: inline-block; width: auto; padding: 0 24px; text-decoration: none; line-height: 44px;">
                Ir para a Loja Online
              </a>
            </div>
          ` : `
            <div class="products-grid-4col">
              ${wishedProducts.map(p => renderProductCard(p)).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    bindCatalogEvents();
  }

  // ----------------- CHECKOUT PAGE -----------------
  function renderCheckoutPage() {
    const totalBRL = store.getCartTotalBRL();
    const totalUSD = store.getCartTotalUSD().toFixed(2);

    if (store.cart.length === 0) {
      appContainer.innerHTML = `
        <div class="container" style="padding: 60px 15px; text-align: center;">
          <div style="background: #fff; border: 1px solid #ccc; border-radius: 8px; padding: 40px; max-width: 500px; margin: 0 auto;">
            <h2 style="font-size: 20px; margin-bottom: 10px;">Seu carrinho está vazio</h2>
            <p style="color: #666; margin-bottom: 20px;">Adicione produtos antes de prosseguir com o pedido.</p>
            <a href="#/shop" class="btn-proceed-checkout" style="display: inline-block; width: auto; padding: 0 24px; text-decoration: none; line-height: 44px;">
              Retornar à Loja Online
            </a>
          </div>
        </div>
      `;
      return;
    }

    appContainer.innerHTML = `
      <div class="checkout-page-wrap">
        <div class="container">
          <div class="shop-header-bar">
            <div class="shop-title-wrap">
              <h1>Finalizar Pedido &bull; Envio para o Brasil</h1>
              <span class="shop-results-count">Preencha seus dados para envio com rastreio e confirmação imediata.</span>
            </div>
          </div>

          <div class="checkout-grid">
            <!-- Form -->
            <div class="checkout-box">
              <h2>Dados de Entrega</h2>
              <form id="checkoutOrderForm">
                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label" for="custName">Nome Completo *</label>
                    <input type="text" id="custName" class="form-control" placeholder="Seu nome completo" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="custPhone">WhatsApp com DDD (Brasil) *</label>
                    <input type="tel" id="custPhone" class="form-control" placeholder="(11) 99999-9999" required />
                  </div>
                </div>

                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label" for="custCpf">CPF (Para trânsito fiscal) *</label>
                    <input type="text" id="custCpf" class="form-control" placeholder="000.000.000-00" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="custDelivery">Modalidade de Envio *</label>
                    <select id="custDelivery" class="form-control" required>
                      <option value="Dialog Expresso Brasil (2 a 4 dias úteis - R$ 38,00)">Dialog Expresso Brasil (2 a 4 dias úteis - R$ 38,00)</option>
                      <option value="JadLog Econômico Brasil (5 a 8 dias úteis - R$ 24,00)">JadLog Econômico Brasil (5 a 8 dias úteis - R$ 24,00)</option>
                      <option value="Retirada na Loja Física (Jebai Center, Piso 3, Loja 2208)">Retirada na Loja Física (Jebai Center, CDE - Grátis)</option>
                    </select>
                  </div>
                </div>

                <h2 style="margin-top: 20px;">Endereço no Brasil</h2>
                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label" for="custCep">CEP *</label>
                    <input type="text" id="custCep" class="form-control" placeholder="00000-000" maxlength="9" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="custCity">Cidade / Estado (UF) *</label>
                    <input type="text" id="custCity" class="form-control" placeholder="Ex: São Paulo / SP" required />
                  </div>
                </div>

                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label" for="custAddress">Rua / Avenida e Número *</label>
                    <input type="text" id="custAddress" class="form-control" placeholder="Rua das Flores, 123" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="custComplement">Bairro e Complemento</label>
                    <input type="text" id="custComplement" class="form-control" placeholder="Apto 42, Bloco B" />
                  </div>
                </div>

                <h2 style="margin-top: 20px;">Forma de Pagamento em Reais</h2>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                  <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff;">
                    <input type="radio" name="payMethod" value="Cartão de Crédito em até 12x" checked />
                    <div>
                      <strong>💳 Cartão de Crédito em até 12x</strong>
                      <div style="font-size: 12px; color: #64748b;">Visa, Mastercard, Elo, Hipercard e American Express</div>
                    </div>
                  </label>
                  <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff;">
                    <input type="radio" name="payMethod" value="Boleto Bancário" />
                    <div>
                      <strong>📄 Boleto Bancário</strong>
                      <div style="font-size: 12px; color: #64748b;">Pagamento à vista com compensação bancária</div>
                    </div>
                  </label>
                </div>

                <div class="form-group">
                  <label class="form-label" for="custObs">Observações do Pedido</label>
                  <textarea id="custObs" class="form-control" rows="2" style="height: auto;" placeholder="Instruções de entrega ou referências..."></textarea>
                </div>

                <button type="submit" class="btn-proceed-checkout" style="margin-top: 15px;">
                  Gerar Pedido no WhatsApp Oficial
                </button>
              </form>
            </div>

            <!-- Resumo -->
            <div class="checkout-box" style="height: fit-content;">
              <h2>Resumo do Pedido</h2>
              <div style="max-height: 280px; overflow-y: auto; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                ${store.cart.map(item => {
                  const subBrl = ((item.product.price_usd * store.rates.USD_TO_BRL) * item.qty).toFixed(2).replace('.', ',');
                  return `
                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px;">
                      <span><strong>${item.qty}x</strong> ${escapeHtml(item.product.name)}</span>
                      <span style="font-weight: 700; margin-left: 8px; white-space: nowrap;">R$ ${subBrl}</span>
                    </div>
                  `;
                }).join('')}
              </div>

              <div class="cart-subtotal-row" style="margin-bottom: 6px;">
                <span>Total em Reais:</span>
                <span style="color: #25854b;">R$ ${totalBRL}</span>
              </div>
              <div style="font-size: 12px; color: #666; margin-bottom: 14px;">
                Conversão oficial: $${totalUSD} USD &bull; ${store.formatPrice(totalUSD, 'PYG')}
              </div>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px; font-size: 12px; color: #666; line-height: 1.5;">
                🔒 <strong>Envio Seguro:</strong> Seu pedido será despachado em embalagem térmica/discreta com código de rastreio e seguro contra extravio.
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    document.getElementById('checkoutOrderForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const customer = {
        name: document.getElementById('custName').value.trim(),
        phone: document.getElementById('custPhone').value.trim(),
        cpf: document.getElementById('custCpf').value.trim(),
        cep: document.getElementById('custCep').value.trim(),
        city: document.getElementById('custCity').value.trim(),
        address: `${document.getElementById('custAddress').value.trim()} - ${document.getElementById('custComplement').value.trim()}`,
        deliveryType: document.getElementById('custDelivery').value,
        payment: document.querySelector('input[name="payMethod"]:checked')?.value || 'Cartão de Crédito em até 12x',
        obs: document.getElementById('custObs').value.trim()
      };

      const waUrl = store.getWhatsAppOrderUrl(customer);
      window.open(waUrl, '_blank');
    });
  }

  // ----------------- CART DRAWER -----------------
  function setupCartDrawer() {
    document.querySelectorAll('.btn-cart-toggle').forEach(btn => {
      btn.addEventListener('click', openCartDrawer);
    });

    document.getElementById('closeCartDrawerBtn')?.addEventListener('click', closeCartDrawer);
    cartDrawerOverlay?.addEventListener('click', (e) => {
      if (e.target === cartDrawerOverlay) closeCartDrawer();
    });

    document.getElementById('proceedCheckoutBtn')?.addEventListener('click', () => {
      closeCartDrawer();
      window.location.hash = '#/checkout';
    });
  }

  function openCartDrawer() {
    cartDrawerOverlay.classList.add('active');
    document.body.classList.add('cart-open');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    cartDrawerOverlay.classList.remove('active');
    document.body.classList.remove('cart-open');
    document.body.style.overflow = '';
  }

  function updateCartUI() {
    if (!cartDrawerItems) return;
    const cartFooter = document.querySelector('.cart-drawer-footer');

    if (store.cart.length === 0) {
      if (cartFooter) cartFooter.style.display = 'none';
      cartDrawerItems.innerHTML = `
        <div style="text-align: center; padding: 40px 15px; color: #888;">
          <p style="font-size: 15px; margin-bottom: 8px;">Sem produto(s) no carrinho.</p>
          <a href="#/shop" onclick="document.getElementById('closeCartDrawerBtn')?.click()" style="color: #c6a237; font-weight: 700; text-decoration: underline;">
            Retornar para a loja
          </a>
        </div>
      `;
      if (cartDrawerSubtotal) cartDrawerSubtotal.textContent = 'R$ 0,00';
      if (cartDrawerCurrencies) cartDrawerCurrencies.innerHTML = '';
      return;
    }

    if (cartFooter) cartFooter.style.display = 'block';

    cartDrawerItems.innerHTML = store.cart.map(item => {
      const p = item.product;
      const itemTotalBRL = ((p.price_usd * store.rates.USD_TO_BRL) * item.qty).toFixed(2).replace('.', ',');
      const itemUnitPriceBRL = (p.price_usd * store.rates.USD_TO_BRL).toFixed(2).replace('.', ',');

      return `
        <div class="cart-item-row">
          <img src="${p.thumbnail || p.image}" alt="${escapeHtml(p.name)}" class="cart-item-img" />
          <div class="cart-item-info">
            <h4 class="cart-item-title">${escapeHtml(p.name)}</h4>
            <div style="font-size: 12px; color: #666; margin-bottom: 6px;">R$ ${itemUnitPriceBRL} cada</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="ux-quantity" style="height: 30px;">
                <button type="button" class="qty-btn btn-cart-minus" data-id="${p.id}">&minus;</button>
                <input type="number" class="qty-input" style="width: 32px; font-size: 13px;" value="${item.qty}" readonly />
                <button type="button" class="qty-btn btn-cart-plus" data-id="${p.id}">&plus;</button>
              </div>
              <button type="button" class="btn-remove-item" data-id="${p.id}" style="background: none; border: none; color: #999; font-size: 11px; cursor: pointer; text-decoration: underline;">
                Remover
              </button>
            </div>
          </div>
          <div class="cart-item-price">R$ ${itemTotalBRL}</div>
        </div>
      `;
    }).join('');

    const totalUSD = store.getCartTotalUSD();
    const totalBRL = store.getCartTotalBRL();
    if (cartDrawerSubtotal) cartDrawerSubtotal.textContent = `R$ ${totalBRL}`;
    if (cartDrawerCurrencies) {
      cartDrawerCurrencies.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
          <span>Conversão oficial:</span>
          <span><strong>$${totalUSD.toFixed(2)} USD</strong> &bull; <strong>${store.formatPrice(totalUSD, 'PYG')}</strong></span>
        </div>
      `;
    }

    cartDrawerItems.querySelectorAll('.btn-cart-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = store.cart.find(i => i.product.id == id);
        if (item) store.updateCartQty(item.product.id, item.qty - 1);
      });
    });

    cartDrawerItems.querySelectorAll('.btn-cart-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = store.cart.find(i => i.product.id == id);
        if (item) store.updateCartQty(item.product.id, item.qty + 1);
      });
    });

    cartDrawerItems.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        store.removeFromCart(parseInt(id) || id);
      });
    });
  }

  // ----------------- INSTITUTIONAL PAGES -----------------
  function renderComoTrabalhamosPage() {
    appContainer.innerHTML = `
      <div class="container" style="padding: 35px 15px 60px;">
        <div class="shop-header-bar">
          <div class="shop-title-wrap">
            <h1>Como Trabalhamos?</h1>
            <span class="shop-results-count">Transparência, procedência e logística com envio para todo o Brasil.</span>
          </div>
        </div>

        <div style="background: #fff; border: 1px solid #ccc; border-radius: 8px; padding: 30px; line-height: 1.7; color: #444;">
          <h2 style="font-size: 18px; color: #222; margin-bottom: 10px;">Envios para Todo o Brasil 🇧🇷</h2>
          <p>A Farma Fit realiza envios expressos com seguro e código de rastreamento para todos os estados brasileiros. Os produtos que exigem controle de temperatura (como Tirzepatidas e peptídeos) viajam em embalagens térmicas lacradas com gelo reutilizável para garantir 100% de estabilidade até o destino final.</p>

          <h2 style="font-size: 18px; color: #222; margin: 25px 0 10px;">Preços e Moeda</h2>
          <p>Trabalhamos com conversão transparente em Reais (R$) para comodidade dos clientes no Brasil. Os pagamentos são aceitos exclusivamente via <strong>Cartão de Crédito (em até 12x)</strong> e <strong>Boleto Bancário</strong>, com total segurança e confirmação bancária.</p>

          <h2 style="font-size: 18px; color: #222; margin: 25px 0 10px;">Retirada Física no Paraguai 🇵🇾</h2>
          <p>Para clientes em trânsito ou moradores da fronteira:</p>
          <div style="background: #f8fafc; border-left: 4px solid #d4af37; padding: 15px; margin-top: 10px; border-radius: 4px;">
            <strong>Endereço:</strong> Galería Jebai Center, Piso 3, Loja 2208 &bull; Ciudad del Este &bull; Paraguai.<br/>
            <strong>Horário:</strong> Segunda a sábado, das 7h30 às 16h00.
          </div>
        </div>
      </div>
    `;
  }

  function renderLocalizacaoPage() {
    appContainer.innerHTML = `
      <div class="container" style="padding: 35px 15px 60px;">
        <div class="shop-header-bar">
          <div class="shop-title-wrap">
            <h1>Localização no Jebai Center</h1>
            <span class="shop-results-count">Visite nossa farmácia física oficial no coração do microcentro de Ciudad del Este.</span>
          </div>
        </div>

        <div style="background: #fff; border: 1px solid #ccc; border-radius: 8px; padding: 30px; line-height: 1.7; color: #444;">
          <h2 style="font-size: 18px; color: #222; margin-bottom: 10px;">Farma Fit Farmácia Fitness</h2>
          <p><strong>Endereço:</strong> Av. Carlos Antonio López com Monseñor Rodríguez, Galería Jebai Center – Entrada 1 – Piso 3, Loja 2208, Microcentro, Ciudad del Este, Paraguai.</p>
          <p><strong>Horário de Funcionamento:</strong> Segunda a sábado, das 7h30 às 16h00.</p>
          <p><strong>WhatsApp de Atendimento:</strong> <a href="https://wa.me/5545988085189" target="_blank" rel="noopener" style="color: #128c4a; font-weight: 700;">+55 45 98808-5189</a></p>

          <div style="margin-top: 25px;">
            <a href="https://maps.app.goo.gl/HL9xFWUP4epCThgk6" target="_blank" rel="noopener" class="btn-proceed-checkout" style="display: inline-block; width: auto; padding: 0 24px; text-decoration: none; line-height: 44px;">
              Ver no Google Maps
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function renderContatoPage() {
    appContainer.innerHTML = `
      <div class="container" style="padding: 35px 15px 60px;">
        <div class="shop-header-bar">
          <div class="shop-title-wrap">
            <h1>Contato & Atendimento</h1>
            <span class="shop-results-count">Fale diretamente com nossa equipe farmacêutica.</span>
          </div>
        </div>

        <div style="background: #fff; border: 1px solid #ccc; border-radius: 8px; padding: 30px; line-height: 1.7; color: #444;">
          <p>Para dúvidas sobre produtos, posologia, lote ou envios para o Brasil, utilize nossos canais diretos:</p>
          
          <div style="margin: 20px 0;">
            <p><strong>WhatsApp Oficial:</strong> <a href="https://wa.me/5545988085189" target="_blank" rel="noopener" style="color: #128c4a; font-weight: 700; font-size: 16px;">+55 45 98808-5189</a></p>
            <p><strong>Telefone:</strong> +55 45 98808-5189</p>
            <p><strong>E-mail:</strong> <a href="mailto:contato@farmafit.com" style="color: #222; text-decoration: underline;">contato@farmafit.com</a></p>
            <p><strong>Endereço:</strong> Galería Jebai Center, Piso 3, Loja 2208, Ciudad del Este - Paraguai</p>
          </div>

          <a href="https://wa.me/5545988085189?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20a%20Farma%20Fit" target="_blank" rel="noopener" class="btn-proceed-checkout" style="display: inline-block; width: auto; padding: 0 24px; text-decoration: none; line-height: 44px; background-color: #6bd068; color: #fff;">
            Iniciar Conversa no WhatsApp
          </a>
        </div>
      </div>
    `;
  }

  function renderTermosPage() {
    appContainer.innerHTML = `
      <div class="container" style="padding: 35px 15px 60px;">
        <div class="shop-header-bar">
          <div class="shop-title-wrap">
            <h1>Termos de Uso</h1>
          </div>
        </div>
        <div style="background: #fff; border: 1px solid #ccc; border-radius: 8px; padding: 30px; line-height: 1.7; color: #444;">
          <p>Estes termos regem o acesso e uso dos serviços da FARMA FIT SOCIEDAD ANÓNIMA (RUC 80154367-3). Todos os produtos comercializados cumprem as exigências sanitárias do Paraguai e são expedidos com procedência fiscal e laboratorial comprovada.</p>
        </div>
      </div>
    `;
  }

  function renderDevolucaoPage() {
    appContainer.innerHTML = `
      <div class="container" style="padding: 35px 15px 60px;">
        <div class="shop-header-bar">
          <div class="shop-title-wrap">
            <h1>Políticas de Devolução</h1>
          </div>
        </div>
        <div style="background: #fff; border: 1px solid #ccc; border-radius: 8px; padding: 30px; line-height: 1.7; color: #444;">
          <p>Caso ocorra qualquer avaria no transporte ou divergência no recebimento, entre em contato imediatamente com nosso WhatsApp em até 7 dias após o recebimento para acionamento do seguro e reenvio imediato.</p>
        </div>
      </div>
    `;
  }

  function renderPrivacidadePage() {
    appContainer.innerHTML = `
      <div class="container" style="padding: 35px 15px 60px;">
        <div class="shop-header-bar">
          <div class="shop-title-wrap">
            <h1>Políticas de Privacidade</h1>
          </div>
        </div>
        <div style="background: #fff; border: 1px solid #ccc; border-radius: 8px; padding: 30px; line-height: 1.7; color: #444;">
          <p>Garantimos sigilo e segurança total dos dados de nossos clientes. Suas informações são utilizadas exclusivamente para o faturamento, envio da mercadoria e atendimento personalizado.</p>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start app
  init();
});
