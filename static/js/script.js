/**
 * SSS ONLINE SHOP - FRONTEND ENGINE v3.0
 * Kategoriya filtri, 2 qatorli vitrina va 3 til (UZ, RU, KG)
 */

const translations = {
    uz: {
        subtitle: "Ҳар бир хонадон учун энг яхшиси!",
        btn_katalog: "Каталогга ўтиш",
        services_title: "Бизнинг хизматлар",
        katalog_title: "Қурилиш моллари",
        locations_title: "Бизнинг манзиллар",
        about_title: "Фирма ҳақида",
        order_btn: "Буюртма бериш",
        label_bot: "Ботга ўтиш",
        label_channel: "Каналимиз",
        no_products: "Ҳозирча маҳсулотлар йўқ.",
        stock_label: "Омборда:",
        currency: "сом",
        all_cats: "Барчаси"
    },
    ru: {
        subtitle: "Лучшее для каждого дома!",
        btn_katalog: "Перейти в каталог",
        services_title: "Наши услуги",
        katalog_title: "Стройматериалы",
        locations_title: "Наши адреса",
        about_title: "О компании",
        order_btn: "Заказать",
        label_bot: "Перейти в бот",
        label_channel: "Наш канал",
        no_products: "Товаров пока нет.",
        stock_label: "В наличии:",
        currency: "сом",
        all_cats: "Все"
    },
    kg: {
        subtitle: "Ар бир үй үчүн эң жакшысы!",
        btn_katalog: "Каталогко өтүү",
        services_title: "Биздин кызматтар",
        katalog_title: "Курулуш материалдары",
        locations_title: "Биздин даректер",
        about_title: "Фирма жөнүндө",
        order_btn: "Заказ берүү",
        label_bot: "Ботко өтүү",
        label_channel: "Биздин канал",
        no_products: "Азырынча продукция жок.",
        stock_label: "Кампада:",
        currency: "сом",
        all_cats: "Баардыгы"
    }
};

let allProductsData = []; 

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('selectedLang') || 'uz';
    applyLang(savedLang);
    
    Promise.all([
        fetchAds(),
        fetchServices(),
        fetchProducts(),
        fetchLocations()
    ]).catch(err => console.error("API Xatolik:", err));
});

function changeLang(lang) {
    if (translations[lang]) {
        localStorage.setItem('selectedLang', lang);
        applyLang(lang);
        fetchProducts(); // Til o'zgarganda mahsulotlar qayta chiziladi
    }
}

function applyLang(lang) {
    const t = translations[lang];
    if (!t) return;

    const elements = {
        'site-subtitle': t.subtitle,
        'btn-katalog': t.btn_katalog,
        'services-title': t.services_title,
        'katalog-title': t.katalog_title,
        'locations-title': t.locations_title,
        'label-bot': t.label_bot,
        'label-channel': t.label_channel
    };

    for (let id in elements) {
        const el = document.getElementById(id);
        if (el) el.innerText = elements[id];
    }

    const aboutTitle = document.getElementById('about-title');
    if (aboutTitle) {
        aboutTitle.innerHTML = `<i class="fa-solid fa-circle-info mr-3"></i> ${t.about_title}`;
    }
}

async function fetchProducts() {
    const container = document.getElementById('products-container');
    const filterContainer = document.getElementById('category-filters');
    const lang = localStorage.getItem('selectedLang') || 'uz';
    const t = translations[lang];
    const allCatsText = t.all_cats; 
    
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        
        if (data.status === 'success' && data.data.length > 0) {
            allProductsData = data.data;
            
            const uniqueCategories = [...new Set(allProductsData.map(p => p.category || 'Бошқалар'))];
            const categories = [allCatsText, ...uniqueCategories];
            
            filterContainer.innerHTML = categories.map((cat, index) => `
                <button onclick="filterProducts('${cat}', '${allCatsText}')" 
                        class="category-btn ${index === 0 ? 'active' : ''}" 
                        data-cat="${cat}">
                    ${cat}
                </button>
            `).join('');
            
            renderProducts(allCatsText, allCatsText);
        } else {
            container.innerHTML = `<p class="col-span-full text-center text-gray-400 py-12 w-full">${t.no_products}</p>`;
            filterContainer.innerHTML = '';
        }
    } catch (e) {
        console.error("FetchProducts Error:", e);
        container.innerHTML = `<p class="col-span-full text-center text-red-500 py-12 w-full">API Error</p>`;
    }
}

function filterProducts(selectedCategory, allCatsText) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        if (btn.getAttribute('data-cat') === selectedCategory) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderProducts(selectedCategory, allCatsText);
}

