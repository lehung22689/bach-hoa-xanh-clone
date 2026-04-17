"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Search, ShoppingCart, MapPin, Menu, ChevronRight, ChevronLeft, X, Loader2, SearchX } from 'lucide-react';

// ⚠️ KHI CHẠY TRÊN VS CODE CỦA BẠN: Hãy BỎ COMMENT 3 dòng dưới đây và XÓA phần MOCK COMPONENT đi nhé!
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MobileCategoryNav, DesktopSidebar, categoriesData } from '@/components/Sidebar';



const Header = ({ cartCount }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (searchQuery.trim() !== '') {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-[#008b4b] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center space-x-2 font-bold text-2xl tracking-tighter cursor-pointer">
            <div className="bg-yellow-400 text-green-800 p-1 rounded-md">BÁCH HÓA</div>
            <span>LAN HẢO</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1 bg-[#00703c] px-3 py-2 rounded-lg cursor-pointer hover:bg-[#006030] text-sm">
            <MapPin size={16} />
            <span>Giao tới: <strong className="text-yellow-300">Dĩ An, Bình Dương</strong></span>
          </div>

          <div className="flex-1 max-w-2xl mx-4 relative hidden sm:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm sản phẩm tại Bách Hóa Lan Hảo..."
                className="w-full px-4 py-2.5 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              />
              <button 
                onClick={handleSearch}
                className="absolute right-1 top-1 bg-gray-100 p-1.5 rounded-full text-gray-600 hover:bg-gray-200"
              >
                <Search size={20} />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/cart" className="relative cursor-pointer bg-[#00703c] p-2.5 rounded-lg flex items-center space-x-2 hover:bg-[#006030]">
              <ShoppingCart size={22} />
              <span className="hidden sm:inline font-medium">Giỏ hàng</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-600 font-bold rounded-full h-6 w-6 flex items-center justify-center text-xs border-2 border-[#008b4b]">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

function ProductDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('id');
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [activeImage, setActiveImage] = useState(0);

  // Lấy giỏ hàng
  useEffect(() => {
    const savedCart = localStorage.getItem('lanHaoCart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('lanHaoCart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('lanHaoCart');
    }
  }, [cart]);

  // Fetch chi tiết một sản phẩm
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const wpDomain = 'https://bachhoalanhao.com';
        const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
        const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';
        
        const apiUrl = `${wpDomain}/wp-json/wc/v3/products/${productId}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const data = await response.json();
          // Chuyển đổi chuỗi giá thành số để tính toán
          data.price = data.price ? parseInt(data.price) : 0;
          data.regular_price = data.regular_price ? parseInt(data.regular_price) : 0;
          setProduct(data);
        }
      } catch (error) {
        console.error("Lỗi tải chi tiết sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddQuantity = () => {
    if (!product) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveQuantity = () => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing && existing.quantity === 1) return prev.filter(item => item.id !== product.id);
      return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item);
    });
  };

  const currentQuantity = cart.find(i => i.id === Number(productId))?.quantity || 0;
  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] font-sans pb-10 flex flex-col">
        <Header cartCount={cartTotalCount} />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
           <Loader2 size={40} className="animate-spin text-[#008b4b] mb-4" />
           <p className="italic">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] font-sans pb-10 flex flex-col">
        <Header cartCount={cartTotalCount} />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
           <SearchX size={64} className="text-gray-300 mb-4" />
           <h3 className="text-lg font-bold text-gray-800 mb-2">Sản phẩm không tồn tại</h3>
           <p className="text-gray-500 text-sm">Có thể sản phẩm đã bị xóa hoặc ngưng kinh doanh.</p>
           <Link href="/" className="mt-6 px-6 py-2 bg-[#008b4b] text-white font-bold rounded-full hover:bg-[#00703c]">
             Quay lại trang chủ
           </Link>
        </div>
      </div>
    );
  }

  const discountPercent = product.on_sale && product.regular_price > product.price
    ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#f1f1f1] font-sans pb-10">
      <Header cartCount={cartTotalCount} />

      <div className="max-w-7xl mx-auto px-4 mt-4 flex gap-4 lg:gap-6">
        <DesktopSidebar />

        <main className="flex-1 min-w-0">
          
          {/* Nút Quay Lại / Breadcrumb */}
          <div className="mb-4 flex items-center text-sm font-medium text-gray-600 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            <button onClick={() => window.history.back()} className="flex items-center hover:text-[#008b4b] transition-colors">
              <ChevronLeft size={18} className="mr-1" />
              <span>{product.categories?.[0]?.name || 'Quay lại'}</span>
            </button>
          </div>

          {/* Chi tiết sản phẩm (Layout hệt Bách Hóa Xanh) */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border p-4 md:p-6 flex flex-col lg:flex-row gap-8">
            
            {/* Cột trái: Hình ảnh */}
            <div className="w-full lg:w-3/5">
              <div className="border rounded-xl p-4 mb-4 relative flex items-center justify-center bg-white aspect-[4/3]">
                {discountPercent > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded shadow-sm z-10">
                    GIẢM {discountPercent}%
                  </div>
                )}
                <img 
                  src={product.images[activeImage]?.src || '/api/placeholder/600/400'} 
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Danh sách ảnh thu nhỏ */}
              {product.images?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {product.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActiveImage(idx)} 
                      className={`border p-1 rounded-lg cursor-pointer w-20 h-20 flex-shrink-0 transition-all ${
                        activeImage === idx ? 'border-[#008b4b] ring-2 ring-[#008b4b] ring-opacity-50' : 'hover:border-gray-400'
                      }`}
                    >
                      <img src={img.src} alt={`${product.name} - ảnh ${idx+1}`} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cột phải: Thông tin & Đặt hàng */}
            <div className="w-full lg:w-2/5 flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 leading-snug">
                {product.name}
              </h1>
              
              {/* Khung Giá */}
              <div className="bg-gray-50 border border-green-100 rounded-xl p-5 mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#008b4b]"></div>
                <p className="text-sm text-gray-500 mb-1">Giá bán hiện tại:</p>
                <div className="flex items-end gap-3 mb-1">
                  <div className="text-3xl font-bold text-[#008b4b]">
                    {product.price.toLocaleString('vi-VN')}₫
                  </div>
                  {product.on_sale && product.regular_price > product.price && (
                    <div className="text-gray-400 line-through text-base mb-1">
                      {product.regular_price.toLocaleString('vi-VN')}₫
                    </div>
                  )}
                </div>
              </div>

              {/* Nút Đặt Mua */}
              <div className="mb-8">
                {currentQuantity === 0 ? (
                  <button 
                    onClick={handleAddQuantity}
                    className="w-full py-4 bg-[#008b4b] text-white font-bold text-lg rounded-xl hover:bg-[#00703c] transition-colors shadow-md flex items-center justify-center uppercase tracking-wide"
                  >
                    CHỌN MUA
                  </button>
                ) : (
                  <div className="flex items-center justify-between w-full py-2 px-3 bg-[#f0f9f4] rounded-xl border border-[#008b4b] shadow-sm">
                    <button 
                      onClick={handleRemoveQuantity}
                      className="w-12 h-12 flex items-center justify-center text-[#008b4b] text-3xl font-bold hover:bg-[#e0f0e8] rounded-lg transition-colors"
                    >
                      -
                    </button>
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-gray-800 text-xl">{currentQuantity}</span>
                      <span className="text-[10px] text-gray-500 font-medium uppercase">Trong giỏ hàng</span>
                    </div>
                    <button 
                      onClick={handleAddQuantity}
                      className="w-12 h-12 flex items-center justify-center text-[#008b4b] text-3xl font-bold hover:bg-[#e0f0e8] rounded-lg transition-colors"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Mô tả sản phẩm lấy từ WooCommerce */}
              <div className="mt-auto">
                <h3 className="font-bold text-gray-800 mb-3 border-b pb-2 uppercase text-sm">Thông tin sản phẩm</h3>
                <div 
                  className="text-sm text-gray-600 space-y-3 leading-relaxed [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&_strong]:text-gray-800" 
                  dangerouslySetInnerHTML={{__html: product.short_description || product.description || '<p>Đang cập nhật thông tin mô tả chi tiết cho sản phẩm này.</p>'}} 
                />
              </div>
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

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f1f1f1] flex items-center justify-center"><Loader2 className="animate-spin text-[#008b4b]" size={32} /></div>}>
      <ProductDetailContent />
    </Suspense>
  );
}