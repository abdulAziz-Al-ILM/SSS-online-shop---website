/**
 * SSS ONLINE SHOP FRONTEND CORE v2.0
 * Barcha tillar va dinamik kontent boshqaruvi
 */

const translations = {
    uz: {
        subtitle: "Доим хизматингиздамиз!",
        btn_katalog: "Каталогга ўтиш",
        services_title: "Бизнинг хизматлар",
        katalog_title: "Арзон қурилиш моллари",
        locations_title: "Бизнинг манзиллар ва контактлар",
        about_title: "Фирма ҳақида",
        order_btn: "Буюртма бериш",
        label_bot: "Ботга ўтиш",
        label_channel: "Каналимиз",
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
        label_bot: "Перейти в бот",
        label_channel: "Наш канал",
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
        label_bot: "Ботко өтүү",
        label_channel: "Биздин канал",
        no_products: "Азырынча продукция жок."
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Tanlangan tilni yuklash
    const savedLang = localStorage.getItem('selectedLang') || 'uz';
    applyLang(savedLang);
    
    // Ma'lumotlarni API orqali yuklash
    fetchAds();
    fetchServices();
    fetchProducts();
    fetchLocations();
});

function changeLang(lang) {
    localStorage.setItem('selectedLang', lang);
    applyLang(lang);
    // Mahsulotlar ro'yxati tugmalarini ham yangilash uchun sahifani qayta chizish yoki ro'yxatni yangilash
    fetchProducts();
}

function applyLang(lang) {
    const t = translations[lang];
    if (!t) return;

    document.getElementById('site-subtitle').innerText = t.subtitle;
    document.getElementById('btn-katalog').innerText = t.btn_katalog;
    document.getElementById('services-title').innerText = t.services_title;
    document.getElementById('katalog-title').innerText = t.katalog_title;
    document.getElementById('locations-title').innerText = t.locations_title;
    document.getElementById('label-bot').innerText = t.label_bot;
    document.getElementById('label-channel').innerText = t.label_channel;
    document.getElementById('about-title').innerHTML = `<i class="fa-solid fa-circle-info mr-3"></i> ${t.about_title}`;
}

// MAHSULOTLAR (Buyurtma to'g'ridan-to'g'ri botga start_parameter orqali boradi)
async function fetchProducts() {
    const container = document.getElementById('products-container');
    const lang = localStorage.getItem('selectedLang') || 'uz';
    
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        container.innerHTML = ''; 
        
        if (data.data && data.data.length > 0) {
            data.data.forEach(p => {
                const orderLink = `${BOT_URL}?start=order_${p._id}`;
                container.innerHTML += `
                    <div class="glass-card flex flex-col h-full overflow-hidden group border border-white/5 rounded-[2rem]">
                        <div class="h-56 w-full bg-navy_light relative border-b border-white/5 overflow-hidden">
                            <img src="/api/image/${p.file_id}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onerror="this.src='https://via.placeholder.com/400x300/1e293b/facc15?text=Rasm+Yo%27q'">
                            <div class="absolute top-4 right-4 bg-navy/60 backdrop-blur-md px-4 py-1 rounded-full text-neon_yellow font-bold text-sm">
                                Stock: ${p.stock}
                            </div>
                        </div>
                        <div class="p-8 flex-grow">
                            <h3 class="font-heading text-2xl font-bold text-white mb-3 tracking-wide">${p.name}</h3>
                            <p class="text-neon_yellow text-2xl font-mono font-bold mb-4">${p.price.toLocaleString()} so'm</p>
                            <p class="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-3 italic">${p.description || ''}</p>
                        </div>
                        <div class="p-8 pt-0 mt-auto">
                            <a href="${orderLink}" target="_blank" class="block w-full text-center border-2 border-neon_yellow text-neon_yellow hover:bg-neon_yellow hover:text-navy font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02]">
                                <i class="fa-solid fa-cart-shopping mr-2"></i> ${translations[lang].order_btn}
                            </a>
                        </div>
                    </div>`;
            });
        } else {
            container.innerHTML = `<p class="col-span-full text-center text-gray-400 py-10">${translations[lang].no_products}</p>`;
        }
    } catch (e) { console.error("Mahsulot yuklashda xato:", e); }
}

