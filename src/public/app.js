const state = {
  ducks: [],
  cart: { items: [], total: 0 },
  selectedDuckId: null,
  cartModalMode: "cart",
};

const selectors = {
  featured: document.getElementById("featured-content"),
  list: document.getElementById("catalog-list"),
  detail: document.getElementById("detail-content"),
  cart: document.getElementById("cart-content"),
  checkoutResult: document.getElementById("checkout-result"),
  quizResult: document.getElementById("quiz-result"),
  globalError: document.getElementById("global-error"),
  category: document.getElementById("category"),
  query: document.getElementById("query"),
  minPrice: document.getElementById("min-price"),
  maxPrice: document.getElementById("max-price"),
  detailModal: document.getElementById("detail-modal"),
  closeDetailModal: document.getElementById("close-detail-modal"),
  cartModal: document.getElementById("cart-modal"),
  openCartModal: document.getElementById("open-cart-modal"),
  closeCartModal: document.getElementById("close-cart-modal"),
  proceedCheckout: document.getElementById("proceed-checkout"),
  backToCart: document.getElementById("back-to-cart"),
  cartModalView: document.getElementById("cart-modal-view"),
  checkoutModalView: document.getElementById("checkout-modal-view"),
};

function closeDetailModal() {
  if (selectors.detailModal?.open) {
    selectors.detailModal.close();
  }
}

function setCartModalMode(mode) {
  state.cartModalMode = mode === "checkout" ? "checkout" : "cart";
  selectors.cartModalView?.classList.toggle("is-active", state.cartModalMode === "cart");
  selectors.checkoutModalView?.classList.toggle("is-active", state.cartModalMode === "checkout");
}

function openCartModal(mode = "cart") {
  setCartModalMode(mode);
  if (selectors.cartModal && !selectors.cartModal.open) {
    selectors.cartModal.showModal();
  }
}

function closeCartModal() {
  if (selectors.cartModal?.open) {
    selectors.cartModal.close();
  }
  setCartModalMode("cart");
}

function setGlobalError(message = "") {
  selectors.globalError.textContent = message;
}

function mapError(errorPayload, status) {
  if (status === 400) return errorPayload?.error ?? "Request was invalid.";
  if (status === 404) return errorPayload?.error ?? "Resource not found.";
  if (status === 409) return errorPayload?.error ?? "Conflict while processing request.";
  return errorPayload?.error ?? "Unexpected error.";
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(mapError(data, response.status));
  }

  return data;
}

function money(value) {
  return `€${Number(value).toFixed(2)}`;
}

function renderCartButton() {
  if (!selectors.openCartModal) {
    return;
  }
  const count = state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  selectors.openCartModal.textContent = count > 0 ? `Cart (${count})` : "Cart";
}

function renderCatalog() {
  const query = selectors.query.value.trim().toLowerCase();
  const category = selectors.category.value;
  const min = Number(selectors.minPrice.value || 0);
  const max = Number(selectors.maxPrice.value || Number.POSITIVE_INFINITY);

  const filtered = state.ducks.filter((duck) => {
    const matchesQuery = !query || [duck.name, duck.category, duck.tagline].join(" ").toLowerCase().includes(query);
    const matchesCategory = !category || duck.category === category;
    const matchesPrice = duck.price >= min && duck.price <= max;
    return matchesQuery && matchesCategory && matchesPrice;
  });

  if (filtered.length === 0) {
    selectors.list.innerHTML = '<article class="card"><p>No ducks match the current filters.</p></article>';
    return;
  }

  selectors.list.innerHTML = filtered
    .map(
      (duck) => `
      <article class="card">
        <h3>${duck.name}</h3>
        <p><strong>${duck.category}</strong> · ${money(duck.price)}</p>
        <p>${duck.tagline}</p>
        <button data-detail="${duck.id}">View Details</button>
      </article>
    `,
    )
    .join("");

  selectors.list.querySelectorAll("button[data-detail]").forEach((button) => {
    button.addEventListener("click", async () => {
      await loadDuckDetail(button.getAttribute("data-detail"));
    });
  });
}

function renderCategoryOptions() {
  const categories = [...new Set(state.ducks.map((duck) => duck.category))].sort((a, b) => a.localeCompare(b));
  selectors.category.innerHTML = '<option value="">All categories</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    selectors.category.appendChild(option);
  });
}

async function loadCatalog() {
  const payload = await apiFetch("/ducks");
  state.ducks = payload.items ?? [];
  renderCategoryOptions();
  renderCatalog();
}

async function loadDuckDetail(duckId) {
  const payload = await apiFetch(`/ducks/${duckId}`);
  state.selectedDuckId = duckId;

  selectors.detail.innerHTML = `
    <article class="card">
      <h3>${payload.duck.name}</h3>
      <p><strong>${payload.duck.category}</strong> · ${money(payload.duck.price)}</p>
      <p>${payload.duck.tagline}</p>
      <p>${payload.duck.description}</p>
      <p><strong>Traits:</strong> ${payload.duck.personalityTraits.join(", ")}</p>
      <p><strong>Stock:</strong> ${payload.duck.stockStatus}</p>
      <button id="add-to-cart">Add to Cart</button>
    </article>
  `;

  document.getElementById("add-to-cart").addEventListener("click", async () => {
    await addToCart(duckId, 1);
    closeDetailModal();
    openCartModal("cart");
  });

  if (selectors.detailModal && !selectors.detailModal.open) {
    selectors.detailModal.showModal();
  }
}

