let currentLang = 'uz';
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Tilni o'zgartirish tizimi
function changeLang() {
    currentLang = document.getElementById('lang-select').value;
    document.querySelectorAll('.lang-text').forEach(el => {
        if (el.dataset[currentLang]) {
            if (el.tagName === 'INPUT') el.placeholder = el.dataset[currentLang];
            else el.innerText = el.dataset[currentLang];
        }
    });
    renderProducts();
    updateCartUI();
}

// 3D Effekt uchun Intersection Observer (o'rtaga kelgan element kattalashadi)
const observerOptions = {
    root: document.getElementById('product-carousel'),
    rootMargin: '0px -40% 0px -40%', 
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

// Mahsulotlarni O'ZIMIZNING BACKEND (main.py) orqali xavfsiz tortib olish
async function fetchProducts() {
    try {
        const response = await fetch('/api/products'); 
        if (!response.ok) throw new Error("Serverdan ma'lumot olishda xato");

        const resData = await response.json();
        const data = resData.data; // Backenddan kelgan "data" qismi
        
        // Ham Billz API formatiga, ham o'zimizning MongoDB formatimizga tushadigan universal formatlash
        products = data.map(item => ({
            id: item.id || item._id, // Billz 'id' qaytaradi, Mongo '_id'
            name: item.name,
            article: item.sku || item.article || "0000",
            price: item.price || 0,
            category: item.category_name || item.category || "Boshqa",
            // Rasm Billzdan kelsa url, Mongodan kelsa file_id. File_id bo'lsa uni proxy orqali ochamiz
            img: item.image_url ? item.image_url : (item.file_id ? `/api/image/${item.file_id}` : "https://via.placeholder.com/200?text=Rasm+yo'q")
        }));
        
        renderCategories();
        renderProducts();
    } catch (error) {
        console.error("Mahsulotlarni yuklashda xatolik:", error);
        document.getElementById('product-carousel').innerHTML = "<p style='text-align:center;'>Mahsulotlarni yuklashda xatolik yuz berdi. Iltimos sahifani yangilang.</p>";
    }
}

let activeCategory = 'All';

function renderCategories() {
    const tabs = document.getElementById('category-tabs');
    const categories = ['All', ...new Set(products.map(p => p.category))];
    
    tabs.innerHTML = categories.map(c => 
        `<button class="${c === activeCategory ? 'active' : ''}" onclick="filterCategory('${c}')">
            ${c === 'All' ? (currentLang === 'uz' ? 'Barchasi' : currentLang === 'ru' ? 'Все' : 'Баары') : c}
        </button>`
    ).join('');
}

function filterCategory(cat) {
    activeCategory = cat;
    renderCategories();
    renderProducts();
}

function filterProducts() {
    renderProducts(document.getElementById('search-input').value.toLowerCase());
}

function renderProducts(searchQuery = '') {
    const container = document.getElementById('product-carousel');
    container.innerHTML = '';
    
    const filtered = products.filter(p => {
        const matchCat = activeCategory === 'All' || p.category === activeCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery) || String(p.article).toLowerCase().includes(searchQuery);
        return matchCat && matchSearch;
    });

    filtered.forEach(p => {
        // Artikulning faqat oxirgi 4 ta raqami olinadi
        const shortArt = String(p.article).slice(-4);
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.img}" loading="lazy" alt="${p.name}">
            <h3>${p.name}</h3>
            <p class="article">Art: ...${shortArt}</p>
            <p class="price">${p.price.toLocaleString()} UZS</p>
            <button onclick="addToCart('${p.id}', '${shortArt}', '${p.name}', ${p.price})">
                ${currentLang === 'uz' ? 'Savatga qo\'shish' : currentLang === 'ru' ? 'В корзину' : 'Себетке кошуу'}
            </button>
        `;
        container.appendChild(card);
        observer.observe(card); // 3D effekt uchun observerga qo'shamiz
    });
}

// Savatcha tizimi
function addToCart(id, article, name, price) {
    let qtyStr = prompt(currentLang === 'uz' ? "Nechta qo'shmoqchisiz?" : currentLang === 'ru' ? "Сколько добавить?" : "Канча кошосуз?", "1");
    let qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) return;

    const existingIndex = cart.findIndex(item => item.id === id);
    if (existingIndex > -1) {
        cart[existingIndex].qty += qty;
    } else {
        cart.push({ id, article, name, price, qty });
    }
    saveCart();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    updateCartUI();
}

function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    const container = document.getElementById('cart-items');
    let total = 0;
    
    if (cart.length === 0) {
        container.innerHTML = `<p>${currentLang === 'uz' ? 'Savatcha bo\'sh' : currentLang === 'ru' ? 'Корзина пуста' : 'Себет бош'}</p>`;
    } else {
        container.innerHTML = cart.map((item, index) => {
            total += item.price * item.qty;
            return `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong> (Art: ...${item.article})<br>
                    ${item.qty} x ${item.price.toLocaleString()} = ${(item.qty * item.price).toLocaleString()} UZS
                </div>
                <button onclick="removeFromCart(${index})">X</button>
            </div>`;
        }).join('');
    }
    document.getElementById('cart-total').innerText = total.toLocaleString();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
}

function clearCart() {
    cart = [];
    saveCart();
}

// WhatsApp Checkout Mantiqi
function checkoutWhatsApp() {
    if (cart.length === 0) return alert(currentLang === 'uz' ? "Savatcha bo'sh!" : currentLang === 'ru' ? "Корзина пуста!" : "Себет бош!");
    
    let text = "Assalomu alaykum! Men quyidagi artikullar bo'yicha buyurtma bermoqchiman:\n\n";
    let total = 0;
    
    cart.forEach(item => {
        text += `🔹 Art: ...${item.article} | ${item.qty} ta x ${item.price} = ${item.price * item.qty} UZS\n`;
        total += item.price * item.qty;
    });
    
    text += `\n💵 Jami summa: ${total.toLocaleString()} UZS\nIltimos, tayyorlab qo'ying!`;
    
    // Telefon raqamingni shu yerga yoz (+998...)
    window.open(`https://wa.me/998901234567?text=${encodeURIComponent(text)}`, '_blank');
    clearCart();
    toggleCart();
}

// PWA o'rnatish mantig'i
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
    updateCartUI();
    document.getElementById('lang-select').value = currentLang;
};
