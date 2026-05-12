let currentLang = 'uz';
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function changeLang(lang) {
    if(lang) currentLang = lang;
    document.querySelectorAll('.lang-text').forEach(el => {
        if (el.dataset[currentLang]) {
            if (el.tagName === 'INPUT') el.placeholder = el.dataset[currentLang];
            else el.innerText = el.dataset[currentLang];
        }
    });
    renderCategories();
    renderProducts(document.getElementById('search-input').value.toLowerCase());
    updateCartUI();
}

const observerOptions = {
    root: document.getElementById('products-container'),
    rootMargin: '0px -35% 0px -35%',
    threshold: 0
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('center-3d');
        } else {
            entry.target.classList.remove('center-3d');
        }
    });
}, observerOptions);

// --- MAHSULOTLARNI TORTISH (Backend o'zi tozalab yuboradi) ---
async function fetchProducts() {
    try {
        const response = await fetch('/api/products'); 
        if (!response.ok) throw new Error("Server xatosi");

        const resData = await response.json();
        products = resData.data || [];
        
        if(products.length === 0) {
            document.getElementById('products-container').innerHTML = `
                <div class="col-span-full w-full text-center py-10 glass-card">
                    <p class='text-neon_yellow text-xl font-bold mb-2'>Ҳозирча маҳсулотлар қўшилмаган</p>
                    <p class='text-gray-400 text-sm'>Бот орқали ёки Billz тизимига маҳсулот қўшинг.</p>
                </div>`;
            return;
        }

        renderCategories();
        renderProducts();
    } catch (error) {
        console.error("Xatolik:", error);
        document.getElementById('products-container').innerHTML = `<p class='text-red-400 text-center w-full font-bold py-10'>Сервердан маълумот олишда узилиш бўлди. Базани текширинг.</p>`;
    }
}

// --- XIZMATLARNI TORTISH ---
async function fetchServices() {
    try {
        const response = await fetch('/api/services');
        if (!response.ok) return;
        const resData = await response.json();
        renderServices(resData.data || []);
    } catch (error) {
        console.error("Xizmat yuklash xatosi:", error);
    }
}

function renderServices(services) {
    const container = document.getElementById('services-container');
    if (!services || services.length === 0) {
        container.innerHTML = `<p class="text-gray-500 italic col-span-full text-center py-4">Ҳозирча хизматлар қўшилмаган</p>`;
        return;
    }
    
    container.innerHTML = services.map(s => `
        <div class="glass-card p-8 border-t-2 border-neon_yellow/30 hover:border-neon_yellow transition-all group">
            <h3 class="text-2xl font-bold text-white mb-4 group-hover:text-neon_yellow transition-colors">${s.name}</h3>
            <p class="text-gray-400 text-sm leading-relaxed">${s.description || ''}</p>
        </div>
    `).join('');
}

let activeCategory = 'All';

function renderCategories() {
    const tabs = document.getElementById('category-filters');
    const categories = ['All', ...new Set(products.map(p => p.category))];
    
    tabs.innerHTML = categories.map(c => 
        `<button class="category-btn ${c === activeCategory ? 'active' : ''}" onclick="filterCategory('${c}')">
            ${c === 'All' ? (currentLang === 'uz' ? 'Барчаси' : currentLang === 'ru' ? 'Все' : 'Баары') : c}
        </button>`
    ).join('');
}

function filterCategory(cat) {
    activeCategory = cat;
    renderCategories();
    filterProducts();
}

function filterProducts() {
    renderProducts(document.getElementById('search-input').value.toLowerCase());
}

