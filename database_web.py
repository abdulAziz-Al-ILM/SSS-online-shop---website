import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGO_URL = os.getenv("MONGO_URL")

# Bazaga ulanish
client = AsyncIOMotorClient(MONGO_URL)
db = client['sss_new_shop'] # Boting bilan bir xil baza nomi
products_col = db['products']
settings_col = db['settings']
orders_col = db['orders']

async def get_all_active_products():
    # Saytga faqat omborda bor mahsulotlarni chiqaramiz
    cursor = products_col.find({"stock": {"$gt": 0}})
    products = await cursor.to_list(length=100)
    
    # ObjectId'ni stringga o'g'iramiz JSON qabul qilishi uchun
    for p in products:
        p["_id"] = str(p["_id"])
    return products

async def get_company_info():
    info = await settings_col.find_one({"type": "info"})
    if info:
        info["_id"] = str(info["_id"])
        return info
    return {"address": "Manzil kiritilmagan", "phone": "+998", "about": "Doim xizmatingizdamiz"}
