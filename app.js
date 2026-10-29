/* ============ CONFIGURACIÓN ============
   WHATSAPP: número que recibe los pedidos, formato internacional sin "+" ni espacios.
   Ej. 0991234567 -> "593991234567"                                                    */
const CONFIG = {
  WHATSAPP: "593992809004",
  PRECIO: 10,
};

const PRODUCTOS = {
  grano: { nombre: "Café Tostado en Grano 500 g", img: "assets/img/bolsa-grano.webp" },
  molido: { nombre: "Café Tostado Molido 500 g", img: "assets/img/bolsa-molido.webp" },
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n) => `$${n.toFixed(2)}`;
const STORE_KEY = "km-pedido";

let cart = load();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return Object.fromEntries(Object.entries(raw).filter(([k, v]) => PRODUCTOS[k] && v > 0));
  } catch { return {}; }
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch {} }

const units = () => Object.values(cart).reduce((a, b) => a + b, 0);
const total = () => units() * CONFIG.PRECIO;

/* ---------- Tarjetas de producto ---------- */
$$("[data-product]").forEach((card) => {
  const id = card.dataset.product;
  const out = $("[data-qty]", card);
  let qty = 1;
  $$("[data-step]", card).forEach((b) =>
    b.addEventListener("click", () => {
      qty = Math.min(20, Math.max(1, qty + Number(b.dataset.step)));
      out.textContent = qty;
    })
  );
  $("[data-add]", card).addEventListener("click", () => {
    cart[id] = Math.min(50, (cart[id] || 0) + qty);
    save(); render();
    toast(`${qty} × ${PRODUCTOS[id].nombre} agregado`);
    document.dispatchEvent(new CustomEvent("km:add", { detail: { img: $(".product__media img", card) } }));
    qty = 1; out.textContent = 1;
  });
});

/* ---------- Render del pedido ---------- */
function render() {
  const n = units();
  $$("[data-cart-count]").forEach((el) => (el.textContent = n));
  $$("[data-cart-total]").forEach((el) => (el.textContent = money(total())));
  $$("[data-cart-units]").forEach((el) => (el.textContent = `${n} ${n === 1 ? "funda" : "fundas"}`));

  const empty = n === 0;
  $("[data-cart-empty]").hidden = !empty;
  $("[data-order-form]").hidden = empty;
  $("[data-cart-foot]").hidden = empty;
  const bar = $("[data-mobile-bar]");
  bar.hidden = empty;
  document.body.classList.toggle("has-bar", !empty);

  $("[data-cart-list]").innerHTML = Object.entries(cart)
    .map(([id, q]) => `
      <li class="cart-item" data-id="${id}">
        <img src="${PRODUCTOS[id].img}" alt="" />
        <div>
          <p class="cart-item__name">${PRODUCTOS[id].nombre}</p>
          <div class="cart-item__meta">
            <div class="qty qty--sm" role="group" aria-label="Cantidad">
              <button type="button" data-cart-step="-1" aria-label="Quitar una">−</button>
              <output>${q}</output>
              <button type="button" data-cart-step="1" aria-label="Agregar una">+</button>
            </div>
            <button type="button" class="cart-item__remove" data-remove>Quitar</button>
          </div>
        </div>
        <span class="cart-item__price">${money(q * CONFIG.PRECIO)}</span>
      </li>`)
    .join("");
}

$("[data-cart-list]").addEventListener("click", (e) => {
  const li = e.target.closest(".cart-item");
  if (!li) return;
  const id = li.dataset.id;
  const step = e.target.closest("[data-cart-step]");
  if (step) cart[id] = Math.min(50, cart[id] + Number(step.dataset.cartStep));
  if (e.target.closest("[data-remove]")) cart[id] = 0;
  if (cart[id] <= 0) delete cart[id];
  save(); render();
});

/* ---------- Drawer ---------- */
const drawer = $("[data-drawer]");
const panel = $(".drawer__panel");
let lastFocus = null;

function openCart() {
  lastFocus = document.activeElement;
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => panel.focus(), 50);
}
function closeCart() {
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lastFocus?.focus?.();
}
$$("[data-open-cart]").forEach((b) => b.addEventListener("click", openCart));
$$("[data-close-cart]").forEach((b) => b.addEventListener("click", closeCart));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawer.classList.contains("is-open")) closeCart();
});

/* ---------- Formulario ---------- */
const form = $("[data-order-form]");

function syncDelivery() {
  const envio = form.entrega.value === "Envío a domicilio";
  $$("[data-delivery-only]", form).forEach((f) => {
    f.hidden = !envio;
    $("input", f).required = envio;
  });
}
form.addEventListener("change", (e) => { if (e.target.name === "entrega") syncDelivery(); });
form.addEventListener("input", (e) => {
  const f = e.target.closest(".field");
  if (f && e.target.checkValidity()) f.classList.remove("is-invalid");
});
syncDelivery();

function validate() {
  let first = null;
  $$(".field", form).forEach((f) => {
    const input = $("input, textarea", f);
    if (f.hidden) return f.classList.remove("is-invalid");
    input.value = input.value.trim();
    if (input.name === "telefono") input.value = input.value.replace(/[\s-]/g, "");
    const ok = input.checkValidity();
    f.classList.toggle("is-invalid", !ok);
    if (!ok && !first) first = input;
  });
  first?.focus();
  return !first;
}

$("[data-submit-order]").addEventListener("click", () => {
  if (!units()) return;
  if (!validate()) return;
  const d = Object.fromEntries(new FormData(form));
  const lineas = Object.entries(cart).map(([id, q]) => `• ${q} × ${PRODUCTOS[id].nombre} — ${money(q * CONFIG.PRECIO)}`);
  const msg = [
    "¡Hola Kafé Maravilla! Quiero hacer este pedido ☕",
    "",
    ...lineas,
    `*Subtotal: ${money(total())}*`,
    "",
    `Nombre: ${d.nombre}`,
    `Teléfono: ${d.telefono}`,
    `Entrega: ${d.entrega}`,
    ...(d.entrega === "Envío a domicilio" ? [`Dirección: ${d.direccion}`, `Sector: ${d.sector}`] : []),
    `Pago: ${d.pago}`,
    ...(d.notas ? [`Notas: ${d.notas}`] : []),
  ].join("\n");
  window.open(`https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
});

/* Links de WhatsApp para mayoristas / contacto */
$$("[data-wa-business]").forEach((a) => {
  a.href = `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent("Hola Kafé Maravilla, me interesa su café para mi negocio.")}`;
  a.target = "_blank";
  a.rel = "noopener";
});

/* ---------- Toast ---------- */
let toastT;
function toast(text) {
  const t = $("[data-toast]");
  t.textContent = text;
  t.classList.add("is-on");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("is-on"), 2200);
}

$("[data-year]").textContent = new Date().getFullYear();
render();
