"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, ChevronRight, Store, ShoppingCart, 
  X, Trash2, Check, Landmark, Wallet, CheckCircle2, 
  Download, Home, HelpCircle, Loader2 
} from 'lucide-react';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [deliveryMethod, setDeliveryMethod] = useState('home');
  const [isLoaded, setIsLoaded] = useState(false);

  // State cho Hình thức thanh toán
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);

  // State cho Popup Xóa
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [dontAskChecked, setDontAskChecked] = useState(false);

  // State cho luồng Đặt hàng thành công
  const [orderStep, setOrderStep] = useState('cart'); // 'cart' | 'success'
  const [orderData, setOrderData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending' | 'success'
  const [isSubmitting, setIsSubmitting] = useState(false); // Trạng thái đang đẩy đơn lên máy chủ

  // 1. Lấy dữ liệu khi vào trang
  useEffect(() => {
    const savedCart = localStorage.getItem('lanHaoCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Lỗi đọc dữ liệu:", error);
      }
    }
    
    const savedPayment = localStorage.getItem('lanHaoPayment');
    if (savedPayment) {
      setPaymentMethod(savedPayment);
    }

    // Kiểm tra xem có đơn hàng nào vừa đặt xong không
    const savedOrder = sessionStorage.getItem('lanHaoLatestOrder');
    if (savedOrder) {
      setOrderData(JSON.parse(savedOrder));
      setOrderStep('success');
    }

    setIsLoaded(true);
  }, []);

  // 2. Hàm cập nhật Giỏ hàng
  const updateCart = (newCart) => {
    setCartItems(newCart);
    localStorage.setItem('lanHaoCart', JSON.stringify(newCart));
  };

  // --- CÁC HÀM XỬ LÝ SỐ LƯỢNG ---
  const handleIncrease = (id) => {
    const newCart = cartItems.map(item => 
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );
    updateCart(newCart);
  };

  const requestRemove = (item) => {
    const skipPopup = localStorage.getItem('skipDeleteConfirm') === 'true';
    if (skipPopup) {
      handleRemove(item.id);
    } else {
      setItemToDelete(item);
      setShowDeletePopup(true);
      setDontAskChecked(false);
    }
  };

  const handleDecrease = (item) => {
    if (item.quantity > 1) {
      const newCart = cartItems.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
      );
      updateCart(newCart);
    } else {
      requestRemove(item);
    }
  };

  const handleRemove = (id) => {
    const newCart = cartItems.filter(item => item.id !== id);
    updateCart(newCart);
  };

  const confirmDelete = () => {
    if (dontAskChecked) {
      localStorage.setItem('skipDeleteConfirm', 'true');
    }
    if (itemToDelete) {
      handleRemove(itemToDelete.id);
    }
    setShowDeletePopup(false);
    setItemToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setItemToDelete(null);
  };

  const changePaymentMethod = (id) => {
    setPaymentMethod(id);
    localStorage.setItem('lanHaoPayment', id);
    setShowPaymentPopup(false);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- HÀM XỬ LÝ ĐẶT HÀNG (ĐÃ CẬP NHẬT ĐẨY API THẬT) ---
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const wpDomain = 'https://bachhoalanhao.com';
      const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
      const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';

      // 1. Chuẩn bị danh sách sản phẩm theo định dạng của WooCommerce
      const lineItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));

      // 2. Map phương thức thanh toán sang định dạng của Woo
      let wooPaymentMethod = 'cod';
      let wooPaymentTitle = 'Tiền mặt khi nhận hàng';
      if (paymentMethod === 'transfer') {
        wooPaymentMethod = 'bacs'; // Mã chuẩn của Chuyển khoản ngân hàng trong Woo
        wooPaymentTitle = 'Chuyển khoản ngân hàng';
      } else if (paymentMethod === 'momo') {
        wooPaymentMethod = 'momo';
        wooPaymentTitle = 'MoMo';
      }

      // 3. Payload chuẩn bị gửi lên
      // Thông tin khách hàng ở đây đang được giả lập, thực tế sẽ lấy từ Form nhập liệu của khách
      const orderPayload = {
        payment_method: wooPaymentMethod,
        payment_method_title: wooPaymentTitle,
        set_paid: false,
        billing: {
          first_name: "Anh Hảo",
          address_1: "13/2 QL1K, Kp Tân Hòa, Phường Đông Hòa",
          city: "Dĩ An",
          state: "Bình Dương",
          country: "VN",
          phone: "0937298982"
        },
        shipping: {
          first_name: "Anh Hảo",
          address_1: "13/2 QL1K, Kp Tân Hòa, Phường Đông Hòa",
          city: "Dĩ An",
          state: "Bình Dương",
          country: "VN"
        },
        line_items: lineItems
      };

      // 4. Gọi API POST để tạo đơn hàng
      const response = await fetch(`${wpDomain}/wp-json/wc/v3/orders?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        throw new Error('Lỗi khi tạo đơn hàng trên máy chủ');
      }

      const wooOrder = await response.json();

      // 5. Lưu thông tin đơn hàng vừa tạo thành công
      const newOrder = {
        id: wooOrder.id, // ID thật dạng số (VD: 6892) dùng để Polling API
        displayId: 'DH' + wooOrder.id, // ID hiển thị và tạo mã QR (VD: DH6892) để SePay dễ nhận diện
        items: cartItems,
        total: totalAmount,
        paymentMethod: paymentMethod,
        deliveryMethod: deliveryMethod,
        date: new Date().toLocaleDateString('vi-VN')
      };

      setOrderData(newOrder);
      sessionStorage.setItem('lanHaoLatestOrder', JSON.stringify(newOrder));
      
      // Xóa giỏ hàng
      setCartItems([]);
      localStorage.removeItem('lanHaoCart');
      
      // Chuyển sang màn hình thành công
      setOrderStep('success');
      setPaymentStatus('pending'); // Reset trạng thái thanh toán

    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      alert("Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const PAYMENT_OPTIONS = [
    { id: 'transfer', name: 'Chuyển khoản', icon: <Landmark size={22} className="text-gray-600" /> },
    { 
      id: 'momo', 
      name: 'MoMo', 
      icon: (
        <div className="w-5 h-5 rounded-md bg-[#ae2070] text-white flex flex-col items-center justify-center leading-[8px] text-[7px] font-bold">
          <span>mo</span><span>mo</span>
        </div>
      ) 
    },
    { id: 'cash', name: 'Tiền mặt khi nhận hàng', icon: <Wallet size={22} className="text-gray-600" /> }
  ];

  const displayPaymentOptions = [
    PAYMENT_OPTIONS.find(opt => opt.id === 'transfer'),
    paymentMethod === 'transfer' ? PAYMENT_OPTIONS.find(opt => opt.id === 'cash') : PAYMENT_OPTIONS.find(opt => opt.id === paymentMethod)
  ];

  // --- LẮNG NGHE THANH TOÁN THỰC TẾ (API POLLING) ---
  useEffect(() => {
    let pollingInterval;

    if (orderStep === 'success' && orderData && (orderData.paymentMethod === 'transfer' || orderData.paymentMethod === 'momo') && paymentStatus === 'pending') {
      
      // Hàm kiểm tra trạng thái thanh toán từ Backend WordPress
      const checkPaymentStatus = async () => {
        try {
          const wpDomain = 'https://bachhoalanhao.com';
          const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
          const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';
          
          const response = await fetch(`${wpDomain}/wp-json/wc/v3/orders/${orderData.id}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`);
          
          if (response.ok) {
            const orderInfo = await response.json();
            // Khi SePay nhận tiền, nó sẽ báo Webhook sang Woo và đổi trạng thái thành 'processing' hoặc 'completed'
            if (orderInfo.status === 'processing' || orderInfo.status === 'completed') {
              setPaymentStatus('success');
              clearInterval(pollingInterval); // Ngừng kiểm tra khi đã thành công
            }
          } else {
            console.log(`[API Polling] Đang chờ thanh toán cho đơn hàng ${orderData.displayId}...`);
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra thanh toán:", error);
        }
      };

      // Thiết lập gọi API kiểm tra mỗi 3 giây (3000ms)
      pollingInterval = setInterval(checkPaymentStatus, 3000);
    }

    // Dọn dẹp interval khi component bị hủy hoặc paymentStatus thay đổi
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [orderStep, orderData, paymentStatus]);


  // ==========================================
  // GIAO DIỆN 1: MÀN HÌNH ĐẶT HÀNG THÀNH CÔNG
  // ==========================================
  if (orderStep === 'success' && orderData) {
    // Sửa lại thành VietinBank, đúng số tài khoản và bắt buộc thêm chữ SEVQR vào addInfo
    const qrUrl = `https://img.vietqr.io/image/vietinbank-13571122-compact2.png?amount=${orderData.total}&addInfo=SEVQR%20${orderData.displayId}&accountName=BACH%20HOA%20LAN%20HAO`;

    return (
      <div className="min-h-screen bg-[#f1f1f1] font-sans pb-28 relative flex flex-col items-center">
        
        {/* Phần thông báo thành công */}
        <div className="w-full bg-[#f1f1f1] pt-8 pb-4 flex flex-col items-center px-4">
          <CheckCircle2 size={56} className="text-[#008b4b] fill-green-100 mb-2" strokeWidth={1.5} />
          <h1 className="text-xl font-bold text-[#008b4b] mb-1 uppercase tracking-wide">ĐẶT HÀNG THÀNH CÔNG</h1>
          <p className="text-sm text-gray-600 text-center">
            Anh có thể <span className="font-bold text-gray-800">thanh toán trước</span> hoặc <span className="font-bold text-gray-800">trả tiền khi nhận hàng!</span>
          </p>
        </div>

        <div className="w-full max-w-2xl px-4 space-y-4">
          
          {/* Hộp Thông tin đơn hàng */}
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-gray-600">Mã đơn hàng:</span>
              <span className="font-bold text-gray-800">{orderData.displayId}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-gray-600">Tổng đơn hàng:</span>
              <span className="font-bold text-gray-800 text-[16px]">{orderData.total.toLocaleString('vi-VN')}₫</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-600">Hẹn giao:</span>
              <span className="font-bold text-gray-800 text-[15px]">
                {orderData.deliveryMethod === 'home' ? 'Nhận: Ngày mai, từ 8:00 sáng' : 'Đến lấy tại siêu thị ngay hôm nay'}
              </span>
            </div>
          </div>

          {/* Hộp Hướng dẫn */}
          {orderData.deliveryMethod === 'store' && (
            <div className="bg-green-50 rounded-xl border border-green-100 p-4 flex items-start space-x-3">
              <Store className="text-[#008b4b] mt-1" size={24} />
              <div>
                <p className="text-sm text-gray-700">Hướng dẫn nhận hàng tại cửa hàng</p>
                <p className="font-bold text-[#008b4b] text-sm mt-0.5 cursor-pointer hover:underline">Xem quy trình để nhận hàng nhanh nhất.</p>
              </div>
            </div>
          )}

          {/* HỘP MÃ QR CHUYỂN KHOẢN (Chỉ hiện nếu chọn chuyển khoản) */}
          {(orderData.paymentMethod === 'transfer' || orderData.paymentMethod === 'momo') && (
            <div className="bg-white rounded-xl border border-[#008b4b] shadow-sm overflow-hidden">
              <div className="flex items-center p-3 border-b">
                <Landmark size={20} className="text-gray-600 mr-2" />
                <span className="text-gray-800 font-medium">
                  {orderData.paymentMethod === 'transfer' ? 'Chuyển khoản ngân hàng' : 'Thanh toán qua MoMo'}
                </span>
              </div>
              
              <div className="p-6 flex flex-col items-center">
                {paymentStatus === 'success' ? (
                  // Giao diện Đã thanh toán thành công
                  <div className="py-8 flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Check size={32} className="text-[#008b4b]" strokeWidth={3} />
                    </div>
                    <h3 className="text-lg font-bold text-[#008b4b] mb-1">Đã nhận được thanh toán!</h3>
                    <p className="text-sm text-gray-500">Đơn hàng của bạn đang được chuẩn bị.</p>
                  </div>
                ) : (
                  // Giao diện Chờ thanh toán (Mã QR)
                  <>
                    <div className="border border-gray-200 rounded-2xl p-2 mb-3 shadow-sm bg-white">
                      <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain rounded-xl mix-blend-multiply" />
                    </div>
                    <p className="text-orange-500 font-bold text-[11px] mb-1 uppercase">QR THANH TOÁN MỘT LẦN</p>
                    <p className="text-[#008b4b] font-bold text-2xl mb-4">{orderData.total.toLocaleString('vi-VN')}₫</p>
                    
                    <button className="flex items-center text-blue-500 text-sm font-medium hover:underline mb-6">
                      Tải <Download size={14} className="mx-1" /> và quét mã QR <HelpCircle size={14} className="ml-1 text-gray-400" />
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center">
                      <span className="relative flex h-3 w-3 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#008b4b]"></span>
                      </span>
                      Hệ thống đang chờ bạn thanh toán...
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="pt-6 pb-10 text-center">
            <button 
              onClick={() => { sessionStorage.removeItem('lanHaoLatestOrder'); setOrderStep('cart'); }} 
              className="text-gray-400 text-sm hover:underline"
            >
              Hủy đơn hàng
            </button>
          </div>
        </div>

        {/* Footer Fixed cho màn hình Success */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#f1f1f1] border-t p-4 z-40 flex items-center justify-center gap-3">
          <Link href="/" className="bg-white border rounded-lg px-4 py-3 flex flex-col items-center justify-center text-[#008b4b] shadow-sm hover:bg-gray-50 min-w-[80px]">
            <Home size={20} />
            <span className="text-[10px] font-bold mt-1">Trang chủ</span>
          </Link>
          <button className="flex-1 bg-[#008b4b] text-white font-bold text-[15px] py-3.5 rounded-lg shadow-sm hover:bg-[#00703c] transition-colors flex items-center justify-center">
            Xem chi tiết đơn hàng
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN 2: MÀN HÌNH GIỎ HÀNG (MẶC ĐỊNH)
  // ==========================================
  if (!isLoaded) return <div className="min-h-screen bg-[#f1f1f1]"></div>;

  return (
    <div className="min-h-screen bg-[#f1f1f1] font-sans pb-28 relative">
      <header className="bg-white text-gray-800 sticky top-0 z-40 shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-gray-600 hover:text-[#008b4b] p-1">
            <ChevronLeft size={26} />
          </Link>
          <h1 className="font-bold text-xl flex-1 text-center pr-8">Giỏ hàng</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-4 space-y-4">
        {cartItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4 relative">
              <button
                onClick={() => setDeliveryMethod('home')}
                className={`flex-1 py-2 text-sm sm:text-base font-bold rounded-lg transition-all ${
                  deliveryMethod === 'home' ? 'bg-white text-[#008b4b] shadow-sm' : 'text-gray-500'
                }`}
              >
                Giao hàng tận nhà
              </button>
              <button
                onClick={() => setDeliveryMethod('store')}
                className={`flex-1 py-2 text-sm sm:text-base font-bold rounded-lg transition-all ${
                  deliveryMethod === 'store' ? 'bg-white text-[#008b4b] shadow-sm' : 'text-gray-500'
                }`}
              >
                Nhận tại cửa hàng
              </button>
              
              {deliveryMethod === 'home' && (
                <span className="absolute -top-2 right-4 text-[10px] text-[#008b4b] font-bold bg-green-100 px-1.5 py-0.5 rounded shadow-sm border border-green-200">
                  Không phí SHIP
                </span>
              )}
            </div>

            {deliveryMethod === 'home' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:border-[#008b4b] cursor-pointer transition-colors group">
                  <div className="pr-2">
                    <p className="text-sm text-gray-800 leading-relaxed">
                      <span className="font-bold">Địa chỉ:</span> 13/2 QL1K, Kp Tân Hòa, Phường Đông Hòa, Thành phố Dĩ An
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Anh Hảo, 0937298982</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-[#008b4b] flex-shrink-0" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-[#008b4b] bg-green-50 rounded-lg cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <Store className="text-[#008b4b] mt-0.5" size={24} />
                    <div>
                      <p className="font-bold text-[#008b4b] text-base">Chọn siêu thị Bách Hóa Lan Hảo</p>
                      <p className="text-xs text-gray-600 mt-1">Miễn phí soạn hàng, đến lấy ngay không cần chờ đợi</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-[#008b4b]" />
                </div>
              </div>
            )}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm mt-10">
            <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-6">Giỏ hàng của bạn đang trống.</p>
            <Link href="/" className="bg-[#008b4b] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#00703c] transition-colors">
              Tiếp tục mua hàng
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4">
              {cartItems.map((item, index) => (
                <div key={item.id} className="flex py-5 border-b border-gray-100 last:border-0">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <button 
                      onClick={() => requestRemove(item)}
                      className="absolute -top-2 -left-2 bg-blue-100 text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500 hover:text-white transition-colors z-10 border border-white"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                    <img 
                      src={item.images[0]?.src || '/api/placeholder/100/100'} 
                      alt={item.name} 
                      className="w-full h-full object-contain rounded-md border p-1 bg-white" 
                    />
                  </div>
                  
                  <div className="ml-3 flex-1 flex flex-col pr-2">
                    <h3 className="text-[15px] text-gray-800 leading-snug line-clamp-3">
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end justify-start min-w-[110px]">
                    <div className="text-gray-800 font-medium text-[15px]">
                      {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                    </div>
                    
                    {item.on_sale && item.regular_price > item.price && (
                      <div className="text-xs text-gray-400 line-through mb-2 mt-0.5">
                        {(item.regular_price * item.quantity).toLocaleString('vi-VN')}₫
                      </div>
                    )}
                    
                    <div className={`flex items-center border rounded-lg bg-gray-50 mt-auto ${!item.on_sale && 'mt-3'}`}>
                      <button 
                        onClick={() => handleDecrease(item)}
                        className="w-8 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-l-lg transition-colors font-medium text-lg"
                      >
                        -
                      </button>
                      <span className="w-8 h-7 flex items-center justify-center text-sm font-medium bg-white border-x">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => handleIncrease(item.id)}
                        className="w-8 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-r-lg transition-colors font-medium text-lg"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-[11px] text-gray-400 mt-2">
                      Giá: {item.price.toLocaleString('vi-VN')}₫/SP
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="mt-4 pt-4 border-t flex justify-between items-end">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Tạm tính ({cartItems.reduce((a, b) => a + b.quantity, 0)} sản phẩm)
                  </p>
                  <p className="text-gray-800 font-bold">Tổng tiền:</p>
                </div>
                <span className="text-xl font-bold text-red-600">
                  {totalAmount.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>
          </div>
        )}

        {cartItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="flex justify-between items-center p-4 pb-3">
              <h3 className="text-gray-800 font-medium text-[16px]">Hình thức thanh toán</h3>
              <button 
                onClick={() => setShowPaymentPopup(true)} 
                className="text-blue-500 text-sm font-medium flex items-center hover:underline"
              >
                Đổi <ChevronRight size={16} className="ml-0.5" />
              </button>
            </div>
            
            <div className="px-4 pb-4 space-y-3">
              {displayPaymentOptions.map((option) => {
                const isSelected = paymentMethod === option.id;
                return (
                  <div
                    key={`quick-${option.id}`}
                    onClick={() => {
                      setPaymentMethod(option.id);
                      localStorage.setItem('lanHaoPayment', option.id);
                    }}
                    className={`flex items-center p-3.5 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'border-[#008b4b] bg-[#f0f9f4]' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                      isSelected ? 'border-[#008b4b]' : 'border-gray-300'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#008b4b]"></div>}
                    </div>
                    <div className="mr-3">{option.icon}</div>
                    <span className={`text-[15px] flex-1 ${isSelected ? 'text-[#008b4b]' : 'text-gray-700'}`}>
                      {option.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Thanh đặt hàng cố định */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t p-4 z-40">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="hidden sm:flex flex-col justify-center flex-1">
              <span className="text-sm text-gray-500">Tổng thanh toán:</span>
              <span className="text-xl font-bold text-red-600">{totalAmount.toLocaleString('vi-VN')}₫</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={isSubmitting}
              className={`w-full sm:w-auto flex-1 font-bold text-lg py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center ${
                isSubmitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-yellow-400 text-green-900 hover:bg-yellow-300'
              }`}
            >
              {isSubmitting ? (
                <><Loader2 size={20} className="animate-spin mr-2" /> ĐANG XỬ LÝ...</>
              ) : (
                'ĐẶT HÀNG'
              )}
            </button>
          </div>
        </div>
      )}

      {/* POPUP XÁC NHẬN XÓA SẢN PHẨM */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 flex flex-col items-center shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="mb-4">
              <Trash2 size={44} strokeWidth={1.5} className="text-[#008b4b]" />
            </div>
            
            <p className="text-gray-800 text-[17px] mb-6 text-center leading-relaxed">
              Bạn có muốn xóa sản phẩm<br/>
              <span className="font-bold text-sm text-gray-600 line-clamp-2 mt-1">
                {itemToDelete?.name}
              </span>
            </p>
            
            <div 
              className="w-full flex items-center justify-start mb-6 cursor-pointer select-none"
              onClick={() => setDontAskChecked(!dontAskChecked)}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center border mr-3 transition-colors ${
                dontAskChecked ? 'bg-[#008b4b] border-[#008b4b]' : 'border-gray-400 bg-white'
              }`}>
                {dontAskChecked && <Check size={14} className="text-white" strokeWidth={3} />}
              </div>
              <span className="text-gray-600 text-[15px]">Không hỏi lại cho lần sau</span>
            </div>

            <div className="flex w-full space-x-3">
              <button 
                onClick={cancelDelete}
                className="flex-1 py-2.5 rounded-lg font-medium text-[15px] bg-[#f2f4f5] text-[#4a4a4a] hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-lg font-medium text-[15px] bg-[#008b4b] text-white hover:bg-[#00703c] transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP CHỌN HÌNH THỨC THANH TOÁN */}
      {showPaymentPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl animate-in slide-in-from-bottom-full sm:zoom-in duration-200 pb-6 sm:pb-0">
            <div className="flex items-center justify-between p-4 border-b relative">
              <h2 className="text-[17px] font-bold text-gray-800 w-full text-center">Đổi hình thức thanh toán</h2>
              <button 
                onClick={() => setShowPaymentPopup(false)} 
                className="absolute right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {PAYMENT_OPTIONS.map((option) => {
                const isSelected = paymentMethod === option.id;
                return (
                  <div
                    key={`full-${option.id}`}
                    onClick={() => changePaymentMethod(option.id)}
                    className={`flex items-center p-3.5 border rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'border-[#008b4b] bg-[#f0f9f4]' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                      isSelected ? 'border-[#008b4b]' : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#008b4b]"></div>}
                    </div>
                    
                    <div className="mr-3">{option.icon}</div>
                    <span className={`text-[15px] flex-1 ${isSelected ? 'text-[#008b4b] font-medium' : 'text-gray-700'}`}>
                      {option.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}