document.addEventListener('DOMContentLoaded', () => {
    fetchAds();
    fetchServices();
    fetchProducts();
    fetchLocations();
});

// Reklama va Bonuslar
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

// Xizmatlar
async function fetchServices() {
    try {
        const res = await fetch('/api/services');
        const data = await res.json();
        const container = document.getElementById('services-container');
        if (data.data && data.data.length > 0) {
            data.data.forEach(srv => {
                // Ikonka nomi bazadan keladi, bo'lmasa default 'fa-tools' qo'yiladi
                const icon = srv.icon || 'fa-solid fa-tools'; 
                container.innerHTML += `
                    <div class="glass-card p-6 border-t-4 border-t-neon_orange hover:scale-105 transition-transform">
                        <i class="${icon} text-4xl text-neon_yellow mb-4"></i>
                        <h3 class="font-heading text-xl font-bold text-white mb-2">${srv.name}</h3>
                        <p class="text-gray-400 text-sm">${srv.description}</p>
                    </div>`;
            });
        } else {
            container.innerHTML = `<p class="text-gray-500 italic">Xizmatlar tez kunda qo'shiladi...</p>`;
        }
    } catch (e) { console.error(e); }
}

// Lokatsiyalar
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

// Mahsulotlar (Oldingi kod, muammosiz)
async function fetchProducts() {
    const container = document.getElementById('products-container');
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        container.innerHTML = ''; 
        if (data.data && data.data.length > 0) {
            data.data.forEach(p => {
                container.innerHTML += `
                    <div class="glass-card flex flex-col h-full overflow-hidden">
                        <div class="h-48 w-full bg-navy_light relative border-b border-gray-700">
                            <img src="/api/image/${p.file_id}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/400x300/1e293b/facc15?text=Rasm+Yo%27q'">
                        </div>
                        <div class="p-6 flex-grow">
                            <h3 class="font-heading text-2xl font-bold text-white mb-2">${p.name}</h3>
                            <p class="text-neon_yellow text-xl font-mono font-bold mb-4">${p.price.toLocaleString()} so'm</p>
                            <p class="text-gray-400 text-sm mb-4">${p.description || ''}</p>
                        </div>
                        <div class="p-6 pt-0 mt-auto">
                            <button onclick="openModal('${p._id}', '${p.name}')" class="w-full border-2 border-neon_yellow text-neon_yellow hover:bg-neon_yellow hover:text-navy font-bold py-2 rounded-lg transition-colors">
                                <i class="fa-solid fa-cart-shopping mr-2"></i> Buyurtma
                            </button>
                        </div>
                    </div>`;
            });
        } else {
            container.innerHTML = `<p class="col-span-full text-center text-gray-400">Hozircha mahsulotlar yo'q.</p>`;
        }
    } catch (e) { console.error(e); }
}

window.openModal = function(id, name) {
    document.getElementById('product_id').value = id;
    document.getElementById('modal-product-name').innerText = name;
    document.getElementById('order-modal').classList.remove('hidden');
    document.getElementById('order-modal').classList.add('flex');
    setTimeout(() => document.getElementById('user_name').focus(), 100);
}

window.closeModal = function() {
    document.getElementById('order-modal').classList.add('hidden');
    document.getElementById('order-modal').classList.remove('flex');
    document.getElementById('order-form').reset();
}

window.submitOrder = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = 'Yuborilmoqda...'; btn.disabled = true;
    try {
        const res = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: document.getElementById('product_id').value, name: document.getElementById('user_name').value, phone: document.getElementById('user_phone').value })
        });
        if (res.ok) {
            btn.innerHTML = 'Qabul qilindi!';
            setTimeout(() => { closeModal(); btn.innerHTML = 'Tasdiqlash'; btn.disabled = false; }, 2000);
        }
    } catch (err) { alert("Xato!"); btn.innerHTML = 'Tasdiqlash'; btn.disabled = false; }
}
