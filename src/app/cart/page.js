"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Store, ShoppingCart, 
  X, Trash2, Check, Landmark, Wallet, CheckCircle2, 
  Loader2, MapPin, AlertCircle, QrCode, RefreshCw, Home
} from 'lucide-react';

// ⚠️ KHI CHẠY TRÊN VS CODE: Hãy BỎ COMMENT 4 dòng dưới đây và XÓA phần MOCK COMPONENT đi nhé!
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";



// ID cửa hàng để đối chiếu kho
const STORE_THD_ID = 's1'; 
const STORE_QL1K_ID = 's2'; 

const mockStores = [
  { id: STORE_THD_ID, name: 'Siêu thị Lan Hảo - 27 Trần Hưng Đạo', address: '27 Trần Hưng Đạo, Đông Hòa, Dĩ An, Bình Dương' },
  { id: STORE_QL1K_ID, name: 'Siêu thị Lan Hảo - 144 Quốc Lộ 1K', address: '144 Quốc Lộ 1K, Linh Xuân, Thủ Đức' },
];

export default function CartPage() {
  const { 
    cart: cartItems, user, profile, addToCart, removeFromCart, 
    clearCart, isLoaded, setShowAddressModal, addresses, selectedAddressId
  } = useCart();

  // --- STATE QUẢN LÝ ---
  const [deliveryMethod, setDeliveryMethod] = useState('home'); 
  const [selectedStoreId, setSelectedStoreId] = useState(STORE_THD_ID);
  const [paymentMethod, setPaymentMethod] = useState('cash'); 
  const [orderStep, setOrderStep] = useState('cart'); 
  const [orderData, setOrderData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollingStatus, setPollingStatus] = useState(false);

  // --- STATE TỒN KHO 8000 SKU ---
  const [branchInventoryMap, setBranchInventoryMap] = useState({});
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || null;
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const pollingTimerRef = useRef(null);

  // --- 1. TẢI BẢNG TỒN KHO CHI NHÁNH QUỐC LỘ 1K ---
  useEffect(() => {
    const fetchBranchStock = async () => {
      setIsLoadingStock(true);
      try {
        const res = await fetch('https://bachhoalanhao.com/stock_ql1k.json');
        const rawData = await res.json();
        const inventoryMap = rawData.reduce((acc, item) => {
          const sku = item["Mã hàng"];
          const qtyString = (item["Tồn kho"] || "0").toString().replace(',', '.');
          acc[sku] = parseFloat(qtyString);
          return acc;
        }, {});
        setBranchInventoryMap(inventoryMap);
      } catch (e) {
        console.error("Lỗi tải bảng tồn kho:", e);
      } finally {
        setIsLoadingStock(false);
      }
    };
    if (deliveryMethod === 'store' && selectedStoreId === STORE_QL1K_ID) {
        fetchBranchStock();
    }
  }, [deliveryMethod, selectedStoreId]);

  // --- 2. LOGIC ĐỐI CHIẾU TỒN KHO ---
  const checkAvailability = (item) => {
    if (deliveryMethod === 'home') return true; 
    if (selectedStoreId === STORE_THD_ID) return true; 
    if (selectedStoreId === STORE_QL1K_ID) {
        const availableQty = branchInventoryMap[item.sku] || 0;
        return availableQty >= item.quantity;
    }
    return true;
  };
  const unavailableItems = cartItems.filter(item => !checkAvailability(item));

  // --- 3. LOGIC SEPAY POLLING ---
  useEffect(() => {
    if (orderStep === 'payment' && orderData?.id) {
      setPollingStatus(true);
      pollingTimerRef.current = setInterval(async () => {
        try {
          const wpDomain = 'https://bachhoalanhao.com';
          const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
          const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';
          const response = await fetch(`${wpDomain}/wp-json/wc/v3/orders/${orderData.id}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`);
          const currentOrder = await response.json();
          if (currentOrder.status === 'processing' || currentOrder.status === 'completed') {
            clearInterval(pollingTimerRef.current);
            setPollingStatus(false);
            setOrderStep('success');
          }
        } catch (error) { console.error("Lỗi Polling:", error); }
      }, 3000); 
    }
    return () => { if (pollingTimerRef.current) clearInterval(pollingTimerRef.current); };
  }, [orderStep, orderData]);

  // --- 4. XỬ LÝ ĐẶT HÀNG ---
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (deliveryMethod === 'store' && unavailableItems.length > 0) {
        alert("Một số sản phẩm không đủ hàng tại chi nhánh này.");
        return;
    }
    if (!user) { alert("Vui lòng đăng nhập để đặt hàng"); return; }
    if (deliveryMethod === 'home' && !selectedAddress) { setShowAddressModal(true); return; }
    
    setIsSubmitting(true);
    try {
      const wpDomain = 'https://bachhoalanhao.com';
      const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
      const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';
      const selectedStore = mockStores.find(s => s.id === selectedStoreId);

      const orderPayload = {
        payment_method: paymentMethod === 'transfer' ? 'bacs' : 'cod',
        payment_method_title: paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt',
        status: 'pending',
        billing: { 
          first_name: profile?.fullName || "Khách hàng", 
          address_1: deliveryMethod === 'home' ? selectedAddress?.address : `Nhận tại: ${selectedStore.name}`, 
          phone: user?.phoneNumber?.replace('+84', '0') || "" 
        },
        line_items: cartItems.map(item => ({ product_id: item.id, quantity: item.quantity }))
      };

      const response = await fetch(`${wpDomain}/wp-json/wc/v3/orders?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        const wooOrder = await response.json();
        setOrderData({ id: wooOrder.id, displayId: 'DH' + wooOrder.id, total: totalAmount, paymentMethod });
        clearCart();
        setOrderStep(paymentMethod === 'transfer' ? 'payment' : 'success');
      } else { alert("Lỗi tạo đơn hàng!"); }
    } catch (error) { alert("Lỗi kết nối máy chủ!"); } finally { setIsSubmitting(false); }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-[#f1f1f1]"><Loader2 className="animate-spin text-[#008b4b]" /></div>;

  return (
    <div className="min-h-screen bg-[#f1f1f1] font-sans pb-28 text-gray-800 relative -mt-4">
      <style dangerouslySetInnerHTML={{__html: `aside { display: none !important; }`}} />

      <header className="bg-white sticky top-[60px] md:top-[70px] z-30 shadow-sm border-b p-4 flex items-center">
          <button onClick={() => window.history.back()}><ChevronLeft size={26} /></button>
          <h1 className="font-bold text-lg flex-1 text-center pr-8 uppercase">
             {orderStep === 'payment' ? 'Quét mã thanh toán' : 'Xác nhận đơn hàng'}
          </h1>
      </header>

      {orderStep === 'cart' ? (
        <main className="max-w-3xl mx-auto px-4 mt-4 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4 relative">
              <button onClick={() => setDeliveryMethod('home')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${deliveryMethod === 'home' ? 'bg-white text-[#008b4b] shadow-sm' : 'text-gray-500'}`}>Giao hàng tận nhà</button>
              <div className="flex-1 relative">
                <button onClick={() => setDeliveryMethod('store')} className={`w-full py-2 text-sm font-bold rounded-lg transition-all ${deliveryMethod === 'store' ? 'bg-white text-[#008b4b] shadow-sm' : 'text-gray-500'}`}>Nhận tại cửa hàng</button>
                <div className="absolute -top-3 -right-1 bg-[#eafff3] text-[#008b4b] text-[8px] font-bold px-1.5 py-0.5 rounded border border-[#b2efcd] shadow-sm">Không phí SHIP</div>
              </div>
            </div>
            {deliveryMethod === 'home' ? (
              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/50 cursor-pointer" onClick={() => setShowAddressModal(true)}>
                <div className="flex justify-between items-center">
                  <div className="flex-1"><p className="text-[14px] font-bold text-[#008b4b]">Giao đến: {profile?.displayName || "Khách hàng"}</p><p className="text-[13px] text-gray-600 mt-1 line-clamp-1">{selectedAddress ? selectedAddress.address : "Bấm để chọn địa chỉ nhận hàng"}</p></div>
                  <ChevronRight size={18} className="text-[#008b4b]" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                  {mockStores.map(store => (
                    <div key={store.id} onClick={() => setSelectedStoreId(store.id)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedStoreId === store.id ? 'border-[#008b4b] bg-green-50/30' : 'border-gray-100'}`}>
                      <div className="flex justify-between items-center">
                        <div><p className="text-sm font-bold">{store.name}</p><p className="text-[11px] text-gray-500">{store.address}</p></div>
                        {selectedStoreId === store.id && <CheckCircle2 size={18} className="text-[#008b4b]" />}
                      </div>
                      {store.id === STORE_QL1K_ID && isLoadingStock && <p className="text-[10px] text-orange-500 mt-1 animate-pulse italic font-bold">Đang đối chiếu 8000 SKU tồn kho...</p>}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-sm mb-3">Sản phẩm đã chọn</h3>
            <div className="divide-y divide-gray-50">
              {cartItems.map(item => {
                const isAvailable = checkAvailability(item);
                return (
                  <div key={item.id} className="py-4">
                    <div className="flex">
                      <img src={item.images[0]?.src} className="w-16 h-16 object-contain border rounded p-1" />
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium leading-tight">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase">SKU: {item.sku}</p>
                        <p className="text-red-600 font-bold mt-1 text-sm">{item.price.toLocaleString()}₫</p>
                        {!isAvailable && <div className="mt-2 bg-red-50 text-red-600 p-2 rounded-lg border border-red-100 flex items-start"><AlertCircle size={14} className="mr-1.5 mt-0.5 flex-shrink-0" /><p className="text-[11px] font-bold">Hết hàng tại chi nhánh này.</p></div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-sm mb-4 flex items-center"><Wallet size={18} className="mr-2 text-gray-400" /> Hình thức thanh toán</h3>
            <div className="space-y-3">
              <div onClick={() => setPaymentMethod('cash')} className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${paymentMethod === 'cash' ? 'border-[#008b4b] bg-green-50/30' : 'border-gray-100'}`}>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3 text-orange-600"><Wallet size={20} /></div>
                  <div><p className="font-bold text-sm">Tiền mặt (COD)</p><p className="text-xs text-gray-500">Trả tiền khi nhận hàng</p></div>
                </div>
                {paymentMethod === 'cash' && <CheckCircle2 size={22} className="text-[#008b4b] fill-white" />}
              </div>
              <div onClick={() => setPaymentMethod('transfer')} className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${paymentMethod === 'transfer' ? 'border-[#008b4b] bg-green-50/30' : 'border-gray-100'}`}>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-blue-600"><Landmark size={20} /></div>
                  <div><p className="font-bold text-sm">Chuyển khoản QR</p><p className="text-xs text-gray-500">Xác nhận tự động (SePay)</p></div>
                </div>
                {paymentMethod === 'transfer' && <CheckCircle2 size={22} className="text-[#008b4b] fill-white" />}
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t z-40 shadow-lg">
            <div className="max-w-3xl mx-auto flex justify-between items-center">
              <div className="flex flex-col"><p className="text-xs text-gray-400 uppercase font-medium">Tổng thanh toán</p><p className="text-xl font-bold text-red-600">{totalAmount.toLocaleString()}₫</p></div>
              <button onClick={handleCheckout} disabled={isSubmitting || (deliveryMethod === 'store' && unavailableItems.length > 0)} className={`px-10 py-3.5 rounded-xl font-bold uppercase transition-all shadow-md flex items-center ${ (deliveryMethod === 'store' && unavailableItems.length > 0) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-yellow-400 text-green-900 active:scale-95' }`}>{isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'ĐẶT HÀNG'}</button>
            </div>
          </div>
        </main>
      ) : orderStep === 'payment' ? (
        /* 💳 MÀN HÌNH QUÉT MÃ QR (ĐÃ CẬP NHẬT THEO YÊU CẦU) */
        <main className="max-w-3xl mx-auto px-4 mt-6 flex flex-col items-center">
            <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm text-center border-t-8 border-[#008b4b]">
                <div className="flex items-center justify-center mb-4 space-x-2 text-[#008b4b]"><QrCode size={24} /><h2 className="text-lg font-bold uppercase">Thanh toán chuyển khoản</h2></div>
                <div className="relative bg-white p-4 rounded-2xl border-2 border-dashed border-gray-200 mb-6">
                    <img 
                        src={`https://img.vietqr.io/image/vietinbank-13572468-compact2.jpg?amount=${orderData?.total}&addInfo=SEVQR thanh toan ${orderData?.displayId}&accountName=BACH%20HOA%20LAN%20HAO`} 
                        alt="Mã QR VietinBank" className="w-full aspect-square object-contain" 
                    />
                    {pollingStatus && <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded-full shadow-sm flex items-center space-x-1 border border-green-100"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span><span className="text-[10px] font-bold text-green-600 uppercase">Chờ tiền vào...</span></div>}
                </div>
                <div className="space-y-3 text-sm text-gray-800 mb-6">
                    <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Số tài khoản:</span><span className="font-bold">13572468</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Chủ tài khoản:</span><span className="font-bold">BACH HOA LAN HAO</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Số tiền:</span><span className="font-bold text-red-600 text-lg">{orderData?.total.toLocaleString()}₫</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Nội dung:</span><span className="font-bold text-[#008b4b] bg-green-50 px-2 rounded uppercase tracking-wider">SEVQR thanh toan {orderData?.displayId}</span></div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl text-left flex items-start border border-yellow-100">
                    <AlertCircle size={18} className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-yellow-800 leading-relaxed font-medium font-bold italic">Hệ thống sẽ TỰ ĐỘNG XÁC NHẬN đơn ngay khi nhận được tiền. Vui lòng không đóng trang này.</p>
                </div>
            </div>
            <button onClick={() => setOrderStep('cart')} className="mt-8 text-gray-500 font-bold text-sm flex items-center hover:text-red-500 transition-colors"><ChevronLeft size={16} /> QUAY LẠI CHỌN PHƯƠNG THỨC KHÁC</button>
        </main>
      ) : (
        <div className="p-10 text-center bg-white min-h-[60vh] flex flex-col items-center justify-center">
             <CheckCircle2 size={72} className="text-[#008b4b] mb-4" /><h2 className="text-2xl font-bold uppercase text-[#008b4b]">Đặt hàng thành công</h2><p className="mt-3 text-gray-500">Cảm ơn {profile?.displayName || "bạn"} đã mua sắm tại Lan Hảo.</p>
             <div className="mt-6 w-full max-w-sm bg-gray-50 rounded-xl p-6 border space-y-3 text-sm">
                <div className="flex justify-between"><span>Mã đơn hàng:</span><span className="font-bold">#{orderData?.id}</span></div>
                <div className="flex justify-between border-t pt-3"><span>Thanh toán:</span><span className="font-bold">{orderData?.paymentMethod === 'transfer' ? 'Chuyển khoản QR' : 'Tiền mặt (COD)'}</span></div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold"><span>Tổng cộng:</span><span className="text-red-600">{orderData?.total.toLocaleString()}₫</span></div>
             </div>
             <div className="flex flex-col gap-3 w-full max-w-sm mt-10"><Link href="/orders" className="bg-white border-2 border-[#008b4b] text-[#008b4b] py-4 rounded-xl font-bold uppercase shadow-sm">Xem lịch sử đơn hàng</Link><Link href="/" className="bg-[#008b4b] text-white py-4 rounded-xl font-bold uppercase shadow-lg">Tiếp tục mua sắm</Link></div>
        </div>
      )}
    </div>
  );
}