async function loadCart() {
  state.cart = await apiFetch("/cart");
  renderCartButton();

  if (state.cart.items.length === 0) {
    selectors.cart.innerHTML = '<article class="card"><p>Your cart is empty.</p></article>';
    if (selectors.proceedCheckout) {
      selectors.proceedCheckout.disabled = true;
    }
    return;
  }

  if (selectors.proceedCheckout) {
    selectors.proceedCheckout.disabled = false;
  }

  selectors.cart.innerHTML = `
    ${state.cart.items
      .map(
        (item) => `
      <div class="card">
        <p><strong>${item.name}</strong></p>
        <p>${item.quantity} × ${money(item.unitPrice)} = ${money(item.lineTotal)}</p>
        <label>Qty <input data-qty="${item.duckId}" type="number" min="1" value="${item.quantity}" /></label>
        <button data-remove="${item.duckId}">Remove</button>
      </div>
    `,
      )
      .join("")}
    <article class="card">
      <p><strong>Total:</strong> ${money(state.cart.total)}</p>
    </article>
  `;

  selectors.cart.querySelectorAll("input[data-qty]").forEach((input) => {
    input.addEventListener("change", async () => {
      await updateCartItem(input.getAttribute("data-qty"), Number(input.value));
    });
  });

  selectors.cart.querySelectorAll("button[data-remove]").forEach((button) => {
    button.addEventListener("click", async () => {
      await removeCartItem(button.getAttribute("data-remove"));
    });
  });
}

async function addToCart(duckId, quantity) {
  await apiFetch("/cart/items", {
    method: "POST",
    body: JSON.stringify({ duckId, quantity }),
  });
  await loadCart();
}

async function updateCartItem(duckId, quantity) {
  await apiFetch(`/cart/items/${duckId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  await loadCart();
}

async function removeCartItem(duckId) {
  await apiFetch(`/cart/items/${duckId}`, { method: "DELETE" });
  await loadCart();
}

async function loadFeatured() {
  const payload = await apiFetch("/ducks/featured");
  if (payload.duck) {
    selectors.featured.innerHTML = `
      <article class="card">
        <p><strong>${payload.duck.name}</strong> — <strong>${payload.duck.category}</strong></p>
        <p>${payload.duck.tagline}</p>
        <button id="open-featured">Open detail</button>
      </article>
    `;

    document.getElementById("open-featured").addEventListener("click", async () => {
      await loadDuckDetail(payload.duck.id);
    });
    return;
  }

  selectors.featured.innerHTML = `<article class="card"><p>${payload.message}</p></article>`;
}

async function submitCheckout(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const body = Object.fromEntries(new FormData(form).entries());

  try {
    const result = await apiFetch("/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    });

    selectors.checkoutResult.innerHTML = `
      <article class="card">
        <p>Order confirmed: <strong>${result.orderId}</strong></p>
        <p>Total: ${money(result.total)}</p>
      </article>
    `;
    form.reset();
    await loadCart();
  } catch (error) {
    selectors.checkoutResult.innerHTML = `<p class="inline-error">${error.message}</p>`;
    return;
  }

  setCartModalMode("cart");
}

async function submitQuiz(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const answers = Object.fromEntries(new FormData(form).entries());

  try {
    const result = await apiFetch("/quiz/result", {
      method: "POST",
      body: JSON.stringify({ answers }),
    });

    const recommended = result.recommendedDuck
      ? `<p>Recommended duck: <strong>${result.recommendedDuck.name}</strong></p>
         <button id="open-recommended">Open detail</button>`
      : "<p>No in-stock duck currently matches this category.</p>";

    selectors.quizResult.innerHTML = `
      <article class="card">
        <p><strong>${result.message}</strong></p>
        ${recommended}
      </article>
    `;

    const openButton = document.getElementById("open-recommended");
    if (openButton && result.recommendedDuck) {
      openButton.addEventListener("click", async () => {
        await loadDuckDetail(result.recommendedDuck.id);
      });
    }
  } catch (error) {
    selectors.quizResult.innerHTML = `<p class="inline-error">${error.message}</p>`;
  }
}

async function init() {
  try {
    await Promise.all([loadFeatured(), loadCatalog(), loadCart()]);

    setCartModalMode("cart");
    selectors.openCartModal?.addEventListener("click", async () => {
      await loadCart();
      openCartModal("cart");
    });
    selectors.closeCartModal?.addEventListener("click", () => closeCartModal());
    selectors.proceedCheckout?.addEventListener("click", () => {
      selectors.checkoutResult.innerHTML = "";
      setCartModalMode("checkout");
    });
    selectors.backToCart?.addEventListener("click", () => setCartModalMode("cart"));
    selectors.closeDetailModal?.addEventListener("click", () => closeDetailModal());

    document.getElementById("filters").addEventListener("input", () => {
      renderCatalog();
    });
    document.getElementById("checkout-form").addEventListener("submit", submitCheckout);
    document.getElementById("quiz-form").addEventListener("submit", submitQuiz);
    setGlobalError("");
  } catch (error) {
    setGlobalError(error.message || "Failed to initialize app.");
  }
}

init();
