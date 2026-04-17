"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Import các component dùng chung từ Sidebar.js
import { MobileCategoryNav, DesktopSidebar } from '@/components/Sidebar';

import { Search, ShoppingCart, MapPin, Menu, ChevronRight, X, SearchX, Loader2 } from 'lucide-react';

const Header = ({ cartCount }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);

    const fetchDropdownResults = async () => {
      try {
        const wpDomain = 'https://bachhoalanhao.com';
        const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
        const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';
        
        const apiUrl = `${wpDomain}/wp-json/wc/v3/products?search=${encodeURIComponent(searchQuery)}&per_page=5&_fields=id,name,price,regular_price,images,categories,on_sale&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (Array.isArray(data)) {
          const formattedResults = data.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price ? parseInt(item.price) : 0,
            regular_price: item.regular_price ? parseInt(item.regular_price) : 0,
            images: item.images || [],
            on_sale: item.on_sale || false,
          }));
          
          setSearchResults(formattedResults);
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu dropdown:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchDropdownResults();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
              
              {searchQuery && !isSearching && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}

              {isSearching && (
                 <div className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-[#008b4b]">
                   <Loader2 size={16} className="animate-spin" />
                 </div>
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
                {isSearching ? (
                  <div className="p-6 flex flex-col items-center justify-center text-gray-500 text-sm">
                    <Loader2 size={24} className="animate-spin text-[#008b4b] mb-2" />
                    <span>Đang tìm kiếm <span className="font-bold text-gray-700">"{searchQuery}"</span>...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul className="py-2">
                    {searchResults.map(product => (
                      <li key={`search-${product.id}`} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                        <Link href={`/product?id=${product.id}`} className="flex items-center p-3" onClick={() => setIsSearchFocused(false)}>
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
                      <button 
                        onClick={handleSearch}
                        className="text-[#008b4b] text-sm font-bold hover:underline w-full block"
                      >
                        Xem tất cả kết quả cho "{searchQuery}"
                      </button>
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

// --- PRODUCT CARD COMPONENT ---
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
      
      <Link href={`/product?id=${product.id}`} className="block flex-1 flex flex-col cursor-pointer">
        <div className="w-full aspect-square mb-3 relative overflow-hidden rounded-md bg-white border p-1">
          <img 
            src={product.images[0]?.src || '/api/placeholder/200/200'} 
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="flex flex-col flex-1">
          <h3 className="text-sm text-gray-800 font-medium line-clamp-2 min-h-[40px] mb-2 group-hover:text-[#008b4b]">
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
          </div>
        </div>
      </Link>

      <div className="mt-2 relative z-20">
        {quantity === 0 ? (
          <button 
            onClick={(e) => {
              e.preventDefault(); e.stopPropagation();
              onAdd(product);
            }}
            className="w-full py-2 bg-[#f0f9f4] text-[#008b4b] font-bold text-center rounded border border-transparent hover:border-[#008b4b] transition-all"
          >
            MUA
          </button>
        ) : (
          <div className="flex items-center justify-between w-full py-1 px-2 bg-[#f0f9f4] rounded border border-[#008b4b]">
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(product.id); }}
              className="w-8 h-8 flex items-center justify-center text-[#008b4b] text-2xl font-bold hover:bg-[#e0f0e8] rounded">-</button>
            <span className="font-bold text-gray-800 text-lg">{quantity}</span>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(product); }}
              className="w-8 h-8 flex items-center justify-center text-[#008b4b] text-2xl font-bold hover:bg-[#e0f0e8] rounded">+</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN SEARCH CONTENT ---
function SearchContent() {
  const searchParams = useSearchParams();
  const [allFetchedProducts, setAllFetchedProducts] = useState([]); 
  const [visibleCount, setVisibleCount] = useState(20);             
  const [nextOffset, setNextOffset] = useState(0);             
  const [hasMore, setHasMore] = useState(true);                     
  const [isFetching, setIsFetching] = useState(false);              
  const [isFirstLoad, setIsFirstLoad] = useState(true);             
  const [totalCount, setTotalCount] = useState(0);                  
  const [cart, setCart] = useState([]);
  const [searchTitle, setSearchTitle] = useState('');
  const [currentQuery, setCurrentQuery] = useState({ q: '', categorySlug: '', onSale: '' });

  const isFetchingRef = useRef(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('lanHaoCart');
    if (savedCart) { try { setCart(JSON.parse(savedCart)); } catch (e) {} }
  }, []);

  useEffect(() => {
    if (cart.length > 0) { localStorage.setItem('lanHaoCart', JSON.stringify(cart)); } 
    else { localStorage.removeItem('lanHaoCart'); }
  }, [cart]);

  const fetchProductsFromAPI = async (q, categorySlug, onSale, limit, offset) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsFetching(true);
    if (offset === 0) setIsFirstLoad(true);
    
    try {
      const wpDomain = 'https://bachhoalanhao.com';
      const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
      const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';

      let apiUrl = `${wpDomain}/wp-json/wc/v3/products?per_page=${limit}&offset=${offset}&_fields=id,name,price,regular_price,images,categories,on_sale&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

      if (onSale) {
        apiUrl += `&on_sale=true`;
        if (offset === 0) setSearchTitle('Sản phẩm Khuyến mãi');
      } 
      else if (categorySlug) {
        const catUrl = `${wpDomain}/wp-json/wc/v3/products/categories?slug=${categorySlug}&_fields=id,name&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        const catRes = await fetch(catUrl);
        const catData = await catRes.json();
        if (Array.isArray(catData) && catData.length > 0) {
           apiUrl += `&category=${catData[0].id}`;
           if (offset === 0) setSearchTitle(`Danh mục: ${catData[0].name}`);
        }
      } 
      else if (q && q.trim() !== '') {
        apiUrl += `&search=${encodeURIComponent(q)}`;
        if (offset === 0) setSearchTitle(`Kết quả tìm kiếm: "${q}"`);
      } else {
        if (offset === 0) setSearchTitle('Tất cả sản phẩm');
      }

      const response = await fetch(apiUrl);
      const totalHeader = response.headers.get('X-WP-Total');
      if (totalHeader && offset === 0) setTotalCount(parseInt(totalHeader));

      const data = await response.json();
      if (Array.isArray(data)) {
        const formattedProducts = data.map(item => ({
          id: item.id, name: item.name,
          price: item.price ? parseInt(item.price) : 0,
          regular_price: item.regular_price ? parseInt(item.regular_price) : 0,
          images: item.images || [],
          categories: item.categories || [],
          on_sale: item.on_sale || false,
        }));
        
        setAllFetchedProducts(prev => offset === 0 ? formattedProducts : [...prev, ...formattedProducts]);
        setHasMore(data.length === limit); 
        setNextOffset(offset + data.length);
      }
    } catch (error) {
      console.log("Lỗi tải sản phẩm:", error.message);
    } finally {
      setIsFetching(false); isFetchingRef.current = false; setIsFirstLoad(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const categorySlug = searchParams.get('categorySlug') || '';
    const onSale = searchParams.get('on_sale') || '';
    setCurrentQuery({ q, categorySlug, onSale });
    setAllFetchedProducts([]); setVisibleCount(20); setNextOffset(0); setHasMore(true);
    fetchProductsFromAPI(q, categorySlug, onSale, 20, 0);
  }, [searchParams]);

  useEffect(() => {
    if (isFirstLoad || !hasMore || isFetchingRef.current) return;
    if (allFetchedProducts.length - visibleCount <= 40) {
       fetchProductsFromAPI(currentQuery.q, currentQuery.categorySlug, currentQuery.onSale, 100, nextOffset);
    }
  }, [allFetchedProducts.length, visibleCount]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200) {
        setVisibleCount(prev => prev >= allFetchedProducts.length ? prev : prev + 20);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [allFetchedProducts.length]);

  const handleAddQuantity = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveQuantity = (productId) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity === 1) return prev.filter(item => item.id !== productId);
      return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
    });
  };

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const displayedProducts = allFetchedProducts.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#f1f1f1] font-sans pb-10 relative">
      <Header cartCount={cartTotalCount} />
      <MobileCategoryNav />
      <div className="max-w-7xl mx-auto px-4 mt-4 flex gap-4 lg:gap-6">
        <DesktopSidebar />
        <main className="flex-1 min-w-0 space-y-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-t-4 border-[#008b4b]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                <span className="text-[#008b4b] mr-2">{searchTitle}</span>
              </h2>
              <span className="text-sm text-gray-500">
                Hiển thị {displayedProducts.length} / {totalCount || displayedProducts.length} sản phẩm
              </span>
            </div>
            <div className="p-4">
              {isFirstLoad ? (
                <div className="py-10 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 size={32} className="animate-spin text-[#008b4b] mb-4" />
                  <p className="italic">Đang kết nối dữ liệu...</p>
                </div>
              ) : displayedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {displayedProducts.map(product => (
                    <ProductCard key={product.id} product={product} 
                      quantity={cart.find(i => i.id === product.id)?.quantity || 0}
                      onAdd={handleAddQuantity} onRemove={handleRemoveQuantity} />
                  ))}
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center">
                  <SearchX size={64} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-800">Không có sản phẩm nào</h3>
                  <Link href="/" className="mt-6 px-6 py-2 bg-[#008b4b] text-white font-bold rounded-full">Quay lại trang chủ</Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#008b4b]" size={32} /></div>}>
      <SearchContent />
    </Suspense>
  );
}