"use client";

import React, { useState, useEffect, useRef } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, MapPin, Menu, ChevronRight, X, SearchX } from 'lucide-react';

// Giả lập thẻ Link và useRouter của Next.js để có thể xem trước trực tiếp trên môi trường này
const Link = ({ href, children, className, onClick }) => {
  const handleClick = (e) => {
    if (onClick) onClick(e);
    // Ngăn chặn lỗi định dạng URL khi chạy trên môi trường giả lập (Canvas)
    if (window.location.protocol === 'blob:' && href.startsWith('/')) {
      e.preventDefault();
      if (href.includes('?q=')) {
        const q = href.split('?q=')[1] || '';
        window.dispatchEvent(new CustomEvent('mock-navigate', { detail: decodeURIComponent(q) }));
      }
    }
  };
  return <a href={href} className={className} onClick={handleClick}>{children}</a>;
};

const useRouter = () => ({
  push: (url) => {
    try {
      if (window.location.protocol === 'blob:') {
        if (url.includes('?q=')) {
          const q = url.split('?q=')[1] || '';
          window.dispatchEvent(new CustomEvent('mock-navigate', { detail: decodeURIComponent(q) }));
        }
      } else {
        window.location.href = url;
      }
    } catch (error) {
      console.log("Đã bỏ qua lỗi điều hướng trong môi trường xem trước.");
    }
  }
});

