// ILM Construction Web - Core Logic

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});

// Backenddan mahsulotlarni tortib olish
async function fetchProducts() {
    const container = document.getElementById('products-container');
    
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Tarmoqda xatolik');
        
        const data = await response.json();
        container.innerHTML = ''; // Loaderni tozalash

        if (data.status === 'success' && data.data.length > 0) {
            data.data.forEach(product => {
                const html = `
                    <div class="glass-card flex flex-col h-full animate-fade-in">
                        <div class="p-6 flex-grow">
                            <h3 class="font-heading text-2xl font-bold text-white mb-2 tracking-wide">${product.name}</h3>
                            <p class="text-neon_yellow text-xl font-mono font-bold mb-4">${product.price.toLocaleString()} so'm</p>
                            <p class="text-gray-400 text-sm mb-4 leading-relaxed">${product.description || 'Yuqori sifatli mahsulot'}</p>
                            <div class="flex items-center text-sm text-gray-400 mb-4 bg-navy_light/50 inline-block px-3 py-1 rounded-full border border-gray-700">
                                <i class="fa-solid fa-box-open mr-2 text-neon_orange"></i> Omborda: <span class="text-white font-bold ml-1">${product.stock}</span> ta
                            </div>
                        </div>
                        <div class="p-6 pt-0 mt-auto">
                            <button onclick="openModal('${product._id}', '${product.name}')" class="w-full border-2 border-neon_yellow text-neon_yellow hover:bg-neon_yellow hover:text-navy font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02]">
                                <i class="fa-solid fa-cart-shopping mr-2"></i> Buyurtma berish
                            </button>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', html);
            });
        } else {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 glass-card">
                    <i class="fa-solid fa-boxes-stacked text-5xl text-gray-600 mb-4"></i>
                    <p class="text-gray-400 font-heading text-xl">Hozircha mahsulotlar yo'q.</p>
                </div>`;
        }
    } catch (error) {
        console.error("Baza bilan xatolik:", error);
        container.innerHTML = `
            <div class="col-span-full text-center py-12 glass-card border-red-500/30">
                <i class="fa-solid fa-triangle-exclamation text-5xl text-red-500/50 mb-4"></i>
                <p class="text-red-400 font-heading text-xl">Tizimga ulanishda xatolik yuz berdi. Iltimos keyinroq urining.</p>
            </div>`;
    }
}

// Buyurtma modalini boshqarish
window.openModal = function(id, name) {
    document.getElementById('product_id').value = id;
    document.getElementById('modal-product-name').innerText = name;
    const modal = document.getElementById('order-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Psixologik tryuk: Fokusni avtomatik ism yozishga qaratish, konversiyani oshiradi
    setTimeout(() => document.getElementById('user_name').focus(), 100);
}

window.closeModal = function() {
    const modal = document.getElementById('order-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('order-form').reset();
}

// Buyurtmani yuborish mantiqi
window.submitOrder = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    // Yuklanish effekti
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Yuborilmoqda...';
    btn.disabled = true;
    btn.classList.add('opacity-75', 'cursor-not-allowed');

    const payload = {
        product_id: document.getElementById('product_id').value,
        name: document.getElementById('user_name').value,
        phone: document.getElementById('user_phone').value
    };

    try {
        const res = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            // Muvaffaqiyatli animatsiya
            btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Qabul qilindi!';
            btn.classList.remove('btn-neon');
            btn.classList.add('bg-green-500', 'text-white', 'border-none');
            
            setTimeout(() => {
                closeModal();
                btn.innerHTML = originalText;
                btn.classList.add('btn-neon');
                btn.classList.remove('bg-green-500', 'text-white', 'border-none', 'opacity-75', 'cursor-not-allowed');
                btn.disabled = false;
            }, 2000);
        } else {
            throw new Error('Server xatosi');
        }
    } catch (err) {
        alert("Xatolik yuz berdi! Tarmoqni tekshiring.");
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

// Modalni foniga bosganda yopilish mantiqi
document.getElementById('order-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});
