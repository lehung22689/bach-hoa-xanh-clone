"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Trash2 } from 'lucide-react';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);

  // Lấy dữ liệu giỏ hàng từ máy tính khi vào trang
  useEffect(() => {
    const savedCart = localStorage.getItem('lanHaoCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-[#f1f1f1] font-sans pb-10">
      <header className="bg-[#008b4b] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
          <Link href="/" className="flex items-center hover:text-yellow-300 transition-colors">
            <ChevronLeft size={24} className="mr-1" />
            <span className="font-bold text-lg">Quay lại mua sắm</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Giỏ hàng của bạn</h1>
        
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm">
            <p className="text-gray-500 mb-4">Giỏ hàng đang trống.</p>
            <Link href="/" className="bg-[#008b4b] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#00703c]">
              Tiếp tục mua hàng
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-4">
            {cartItems.map((item, index) => (
              <div key={index} className="flex items-center py-4 border-b last:border-0">
                <img src={item.images[0]?.src} alt={item.name} className="w-20 h-20 object-cover rounded border" />
                <div className="ml-4 flex-1">
                  <h3 className="font-medium text-gray-800">{item.name}</h3>
                  <p className="text-red-600 font-bold">{item.price.toLocaleString('vi-VN')}₫</p>
                  <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                </div>
                <div className="font-bold text-red-600">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                </div>
              </div>
            ))}
            
            <div className="mt-6 pt-4 border-t flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">Tổng tiền:</span>
              <span className="text-2xl font-bold text-red-600">{totalAmount.toLocaleString('vi-VN')}₫</span>
            </div>
            
            <button className="w-full mt-4 bg-yellow-400 text-green-900 font-bold text-lg py-3 rounded-xl hover:bg-yellow-300 transition-colors">
              ĐẶT HÀNG NGAY
            </button>
          </div>
        )}
      </main>
    </div>
  );
}