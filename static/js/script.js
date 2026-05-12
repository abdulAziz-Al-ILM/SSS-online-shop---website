let currentLang = 'uz';
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Tilni o'zgartirish
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

// 3D Effekt Observer
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

// --- MAHSULOTLARNI TORTISH (XATOLARDAN HIMOYA BILAN) ---
async function fetchProducts() {
    try {
        const response = await fetch('/api/products'); 
        if (!response.ok) throw new Error("Server xatosi");

        const resData = await response.json();
        let data = resData.data; 
        
        // Agar API dan data obyekt ichida kelsa uni massivga(Array) aylantiramiz
        let productList = Array.isArray(data) ? data : (data.products || data.items || data.data || []);

        if(!Array.isArray(productList) || productList.length === 0) {
            console.warn("API mahsulotlarni topmadi yoki format xato:", data);
        }

        products = productList.map(item => ({
            id: item.id || item._id,
            name: item.name || "Nomsiz mahsulot",
            article: item.sku || item.article || item.id || "0000",
            price: item.price || 0,
            category: item.category_name || item.category || "Boshqa",
            img: item.image_url ? item.image_url : (item.file_id ? `/api/image/${item.file_id}` : "https://via.placeholder.com/200?text=Rasm+yo'q")
        }));
        
        renderCategories();
        renderProducts();
    } catch (error) {
        console.error("Mahsulotларни юклаш хатоси:", error);
        document.getElementById('products-container').innerHTML = `<p class='text-red-400 text-center w-full'>Маҳсулотларни юклашда хатолик юз берди. Базани текширинг.</p>`;
    }
}

// --- XIZMATLARNI (BOTDAN QO'SHILADIGAN) TORTISH VA CHIZISH ---
async function fetchServices() {
    try {
        const response = await fetch('/api/services');
        if (!response.ok) return;
        const resData = await response.json();
        renderServices(resData.data || []);
    } catch (error) {
        console.error("Xizmatlarni yuklash xatosi:", error);
    }
}

function renderServices(services) {
    const container = document.getElementById('services-container');
    if (!services || services.length === 0) {
        container.innerHTML = `<p class="text-gray-500 italic col-span-full text-center">Ҳозирча хизматлар қўшилмаган</p>`;
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
    container.innerHTML = '';
    
    const filtered = products.filter(p => {
        const matchCat = activeCategory === 'All' || p.category === activeCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery) || String(p.article).toLowerCase().includes(searchQuery);
        return matchCat && matchSearch;
    });

    if(filtered.length === 0) {
        container.innerHTML = `<p class="text-gray-400 p-4">${currentLang === 'uz' ? 'Топилмади' : 'Не найдено'}</p>`;
        return;
    }

    filtered.forEach(p => {
        const shortArt = String(p.article).slice(-4);
        const card = document.createElement('div');
        card.className = 'product-card glass-card p-4 flex flex-col justify-between h-full';
        card.innerHTML = `
            <div>
                <img src="${p.img}" loading="lazy" alt="${p.name}" class="w-full h-36 object-cover rounded-xl mb-3 border border-white/5">
                <h3 class="text-white font-bold text-lg leading-tight mb-1 truncate">${p.name}</h3>
                <p class="text-gray-400 text-xs mb-2 font-mono">Art: ...${shortArt}</p>
            </div>
            <div>
                <p class="text-neon_yellow font-bold text-xl mb-3">${p.price.toLocaleString()} <span class="text-xs">UZS</span></p>
                <button onclick="addToCart('${p.id}', '${shortArt}', '${p.name}', ${p.price})" class="w-full bg-white/10 hover:bg-neon_yellow hover:text-navy text-white text-sm font-bold py-2.5 rounded-lg transition-colors border border-white/5">
                    <i class="fa-solid fa-cart-plus"></i> ${currentLang === 'uz' ? 'Саватга' : currentLang === 'ru' ? 'В корзину' : 'Себетке'}
                </button>
            </div>
        `;
        container.appendChild(card);
        observer.observe(card); // 3D uchun
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
    btn.classList.add('scale-125');
    setTimeout(() => btn.classList.remove('scale-125'), 200);
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
            <div class="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <div class="flex-1">
                    <p class="font-bold text-sm text-white truncate w-48">${item.name}</p>
                    <p class="text-xs text-gray-400 font-mono">Art: ...${item.article}</p>
                    <p class="text-sm text-neon_yellow mt-1">${item.qty} x ${item.price.toLocaleString()} = ${(item.qty * item.price).toLocaleString()}</p>
                </div>
                <button onclick="removeFromCart(${index})" class="text-red-400 hover:text-red-500 bg-red-400/10 p-2 rounded-lg ml-2">
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

// WhatsApp Checkout
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

// PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('install-pwa-btn');
    installBtn.style.display = 'block';
    
    installBtn.addEventListener('click', () => {
        installBtn.style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            deferredPrompt = null;
        });
    });
});

window.onload = () => {
    fetchProducts();
    fetchServices(); // Xizmatlar endi alohida yuklanadi
    updateCartUI();
    changeLang('uz');
};
