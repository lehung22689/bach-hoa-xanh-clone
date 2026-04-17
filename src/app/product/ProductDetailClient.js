"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, SearchX } from 'lucide-react';

// ⚠️ KHI CHẠY TRÊN VS CODE CỦA BẠN: Hãy bỏ comment dòng dưới đây và XÓA phần MOCK COMPONENT đi nhé!
import Link from 'next/link';


export default function ProductDetailClient({ initialProduct, productId }) {
  const [cart, setCart] = useState([]);
  const [activeImage, setActiveImage] = useState(0);

  // Lấy giỏ hàng từ localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('lanHaoCart');
    if (savedCart) { 
      try { 
        setCart(JSON.parse(savedCart)); 
      } catch (e) {
        console.error("Lỗi đọc giỏ hàng", e);
      } 
    }
  }, []);

  // Lưu giỏ hàng khi có thay đổi
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('lanHaoCart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('lanHaoCart');
    }
  }, [cart]);

  const handleAddQuantity = () => {
    setCart(prev => {
      const existing = prev.find(item => item.id === initialProduct.id);
      if (existing) return prev.map(item => item.id === initialProduct.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...initialProduct, quantity: 1 }];
    });
  };

  const handleRemoveQuantity = () => {
    setCart(prev => {
      const existing = prev.find(item => item.id === initialProduct.id);
      if (existing && existing.quantity === 1) return prev.filter(item => item.id !== initialProduct.id);
      return prev.map(item => item.id === initialProduct.id ? { ...item, quantity: item.quantity - 1 } : item);
    });
  };

  // Nếu không tìm thấy sản phẩm
  if (!initialProduct) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <SearchX size={64} className="text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-800">Sản phẩm không tồn tại</h3>
        <Link href="/" className="mt-4 px-6 py-2 bg-[#008b4b] text-white font-bold rounded-full hover:bg-[#00703c] transition-colors">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const currentQuantity = cart.find(i => i.id === initialProduct.id)?.quantity || 0;
  const discountPercent = initialProduct.on_sale && initialProduct.regular_price > initialProduct.price
    ? Math.round(((initialProduct.regular_price - initialProduct.price) / initialProduct.regular_price) * 100) 
    : 0;

  // LƯU Ý: Không dùng thẻ <div> bao bọc ngoài cùng nữa vì layout.js đã lo phần khung.
  // Chúng ta dùng thẻ Fragment <> ... </>
  return (
    <>
      {/* Nút Quay Lại / Breadcrumb */}
      <div className="mb-4 flex items-center text-sm font-medium text-gray-600 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
        <button onClick={() => window.history.back()} className="flex items-center hover:text-[#008b4b] transition-colors">
          <ChevronLeft size={18} className="mr-1" />
          <span>{initialProduct.categories?.[0]?.name || 'Quay lại'}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col lg:flex-row gap-8">
        
        {/* Cột trái: Hình ảnh */}
        <div className="w-full lg:w-3/5">
          <div className="border rounded-xl p-4 mb-4 relative flex items-center justify-center aspect-[4/3]">
            {discountPercent > 0 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
                GIẢM {discountPercent}%
              </div>
            )}
            <img 
              src={initialProduct.images[activeImage]?.src || '/api/placeholder/600/400'} 
              alt={initialProduct.name} 
              className="max-w-full max-h-full object-contain" 
            />
          </div>

          {/* Danh sách ảnh thu nhỏ */}
          {initialProduct.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {initialProduct.images.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveImage(idx)} 
                  className={`border p-1 rounded-lg cursor-pointer w-20 h-20 flex-shrink-0 transition-all ${
                    activeImage === idx ? 'border-[#008b4b] ring-2 ring-[#008b4b] ring-opacity-50' : 'hover:border-gray-400'
                  }`}
                >
                  <img src={img.src} alt={`${initialProduct.name} - ảnh ${idx+1}`} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cột phải: Thông tin & Đặt hàng */}
        <div className="w-full lg:w-2/5 flex flex-col">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{initialProduct.name}</h1>
          
          <div className="bg-gray-50 border-l-4 border-[#008b4b] p-5 mb-6">
            <div className="text-3xl font-bold text-[#008b4b] mb-1">
              {initialProduct.price.toLocaleString('vi-VN')}₫
            </div>
            {discountPercent > 0 && (
              <div className="text-gray-400 line-through">
                {initialProduct.regular_price.toLocaleString('vi-VN')}₫
              </div>
            )}
          </div>

          {currentQuantity === 0 ? (
            <button 
              onClick={handleAddQuantity} 
              className="w-full py-4 bg-[#008b4b] text-white font-bold rounded-xl uppercase hover:bg-[#00703c] transition-colors"
            >
              CHỌN MUA
            </button>
          ) : (
            <div className="flex items-center justify-between p-2 bg-[#f0f9f4] rounded-xl border border-[#008b4b]">
              <button 
                onClick={handleRemoveQuantity} 
                className="w-12 h-12 text-[#008b4b] hover:bg-[#e0f0e8] rounded-lg text-2xl font-bold transition-colors"
              >
                -
              </button>
              <span className="font-bold text-xl">{currentQuantity}</span>
              <button 
                onClick={handleAddQuantity} 
                className="w-12 h-12 text-[#008b4b] hover:bg-[#e0f0e8] rounded-lg text-2xl font-bold transition-colors"
              >
                +
              </button>
            </div>
          )}
          
          {/* Thông tin mô tả */}
          <div className="mt-8 border-t pt-4">
            <h3 className="font-bold uppercase text-sm mb-3">Thông tin sản phẩm</h3>
            <div 
              className="text-sm text-gray-600 space-y-2 leading-relaxed" 
              dangerouslySetInnerHTML={{__html: initialProduct.short_description || initialProduct.description || 'Đang cập nhật thông tin chi tiết.'}} 
            />
          </div>
        </div>
      </div>
    </>
  );
}