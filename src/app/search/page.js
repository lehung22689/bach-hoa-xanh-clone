"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { SearchX, Loader2 } from 'lucide-react';

// ⚠️ KHI CHẠY TRÊN VS CODE: Hãy BỎ COMMENT 3 dòng dưới đây và XÓA phần MOCK COMPONENT đi nhé!
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';


// Component thẻ sản phẩm
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
      
      <Link href={`/product?id=${product.id}`} className="block w-full aspect-square mb-3 relative overflow-hidden rounded-md bg-white border p-1">
        <img 
          src={product.images[0]?.src || '/api/placeholder/200/200'} 
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      <div className="flex flex-col flex-1">
        <Link href={`/product?id=${product.id}`}>
          <h3 className="text-sm text-gray-800 font-medium line-clamp-2 min-h-[40px] mb-2 hover:text-green-600 cursor-pointer">
            {product.name}
          </h3>
        </Link>
        
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

function SearchContent() {
  const searchParams = useSearchParams();
  
  const [allFetchedProducts, setAllFetchedProducts] = useState([]); 
  const [visibleCount, setVisibleCount] = useState(20);             
  const [nextOffset, setNextOffset] = useState(0);             
  const [hasMore, setHasMore] = useState(true);                     
  const [isFetching, setIsFetching] = useState(false);              
  const [isFirstLoad, setIsFirstLoad] = useState(true);             
  const [totalCount, setTotalCount] = useState(0);                  
  
  const [searchTitle, setSearchTitle] = useState('');
  const [currentQuery, setCurrentQuery] = useState({ q: '', categorySlug: '', onSale: '' });

  const isFetchingRef = useRef(false);

  // GỌI CÁC HÀM XỬ LÝ TỪ KHO CHỨA DÙNG CHUNG (Context API)
  const { addToCart, removeFromCart, getProductQuantity } = useCart() || {
    addToCart: () => {},
    removeFromCart: () => {},
    getProductQuantity: () => 0
  };

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
        } else {
           if (offset === 0) setSearchTitle(`Danh mục: ${categorySlug}`);
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
      if (totalHeader && offset === 0) {
          setTotalCount(parseInt(totalHeader));
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        const formattedProducts = data.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price ? parseInt(item.price) : 0,
          regular_price: item.regular_price ? parseInt(item.regular_price) : 0,
          images: item.images || [],
          categories: item.categories || [],
          on_sale: item.on_sale || false,
        }));
        
        const uniqueFormattedProducts = formattedProducts.filter((item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
        );

        setAllFetchedProducts(prev => {
           if (offset === 0) return uniqueFormattedProducts;
           const existingIds = new Set(prev.map(item => item.id));
           const uniqueNewProducts = uniqueFormattedProducts.filter(item => !existingIds.has(item.id));
           return [...prev, ...uniqueNewProducts];
        });
        
        setHasMore(data.length === limit); 
        setNextOffset(offset + data.length);
      } else {
         throw new Error("Không lấy được dữ liệu");
      }
    } catch (error) {
      console.log("Lỗi tải sản phẩm:", error.message);
    } finally {
      setIsFetching(false);
      isFetchingRef.current = false; 
      setIsFirstLoad(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const categorySlug = searchParams.get('categorySlug') || '';
    const onSale = searchParams.get('on_sale') || '';
    
    setCurrentQuery({ q, categorySlug, onSale });
    setAllFetchedProducts([]);
    setVisibleCount(20);
    setNextOffset(0);
    setHasMore(true);
    
    fetchProductsFromAPI(q, categorySlug, onSale, 20, 0);
  }, [searchParams]);

  useEffect(() => {
    if (isFirstLoad || !hasMore || isFetchingRef.current) return;

    const bufferRemaining = allFetchedProducts.length - visibleCount;
    
    if (bufferRemaining <= 40) {
       fetchProductsFromAPI(currentQuery.q, currentQuery.categorySlug, currentQuery.onSale, 100, nextOffset);
    }
  }, [allFetchedProducts.length, visibleCount, hasMore, isFirstLoad, currentQuery, nextOffset]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 200;
      
      if (scrollPosition >= threshold) {
        setVisibleCount(prev => {
          if (prev >= allFetchedProducts.length) return prev;
          return prev + 20; 
        });
      }
    };

    let scrollTimeout;
    const throttledScroll = () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          handleScroll();
          scrollTimeout = null;
        }, 100);
      }
    };

    window.addEventListener('scroll', throttledScroll);
    return () => {
       window.removeEventListener('scroll', throttledScroll);
       if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [allFetchedProducts.length]);

  const displayedProducts = allFetchedProducts.slice(0, visibleCount);
  const isShowingSpinner = isFetching && visibleCount >= allFetchedProducts.length;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border-t-4 border-[#008b4b]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
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
                <p className="italic">Hệ thống đang kết nối dữ liệu...</p>
            </div>
          ) : displayedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayedProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    quantity={getProductQuantity(product.id)}
                    onAdd={addToCart}           // Đã đổi sang hàm của Context API
                    onRemove={removeFromCart}   // Đã đổi sang hàm của Context API
                  />
                ))}
              </div>
              
              {isShowingSpinner && (
                <div className="pt-8 pb-4 flex justify-center w-full col-span-full">
                  <Loader2 className="animate-spin text-[#008b4b]" size={28} />
                </div>
              )}
              
              {!hasMore && displayedProducts.length === allFetchedProducts.length && (
                  <div className="pt-8 pb-2 text-center text-gray-400 text-sm">
                    Bạn đã xem hết sản phẩm trong danh mục này.
                  </div>
              )}
            </>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <SearchX size={64} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">Không có sản phẩm nào</h3>
              <p className="text-gray-500 text-sm">Danh mục này hiện chưa có sản phẩm.</p>
              <Link href="/" className="mt-6 px-6 py-2 bg-[#008b4b] text-white font-bold rounded-full hover:bg-[#00703c] transition-colors">
                Quay lại trang chủ
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f1f1f1] flex items-center justify-center"><Loader2 className="animate-spin text-[#008b4b]" size={32} /></div>}>
      <SearchContent />
    </Suspense>
  );
}