// --- MOCK DATA: Danh mục ---
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
const Header = ({ cartCount, allProducts }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const keyword = searchQuery.toLowerCase();
    const results = allProducts.filter(product => 
      product.name.toLowerCase().includes(keyword)
    );
    setSearchResults(results.slice(0, 5));
  }, [searchQuery, allProducts]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim() !== '') {
      setIsSearchFocused(false);
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

          <div className="flex-1 max-w-2xl mx-4 relative hidden sm:block" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm sản phẩm tại Bách Hóa Lan Hảo..."
                className="w-full px-4 py-2.5 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}

              <button 
                onClick={handleSearch}
                className="absolute right-1 top-1 bg-gray-100 p-1.5 rounded-full text-gray-600 hover:bg-gray-200"
              >
                <Search size={20} />
              </button>
            </div>

            {isSearchFocused && searchQuery.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  <ul className="py-2">
                    {searchResults.map(product => (
                      <li key={`search-${product.id}`} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                        <Link href="#" className="flex items-center p-3">
                          <div className="w-12 h-12 flex-shrink-0 bg-white border rounded">
                            <img 
                              src={product.images[0]?.src || '/api/placeholder/48/48'} 
                              alt={product.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-[#008b4b]">
                              {product.name}
                            </p>
                            <p className="text-red-600 font-bold text-sm mt-0.5">
                              {product.price.toLocaleString('vi-VN')}₫
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                    <li className="p-2 text-center bg-gray-50 border-t">
                      <Link 
                        href={`/search?q=${encodeURIComponent(searchQuery)}`}
                        onClick={() => setIsSearchFocused(false)}
                        className="text-[#008b4b] text-sm font-bold hover:underline block w-full"
                      >
                        Xem tất cả kết quả cho "{searchQuery}"
                      </Link>
                    </li>
                  </ul>
                ) : (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    Không tìm thấy sản phẩm nào khớp với <br/> <span className="font-bold text-gray-700">"{searchQuery}"</span>
                  </div>
                )}
              </div>
            )}
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

const ProductCard = ({ product, quantity, onAdd, onRemove }) => {
  const discountPercent = product.on_sale && product.regular_price > product.price
    ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100) 
    : 0;

  return (
    <div className={`bg-white rounded-lg p-3 hover:shadow-lg transition-shadow border flex flex-col h-full relative group ${quantity > 0 ? 'border-[#008b4b]' : 'border-gray-100'}`}>
      {discountPercent > 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded z-10">
          -{discountPercent}%
        </div>
      )}
      
      <div className="w-full aspect-square mb-3 relative overflow-hidden rounded-md bg-white border p-1">
        <img 
          src={product.images[0]?.src || '/api/placeholder/200/200'} 
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="flex flex-col flex-1">
        <h3 className="text-sm text-gray-800 font-medium line-clamp-2 min-h-[40px] mb-2 hover:text-green-600 cursor-pointer">
          {product.name}
        </h3>
        
        <div className="mt-auto flex flex-col">
          <div className="mb-2">
            {product.on_sale && product.regular_price > product.price && (
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

// 4. Main Search Page Component
export default function SearchPage() {
  const [allProducts, setAllProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Lấy giỏ hàng
  useEffect(() => {
    const savedCart = localStorage.getItem('lanHaoCart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }
  }, []);

  // Lưu giỏ hàng
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('lanHaoCart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('lanHaoCart');
    }
  }, [cart]);

  // Lấy danh sách sản phẩm và lọc theo URL ban đầu
  useEffect(() => {
    let isMounted = true; 
    
    // Lấy từ khóa (q) từ URL của trình duyệt
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    setSearchKeyword(q);

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const wpDomain = 'https://bachhoalanhao.com';
        const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
        const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';

        const apiUrl = `${wpDomain}/wp-json/wc/v3/products?per_page=100&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (Array.isArray(data) && isMounted) {
          const formattedProducts = data.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price ? parseInt(item.price) : 0,
            regular_price: item.regular_price ? parseInt(item.regular_price) : 0,
            images: item.images || [],
            categories: item.categories || [],
            on_sale: item.on_sale || false,
          }));

          setAllProducts(formattedProducts);

          // Lọc sản phẩm theo từ khóa
          if (q.trim() !== '') {
            const filtered = formattedProducts.filter(p => 
              p.name.toLowerCase().includes(q.toLowerCase())
            );
            setDisplayedProducts(filtered);
          } else {
            setDisplayedProducts(formattedProducts);
          }
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    
    return () => { isMounted = false; };
  }, []);

  // --- THÊM MỚI: Lắng nghe sự kiện chuyển trang mô phỏng trong Canvas ---
  useEffect(() => {
    const handleMockNavigate = (e) => {
      const newQuery = e.detail || '';
      setSearchKeyword(newQuery);
      if (newQuery.trim() !== '') {
        const filtered = allProducts.filter(p => p.name.toLowerCase().includes(newQuery.toLowerCase()));
        setDisplayedProducts(filtered);
      } else {
        setDisplayedProducts(allProducts);
      }
    };

    window.addEventListener('mock-navigate', handleMockNavigate);
    return () => window.removeEventListener('mock-navigate', handleMockNavigate);
  }, [allProducts]);

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

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f1f1f1] font-sans pb-10 relative">
      {/* Truyền allProducts vào Header để thanh Search vẫn hoạt động liên tục */}
      <Header cartCount={cartTotalCount} allProducts={allProducts} />
      
      <MobileCategoryNav />

      <div className="max-w-7xl mx-auto px-4 mt-4 flex gap-4 lg:gap-6">
        <DesktopSidebar />

        <main className="flex-1 min-w-0 space-y-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-t-4 border-[#008b4b]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                Kết quả tìm kiếm cho: <span className="text-[#008b4b] ml-2">"{searchKeyword}"</span>
              </h2>
              <span className="text-sm text-gray-500">{displayedProducts.length} sản phẩm</span>
            </div>
            
            <div className="p-4">
              {loading ? (
                <div className="py-10 text-center text-gray-400 italic">Đang tìm kiếm sản phẩm...</div>
              ) : displayedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {displayedProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      quantity={getProductQuantity(product.id)}
                      onAdd={handleAddQuantity}
                      onRemove={handleRemoveQuantity}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <SearchX size={64} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Không tìm thấy sản phẩm nào</h3>
                  <p className="text-gray-500 text-sm">Vui lòng kiểm tra lại lỗi chính tả hoặc thử với từ khóa khác.</p>
                  <Link href="/" className="mt-6 px-6 py-2 bg-[#008b4b] text-white font-bold rounded-full hover:bg-[#00703c] transition-colors">
                    Quay lại trang chủ
                  </Link>
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