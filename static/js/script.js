/**
 * SSS ONLINE SHOP - FRONTEND ENGINE v2.5
 * Muallif: Abdulaziz To'lqinov
 * Tavsif: Barcha tillar, dinamik kontent va bot integratsiyasi boshqaruvi.
 */

// 1. TILLAR LUG'ATI (UZ-Kirill, RU, KG)
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
        no_products: "Ҳозирча маҳсулотлар йўқ.",
        stock_label: "Омборда:",
        currency: "сўм"
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
        no_products: "Товаров пока нет.",
        stock_label: "В наличии:",
        currency: "сум"
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
        no_products: "Азырынча продукция жок.",
        stock_label: "Кампада:",
        currency: "сом"
    }
};

// 2. SAYT YUKLANGANDA ISHGA TUSHISH
document.addEventListener('DOMContentLoaded', () => {
    // Tanlangan tilni localStorage'dan tekshirish (default: uz)
    const savedLang = localStorage.getItem('selectedLang') || 'uz';
    applyLang(savedLang);
    
    // Barcha ma'lumotlarni parallel ravishda yuklash
    Promise.all([
        fetchAds(),
        fetchServices(),
        fetchProducts(),
        fetchLocations()
    ]).catch(err => console.error("API yuklashda xatolik:", err));
});

// 3. TILLARNI ALMASHTIRISH MANTIQI
function changeLang(lang) {
    if (translations[lang]) {
        localStorage.setItem('selectedLang', lang);
        applyLang(lang);
        // Mahsulotlar ro'yxatini qayta chizamiz (tugmalar tarjimasi uchun)
        fetchProducts();
    }
}

function applyLang(lang) {
    const t = translations[lang];
    if (!t) return;

    // Matnlarni DOM elementlariga joylashtirish
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

    // "Firma haqida" sarlavhasini ikonka bilan birga yangilash
    const aboutTitle = document.getElementById('about-title');
    if (aboutTitle) {
        aboutTitle.innerHTML = `<i class="fa-solid fa-circle-info mr-3"></i> ${t.about_title}`;
    }
}

// 4. MAHSULOTLARNI TORTISH (DEEP LINKING BILAN)
async function fetchProducts() {
    const container = document.getElementById('products-container');
    const lang = localStorage.getItem('selectedLang') || 'uz';
    const t = translations[lang];
    
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        
        if (data.status === 'success' && data.data.length > 0) {
            container.innerHTML = ''; // Eski kontentni tozalash
            
            data.data.forEach(p => {
                // Buyurtma tugmasi bosilganda botga o'sha mahsulot IDsi bilan o'tadi
                const botOrderUrl = `${BOT_URL}?start=order_${p._id}`;
                
                container.innerHTML += `
                    <div class="glass-card flex flex-col h-full overflow-hidden group border border-white/5 rounded-[2.5rem] transition-all hover:shadow-[0_15px_35px_rgba(0,0,0,0.4)]">
                        <div class="h-60 w-full bg-navy_light relative border-b border-white/5 overflow-hidden">
                            <img src="/api/image/${p.file_id}" 
                                 class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                 onerror="this.src='https://via.placeholder.com/500x400/1e293b/facc15?text=Rasm+Yo%27q'">
                            <div class="absolute top-4 right-4 bg-navy/70 backdrop-blur-md px-4 py-1 rounded-full text-neon_yellow font-bold text-xs">
                                ${t.stock_label} ${p.stock}
                            </div>
                        </div>
                        <div class="p-8 flex-grow">
                            <h3 class="font-heading text-2xl font-bold text-white mb-3 tracking-wide">${p.name}</h3>
                            <p class="text-neon_yellow text-2xl font-mono font-bold mb-4">
                                ${p.price.toLocaleString()} ${t.currency}
                            </p>
                            <p class="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-3 italic">
                                ${p.description || ''}
                            </p>
                        </div>
                        <div class="p-8 pt-0 mt-auto">
                            <a href="${botOrderUrl}" target="_blank" class="block w-full text-center btn-neon py-4 rounded-2xl font-bold transition-all duration-300 transform active:scale-95">
                                <i class="fa-solid fa-cart-shopping mr-2"></i> ${t.order_btn}
                            </a>
                        </div>
                    </div>`;
            });
        } else {
            container.innerHTML = `<p class="col-span-full text-center text-gray-400 py-12">${t.no_products}</p>`;
        }
    } catch (e) {
        console.error("FetchProducts Error:", e);
        container.innerHTML = `<p class="col-span-full text-center text-red-500 py-12">API Error</p>`;
    }
}

// 5. DINAMIK REKLAMALAR (ADS)
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
                            <div class="bg-neon_orange/20 p-6 rounded-3xl">
                                <i class="fa-solid fa-fire text-4xl text-neon_orange animate-bounce"></i>
                            </div>
                            <div>
                                <h3 class="font-heading text-4xl text-white font-bold mb-2 uppercase tracking-tighter">${ad.title}</h3>
                                <p class="text-gray-300 text-xl">${ad.text}</p>
                            </div>
                        </div>
                        ${ad.discount ? `
                            <div class="bg-neon_yellow text-navy font-black text-4xl px-10 py-4 rounded-[1.5rem] shadow-[0_10px_30px_rgba(250,204,21,0.3)]">
                                -${ad.discount}%
                            </div>` : ''}
                    </div>`;
            });
        }
    } catch (e) { console.error("Ads Error:", e); }
}

// 6. XIZMATLAR (SERVICES)
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
    } catch (e) { console.error("Services Error:", e); }
}

// 7. FILIALLAR (LOCATIONS)
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
                        <div class="absolute -right-12 -top-12 text-white/5 group-hover:text-neon_yellow/5 transition-colors duration-1000">
                            <i class="fa-solid fa-map-location-dot text-[14rem]"></i>
                        </div>
                        <h3 class="font-heading text-3xl font-bold text-neon_yellow mb-8 relative z-10 uppercase tracking-widest">${loc.name}</h3>
                        <p class="text-gray-300 mb-10 relative z-10 text-xl italic font-light leading-snug">
                            <i class="fa-solid fa-location-dot mr-4 text-neon_orange"></i>${loc.address}
                        </p>
                        ${loc.map_link ? `
                            <a href="${loc.map_link}" target="_blank" class="inline-flex items-center px-10 py-3 border border-gray-600 rounded-full text-white hover:border-neon_yellow hover:text-neon_yellow relative z-10 transition-all font-bold uppercase text-sm tracking-widest bg-navy/20 backdrop-blur-sm">
                                <i class="fa-solid fa-diamond-turn-right mr-3"></i> Xaritada ko'rish
                            </a>` : ''}
                    </div>`;
            });
        }
    } catch (e) { console.error("Locations Error:", e); }
}
