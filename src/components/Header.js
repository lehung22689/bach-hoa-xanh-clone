"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, MapPin, X, Loader2 } from 'lucide-react';
// IMPORT CHUẨN CỦA NEXT.JS (Không dùng giả lập nữa)
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header({ cartCount = 0 }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  
  // SỬ DỤNG ROUTER CHUẨN ĐỂ CHUYỂN TRANG KHÔNG BỊ NHÁY
  const router = useRouter();

  useEffect(() => {
    const fetchDropdownResults = async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
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
          
          const uniqueResults = formattedResults.filter((item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
          );
          
          setSearchResults(uniqueResults);
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
          <Link href="/" className="flex items-center space-x-2 font-bold text-2xl tracking-tighter cursor-pointer hover:text-yellow-300 transition-colors">
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
                {searchResults.length > 0 ? (
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
                ) : !isSearching && (
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
}