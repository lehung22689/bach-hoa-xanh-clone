"use client";

import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, MapPin, Menu, ChevronRight, Phone, Clock, ShieldCheck, Ticket } from 'lucide-react';

// --- MOCK DATA: Danh mục hiển thị trên giao diện ---
const mockCategories = [
  { id: 1, name: 'Thịt, cá, hải sản', icon: '🥩' },
  { id: 2, name: 'Rau, củ, trái cây', icon: '🥬' },
  { id: 3, name: 'Sữa các loại', icon: '🥛' },
  { id: 4, name: 'Bia, nước giải khát', icon: '🍺' },
  { id: 5, name: 'Mì, miến, cháo, phở', icon: '🍜' },
  { id: 6, name: 'Dầu ăn, gia vị', icon: '🧂' },
  { id: 7, name: 'Gạo, bột, đồ khô', icon: '🍚' },
  { id: 8, name: 'Kem, thực phẩm đông', icon: '🍦' },
];

// --- COMPONENTS ---

// 1. Header Component
const Header = ({ cartCount }) => (
  <header className="bg-[#008b4b] text-white sticky top-0 z-50 shadow-md">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between py-3">
        {/* Logo */}
        <div className="flex items-center space-x-2 font-bold text-2xl tracking-tighter cursor-pointer">
          <div className="bg-yellow-400 text-green-800 p-1 rounded-md">BÁCH HÓA</div>
          <span>LAN HẢO</span>
        </div>

        {/* Location Selector */}
        <div className="hidden md:flex items-center space-x-1 bg-[#00703c] px-3 py-2 rounded-lg cursor-pointer hover:bg-[#006030] text-sm">
          <MapPin size={16} />
          <span>Giao tới: <strong className="text-yellow-300">Dĩ An, Bình Dương</strong></span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-4 relative hidden sm:block">
          <input
            type="text"
            placeholder="Tìm sản phẩm tại Bách Hóa Lan Hảo..."
            className="w-full px-4 py-2.5 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button className="absolute right-1 top-1 bg-gray-100 p-1.5 rounded-full text-gray-600 hover:bg-gray-200">
            <Search size={20} />
          </button>
        </div>

        {/* Cart & Login */}
        <div className="flex items-center space-x-4">
          <div className="relative cursor-pointer bg-[#00703c] p-2.5 rounded-lg flex items-center space-x-2 hover:bg-[#006030]">
            <ShoppingCart size={22} />
            <span className="hidden sm:inline font-medium">Giỏ hàng</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-600 font-bold rounded-full h-6 w-6 flex items-center justify-center text-xs border-2 border-[#008b4b]">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  </header>
);

// 2. Navigation Categories (Mobile)
const MobileCategoryNav = () => (
  <nav className="bg-white shadow-sm border-b md:hidden">
    <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
      <ul className="flex items-center space-x-6 py-3 min-w-max">
        <li className="flex items-center space-x-1 font-bold text-gray-800 cursor-pointer hover:text-green-600">
          <Menu size={20} />
          <span>DANH MỤC</span>
        </li>
        {mockCategories.map(cat => (
          <li key={cat.id} className="text-sm font-medium text-gray-700 cursor-pointer hover:text-green-600 flex items-center whitespace-nowrap">
            <span className="mr-1">{cat.icon}</span> {cat.name}
          </li>
        ))}
      </ul>
    </div>
  </nav>
);

// 2.5 Desktop Sidebar
const DesktopSidebar = () => (
  <aside className="hidden md:block w-60 lg:w-64 flex-shrink-0 relative">
    <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-[88px]">
      <div className="bg-[#008b4b] text-white font-bold p-3 flex items-center space-x-2">
        <Menu size={20} />
        <span>DANH MỤC SẢN PHẨM</span>
      </div>
      <ul className="py-2">
        {mockCategories.map(cat => (
          <li key={cat.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center border-b border-gray-50 last:border-0 transition-colors group">
            <span className="mr-3 text-xl group-hover:scale-110 transition-transform">{cat.icon}</span>
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#008b4b]">{cat.name}</span>
            <ChevronRight size={16} className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-[#008b4b] transition-opacity" />
          </li>
        ))}
      </ul>
    </div>
  </aside>
);

// 3. Product Card Component
const ProductCard = ({ product, quantity, onAdd, onRemove }) => {
  const discountPercent = product.on_sale 
    ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100) 
    : 0;

  return (
    <div className={`bg-white rounded-lg p-3 hover:shadow-lg transition-shadow border flex flex-col h-full relative group ${quantity > 0 ? 'border-[#008b4b]' : 'border-gray-100'}`}>
      {discountPercent > 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded z-10">
          -{discountPercent}%
        </div>
      )}
      
      <div className="w-full aspect-square mb-3 relative overflow-hidden rounded-md">
        <img 
          src={product.images[0]?.src || '/api/placeholder/200/200'} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="flex flex-col flex-1">
        <h3 className="text-sm text-gray-800 font-medium line-clamp-2 min-h-[40px] mb-2 hover:text-green-600 cursor-pointer">
          {product.name}
        </h3>
        
        <div className="mt-auto flex flex-col">
          <div className="mb-2">
            {product.on_sale && (
              <div className="text-xs text-gray-400 line-through mb-0.5">
                {product.regular_price.toLocaleString('vi-VN')}₫
              </div>
            )}
            <span className="text-red-600 font-bold text-base">
              {product.price.toLocaleString('vi-VN')}₫
            </span>
          </div>

          {quantity === 0 ? (
            <button 
              onClick={() => onAdd(product)}
              className="w-full py-2 bg-[#f0f9f4] text-[#008b4b] font-bold text-center rounded border border-transparent hover:border-[#008b4b] transition-all"
            >
              MUA
            </button>
          ) : (
            <div className="flex items-center justify-between w-full py-1 px-2 bg-[#f0f9f4] rounded border border-[#008b4b]">
              <button 
                onClick={() => onRemove(product.id)}
                className="w-8 h-8 flex items-center justify-center text-[#008b4b] text-2xl font-bold hover:bg-[#e0f0e8] rounded"
              >
                -
              </button>
              <span className="font-bold text-gray-800 text-lg">{quantity}</span>
              <button 
                onClick={() => onAdd(product)}
                className="w-8 h-8 flex items-center justify-center text-[#008b4b] text-2xl font-bold hover:bg-[#e0f0e8] rounded"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 4. Main App Component
// 4. Main App Component
export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. THÊM MỚI: Lấy giỏ hàng từ máy tính khách hàng khi vừa vào web ---
  useEffect(() => {
    const savedCart = localStorage.getItem('lanHaoCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Lỗi đọc dữ liệu giỏ hàng:", error);
      }
    }
  }, []); // Mảng rỗng [] nghĩa là chỉ chạy 1 lần duy nhất khi web vừa load xong

  // --- 2. THÊM MỚI: Lưu giỏ hàng vào máy tính mỗi khi biến 'cart' thay đổi ---
  useEffect(() => {
    // Lưu ý: Lần chạy đầu tiên cart là [], nên ta không lưu mảng rỗng đè lên dữ liệu cũ
    // Nhưng để đơn giản và chuẩn xác nhất cho React, ta cứ lưu stringify của cart
    // Tuy nhiên, để tránh lỗi ghi đè mảng rỗng lúc mới load trang do bất đồng bộ,
    // ta nên đặt một điều kiện nhỏ:
    if (cart.length > 0) {
      localStorage.setItem('lanHaoCart', JSON.stringify(cart));
    } else {
      // Nếu giỏ hàng trống, xóa luôn key trong localStorage cho sạch
      localStorage.removeItem('lanHaoCart');
    }
  }, [cart]); // [cart] nghĩa là hàm này sẽ tự động chạy mỗi khi giỏ hàng có sự thay đổi

useEffect(() => {
    const fetchProducts = async () => {
      try {
        const wpDomain = 'https://bachhoalanhao.com';
        const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
        const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';

        // CÁCH MỚI: Đưa trực tiếp Key vào URL thay vì dùng headers (Tránh việc Tinohost chặn Header Basic Auth)
        const apiUrl = `${wpDomain}/wp-json/wc/v3/products?per_page=100&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // In ra để kiểm tra
        console.log("📦 Dữ liệu từ WooCommerce đổ về:", data);

        // BẮT LỖI: Nếu API trả về chuỗi báo lỗi (không phải là mảng dữ liệu)
        if (!Array.isArray(data)) {
           console.error("❌ Lỗi từ WordPress (Có thể sai Key hoặc chặn truy cập):", data);
           setLoading(false);
           return;
        }
        
        const formattedProducts = data.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price ? parseInt(item.price) : 0,
          regular_price: item.regular_price ? parseInt(item.regular_price) : 0,
          images: item.images || [],
          categories: item.categories || [],
          on_sale: item.on_sale || false,
        }));

        setProducts(formattedProducts);
        setLoading(false);
      } catch (error) {
        console.error("❌ Lỗi mạng hoặc lỗi CORS:", error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddQuantity = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveQuantity = (productId) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing.quantity === 1) return prev.filter(item => item.id !== productId);
      return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
    });
  };

  const getProductQuantity = (productId) => {
    const item = cart.find(i => i.id === productId);
    return item ? item.quantity : 0;
  };

  const flashSaleProducts = products.filter(p => p.on_sale).slice(0, 5);
  
  // Logic lọc linh hoạt: Kiểm tra xem có bất kỳ danh mục nào khớp với tên mong muốn không
// Lọc tạm các sản phẩm có chữ SỮA hoặc SNACK để test
  const meatProducts = products.filter(p => 
    p.categories && p.categories.some(cat => 
        cat.name.toLowerCase().includes('sữa') || 
        cat.name.toLowerCase().includes('snack')
    )
  );
  
  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f1f1f1] font-sans pb-10">
      <Header cartCount={cartTotalCount} />
      <MobileCategoryNav />

      <div className="max-w-7xl mx-auto px-4 mt-4 flex gap-4 lg:gap-6">
        <DesktopSidebar />

        <main className="flex-1 min-w-0 space-y-6">
          {/* Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-gradient-to-r from-green-500 to-green-400 rounded-xl p-6 h-48 sm:h-64 flex items-center justify-between text-white shadow-sm overflow-hidden relative">
              <div className="z-10">
                <h2 className="text-3xl sm:text-4xl font-bold mb-2">ĐẠI TIỆC RAU CỦ</h2>
                <p className="text-lg mb-4 text-green-100">Ưu đãi đặc biệt tại Bách Hóa Lan Hảo</p>
                <button className="bg-yellow-400 text-green-900 px-6 py-2 rounded-full font-bold hover:bg-yellow-300">Mua ngay</button>
              </div>
              <div className="absolute right-0 bottom-0 opacity-50"><span className="text-9xl">🥬</span></div>
            </div>
            <div className="hidden md:flex flex-col space-y-4">
              <div className="bg-orange-400 rounded-xl p-4 flex-1 text-white shadow-sm flex items-center font-bold">Thịt heo VietGAP</div>
              <div className="bg-blue-400 rounded-xl p-4 flex-1 text-white shadow-sm flex items-center font-bold">Hải sản tươi sống</div>
            </div>
          </div>

          {/* Flash Sale Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-t-4 border-red-500">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white italic tracking-wider">⚡ GIÁ SỐC HÔM NAY</h2>
              <a href="#" className="text-white text-sm hover:underline">Xem tất cả <ChevronRight className="inline" size={16} /></a>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {flashSaleProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  quantity={getProductQuantity(product.id)}
                  onAdd={handleAddQuantity}
                  onRemove={handleRemoveQuantity}
                />
              ))}
            </div>
          </div>

          {/* Meat & Seafood Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-t-4 border-[#008b4b]">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 uppercase flex items-center">
                <span className="text-2xl mr-2">🥩</span> Thịt, cá, hải sản tươi
              </h2>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {meatProducts.length > 0 ? meatProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  quantity={getProductQuantity(product.id)}
                  onAdd={handleAddQuantity}
                  onRemove={handleRemoveQuantity}
                />
              )) : (
                <div className="col-span-full py-10 text-center text-gray-400 italic">
                  Đang đồng bộ dữ liệu sản phẩm từ hệ thống...
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <footer className="max-w-7xl mx-auto px-4 mt-10">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <div className="bg-yellow-400 text-green-800 p-2 rounded-md inline-block font-bold text-xl mb-4">
            BÁCH HÓA <span className="text-white">LAN HẢO</span>
          </div>
          <p className="text-sm text-gray-600">© 2026. Quản lý bởi Hảo. Hệ thống thực phẩm sạch tại Dĩ An.</p>
        </div>
      </footer>
    </div>
  );
}