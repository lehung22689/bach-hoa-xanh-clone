"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { ChevronLeft, ChevronRight, Send, Loader2, FileText, HelpCircle } from 'lucide-react';

// ⚠️ KHI CHẠY TRÊN VS CODE: Hãy BỎ COMMENT các dòng dưới đây và XÓA phần MOCK COMPONENT đi nhé!
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';


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

// Component định dạng ngày tháng: "20:24, 28/06"
const formatDate = (dateString) => {
  if (!dateString) return '';
  const dateObj = new Date(dateString);
  const time = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  return `${time}, ${date}`;
};

function OrderDetailContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const wpDomain = 'https://bachhoalanhao.com';
        const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
        const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';
        
        const apiUrl = `${wpDomain}/wp-json/wc/v3/orders/${orderId}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else {
          console.error("Không tìm thấy đơn hàng");
        }
      } catch (error) {
        console.error("Lỗi lấy chi tiết đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex flex-col items-center justify-center pb-20">
         <Loader2 size={40} className="animate-spin text-[#008b4b] mb-4" />
         <p className="text-gray-500 font-medium">Đang tải thông tin chi tiết...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex flex-col items-center justify-center p-4 pb-20">
         <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
            <FileText size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy đơn hàng</h2>
            <p className="text-gray-500 text-sm mb-6">Đơn hàng này không tồn tại hoặc đã bị xóa.</p>
            <Link href="/orders" className="inline-block bg-[#008b4b] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#00703c] transition-colors">
              Quay lại danh sách
            </Link>
         </div>
      </div>
    );
  }

  const statusInfo = translateStatus(order.status);
  
  // Tính toán số liệu thanh toán
  const shippingTotal = parseFloat(order.shipping_total || 0);
  const discountTotal = parseFloat(order.discount_total || 0);
  const orderTotal = parseFloat(order.total || 0);
  
  // Tạm tính = Tổng thanh toán - phí ship + tiền giảm
  const subTotal = orderTotal - shippingTotal + discountTotal;
  
  // Đã thanh toán (Mô phỏng logic nếu đã hoàn thành hoặc thanh toán onl)
  const paidAmount = (order.status === 'completed' || order.status === 'processing') ? orderTotal : 0;

  return (
    <div className="min-h-screen bg-[#f1f1f1] font-sans pb-28 relative -mt-4">
      {/* CSS INJECT ĐỂ ẨN SIDEBAR NẾU CÓ BỌC LAYOUT */}
      <style dangerouslySetInnerHTML={{__html: `aside { display: none !important; }`}} />

      {/* Header */}
      <header className="bg-white sticky top-[60px] md:top-[70px] z-30 shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="text-gray-600 hover:text-[#008b4b] p-1 -ml-1">
            <ChevronLeft size={28} />
          </button>
          <h1 className="font-bold text-lg text-gray-800 flex-1 text-center pr-8">
            Đơn hàng #{order.id}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto mt-3 sm:mt-4 space-y-3 sm:space-y-4">
        
        {/* Block 1: Thông tin giao hàng */}
        <div className="bg-white px-4 py-4 shadow-sm border-y sm:border sm:rounded-xl">
          <div className="flex justify-between items-start mb-1 text-[15px]">
            <div className="text-gray-800">
              <span className="font-bold">{order.billing?.first_name || 'Khách hàng'}</span>, {order.billing?.phone || ''}
            </div>
            <div className="text-gray-500 text-sm whitespace-nowrap ml-4">
              Đặt lúc: {formatDate(order.date_created)}
            </div>
          </div>
          <div className="text-[15px] text-gray-600">
            {order.shipping?.address_1 || order.billing?.address_1 || 'Nhận tại cửa hàng'}
          </div>
        </div>

        {/* Block 2: Danh sách sản phẩm */}
        <div className="bg-white shadow-sm border-y sm:border sm:rounded-xl overflow-hidden">
          {/* Trạng thái đơn hàng */}
          <div className="px-4 pt-4 flex justify-end">
            <span className={`font-bold text-[14px] flex items-center ${statusInfo.color}`}>
              {statusInfo.text} <ChevronRight size={16} className="ml-0.5" />
            </span>
          </div>

          {/* Danh sách Item */}
          <div className="px-4 py-2">
            {order.line_items.map((item) => {
              const itemTotal = parseFloat(item.total);
              const itemPrice = itemTotal / item.quantity;

              return (
                <div key={item.id} className="flex py-4 border-b border-gray-100 last:border-0">
                  <div className="w-[72px] h-[72px] flex-shrink-0 border border-gray-200 rounded-lg p-1 mr-3 relative">
                    {/* Badge ví dụ nếu cần */}
                    {item.name.toLowerCase().includes('bia') && (
                       <div className="absolute -top-2 left-0 bg-green-500 text-white text-[8px] font-bold px-1 rounded">MIỄN PHÍ GIAO HÀNG</div>
                    )}
                    <img 
                      src={item.image?.src || '/api/placeholder/100/100'} 
                      alt={item.name} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-[14px] text-gray-800 font-medium leading-snug line-clamp-2 hover:text-[#008b4b] cursor-pointer transition-colors">
                      <Link href={`/product?id=${item.product_id}`}>{item.name}</Link>
                    </h3>
                    <div className="text-[13px] text-gray-500 mt-1">
                      Giá bán: {itemPrice.toLocaleString('vi-VN')}₫
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 w-24">
                    <div className="font-bold text-[15px] text-gray-800">
                      {itemTotal.toLocaleString('vi-VN')}₫
                    </div>
                    <div className="text-[13px] text-gray-500 mt-1">
                      SL: {item.quantity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nút yêu cầu đổi trả */}
          <div className="px-4 pb-4 flex justify-end">
            <button className="flex flex-col items-center justify-center py-2 px-6 bg-gray-50 border border-gray-100 rounded-lg cursor-not-allowed">
              <span className="font-bold text-[13px] text-gray-400">Yêu cầu đổi trả</span>
              <span className="text-[10px] text-gray-400 mt-0.5">(Hết thời gian đổi trả)</span>
            </button>
          </div>
        </div>

        {/* Block 3: Ghi chú & Cần hỗ trợ */}
        <div className="bg-white px-4 py-4 shadow-sm border-y sm:border sm:rounded-xl space-y-3">
          <div>
            <h3 className="font-bold text-[15px] text-gray-800 mb-2">Ghi chú</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-[14px] text-gray-600 border border-gray-100">
              {order.customer_note || '-'}
            </div>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Gửi thông tin cần hỗ trợ..." 
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-gray-400 pr-10 placeholder-gray-400"
            />
            <button className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600 flex items-center justify-center">
              <Send size={18} strokeWidth={2.5} className="rotate-45 relative right-1 bottom-0.5" />
            </button>
          </div>
        </div>

        {/* Block 4: Thông tin thanh toán */}
        <div className="bg-white px-4 py-4 shadow-sm border-y sm:border sm:rounded-xl">
          <h3 className="font-bold text-[15px] text-gray-800 mb-3">Thông tin thanh toán</h3>
          
          <div className="space-y-2 text-[14px] text-gray-600 mb-3">
            <div className="flex justify-between">
              <span>Tiền hàng</span>
              <span className="font-medium text-gray-800">{subTotal.toLocaleString('vi-VN')}₫</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                Phí giao hàng <HelpCircle size={14} className="ml-1 text-gray-400" />
              </span>
              <div className="flex items-center">
                {shippingTotal > 0 ? (
                   <span className="font-medium text-gray-800">{shippingTotal.toLocaleString('vi-VN')}₫</span>
                ) : (
                  <>
                    <span className="line-through text-gray-400 mr-2 text-[13px]">15.000₫</span>
                    <span className="font-bold text-[#008b4b]">Freeship</span>
                  </>
                )}
              </div>
            </div>

            {discountTotal > 0 && (
              <div className="flex justify-between items-center">
                <span>Tiền được giảm</span>
                <span className="font-medium text-gray-800">
                  -{discountTotal.toLocaleString('vi-VN')}₫ <ChevronRight size={14} className="inline text-gray-400" />
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Thanh toán</span>
              <span className="font-medium text-gray-800">{order.payment_method_title || 'Tiền mặt'}</span>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="font-bold text-[15px] text-gray-800">Tổng đơn</span>
              <span className="font-bold text-[16px] text-gray-800">{orderTotal.toLocaleString('vi-VN')}₫</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-[15px] text-gray-800">Đã thanh toán</span>
              <span className="font-bold text-[16px] text-gray-800">{paidAmount.toLocaleString('vi-VN')}₫</span>
            </div>
          </div>
        </div>

      </main>

      {/* Sticky Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex space-x-3">
          <button className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-bold text-[15px] rounded-lg hover:bg-gray-50 transition-colors">
            Liên hệ
          </button>
          <button className="flex-1 py-3 bg-[#008b4b] text-white font-bold text-[15px] rounded-lg hover:bg-[#00703c] transition-colors shadow-sm">
            Mua lại
          </button>
        </div>
      </div>

    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f1f1f1] flex items-center justify-center"><Loader2 className="animate-spin text-[#008b4b]" size={36} /></div>}>
      <OrderDetailContent />
    </Suspense>
  );
}