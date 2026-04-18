"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Store, ShoppingCart, 
  X, Trash2, Check, Landmark, Wallet, CheckCircle2, 
  Download, Home, HelpCircle, Loader2, MapPin
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc,
  deleteDoc,
  onSnapshot,
  query
} from "firebase/firestore";

// --- INITIALIZE FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ⚠️ KHI CHẠY TRÊN VS CODE: Hãy BỎ COMMENT 2 dòng dưới đây và XÓA phần MOCK COMPONENT đi nhé!
// import Link from 'next/link';
// import { useCart } from '@/context/CartContext';

// --- BẮT ĐẦU MOCK COMPONENT ---
const Link = ({ href, children, className, onClick }) => {
  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (typeof window !== 'undefined' && window.location.protocol === 'blob:' && href?.startsWith('/')) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('mock-navigate', { detail: href }));
    }
  };
  return <a href={href} className={className} onClick={handleClick}>{children}</a>;
};
const useCart = () => null;
// --- KẾT THÚC MOCK COMPONENT ---

export default function CartPage() {
  const [user, setUser] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('home');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [dontAskChecked, setDontAskChecked] = useState(false);

  const [orderStep, setOrderStep] = useState('cart'); 
  const [orderData, setOrderData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- QUẢN LÝ ĐỊA CHỈ (FIRESTORE) ---
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [tempSelectedId, setTempSelectedId] = useState(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  // Gọi kho chứa Context API
  const { cart: cartItems, addToCart, removeFromCart, removeItem, clearCart, isLoaded } = useCart() || {
    cart: [], addToCart: () => {}, removeFromCart: () => {}, removeItem: () => {}, clearCart: () => {}, isLoaded: true
  };

  // 1. Khởi tạo Authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          // Nếu không có token, thử lấy từ localStorage hoặc login ẩn danh cho khách vãng lai
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Lấy dữ liệu địa chỉ từ Firestore khi User đã login
  useEffect(() => {
    if (!user) return;

    setIsLoadingAddresses(true);
    // Path chuẩn: /artifacts/{appId}/users/{userId}/addresses
    const addressCol = collection(db, 'artifacts', appId, 'users', user.uid, 'addresses');
    
    const unsubscribe = onSnapshot(addressCol, 
      (snapshot) => {
        const addrList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAddresses(addrList);
        
        // Nếu chưa chọn địa chỉ nào, mặc định chọn cái đầu tiên
        if (addrList.length > 0 && !selectedAddressId) {
          setSelectedAddressId(addrList[0].id);
        }
        setIsLoadingAddresses(false);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setIsLoadingAddresses(false);
      }
    );

    return () => unsubscribe();
  }, [user, appId]);

  useEffect(() => {
    const savedPayment = localStorage.getItem('lanHaoPayment');
    if (savedPayment) setPaymentMethod(savedPayment);

    const savedOrder = sessionStorage.getItem('lanHaoLatestOrder');
    if (savedOrder) {
      setOrderData(JSON.parse(savedOrder));
      setOrderStep('success');
    }
  }, []);

  const openAddressModal = () => {
    setTempSelectedId(selectedAddressId);
    setShowAddressModal(true);
  };

  const confirmAddress = () => {
    setSelectedAddressId(tempSelectedId);
    setShowAddressModal(false);
  };

  // Hàm thêm địa chỉ mới (Dùng để test Firestore)
  const handleAddNewAddress = async () => {
    if (!user) return;
    try {
      const addressCol = collection(db, 'artifacts', appId, 'users', user.uid, 'addresses');
      await addDoc(addressCol, {
        name: "Khách hàng mới",
        phone: user.phoneNumber || "09xxxx",
        address: "Số " + Math.floor(Math.random() * 100) + " Đường QL1K, Dĩ An, Bình Dương",
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      alert("Lỗi khi thêm địa chỉ!");
    }
  };

  // Hàm xóa địa chỉ
  const handleDeleteAddress = async (id) => {
    if (!user || !id) return;
    try {
      const addrDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'addresses', id);
      await deleteDoc(addrDoc);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || null;

  const requestRemove = (item) => {
    const skipPopup = localStorage.getItem('skipDeleteConfirm') === 'true';
    if (skipPopup) {
      removeItem(item.id);
    } else {
      setItemToDelete(item);
      setShowDeletePopup(true);
      setDontAskChecked(false);
    }
  };

  const handleDecreaseQuantity = (item) => {
    if (item.quantity === 1) {
      requestRemove(item);
    } else {
      removeFromCart(item.id);
    }
  };

  const confirmDelete = () => {
    if (dontAskChecked) localStorage.setItem('skipDeleteConfirm', 'true');
    if (itemToDelete) removeItem(itemToDelete.id);
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

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const wpDomain = 'https://bachhoalanhao.com';
      const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
      const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';

      const lineItems = cartItems.map(item => ({ product_id: item.id, quantity: item.quantity }));

      let wooPaymentMethod = 'cod';
      let wooPaymentTitle = 'Tiền mặt khi nhận hàng';
      if (paymentMethod === 'transfer') { wooPaymentMethod = 'bacs'; wooPaymentTitle = 'Chuyển khoản ngân hàng'; } 
      else if (paymentMethod === 'momo') { wooPaymentMethod = 'momo'; wooPaymentTitle = 'MoMo'; }

      const orderPayload = {
        payment_method: wooPaymentMethod,
        payment_method_title: wooPaymentTitle,
        set_paid: false,
        billing: { 
          first_name: selectedAddress?.name || "Khách hàng", 
          address_1: selectedAddress?.address || "Chưa có địa chỉ", 
          city: "Dĩ An", 
          state: "Bình Dương", 
          country: "VN", 
          phone: selectedAddress?.phone || "" 
        },
        shipping: { 
          first_name: selectedAddress?.name || "Khách hàng", 
          address_1: selectedAddress?.address || "Chưa có địa chỉ", 
          city: "Dĩ An", 
          state: "Bình Dương", 
          country: "VN" 
        },
        line_items: lineItems
      };

      const response = await fetch(`${wpDomain}/wp-json/wc/v3/orders?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload)
      });

      if (!response.ok) throw new Error('Lỗi khi tạo đơn hàng trên máy chủ');

      const wooOrder = await response.json();

      const newOrder = {
        id: wooOrder.id, 
        displayId: 'DH' + wooOrder.id, 
        items: cartItems, total: totalAmount, paymentMethod: paymentMethod, deliveryMethod: deliveryMethod, date: new Date().toLocaleDateString('vi-VN')
      };

      setOrderData(newOrder);
      sessionStorage.setItem('lanHaoLatestOrder', JSON.stringify(newOrder));
      
      clearCart(); 
      
      setOrderStep('success');
      setPaymentStatus('pending');

    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      alert("Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const PAYMENT_OPTIONS = [
    { id: 'transfer', name: 'Chuyển khoản', icon: <Landmark size={22} className="text-gray-600" /> },
    { id: 'momo', name: 'MoMo', icon: (<div className="w-5 h-5 rounded-md bg-[#ae2070] text-white flex flex-col items-center justify-center leading-[8px] text-[7px] font-bold"><span>mo</span><span>mo</span></div>) },
    { id: 'cash', name: 'Tiền mặt khi nhận hàng', icon: <Wallet size={22} className="text-gray-600" /> }
  ];

  const displayPaymentOptions = [
    PAYMENT_OPTIONS.find(opt => opt.id === 'transfer'),
    paymentMethod === 'transfer' ? PAYMENT_OPTIONS.find(opt => opt.id === 'cash') : PAYMENT_OPTIONS.find(opt => opt.id === paymentMethod)
  ];

  useEffect(() => {
    let pollingInterval;
    if (orderStep === 'success' && orderData && (orderData.paymentMethod === 'transfer' || orderData.paymentMethod === 'momo') && paymentStatus === 'pending') {
      const checkPaymentStatus = async () => {
        try {
          const wpDomain = 'https://bachhoalanhao.com';
          const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
          const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';
          const response = await fetch(`${wpDomain}/wp-json/wc/v3/orders/${orderData.id}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`);
          if (response.ok) {
            const orderInfo = await response.json();
            if (orderInfo.status === 'processing' || orderInfo.status === 'completed') {
              setPaymentStatus('success');
              clearInterval(pollingInterval);
            }
          }
        } catch (error) {}
      };
      pollingInterval = setInterval(checkPaymentStatus, 3000);
    }
    return () => { if (pollingInterval) clearInterval(pollingInterval); };
  }, [orderStep, orderData, paymentStatus]);


  // ==========================================
  // MÀN HÌNH ĐẶT HÀNG THÀNH CÔNG
  // ==========================================
  if (orderStep === 'success' && orderData) {
    const qrUrl = `https://img.vietqr.io/image/vietinbank-13571122-compact2.png?amount=${orderData.total}&addInfo=SEVQR%20${orderData.displayId}&accountName=BACH%20HOA%20LAN%20HAO`;

    return (
      <div className="min-h-screen bg-[#f1f1f1] font-sans pb-28 relative flex flex-col items-center -mt-4">
        <style dangerouslySetInnerHTML={{__html: `aside { display: none !important; }`}} />
        
        <div className="w-full bg-[#f1f1f1] pt-8 pb-4 flex flex-col items-center px-4">
          <CheckCircle2 size={56} className="text-[#008b4b] fill-green-100 mb-2" strokeWidth={1.5} />
          <h1 className="text-xl font-bold text-[#008b4b] mb-1 uppercase tracking-wide">ĐẶT HÀNG THÀNH CÔNG</h1>
          <p className="text-sm text-gray-600 text-center">Anh có thể <span className="font-bold text-gray-800">thanh toán trước</span> hoặc <span className="font-bold text-gray-800">trả tiền khi nhận hàng!</span></p>
        </div>

        <div className="w-full max-w-2xl px-4 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-3"><span className="text-gray-600">Mã đơn hàng:</span><span className="font-bold text-gray-800">{orderData.displayId}</span></div>
            <div className="flex justify-between items-center border-b pb-3"><span className="text-gray-600">Tổng đơn hàng:</span><span className="font-bold text-gray-800 text-[16px]">{orderData.total.toLocaleString('vi-VN')}₫</span></div>
            <div className="flex justify-between items-center pt-1"><span className="text-gray-600">Hẹn giao:</span><span className="font-bold text-gray-800 text-[15px]">{orderData.deliveryMethod === 'home' ? 'Nhận: Ngày mai, từ 8:00 sáng' : 'Đến lấy tại siêu thị ngay hôm nay'}</span></div>
          </div>

          {(orderData.paymentMethod === 'transfer' || orderData.paymentMethod === 'momo') && (
            <div className="bg-white rounded-xl border border-[#008b4b] shadow-sm overflow-hidden">
              <div className="flex items-center p-3 border-b"><Landmark size={20} className="text-gray-600 mr-2" /><span className="text-gray-800 font-medium">{orderData.paymentMethod === 'transfer' ? 'Chuyển khoản ngân hàng' : 'Thanh toán qua MoMo'}</span></div>
              <div className="p-6 flex flex-col items-center">
                {paymentStatus === 'success' ? (
                  <div className="py-8 flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><Check size={32} className="text-[#008b4b]" strokeWidth={3} /></div>
                    <h3 className="text-lg font-bold text-[#008b4b] mb-1">Đã nhận được thanh toán!</h3>
                    <p className="text-sm text-gray-500">Đơn hàng của bạn đang được chuẩn bị.</p>
                  </div>
                ) : (
                  <>
                    <div className="border border-gray-200 rounded-2xl p-2 mb-3 shadow-sm bg-white"><img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain rounded-xl mix-blend-multiply" /></div>
                    <p className="text-[#008b4b] font-bold text-2xl mb-4">{orderData.total.toLocaleString('vi-VN')}₫</p>
                    <button className="flex items-center text-blue-500 text-sm font-medium hover:underline mb-6">Tải <Download size={14} className="mx-1" /> và quét mã QR</button>
                    <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center"><span className="relative flex h-3 w-3 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-[#008b4b]"></span></span>Hệ thống đang chờ bạn thanh toán...</p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="pt-6 pb-10 text-center">
            <button onClick={() => { sessionStorage.removeItem('lanHaoLatestOrder'); setOrderStep('cart'); }} className="text-gray-400 text-sm hover:underline">Hủy đơn hàng</button>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-[#f1f1f1] border-t p-4 z-40 flex items-center justify-center gap-3">
          <Link href="/" className="bg-white border rounded-lg px-4 py-3 flex flex-col items-center justify-center text-[#008b4b] shadow-sm hover:bg-gray-50 min-w-[80px]"><Home size={20} /><span className="text-[10px] font-bold mt-1">Trang chủ</span></Link>
          <Link href={`/order?id=${orderData.id}`} className="flex-1 bg-[#008b4b] text-white font-bold text-[15px] py-3.5 rounded-lg shadow-sm hover:bg-[#00703c] transition-colors flex items-center justify-center">
            Xem chi tiết đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // MÀN HÌNH GIỎ HÀNG (MẶC ĐỊNH)
  // ==========================================
  if (!isLoaded) return <div className="min-h-screen bg-[#f1f1f1]"></div>;

  return (
    <div className="min-h-screen bg-[#f1f1f1] font-sans pb-28 relative -mt-4">
      <style dangerouslySetInnerHTML={{__html: `aside { display: none !important; }`}} />

      <header className="bg-white text-gray-800 sticky top-[60px] md:top-[70px] z-30 shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="text-gray-600 hover:text-[#008b4b] p-1">
            <ChevronLeft size={26} />
          </button>
          <h1 className="font-bold text-xl flex-1 text-center pr-8">Giỏ hàng</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-4 space-y-4">
        {cartItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4 relative">
              <button onClick={() => setDeliveryMethod('home')} className={`flex-1 py-2 text-sm sm:text-base font-bold rounded-lg transition-all ${deliveryMethod === 'home' ? 'bg-white text-[#008b4b] shadow-sm' : 'text-gray-500'}`}>Giao hàng tận nhà</button>
              <button onClick={() => setDeliveryMethod('store')} className={`flex-1 py-2 text-sm sm:text-base font-bold rounded-lg transition-all ${deliveryMethod === 'store' ? 'bg-white text-[#008b4b] shadow-sm' : 'text-gray-500'}`}>Nhận tại cửa hàng</button>
              {deliveryMethod === 'home' && <span className="absolute -top-2 right-4 text-[10px] text-[#008b4b] font-bold bg-green-100 px-1.5 py-0.5 rounded shadow-sm border border-green-200">Không phí SHIP</span>}
            </div>

            {deliveryMethod === 'home' ? (
              <div className="space-y-3" onClick={openAddressModal}>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-[#008b4b] cursor-pointer transition-colors group bg-white shadow-sm">
                  <div className="pr-2">
                    <p className="text-[15px] text-gray-800 leading-relaxed mb-1"><span className="font-bold text-[#008b4b]">Giao đến: </span> {selectedAddress?.address || (isLoadingAddresses ? 'Đang tải địa chỉ...' : 'Bấm để thêm địa chỉ nhận hàng')}</p>
                    {selectedAddress && (
                       <p className="text-[14px] text-gray-600 font-medium">{selectedAddress.name} - {selectedAddress.phone}</p>
                    )}
                  </div>
                  <ChevronRight size={20} className="text-[#008b4b] flex-shrink-0" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-[#008b4b] bg-green-50 rounded-lg cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <Store className="text-[#008b4b] mt-0.5" size={24} />
                    <div><p className="font-bold text-[#008b4b] text-base">Chọn siêu thị Bách Hóa Lan Hảo</p><p className="text-xs text-gray-600 mt-1">Miễn phí soạn hàng, đến lấy ngay không cần chờ đợi</p></div>
                  </div>
                  <ChevronRight size={20} className="text-[#008b4b]" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ... (Các phần danh sách sản phẩm giữ nguyên như Canvas) */}
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm mt-10">
            <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-6">Giỏ hàng của bạn đang trống.</p>
            <Link href="/" className="bg-[#008b4b] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#00703c] transition-colors">Tiếp tục mua hàng</Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex py-5 border-b border-gray-100 last:border-0">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <button onClick={() => requestRemove(item)} className="absolute -top-2 -left-2 bg-blue-100 text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500 hover:text-white transition-colors z-10 border border-white shadow-sm">
                      <X size={12} strokeWidth={3} />
                    </button>
                    <Link href={`/product?id=${item.id}`} className="block w-full h-full">
                      <img src={item.images[0]?.src || '/api/placeholder/100/100'} alt={item.name} className="w-full h-full object-contain rounded-md border p-1 bg-white" />
                    </Link>
                  </div>
                  <div className="ml-3 flex-1 flex flex-col pr-2">
                    <Link href={`/product?id=${item.id}`}><h3 className="text-[15px] text-gray-800 leading-snug line-clamp-3 hover:text-[#008b4b] transition-colors">{item.name}</h3></Link>
                  </div>
                  <div className="flex flex-col items-end justify-start min-w-[110px]">
                    <div className="text-gray-800 font-medium text-[15px]">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</div>
                    <div className="flex items-center border rounded-lg bg-gray-50 mt-auto">
                      <button onClick={() => handleDecreaseQuantity(item)} className="w-8 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-l-lg transition-colors font-medium text-lg">-</button>
                      <span className="w-8 h-7 flex items-center justify-center text-sm font-medium bg-white border-x">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-8 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-r-lg transition-colors font-medium text-lg">+</button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t flex justify-between items-end">
                <div><p className="text-sm text-gray-500 mb-1">Tạm tính ({cartItems.reduce((a, b) => a + b.quantity, 0)} sản phẩm)</p><p className="text-gray-800 font-bold">Tổng tiền:</p></div>
                <span className="text-xl font-bold text-red-600">{totalAmount.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </div>
        )}

        {cartItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="flex justify-between items-center p-4 pb-3">
              <h3 className="text-gray-800 font-medium text-[16px]">Hình thức thanh toán</h3>
              <button onClick={() => setShowPaymentPopup(true)} className="text-blue-500 text-sm font-medium flex items-center hover:underline">Đổi <ChevronRight size={16} className="ml-0.5" /></button>
            </div>
            <div className="px-4 pb-4 space-y-3">
              {displayPaymentOptions.map((option) => (
                <div key={`quick-${option.id}`} onClick={() => { setPaymentMethod(option.id); localStorage.setItem('lanHaoPayment', option.id); }} className={`flex items-center p-3.5 border rounded-lg cursor-pointer transition-colors ${paymentMethod === option.id ? 'border-[#008b4b] bg-[#f0f9f4]' : 'border-gray-200'}`}>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${paymentMethod === option.id ? 'border-[#008b4b]' : 'border-gray-300'}`}>{paymentMethod === option.id && <div className="w-2.5 h-2.5 rounded-full bg-[#008b4b]"></div>}</div>
                  <div className="mr-3">{option.icon}</div>
                  <span className={`text-[15px] flex-1 ${paymentMethod === option.id ? 'text-[#008b4b]' : 'text-gray-700'}`}>{option.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t p-4 z-40">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="hidden sm:flex flex-col justify-center flex-1"><span className="text-sm text-gray-500">Tổng thanh toán:</span><span className="text-xl font-bold text-red-600">{totalAmount.toLocaleString('vi-VN')}₫</span></div>
            <button onClick={handleCheckout} disabled={isSubmitting} className={`w-full sm:w-auto flex-1 font-bold text-lg py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center ${isSubmitting ? 'bg-gray-300 text-gray-500' : 'bg-yellow-400 text-green-900'}`}>
              {isSubmitting ? <Loader2 size={20} className="animate-spin mr-2" /> : 'ĐẶT HÀNG'}
            </button>
          </div>
        </div>
      )}

      {/* POPUP CHỌN ĐỊA CHỈ NHẬN HÀNG (KẾT NỐI FIRESTORE) */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center sm:p-4">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl flex flex-col animate-in fade-in zoom-in duration-200 relative overflow-hidden">
            <div className="flex items-center justify-center p-4 border-b border-gray-200 relative flex-shrink-0 bg-white z-10">
              <h2 className="text-[17px] font-bold text-gray-800">Thông tin nhận hàng</h2>
              <button onClick={() => setShowAddressModal(false)} className="absolute right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1.5 transition-colors"><X size={20} strokeWidth={2.5} /></button>
            </div>

            <div className="overflow-y-auto p-4 space-y-3 flex-1 bg-gray-50/50">
              {isLoadingAddresses ? (
                <div className="py-10 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="animate-spin mb-2" />
                  <p className="text-sm italic">Đang tải danh sách địa chỉ...</p>
                </div>
              ) : addresses.length > 0 ? (
                addresses.map(addr => {
                  const isSelected = tempSelectedId === addr.id;
                  return (
                    <div key={addr.id} onClick={() => setTempSelectedId(addr.id)} className="bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-[#008b4b] relative shadow-sm">
                      <div className="flex items-start">
                        <div className="pt-1 mr-3 flex-shrink-0">
                           <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#008b4b]' : 'border-gray-300'}`}>{isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#008b4b]"></div>}</div>
                        </div>
                        <div className="flex-1 pr-14">
                          <div className="font-bold text-[15px] text-gray-800 mb-1">{addr.name}, {addr.phone}</div>
                          <div className="text-[14px] text-gray-600 leading-snug">{addr.address}</div>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4">
                         <button className="text-gray-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-gray-500 text-sm">Bạn chưa có địa chỉ nào.</div>
              )}

              <button 
                onClick={handleAddNewAddress}
                className="w-full py-3 mt-2 text-[#008b4b] font-medium text-[15px] flex items-center justify-center hover:bg-green-50 rounded-xl border border-dashed border-[#008b4b]"
              >
                <span className="text-xl mr-2">+</span> Thêm thông tin nhận hàng
              </button>
            </div>

            <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
              <button onClick={confirmAddress} disabled={!tempSelectedId} className="w-full py-3.5 bg-[#7cb53b] text-white font-bold text-[15px] rounded-xl hover:bg-[#6ca52a] disabled:bg-gray-300 uppercase shadow-md">XÁC NHẬN</button>
            </div>
          </div>
        </div>
      )}
      
      {/* ... (Popup xóa sản phẩm & đổi thanh toán giữ nguyên) */}
    </div>
  );
}