// REKLAMA (AD)
async function fetchAds() {
    try {
        const res = await fetch('/api/ads');
        const data = await res.json();
        const container = document.getElementById('ads-container');
        if (data.data && data.data.length > 0) {
            container.innerHTML = '';
            data.data.forEach(ad => {
                container.innerHTML += `
                    <div class="bg-gradient-to-r from-neon_orange/10 to-neon_yellow/10 border border-neon_yellow/20 rounded-3xl p-8 flex items-center justify-between mb-8 shadow-2xl">
                        <div class="flex items-center space-x-6">
                            <div class="bg-neon_orange/20 p-5 rounded-2xl">
                                <i class="fa-solid fa-fire text-3xl text-neon_orange animate-pulse"></i>
                            </div>
                            <div>
                                <h3 class="font-heading text-3xl text-white font-bold mb-2 uppercase">${ad.title}</h3>
                                <p class="text-gray-300 text-lg">${ad.text}</p>
                            </div>
                        </div>
                        ${ad.discount ? `<div class="bg-neon_yellow text-navy font-bold text-3xl px-8 py-3 rounded-2xl">-${ad.discount}%</div>` : ''}
                    </div>`;
            });
        }
    } catch (e) { console.error(e); }
}

// XIZMATLAR
async function fetchServices() {
    try {
        const res = await fetch('/api/services');
        const data = await res.json();
        const container = document.getElementById('services-container');
        if (data.data && data.data.length > 0) {
            container.innerHTML = '';
            data.data.forEach(srv => {
                container.innerHTML += `
                    <div class="glass-card p-10 border-t-4 border-t-neon_orange rounded-[2.5rem] hover:bg-white/5 transition-all group">
                        <i class="${srv.icon || 'fa-solid fa-helmet-safety'} text-6xl text-neon_yellow mb-8 group-hover:rotate-12 transition"></i>
                        <h3 class="font-heading text-2xl font-bold text-white mb-4 uppercase tracking-widest">${srv.name}</h3>
                        <p class="text-gray-400 leading-relaxed text-lg">${srv.description}</p>
                    </div>`;
            });
        }
    } catch (e) { console.error(e); }
}

// LOKATSIYALAR
async function fetchLocations() {
    try {
        const res = await fetch('/api/locations');
        const data = await res.json();
        const container = document.getElementById('locations-container');
        if (data.data && data.data.length > 0) {
            container.innerHTML = '';
            data.data.forEach(loc => {
                container.innerHTML += `
                    <div class="glass-card p-10 relative overflow-hidden group border border-white/5 rounded-[2.5rem]">
                        <div class="absolute -right-10 -top-10 text-white/5 group-hover:text-neon_yellow/5 transition-colors duration-700">
                            <i class="fa-solid fa-map-location-dot text-[12rem]"></i>
                        </div>
                        <h3 class="font-heading text-2xl font-bold text-neon_yellow mb-6 relative z-10 uppercase">${loc.name}</h3>
                        <p class="text-gray-300 mb-8 relative z-10 text-lg italic"><i class="fa-solid fa-location-dot mr-3 text-neon_orange"></i>${loc.address}</p>
                        ${loc.map_link ? `
                            <a href="${loc.map_link}" target="_blank" class="inline-block px-8 py-3 border border-gray-600 rounded-full text-white hover:border-neon_yellow hover:text-neon_yellow relative z-10 transition font-bold uppercase text-xs tracking-widest">
                                <i class="fa-solid fa-diamond-turn-right mr-2"></i> Xaritada ko'rish
                            </a>` : ''}
                    </div>`;
            });
        }
    } catch (e) { console.error(e); }
}
