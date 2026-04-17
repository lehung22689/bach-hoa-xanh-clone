"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchX, Loader2 } from 'lucide-react';

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
            // Thêm xử lý lỗi ảnh nếu link từ WP bị die
            onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=BachHoaLanHao'; }}
          />
        </div>

        <div className="flex flex-col flex-1">
          <h3 className="text-sm text-gray-800 font-medium line-clamp-2 min-h-[40px] mb-2 group-hover:text-[#008b4b]">
            {product.name}
          </h3>
          <div className="mt-auto">
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
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(product); }}
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

// --- SEARCH CONTENT ---
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

  // Load giỏ hàng
  useEffect(() => {
    const savedCart = localStorage.getItem('lanHaoCart');
    if (savedCart) { try { setCart(JSON.parse(savedCart)); } catch (e) {} }
  }, []);

  useEffect(() => {
    if (cart.length > 0) { localStorage.setItem('lanHaoCart', JSON.stringify(cart)); } 
    else { localStorage.removeItem('lanHaoCart'); }
  }, [cart]);

  // Fetch API
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
      } else if (categorySlug) {
        const catUrl = `${wpDomain}/wp-json/wc/v3/products/categories?slug=${categorySlug}&_fields=id,name&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        const catRes = await fetch(catUrl);
        const catData = await catRes.json();
        if (Array.isArray(catData) && catData.length > 0) {
           apiUrl += `&category=${catData[0].id}`;
           if (offset === 0) setSearchTitle(`Danh mục: ${catData[0].name}`);
        }
      } else if (q) {
        apiUrl += `&search=${encodeURIComponent(q)}`;
        if (offset === 0) setSearchTitle(`Tìm kiếm: "${q}"`);
      } else {
        if (offset === 0) setSearchTitle('Tất cả sản phẩm');
      }

      const response = await fetch(apiUrl);
      const totalHeader = response.headers.get('X-WP-Total');
      if (totalHeader && offset === 0) setTotalCount(parseInt(totalHeader));

      const data = await response.json();
      if (Array.isArray(data)) {
        const formatted = data.map(item => ({
          id: item.id, name: item.name,
          price: item.price ? parseInt(item.price) : 0,
          regular_price: item.regular_price ? parseInt(item.regular_price) : 0,
          images: item.images || [],
          on_sale: item.on_sale || false,
        }));
        setAllFetchedProducts(prev => offset === 0 ? formatted : [...prev, ...formatted]);
        setHasMore(data.length === limit); 
        setNextOffset(offset + data.length);
      }
    } catch (e) { console.error(e); } 
    finally { setIsFetching(false); isFetchingRef.current = false; setIsFirstLoad(false); }
  };

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const categorySlug = searchParams.get('categorySlug') || '';
    const onSale = searchParams.get('on_sale') || '';
    setCurrentQuery({ q, categorySlug, onSale });
    setAllFetchedProducts([]); setNextOffset(0); setHasMore(true);
    fetchProductsFromAPI(q, categorySlug, onSale, 20, 0);
  }, [searchParams]);

  // Infinite Scroll logic... (giữ nguyên như cũ)

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

  // QUAN TRỌNG: Chỉ trả về nội dung bên trong <main>, không gọi Header/Sidebar/Layout nữa
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border-t-4 border-[#008b4b]">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">
          <span className="text-[#008b4b] mr-2">{searchTitle}</span>
        </h2>
        <span className="text-sm text-gray-500">
          {allFetchedProducts.length} / {totalCount || allFetchedProducts.length} sản phẩm
        </span>
      </div>

      <div className="p-4">
        {isFirstLoad ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 size={40} className="animate-spin text-[#008b4b] mb-4" />
            <p>Đang tải sản phẩm Bách Hóa Lan Hảo...</p>
          </div>
        ) : allFetchedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allFetchedProducts.slice(0, visibleCount).map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                quantity={cart.find(i => i.id === product.id)?.quantity || 0}
                onAdd={handleAddQuantity} 
                onRemove={handleRemoveQuantity} 
              />
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center">
            <SearchX size={60} className="text-gray-200 mb-4" />
            <p className="text-gray-500">Không tìm thấy sản phẩm nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Đang tải...</div>}>
      <SearchContent />
    </Suspense>
  );
}