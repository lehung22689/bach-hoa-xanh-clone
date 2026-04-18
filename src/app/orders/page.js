"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Send, Loader2, SearchX, ShoppingBag, User } from 'lucide-react';

// ⚠️ KHI CHẠY TRÊN VS CODE: Hãy BỎ COMMENT các dòng dưới đây và XÓA phần MOCK COMPONENT đi nhé!
import Link from 'next/link';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";



// CẤU HÌNH FIREBASE TỪ FILE .ENV.LOCAL
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Hàm dịch trạng thái đơn hàng sang Tiếng Việt
const translateStatus = (status) => {
  const statusMap = {
    'pending': { text: 'Chờ thanh toán', color: 'text-orange-500' },
    'processing': { text: 'Chờ xác nhận', color: 'text-[#008b4b]' },
    'on-hold': { text: 'Tạm giữ', color: 'text-yellow-600' },
    'completed': { text: 'Giao thành công', color: 'text-[#008b4b]' },
    'cancelled': { text: 'Đã hủy', color: 'text-gray-500' },
    'refunded': { text: 'Đã hoàn tiền', color: 'text-gray-500' },
    'failed': { text: 'Thất bại', color: 'text-red-500' },
  };
  return statusMap[status] || { text: status, color: 'text-gray-600' };
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPhone, setUserPhone] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // 1. Lắng nghe trạng thái đăng nhập Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Chuyển số +84... thành 0... để match với định dạng lưu trong WooCommerce
        const localPhone = user.phoneNumber.replace('+84', '0');
        setUserPhone(localPhone);
        fetchOrdersByPhone(localPhone);
      } else {
        setLoading(false); 
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchOrdersByPhone = async (phone) => {
    setLoading(true);
    try {
      const wpDomain = 'https://bachhoalanhao.com';
      const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
      const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';
      
      const apiUrl = `${wpDomain}/wp-json/wc/v3/orders?search=${phone}&per_page=20&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Lọc chắc chắn 100% đúng số điện thoại thanh toán
        const exactOrders = data.filter(order => order.billing.phone === phone);
        setOrders(exactOrders);
      }
    } catch (error) {
      console.error("Lỗi lấy đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ giao' },
    { id: 'store', label: 'Mua tại cửa hàng' },
    { id: 'completed', label: 'Giao thành công' },
    { id: 'cancelled', label: 'Hủy đơn' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex flex-col items-center justify-center">
         <Loader2 size={40} className="animate-spin text-[#008b4b] mb-4" />
         <p className="text-gray-500 font-medium">Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  if (!userPhone) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex flex-col items-center justify-center p-4">
         <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
            <User size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Bạn chưa đăng nhập</h2>
            <p className="text-gray-500 text-sm mb-6">Vui lòng đăng nhập để xem lịch sử đơn hàng của bạn.</p>
            <Link href="/" className="inline-block bg-[#008b4b] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#00703c] transition-colors">
              Quay lại trang chủ
            </Link>
         </div>
      </div>
    );
  }

  return (
    // FIX: Thêm relative và -mt-4 để khử khoảng trắng từ layout tổng
    <div className="min-h-screen bg-[#f1f1f1] font-sans pb-10 relative -mt-4">
      {/* CSS INJECT ĐỂ ẨN SIDEBAR NẾU CÓ BỌC LAYOUT */}
      <style dangerouslySetInnerHTML={{__html: `aside { display: none !important; }`}} />

      {/* Header riêng của trang Đơn hàng */}
      {/* FIX: Thêm top-[60px] md:top-[70px] để khi cuộn không bị che khuất */}
      <header className="bg-white sticky top-[60px] md:top-[70px] z-30 shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="text-gray-600 hover:text-[#008b4b] p-1 -ml-1">
            <ChevronLeft size={28} />
          </button>
          <h1 className="font-bold text-lg text-gray-800 flex-1 text-center pr-8">Đơn hàng từng mua</h1>
        </div>
        
        {/* Tabs Filter */}
        <div className="max-w-3xl mx-auto px-4 py-3 flex overflow-x-auto gap-2 no-scrollbar border-t border-gray-50">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-1.5 text-[15px] font-medium rounded-full transition-colors ${
                activeTab === tab.id 
                  ? 'bg-[#008b4b] text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-4 space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm mt-10">
            <ShoppingBag size={56} className="mx-auto text-gray-300 mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-bold text-gray-800 mb-2">Chưa có đơn hàng</h3>
            <p className="text-gray-500 text-sm mb-6">Bạn chưa có đơn hàng nào trong hệ thống.</p>
            <Link href="/" className="bg-[#008b4b] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#00703c] transition-colors">
              Bắt đầu mua sắm
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = translateStatus(order.status);
            
            // Xử lý hiển thị danh sách ảnh (Giới hạn tối đa 4 ô)
            const maxVisibleImages = 4;
            const displayItems = order.line_items.slice(0, maxVisibleImages);
            const extraCount = order.line_items.length > maxVisibleImages ? order.line_items.length - 3 : 0;

            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
                <div className="p-4">
                  {/* Dòng Header của Card */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-[15px] text-gray-800">Đơn hàng #{order.id}</h3>
                    <div className="flex flex-col items-end">
                      <Link href={`/order?id=${order.id}`} className="text-[13px] text-gray-600 hover:text-[#008b4b] flex items-center mb-1">
                        Xem chi tiết <ChevronRight size={14} className="ml-0.5" />
                      </Link>
                      <span className={`text-[13px] font-medium ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                  </div>

                  {/* Dòng Hình ảnh Sản phẩm */}
                  <div className="flex gap-2.5 overflow-hidden mb-4">
                    {displayItems.map((item, index) => {
                      // Nếu có nhiều hơn 4 món, và đây là ô thứ 4 (index 3) -> Hiển thị overlay +N
                      const isLastAndExtra = order.line_items.length > maxVisibleImages && index === 3;
                      
                      return (
                        <div key={item.id} className="relative w-[70px] h-[70px] rounded-lg border border-gray-200 bg-white p-1 flex-shrink-0">
                          <img 
                            src={item.image?.src || '/api/placeholder/100/100'} 
                            alt={item.name} 
                            className="w-full h-full object-contain"
                          />
                          {isLastAndExtra && (
                            <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-lg">+{extraCount}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Tổng kết tiền */}
                  <div className="text-right text-[13px] text-gray-600 space-y-1 mb-4">
                    <p>Tổng đơn hàng: <span className="font-medium text-gray-800 text-[15px] ml-1">{parseInt(order.total).toLocaleString('vi-VN')}₫</span></p>
                    <p>Đã thanh toán: <span className="font-medium text-gray-800 text-[15px] ml-1">{order.status === 'completed' || order.status === 'processing' ? parseInt(order.total).toLocaleString('vi-VN') : '0'}₫</span></p>
                  </div>

                  {/* Ô nhập thông tin hỗ trợ */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Gửi thông tin cần hỗ trợ..." 
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-[13px] text-gray-800 focus:outline-none focus:border-gray-400 pr-10 placeholder-gray-400 shadow-inner shadow-gray-50/50"
                    />
                    <button className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600 flex items-center justify-center">
                      <Send size={16} strokeWidth={2.5} className="rotate-45 relative right-1 bottom-0.5" />
                    </button>
                  </div>
                </div>

                {/* Footer Buttons (3 Tab) */}
                <div className="grid grid-cols-3 border-t border-gray-100 bg-gray-50/30">
                  <button className="flex flex-col items-center justify-center py-2.5 border-r border-gray-100 cursor-not-allowed group">
                    <span className="font-bold text-[13px] text-gray-400">Yêu cầu đổi trả</span>
                    <span className="text-[10px] text-gray-400">(Hết thời gian đổi trả)</span>
                  </button>
                  <button className="flex items-center justify-center py-2.5 border-r border-gray-100 hover:bg-gray-100 transition-colors">
                    <span className="font-bold text-[13px] text-gray-700">Liên hệ</span>
                  </button>
                  <button className="flex items-center justify-center py-2.5 hover:bg-green-50 transition-colors">
                    <span className="font-bold text-[13px] text-[#008b4b]">Mua lại</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}