function renderProducts(category, allCatsText) {
    const container = document.getElementById('products-container');
    const lang = localStorage.getItem('selectedLang') || 'uz';
    const t = translations[lang];
    
    let filtered = allProductsData;
    if (category !== allCatsText) {
        filtered = allProductsData.filter(p => (p.category || 'Бошқалар') === category);
    }
    
    container.innerHTML = '';
    
    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-gray-400 py-12 text-center w-full" style="grid-column: 1 / -1;">Бўш</p>`;
        return;
    }
    
    filtered.forEach(p => {
        const botOrderUrl = `${BOT_URL}?start=order_${p._id}`;
        container.innerHTML += `
            <div class="glass-card flex flex-col h-full overflow-hidden group border border-white/5 rounded-[2rem] transition-all hover:shadow-[0_15px_35px_rgba(0,0,0,0.4)]">
                <div class="h-44 w-full bg-navy_light relative border-b border-white/5 overflow-hidden">
                    <img src="/api/image/${p.file_id}" 
                         class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                         onerror="this.src='https://via.placeholder.com/500x400/1e293b/facc15?text=Rasm+Yo%27q'">
                    <div class="absolute top-3 right-3 bg-navy/80 backdrop-blur-md px-3 py-1 rounded-full text-neon_yellow font-bold text-[10px] uppercase border border-neon_yellow/30">
                        ${t.stock_label} ${p.stock}
                    </div>
                </div>
                <div class="p-5 flex-grow flex flex-col justify-between bg-gradient-to-b from-transparent to-navy/50">
                    <div>
                        <h3 class="font-heading text-lg font-bold text-white mb-1 tracking-wide line-clamp-2">${p.name}</h3>
                        <p class="text-neon_orange text-lg font-mono font-bold mb-3">
                            ${p.price.toLocaleString()} ${t.currency}
                        </p>
                    </div>
                    <div class="mt-auto">
                        <a href="${botOrderUrl}" target="_blank" class="block w-full text-center btn-neon py-3 rounded-xl font-bold text-xs transition-all duration-300 transform active:scale-95 uppercase tracking-widest shadow-lg">
                            <i class="fa-solid fa-cart-shopping mr-1"></i> ${t.order_btn}
                        </a>
                    </div>
                </div>
            </div>`;
    });
}

// BOSHQA FUNKSIYALAR (O'zgarishsiz)
async function fetchAds() {
    try {
        const res = await fetch('/api/ads');
        const data = await res.json();
        const container = document.getElementById('ads-container');
        if (data.data && data.data.length > 0) {
            container.innerHTML = '';
            data.data.forEach(ad => {
                container.innerHTML += `
                    <div class="bg-gradient-to-r from-neon_orange/10 to-neon_yellow/10 border border-neon_yellow/20 rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between mb-8 shadow-2xl">
                        <div class="flex items-center space-x-8 mb-6 md:mb-0">
                            <div class="bg-neon_orange/20 p-6 rounded-3xl"><i class="fa-solid fa-fire text-4xl text-neon_orange animate-bounce"></i></div>
                            <div>
                                <h3 class="font-heading text-4xl text-white font-bold mb-2 uppercase tracking-tighter">${ad.title}</h3>
                                <p class="text-gray-300 text-xl">${ad.text}</p>
                            </div>
                        </div>
                        ${ad.discount ? `<div class="bg-neon_yellow text-navy font-black text-4xl px-10 py-4 rounded-[1.5rem] shadow-[0_10px_30px_rgba(250,204,21,0.3)]">-${ad.discount}%</div>` : ''}
                    </div>`;
            });
        }
    } catch (e) {}
}

async function fetchServices() {
    try {
        const res = await fetch('/api/services');
        const data = await res.json();
        const container = document.getElementById('services-container');
        if (data.data && data.data.length > 0) {
            container.innerHTML = '';
            data.data.forEach(srv => {
                container.innerHTML += `
                    <div class="glass-card p-10 border-t-8 border-t-neon_orange rounded-[3rem] hover:bg-white/5 transition-all group">
                        <i class="${srv.icon || 'fa-solid fa-helmet-safety'} text-7xl text-neon_yellow mb-10 group-hover:scale-110 transition-transform"></i>
                        <h3 class="font-heading text-3xl font-bold text-white mb-6 uppercase tracking-wider">${srv.name}</h3>
                        <p class="text-gray-400 leading-relaxed text-xl">${srv.description}</p>
                    </div>`;
            });
        }
    } catch (e) {}
}

async function fetchLocations() {
    try {
        const res = await fetch('/api/locations');
        const data = await res.json();
        const container = document.getElementById('locations-container');
        if (data.data && data.data.length > 0) {
            container.innerHTML = '';
            data.data.forEach(loc => {
                container.innerHTML += `
                    <div class="glass-card p-10 relative overflow-hidden group border border-white/5 rounded-[3rem]">
                        <div class="absolute -right-12 -top-12 text-white/5 group-hover:text-neon_yellow/5 transition-colors duration-1000"><i class="fa-solid fa-map-location-dot text-[14rem]"></i></div>
                        <h3 class="font-heading text-3xl font-bold text-neon_yellow mb-8 relative z-10 uppercase tracking-widest">${loc.name}</h3>
                        <p class="text-gray-300 mb-10 relative z-10 text-xl italic font-light leading-snug"><i class="fa-solid fa-location-dot mr-4 text-neon_orange"></i>${loc.address}</p>
                        ${loc.map_link ? `<a href="${loc.map_link}" target="_blank" class="inline-flex items-center px-10 py-3 border border-gray-600 rounded-full text-white hover:border-neon_yellow hover:text-neon_yellow relative z-10 transition-all font-bold uppercase text-sm tracking-widest bg-navy/20 backdrop-blur-sm"><i class="fa-solid fa-diamond-turn-right mr-3"></i> Xaritada ko'rish</a>` : ''}
                    </div>`;
            });
        }
    } catch (e) {}
}