function renderProducts(searchQuery = '') {
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = '';
    
    const filtered = products.filter(p => {
        const matchCat = activeCategory === 'All' || p.category === activeCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery) || String(p.article).toLowerCase().includes(searchQuery);
        return matchCat && matchSearch;
    });

    if(filtered.length === 0 && products.length > 0) {
        container.innerHTML = `<p class="text-gray-400 p-4 font-bold col-span-full">${currentLang === 'uz' ? 'Топилмади' : 'Не найдено'}</p>`;
        return;
    }

    filtered.forEach(p => {
        // Artikul uzun bo'lsa oxirgi 4 ta harf/raqamni qirqamiz
        const shortArt = String(p.article).slice(-4).toUpperCase();
        const card = document.createElement('div');
        card.className = 'product-card glass-card p-4 flex flex-col justify-between h-full';
        card.innerHTML = `
            <div>
                <img src="${p.img}" loading="lazy" alt="${p.name}" class="w-full h-36 object-cover rounded-xl mb-3 border border-white/5 bg-navy">
                <h3 class="text-white font-bold text-lg leading-tight mb-1 truncate">${p.name}</h3>
                <p class="text-gray-400 text-xs mb-2 font-mono bg-white/5 inline-block px-2 py-1 rounded">Art: ...${shortArt}</p>
            </div>
            <div class="mt-4">
                <p class="text-neon_yellow font-bold text-xl mb-3">${p.price.toLocaleString()} <span class="text-xs text-white/50">UZS</span></p>
                <button onclick="addToCart('${p.id}', '${shortArt}', '${p.name}', ${p.price})" class="w-full bg-white/10 hover:bg-neon_yellow hover:text-navy text-white text-sm font-bold py-2.5 rounded-lg transition-colors border border-white/5">
                    <i class="fa-solid fa-cart-plus"></i> ${currentLang === 'uz' ? 'Саватга' : currentLang === 'ru' ? 'В корзину' : 'Себетке'}
                </button>
            </div>
        `;
        container.appendChild(card);
        observer.observe(card); // 3D effekt
    });
}

// Savatcha Logikasi
function addToCart(id, article, name, price) {
    let msg = currentLang === 'uz' ? "Нечта қўшмоқчисиз?" : currentLang === 'ru' ? "Сколько добавить?" : "Канча кошосуз?";
    let qtyStr = prompt(msg, "1");
    let qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) return;

    const existingIndex = cart.findIndex(item => item.id === id);
    if (existingIndex > -1) {
        cart[existingIndex].qty += qty;
    } else {
        cart.push({ id, article, name, price, qty });
    }
    saveCart();
    
    const btn = document.getElementById('cart-count').parentElement;
    btn.classList.add('scale-125', 'bg-neon_yellow', 'text-navy');
    setTimeout(() => btn.classList.remove('scale-125', 'bg-neon_yellow', 'text-navy'), 300);
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.classList.toggle('hidden');
    updateCartUI();
}

function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    const container = document.getElementById('cart-items');
    let total = 0;
    
    if (cart.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-center py-6">${currentLang === 'uz' ? 'Сават бўш' : currentLang === 'ru' ? 'Корзина пуста' : 'Себет бош'}</p>`;
    } else {
        container.innerHTML = cart.map((item, index) => {
            total += item.price * item.qty;
            return `
            <div class="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 mb-2">
                <div class="flex-1 overflow-hidden pr-2">
                    <p class="font-bold text-sm text-white truncate">${item.name}</p>
                    <p class="text-xs text-gray-400 font-mono">Art: ...${item.article}</p>
                    <p class="text-sm text-neon_yellow mt-1">${item.qty} x ${item.price.toLocaleString()} = ${(item.qty * item.price).toLocaleString()}</p>
                </div>
                <button onclick="removeFromCart(${index})" class="text-red-400 hover:text-red-500 bg-red-400/10 p-3 rounded-lg ml-2 transition-colors">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>`;
        }).join('');
    }
    document.getElementById('cart-total').innerText = total.toLocaleString() + " UZS";
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
}

function clearCart() {
    if(confirm(currentLang === 'uz' ? "Саватни тўлиқ тозалаймизми?" : "Очистить корзину полностью?")) {
        cart = [];
        saveCart();
    }
}

function checkoutWhatsApp() {
    if (cart.length === 0) return alert(currentLang === 'uz' ? "Сават бўш!" : "Корзина пуста!");
    
    let text = "Ассалому алайкум! Мен қуйидаги артикуллар бўйича буюртма бермоқчиман:\n\n";
    let total = 0;
    
    cart.forEach(item => {
        text += `🔹 Art: ...${item.article} | ${item.qty} та x ${item.price} = ${item.price * item.qty} UZS\n`;
        total += item.price * item.qty;
    });
    
    text += `\n💵 Жами сумма: ${total.toLocaleString()} UZS\nИлтимос, тайёрлаб қўйинг!`;
    window.open(`https://wa.me/998901234567?text=${encodeURIComponent(text)}`, '_blank');
    
    clearCart();
    toggleCart();
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('install-pwa-btn');
    installBtn.style.display = 'block';
    
    installBtn.addEventListener('click', () => {
        installBtn.style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
            deferredPrompt = null;
        });
    });
});

window.onload = () => {
    fetchProducts();
    fetchServices();
    updateCartUI();
    changeLang('uz');
};
