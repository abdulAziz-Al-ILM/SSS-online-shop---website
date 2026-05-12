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

// O'rtadagi elementlarga 3D effekt beruvchi mexanizm
const observerOptions = {
    root: document.getElementById('product-carousel'),
    rootMargin: '0px -40% 0px -40%', // O'rtadagi kichik zonani aniqlash uchun
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

// Mahsulotlarni Billz (yoki o'zingni backending) dan tortib olish
async function fetchProducts() {
    // ACHCHIQ HAQIQAT: Buni haqiqiy Billz API emas, o'zingni Python dagi /api/products yo'lagiga ula!
    // Hozircha sinov uchun mock-ma'lumotlar yaratib turaman.
    products = [
        { id: 1, name: "Sement M400", article: "BLZ-001234", price: 45000, category: "Qurilish", img: "https://via.placeholder.com/200?text=Sement" },
        { id: 2, name: "Armatura 12mm", article: "BLZ-998877", price: 8000, category: "Metall", img: "https://via.placeholder.com/200?text=Armatura" },
        { id: 3, name: "G'isht (Pishgan)", article: "BLZ-556611", price: 1200, category: "Qurilish", img: "https://via.placeholder.com/200?text=G'isht" },
        { id: 4, name: "Alikabond", article: "BLZ-112233", price: 120000, category: "Fasad", img: "https://via.placeholder.com/200?text=Alikabond" },
        { id: 5, name: "Bo'yoq Oq 10L", article: "BLZ-444455", price: 65000, category: "Bo'yoqlar", img: "https://via.placeholder.com/200?text=Bo'yoq" },
        { id: 6, name: "Shpatlyovka", article: "BLZ-777788", price: 35000, category: "Qurilish", img: "https://via.placeholder.com/200?text=Shpatlyovka" },
        { id: 7, name: "Kafel 60x60", article: "BLZ-990011", price: 85000, category: "Bezak", img: "https://via.placeholder.com/200?text=Kafel" },
        { id: 8, name: "Profil truba", article: "BLZ-333322", price: 25000, category: "Metall", img: "https://via.placeholder.com/200?text=Profil" }
    ];
    renderCategories();
    renderProducts();
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
        const matchSearch = p.name.toLowerCase().includes(searchQuery) || p.article.includes(searchQuery);
        return matchCat && matchSearch;
    });

    filtered.forEach(p => {
        // Artikulning faqat oxirgi 4 ta raqami
        const shortArt = p.article.slice(-4);
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.img}" loading="lazy" alt="${p.name}">
            <h3>${p.name}</h3>
            <p class="article">Art: ...${shortArt}</p>
            <p class="price">${p.price.toLocaleString()} UZS</p>
            <button onclick="addToCart(${p.id}, '${shortArt}', '${p.name}', ${p.price})">
                ${currentLang === 'uz' ? 'Savatga qo\'shish' : currentLang === 'ru' ? 'В корзину' : 'Себетке кошуу'}
            </button>
        `;
        container.appendChild(card);
        observer.observe(card); // 3D effekt uchun kuzatish
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
                    <strong>${item.name}</strong> (Art: ${item.article})<br>
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

// WhatsApp Checkout Mantiqi (Faqat oxirgi 4 ta raqam o'qiladi)
function checkoutWhatsApp() {
    if (cart.length === 0) return alert("Savatcha bo'sh!");
    
    let text = "Assalomu alaykum! Men quyidagi artikullar bo'yicha buyurtma bermoqchiman:\n\n";
    let total = 0;
    
    cart.forEach(item => {
        text += `🔹 Artikul: ${item.article} | ${item.qty} ta x ${item.price} = ${item.price * item.qty} UZS\n`;
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
