// Til lug'atlari
const translations = {
    uz: {
        subtitle: "Доим хизматингиздамиз!",
        btn_katalog: "Каталогга ўтиш",
        services_title: "Бизнинг хизматлар",
        katalog_title: "Арзон қурилиш моллари",
        locations_title: "Бизнинг манзиллар ва контактлар",
        about_title: "Фирма ҳақида",
        order_btn: "Буюртма бериш",
        no_products: "Ҳозирча маҳсулотлар йўқ."
    },
    ru: {
        subtitle: "Всегда к вашим услугам!",
        btn_katalog: "Перейти в каталог",
        services_title: "Наши услуги",
        katalog_title: "Дешевые стройматериалы",
        locations_title: "Наши адреса и контакты",
        about_title: "О компании",
        order_btn: "Заказать",
        no_products: "Товаров пока нет."
    },
    kg: {
        subtitle: "Дайыма кызматыңыздабыз!",
        btn_katalog: "Каталогко өтүү",
        services_title: "Биздин кызматтар",
        katalog_title: "Арзан курулуш материалдары",
        locations_title: "Биздин даректер жана байланыштар",
        about_title: "Фирма жөнүндө",
        order_btn: "Заказ берүү",
        no_products: "Азырынча продукция жок."
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('selectedLang') || 'uz';
    applyLang(savedLang);
    
    fetchAds();
    fetchServices();
    fetchProducts();
    fetchLocations();
});

function changeLang(lang) {
    localStorage.setItem('selectedLang', lang);
    location.reload(); // Sahifani yangilab tillarni qo'llash
}

function applyLang(lang) {
    const t = translations[lang];
    document.getElementById('site-subtitle').innerText = t.subtitle;
    document.getElementById('btn-katalog').innerText = t.btn_katalog;
    document.getElementById('services-title').innerText = t.services_title;
    document.getElementById('katalog-title').innerText = t.katalog_title;
    document.getElementById('locations-title').innerText = t.locations_title;
    document.getElementById('about-title').innerHTML = `<i class="fa-solid fa-circle-info"></i> ${t.about_title}`;
}

// Mahsulotlar (Buyurtma botga yo'naltirilgan)
async function fetchProducts() {
    const container = document.getElementById('products-container');
    const lang = localStorage.getItem('selectedLang') || 'uz';
    
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        container.innerHTML = ''; 
        
        if (data.data && data.data.length > 0) {
            data.data.forEach(p => {
                // Buyurtma bosilganda botga o'tkazish linki
                const botLink = `${BOT_URL}?start=order_${p._id}`;
                
                container.innerHTML += `
                    <div class="glass-card flex flex-col h-full overflow-hidden">
                        <div class="h-48 w-full bg-navy_light relative border-b border-gray-700">
                            <img src="/api/image/${p.file_id}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/400x300/1e293b/facc15?text=Rasm+Yo%27q'">
                        </div>
                        <div class="p-6 flex-grow">
                            <h3 class="font-heading text-2xl font-bold text-white mb-2 tracking-wide">${p.name}</h3>
                            <p class="text-neon_yellow text-xl font-mono font-bold mb-4">${p.price.toLocaleString()} so'm</p>
                            <p class="text-gray-400 text-sm mb-4 leading-relaxed">${p.description || ''}</p>
                        </div>
                        <div class="p-6 pt-0 mt-auto">
                            <a href="${botLink}" target="_blank" class="block w-full text-center border-2 border-neon_yellow text-neon_yellow hover:bg-neon_yellow hover:text-navy font-bold py-2 rounded-lg transition-all duration-300">
                                <i class="fa-solid fa-cart-shopping mr-2"></i> ${translations[lang].order_btn}
                            </a>
                        </div>
                    </div>`;
            });
        } else {
            container.innerHTML = `<p class="col-span-full text-center text-gray-400">${translations[lang].no_products}</p>`;
        }
    } catch (e) { console.error(e); }
}

// Boshqa fetch funksiyalari (Ads, Services, Locations) o'zgarmasdan qoladi
async function fetchAds() {
    try {
        const res = await fetch('/api/ads');
        const data = await res.json();
        const container = document.getElementById('ads-container');
        if (data.data && data.data.length > 0) {
            data.data.forEach(ad => {
                container.innerHTML += `
                    <div class="bg-gradient-to-r from-neon_orange/20 to-neon_yellow/20 border border-neon_yellow rounded-lg p-6 flex items-center justify-between mb-4 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                        <div>
                            <h3 class="font-heading text-2xl text-white font-bold mb-1"><i class="fa-solid fa-fire text-neon_orange mr-2"></i>${ad.title}</h3>
                            <p class="text-gray-300">${ad.text}</p>
                        </div>
                        ${ad.discount ? `<div class="bg-neon_yellow text-navy font-bold text-2xl px-4 py-2 rounded">-${ad.discount}%</div>` : ''}
                    </div>`;
            });
        }
    } catch (e) { console.error(e); }
}

async function fetchServices() {
    try {
        const res = await fetch('/api/services');
        const data = await res.json();
        const container = document.getElementById('services-container');
        if (data.data && data.data.length > 0) {
            data.data.forEach(srv => {
                const icon = srv.icon || 'fa-solid fa-tools'; 
                container.innerHTML += `
                    <div class="glass-card p-6 border-t-4 border-t-neon_orange hover:scale-105 transition-transform">
                        <i class="${icon} text-4xl text-neon_yellow mb-4"></i>
                        <h3 class="font-heading text-xl font-bold text-white mb-2">${srv.name}</h3>
                        <p class="text-gray-400 text-sm">${srv.description}</p>
                    </div>`;
            });
        }
    } catch (e) { console.error(e); }
}

async function fetchLocations() {
    try {
        const res = await fetch('/api/locations');
        const data = await res.json();
        const container = document.getElementById('locations-container');
        if (data.data && data.data.length > 0) {
            data.data.forEach(loc => {
                container.innerHTML += `
                    <div class="glass-card p-6 relative overflow-hidden group">
                        <div class="absolute -right-4 -top-4 text-navy_light opacity-50 group-hover:text-neon_yellow/10 transition-colors duration-500">
                            <i class="fa-solid fa-map-location-dot text-9xl"></i>
                        </div>
                        <h3 class="font-heading text-xl font-bold text-neon_yellow mb-2 relative z-10">${loc.name}</h3>
                        <p class="text-gray-300 text-sm mb-4 relative z-10"><i class="fa-solid fa-location-dot mr-2"></i>${loc.address}</p>
                        ${loc.map_link ? `<a href="${loc.map_link}" target="_blank" class="text-sm border border-gray-500 px-3 py-1 rounded text-white hover:border-neon_yellow hover:text-neon_yellow relative z-10 transition">Xaritada ko'rish</a>` : ''}
                    </div>`;
            });
        }
    } catch (e) { console.error(e); }
}
