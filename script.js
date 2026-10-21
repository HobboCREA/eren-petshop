document.addEventListener('DOMContentLoaded', function () {
  'use strict';
  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.from((root || document).querySelectorAll(selector)); };
  var money = function (amount) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(amount);
  };
  var safeRead = function (key, fallback) {
    try { var value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch (_) { return fallback; }
  };
  var safeWrite = function (key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* storage can be disabled */ }
  };
  var escapeHTML = function (value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  };

  /* Mobile navigation and header state */
  var menuButton = $('.toggle');
  var menu = $('.menu');
  if (menuButton && menu) {
    menuButton.addEventListener('click', function () {
      var opened = menu.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(opened));
    });
    $$('.menu a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
  var header = $('#header');
  var updateHeader = function () { if (header) header.classList.toggle('scrolled', window.scrollY > 8); };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  /* Show the welcome gallery once per browser tab, not on every reload. */
  var welcome = $('#welcome-photo');
  var welcomeClose = $('#welcome-close');
  var welcomeTimer;
  var welcomeSlides = $$('.welcome-slide');
  var welcomeDots = $$('.welcome-dot');
  var welcomeIndex = 0;
  var dismissed = false;
  try { dismissed = sessionStorage.getItem('patidost-welcome-seen') === '1'; } catch (_) { dismissed = false; }
  function dismissWelcome() {
    if (!welcome || !welcome.isConnected) return;
    welcome.classList.add('is-hidden');
    document.body.classList.remove('modal-open');
    window.clearInterval(welcomeTimer);
    try { sessionStorage.setItem('patidost-welcome-seen', '1'); } catch (_) { /* ignore */ }
    window.setTimeout(function () { if (welcome && welcome.isConnected) welcome.remove(); }, 280);
  }
  function showWelcome(index) {
    if (!welcomeSlides.length) return;
    welcomeIndex = (index + welcomeSlides.length) % welcomeSlides.length;
    welcomeSlides.forEach(function (image, i) { image.classList.toggle('active', i === welcomeIndex); });
    welcomeDots.forEach(function (dot, i) { dot.classList.toggle('active', i === welcomeIndex); });
  }
  function startWelcome() {
    window.clearInterval(welcomeTimer);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && welcome && welcome.isConnected) {
      welcomeTimer = window.setInterval(function () { showWelcome(welcomeIndex + 1); }, 4200);
    }
  }
  if (welcome && dismissed) welcome.remove();
  else if (welcome) {
    document.body.classList.add('modal-open');
    if (welcomeClose) welcomeClose.addEventListener('click', dismissWelcome);
    welcome.addEventListener('click', function (event) { if (event.target === welcome) dismissWelcome(); });
    $('.welcome-prev')?.addEventListener('click', function () { showWelcome(welcomeIndex - 1); startWelcome(); });
    $('.welcome-next')?.addEventListener('click', function () { showWelcome(welcomeIndex + 1); startWelcome(); });
    welcomeDots.forEach(function (dot, i) { dot.addEventListener('click', function () { showWelcome(i); startWelcome(); }); });
    var welcomeBox = $('.welcome-slider');
    if (welcomeBox) {
      welcomeBox.addEventListener('mouseenter', function () { window.clearInterval(welcomeTimer); });
      welcomeBox.addEventListener('mouseleave', startWelcome);
      var touchStartX = 0;
      welcomeBox.addEventListener('touchstart', function (event) { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
      welcomeBox.addEventListener('touchend', function (event) {
        var delta = event.changedTouches[0].screenX - touchStartX;
        if (Math.abs(delta) > 45) { showWelcome(welcomeIndex + (delta < 0 ? 1 : -1)); startWelcome(); }
      }, { passive: true });
    }
    startWelcome();
  }

  /* Hero image slider */
  var slides = $$('.hero-slide');
  var slideDots = $$('.slide-dot');
  var slideIndex = 0;
  var slideTimer;
  var heroSlider = $('.hero-slider');
  function showSlide(index) {
    if (!slides.length) return;
    slideIndex = (index + slides.length) % slides.length;
    slides.forEach(function (image, i) {
      image.classList.toggle('active', i === slideIndex);
      if (i === slideIndex) image.setAttribute('loading', 'eager');
    });
    slideDots.forEach(function (dot, i) { dot.classList.toggle('active', i === slideIndex); });
  }
  function startSlides() {
    window.clearInterval(slideTimer);
    if (!document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && slides.length > 1) {
      slideTimer = window.setInterval(function () { showSlide(slideIndex + 1); }, 5000);
    }
  }
  if (slides.length) {
    $('.slide-prev')?.addEventListener('click', function () { showSlide(slideIndex - 1); startSlides(); });
    $('.slide-next')?.addEventListener('click', function () { showSlide(slideIndex + 1); startSlides(); });
    slideDots.forEach(function (dot, i) { dot.addEventListener('click', function () { showSlide(i); startSlides(); }); });
    if (heroSlider) {
      heroSlider.addEventListener('mouseenter', function () { window.clearInterval(slideTimer); });
      heroSlider.addEventListener('mouseleave', startSlides);
      var heroTouchX = 0;
      heroSlider.addEventListener('touchstart', function (event) { heroTouchX = event.changedTouches[0].screenX; }, { passive: true });
      heroSlider.addEventListener('touchend', function (event) {
        var delta = event.changedTouches[0].screenX - heroTouchX;
        if (Math.abs(delta) > 45) { showSlide(slideIndex + (delta < 0 ? 1 : -1)); startSlides(); }
      }, { passive: true });
    }
    startSlides();
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) window.clearInterval(slideTimer); else startSlides(); });

  /* Scroll reveals; content stays visible on older browsers. */
  var revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else revealItems.forEach(function (item) { item.classList.add('visible'); });

  /* Product filters */
  var filterButtons = $$('.filter-button');
  var productCards = $$('.product');
  function filterProducts(category) {
    productCards.forEach(function (card) {
      card.hidden = category !== 'all' && card.dataset.category !== category;
    });
    filterButtons.forEach(function (button) {
      var active = button.dataset.productFilter === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () { filterProducts(button.dataset.productFilter || 'all'); });
  });
  $$('[data-filter]').forEach(function (categoryLink) {
    categoryLink.addEventListener('click', function () { filterProducts(categoryLink.dataset.filter); });
  });
  $$('[data-footer-filter]').forEach(function (categoryLink) {
    categoryLink.addEventListener('click', function () { filterProducts(categoryLink.dataset.footerFilter); });
  });

  /* Cart: canonical product prices come from the product catalogue in HTML.
     This also repairs saved quantities from older builds with broken parsing. */
  var productCatalog = new Map();
  productCards.forEach(function (card) {
    var name = card.dataset.name || ($('h3', card) || {}).textContent || '';
    var price = Number(card.dataset.price);
    if (name && Number.isFinite(price) && price > 0) productCatalog.set(name.trim(), price);
  });
  var savedCart = safeRead('patidost-cart', []);
  var cart = Array.isArray(savedCart) ? savedCart.reduce(function (list, item) {
    var name = item && typeof item.name === 'string' ? item.name.trim() : '';
    var qty = Math.max(0, Math.min(99, Math.floor(Number(item && item.qty) || 0)));
    var price = productCatalog.get(name);
    if (price && qty) list.push({ name: name, price: price, qty: qty });
    return list;
  }, []) : [];
  var couponApplied = false;
  var shippingThreshold = 750;
  var shippingFee = 49.9;
  var panel = $('#sepet');
  var backdrop = $('#cart-backdrop');
  var openCartButton = $('.cart');
  var closeCartButton = $('.cart-close');
  var cartItems = $('#cart-items');
  var couponInput = $('#coupon-input');
  var couponMessage = $('#coupon-message');
  var applyCouponButton = $('#apply-coupon');
  var toast = $('#toast');
  var toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('show'); }, 2300);
  }
  function openCart() {
    if (!panel || !backdrop) return;
    panel.classList.add('open');
    backdrop.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if (closeCartButton) closeCartButton.focus({ preventScroll: true });
  }
  function closeCart() {
    if (!panel || !backdrop) return;
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    if (!($('#checkout-modal') && !$('#checkout-modal').hidden) && !(welcome && welcome.isConnected)) document.body.classList.remove('modal-open');
  }
  function renderCart() {
    if (!cartItems) return;
    safeWrite('patidost-cart', cart);
    if (!cart.length) {
      cartItems.innerHTML = '<p class="empty-cart">Sepetiniz şu an boş. Dostunuz için bir güzellik seçin 🐾</p>';
    } else {
      cartItems.innerHTML = cart.map(function (item, index) {
        return '<div class="cart-item"><div><div class="cart-item-name">' + escapeHTML(item.name) + '</div><div class="cart-item-meta">' + money(item.price) + ' × ' + item.qty + ' = <b>' + money(item.price * item.qty) + '</b></div></div><div class="cart-item-controls"><button type="button" data-action="minus" data-i="' + index + '" aria-label="Bir adet azalt">−</button><span>' + item.qty + '</span><button type="button" data-action="plus" data-i="' + index + '" aria-label="Bir adet artır">+</button><button type="button" class="remove-item" data-action="remove" data-i="' + index + '" aria-label="Ürünü sil">×</button></div></div>';
      }).join('');
    }
    var subtotal = cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
    var discount = couponApplied ? Math.round(subtotal * 10) / 100 : 0;
    var shipping = subtotal === 0 || subtotal >= shippingThreshold ? 0 : shippingFee;
    var total = subtotal - discount + shipping;
    var count = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
    $('#cart-subtotal').textContent = money(subtotal);
    $('#cart-discount').textContent = '−' + money(discount);
    $('#cart-shipping').textContent = shipping ? money(shipping) : (subtotal ? 'Ücretsiz' : money(0));
    $('#cart-total').textContent = money(total);
    $('#discount-row').hidden = !couponApplied || !subtotal;
    if (openCartButton) {
      openCartButton.innerHTML = '♡ <span>Sepet (' + count + ')</span>';
      openCartButton.setAttribute('aria-label', 'Sepet, ' + count + ' ürün');
    }
    var progress = $('#shipping-progress');
    if (progress) {
      if (!subtotal) progress.textContent = '₺750 ve üzeri alışverişlerde kargo ücretsiz.';
      else if (subtotal >= shippingThreshold) progress.textContent = 'Harika! Kargonuz ücretsiz 🐾';
      else progress.textContent = 'Ücretsiz kargo için ' + money(shippingThreshold - subtotal) + ' daha ekleyin.';
    }
    var checkoutButton = $('#checkout-button');
    checkoutButton.disabled = !cart.length;
    checkoutButton.textContent = cart.length ? 'Teslimat bilgilerine geç →' : 'Sepetiniz boş';
  }
  productCards.forEach(function (card) {
    var button = $('.add-to-cart', card);
    if (!button) return;
    button.addEventListener('click', function () {
      var name = (card.dataset.name || ($('h3', card) || {}).textContent || '').trim();
      var price = productCatalog.get(name);
      if (!price) { showToast('Bu ürün şu an sepete eklenemiyor.'); return; }
      var item = cart.find(function (entry) { return entry.name === name; });
      if (item) item.qty = Math.min(item.qty + 1, 99);
      else cart.push({ name: name, price: price, qty: 1 });
      renderCart();
      animateToCart(button);
      card.classList.remove('just-added');
      void card.offsetWidth;
      card.classList.add('just-added');
      window.setTimeout(function () { card.classList.remove('just-added'); }, 900);
      showToast('Sepete eklendi: ' + name + ' · Sepeti görmek için üstteki sepet simgesine dokun.');
    });
  });
  function animateToCart(source) {
    if (!openCartButton || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var from = source.getBoundingClientRect();
    var to = openCartButton.getBoundingClientRect();
    var flyer = document.createElement('span');
    flyer.className = 'paw-fly';
    flyer.textContent = '🐾';
    flyer.style.left = (from.left + from.width / 2 - 12) + 'px';
    flyer.style.top = (from.top + from.height / 2 - 12) + 'px';
    document.body.appendChild(flyer);
    var dx = to.left + to.width / 2 - from.left - from.width / 2;
    var dy = to.top + to.height / 2 - from.top - from.height / 2;
    var animation = flyer.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx * .72 + 'px,' + dy * .72 + 'px) scale(.8)', opacity: 1, offset: .75 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.2)', opacity: 0 }
    ], { duration: 620, easing: 'cubic-bezier(.25,.8,.4,1)' });
    animation.onfinish = function () { flyer.remove(); openCartButton.classList.add('cart-pulse'); window.setTimeout(function () { openCartButton.classList.remove('cart-pulse'); }, 450); };
  }
  if (openCartButton) openCartButton.addEventListener('click', function (event) { event.preventDefault(); openCart(); });
  if (closeCartButton) closeCartButton.addEventListener('click', function () { closeCart(); if (openCartButton) openCartButton.focus({ preventScroll: true }); });
  if (backdrop) backdrop.addEventListener('click', closeCart);
  if (cartItems) cartItems.addEventListener('click', function (event) {
    var button = event.target.closest('button[data-action]');
    if (!button) return;
    var index = Number(button.dataset.i);
    var item = cart[index];
    if (!item) return;
    if (button.dataset.action === 'plus') item.qty = Math.min(item.qty + 1, 99);
    else if (button.dataset.action === 'minus') { item.qty--; if (item.qty <= 0) cart.splice(index, 1); }
    else if (button.dataset.action === 'remove') cart.splice(index, 1);
    renderCart();
  });
  if (applyCouponButton) applyCouponButton.addEventListener('click', function () {
    var code = couponInput ? couponInput.value.trim().toLocaleUpperCase('tr-TR') : '';
    if (code === 'PATİ10' && cart.length) {
      couponApplied = true;
      couponMessage.textContent = 'PATİ10 uygulandı: ara toplama %10 indirim.';
      couponMessage.style.color = 'var(--green)';
      showToast('Kupon uygulandı: %10 indirim');
    } else {
      couponApplied = false;
      couponMessage.textContent = code === 'PATİ10' ? 'Kupon için önce sepete ürün ekleyin.' : 'Kod bulunamadı. PATİ10 kodunu deneyin.';
      couponMessage.style.color = '#a54535';
    }
    renderCart();
  });

  /* Demo checkout: no card data, API call, or personal data persistence. */
  var checkoutModal = $('#checkout-modal');
  var checkoutButton = $('#checkout-button');
  var checkoutForm = $('#checkout-form');
  var paymentResult = $('#payment-result');
  var lastFocusedElement = null;
  function openCheckout() {
    if (!cart.length || !checkoutModal) return;
    lastFocusedElement = document.activeElement;
    closeCart();
    checkoutModal.hidden = false;
    document.body.classList.add('modal-open');
    if (paymentResult) paymentResult.hidden = true;
    var name = $('#customer-name');
    if (name) name.focus({ preventScroll: true });
  }
  function closeCheckout() {
    if (!checkoutModal) return;
    checkoutModal.hidden = true;
    document.body.classList.remove('modal-open');
    if (paymentResult) paymentResult.hidden = true;
    if (checkoutForm) checkoutForm.reset();
    if (lastFocusedElement && lastFocusedElement.focus) lastFocusedElement.focus({ preventScroll: true });
  }
  if (checkoutButton) checkoutButton.addEventListener('click', openCheckout);
  $('#payment-close')?.addEventListener('click', closeCheckout);
  $('#payment-cancel')?.addEventListener('click', closeCheckout);
  if (checkoutModal) checkoutModal.addEventListener('click', function (event) { if (event.target === checkoutModal) closeCheckout(); });
  if (checkoutForm) checkoutForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!cart.length || !checkoutForm.reportValidity()) return;
    var method = $('input[name="payment-method"]:checked', checkoutForm);
    var orderNumber = 'PD-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    var totalText = $('#cart-total').textContent;
    if (paymentResult) {
      paymentResult.textContent = 'Önizleme hazır · ' + orderNumber + ' · Toplam ' + totalText + '. ' + (method && method.value === 'delivery' ? 'Kapıda ödeme seçildi.' : 'Gerçek tahsilat yapılmadı; kart ödeme entegrasyonu gerekli.') + ' Bilgileriniz kaydedilmedi ve gönderilmedi.';
      paymentResult.hidden = false;
      paymentResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    showToast('Sipariş önizlemesi oluşturuldu (demo)');
  });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (checkoutModal && !checkoutModal.hidden) closeCheckout();
    else if (panel && panel.classList.contains('open')) closeCart();
    else if (welcome && welcome.isConnected) dismissWelcome();
  });
  renderCart();
});
