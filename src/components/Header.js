"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, MapPin, X, Loader2, User, LogOut, 
  Ticket, Sparkles, ShoppingBag, Shield, PhoneCall, 
  Headphones, Store, FileText, ChevronRight 
} from 'lucide-react';

// ⚠️ KHI CHẠY TRÊN VS CODE: Hãy BỎ COMMENT 3 dòng dưới đây và XÓA phần MOCK COMPONENT đi nhé!
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut } from "firebase/auth";



export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();

  // Kết nối với CartContext để quản lý giỏ hàng và trạng thái đăng nhập toàn cục
  const { cart, user, showLoginModal, setShowLoginModal } = useCart() || { 
    cart: [], user: null, showLoginModal: false, setShowLoginModal: () => {} 
  };
  
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Trạng thái local cho Modal Đăng nhập
  const [loginStep, setLoginStep] = useState('phone'); 
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Khởi tạo Auth
  const auth = typeof getAuth === 'function' ? getAuth() : {};

  // --- XỬ LÝ TÌM KIẾM SẢN PHẨM ---
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
        const apiUrl = `${wpDomain}/wp-json/wc/v3/products?search=${encodeURIComponent(searchQuery)}&per_page=5&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (Array.isArray(data)) {
          setSearchResults(data.map(p => ({
            id: p.id, 
            name: p.name, 
            price: parseInt(p.price || 0), 
            images: p.images || []
          })));
        }
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
      } finally {
        setIsSearching(false);
      }
    };
    const tid = setTimeout(fetchDropdownResults, 500);
    return () => clearTimeout(tid);
  }, [searchQuery]);

  // --- XỬ LÝ GỬI MÃ OTP ---
  const handleSendOTP = async () => {
    if (phoneNumber.length < 9) {
        alert("Vui lòng nhập số điện thoại hợp lệ");
        return;
    }
    setIsProcessing(true);
    try {
      if (window.recaptchaVerifier) { 
        try { window.recaptchaVerifier.clear(); } catch(e) {}
      }
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) recaptchaContainer.innerHTML = '';

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 
        size: 'invisible' 
      });
      
      const formattedPhone = phoneNumber.startsWith('0') ? '+84' + phoneNumber.slice(1) : '+' + phoneNumber;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      
      window.confirmationResult = confirmationResult;
      setLoginStep('otp');
    } catch (error) {
      alert("Lỗi gửi SMS: " + error.message);
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch(e) {}
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // --- XỬ LÝ XÁC THỰC MÃ OTP ---
  const handleVerifyOTP = async (code) => {
    setIsProcessing(true);
    try {
      await window.confirmationResult.confirm(code);
      // Đóng modal khi thành công
      setShowLoginModal(false); 
      setPhoneNumber(''); 
      setOtpCode(''); 
      setLoginStep('phone');
    } catch (error) {
      alert("Mã OTP không đúng hoặc đã hết hạn!");
      setOtpCode(''); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try { 
      await signOut(auth); 
    } catch (error) { 
      console.error("Lỗi đăng xuất:", error); 
    }
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
    setLoginStep('phone');
    setOtpCode('');
    if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch(e) {}
        window.recaptchaVerifier = null;
    }
  };

  return (
    <>
      <header className="bg-[#008b4b] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 font-bold text-2xl tracking-tighter cursor-pointer">
              <div className="bg-yellow-400 text-green-800 p-1 rounded-md">BÁCH HÓA</div>
              <span className="hidden sm:inline">LAN HẢO</span>
            </Link>

            {/* Địa chỉ giao hàng */}
            <div className="hidden lg:flex items-center space-x-1 bg-[#00703c] px-3 py-2 rounded-lg text-sm ml-4 cursor-pointer hover:bg-[#006030] transition-colors">
              <MapPin size={16} />
              <span>Giao tới: <strong className="text-yellow-300">Dĩ An, Bình Dương</strong></span>
            </div>

            {/* Ô tìm kiếm */}
            <div className="flex-1 max-w-2xl mx-4 relative hidden md:block" ref={searchRef}>
              <div className="relative flex items-center bg-white rounded-lg overflow-hidden shadow-inner">
                <input
                  type="text"
                  placeholder="Tìm sản phẩm tại Bách Hóa Lan Hảo..."
                  className="w-full bg-transparent px-4 py-2.5 text-gray-800 focus:outline-none placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                />
                <button className="px-4 py-2.5 text-gray-400 hover:text-[#008b4b] border-l transition-colors">
                  {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </button>
              </div>

              {/* Kết quả tìm kiếm nhanh */}
              {isSearchFocused && searchQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map(p => (
                        <Link key={p.id} href={`/product?id=${p.id}`} className="flex items-center p-3 hover:bg-gray-50 border-b last:border-0" onClick={() => setIsSearchFocused(false)}>
                          <img src={p.images[0]?.src || '/api/placeholder/40/40'} alt={p.name} className="w-10 h-10 object-contain rounded border mr-3" />
                          <div className="flex-1 min-w-0 text-gray-800">
                            <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                            <p className="text-red-600 font-bold text-xs">{p.price.toLocaleString('vi-VN')}₫</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : !isSearching && (
                    <div className="p-4 text-center text-gray-500 text-sm text-gray-800">Không tìm thấy sản phẩm</div>
                  )}
                </div>
              )}
            </div>

            {/* Các chức năng bên phải */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              
              {user ? (
                <div className="group relative flex items-center space-x-1.5 cursor-pointer bg-[#00703c] hover:bg-[#006030] transition-colors p-2 rounded-lg text-sm font-medium">
                  <User size={22} />
                  <span className="hidden xl:inline">{user.phoneNumber}</span>
                  
                  {/* Dropdown Menu người dùng khôi phục hoàn chỉnh */}
                  <div className="absolute top-full right-0 pt-2 w-[320px] hidden group-hover:block z-[60] cursor-default animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-gray-200 overflow-hidden text-gray-800 flex flex-col max-h-[85vh] overflow-y-auto">
                      
                      {/* Header User */}
                      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <span className="font-bold text-gray-800 text-[15px]">{user.phoneNumber}</span>
                        <span className="text-[11px] text-gray-400 font-bold uppercase">CHƯA CÓ HẠNG <span className="text-gray-800 ml-1">0 điểm</span></span>
                      </div>

                      {/* Section 1: Ưu đãi */}
                      <div className="p-2 border-b border-gray-100">
                        <Link href="#" className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item transition-colors">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Ticket size={18} strokeWidth={2} className="text-gray-400 group-hover/item:text-[#008b4b]" />
                            <span className="text-[14px] font-medium">Phiếu mua hàng <span className="bg-yellow-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 relative -top-0.5 shadow-sm">0</span></span>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </Link>
                        <Link href="#" className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item transition-colors">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Sparkles size={18} strokeWidth={2} className="text-gray-400 group-hover/item:text-[#008b4b]" />
                            <span className="text-[14px] font-medium">Ưu đãi đặc biệt</span>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </Link>
                      </div>

                      {/* Section 2: Thông tin cá nhân */}
                      <div className="p-2 border-b border-gray-100">
                        <div className="px-2.5 py-2">
                          <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Thông tin cá nhân</span>
                        </div>
                        {/* ĐÃ CẬP NHẬT HREF TỚI TRANG /profile */}
                        <Link href="/profile" className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item transition-colors">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <User size={18} strokeWidth={2} className="text-gray-400 group-hover/item:text-[#008b4b]" />
                            <span className="text-[14px]">Sửa thông tin cá nhân</span>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </Link>
                        <Link href="#" className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item transition-colors">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <MapPin size={18} strokeWidth={2} className="text-gray-400 group-hover/item:text-[#008b4b]" />
                            <span className="text-[14px]">Địa chỉ nhận hàng (0)</span>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </Link>
                        <Link href="/orders" className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item transition-colors">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <ShoppingBag size={18} className="text-gray-400 group-hover/item:text-[#008b4b]" />
                            <span className="text-[14px]">Đơn hàng từng mua</span>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </Link>
                        <Link href="#" className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item transition-colors">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Shield size={18} strokeWidth={2} className="text-gray-400 group-hover/item:text-[#008b4b]" />
                            <span className="text-[14px]">Thay đổi chính sách xử lý dữ liệu...</span>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </Link>
                      </div>

                      {/* Section 3: Hỗ trợ khách hàng */}
                      <div className="p-2 border-b border-gray-100">
                        <div className="px-2.5 py-2">
                          <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Hỗ trợ khách hàng</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item transition-colors cursor-pointer">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <PhoneCall size={18} strokeWidth={2} className="text-gray-400 group-hover/item:text-[#008b4b]" />
                            <span className="text-[14px]">Tư vấn: <strong className="text-gray-800">1900.1908</strong> <span className="text-gray-400 text-xs ml-1">(7:30 - 21:00)</span></span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item transition-colors cursor-pointer">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Headphones size={18} strokeWidth={2} className="text-gray-400 group-hover/item:text-[#008b4b]" />
                            <div className="flex flex-col">
                                <span className="text-[14px]">Khiếu nại: <strong className="text-gray-800">1800.1067</strong></span>
                                <span className="text-[11px] text-gray-400">(7:30 - 21:00) <strong className="text-[#008b4b]">Miễn phí</strong></span>
                            </div>
                          </div>
                        </div>
                        <Link href="#" className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item transition-colors">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Store size={18} strokeWidth={2} className="text-gray-400 group-hover/item:text-[#008b4b]" />
                            <span className="text-[14px]">Tìm kiếm cửa hàng</span>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </Link>
                        <Link href="#" className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item transition-colors">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Ticket size={18} strokeWidth={2} className="text-gray-400 group-hover/item:text-[#008b4b]" />
                            <span className="text-[14px]">Mua phiếu mua hàng</span>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </Link>
                        <Link href="#" className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item transition-colors">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <FileText size={18} strokeWidth={2} className="text-gray-400 group-hover/item:text-[#008b4b]" />
                            <span className="text-[14px]">Hướng dẫn mua hàng</span>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </Link>
                      </div>

                      {/* Logout Button */}
                      <div className="p-3 bg-gray-50 border-t border-gray-100">
                        <button onClick={handleLogout} className="w-full py-2.5 text-red-600 border border-red-100 bg-white hover:bg-red-50 hover:border-red-200 rounded-lg font-bold transition-all text-[14px] flex items-center justify-center shadow-sm">
                          <LogOut size={18} className="mr-2" /> ĐĂNG XUẤT
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLoginModal(true)} 
                  className="flex items-center space-x-1.5 p-2 rounded-lg text-sm font-medium hover:bg-[#00703c] transition-colors"
                >
                  <User size={22} />
                  <span className="hidden xl:inline">Đăng nhập</span>
                </button>
              )}

              {/* Giỏ hàng */}
              <Link href="/cart" className="relative bg-[#00703c] p-2.5 rounded-lg flex items-center space-x-2 hover:bg-[#006030] transition-colors border border-transparent hover:border-yellow-400">
                <ShoppingCart size={22} />
                <span className="hidden sm:inline font-medium">Giỏ hàng</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-600 font-bold rounded-full h-6 w-6 flex items-center justify-center text-xs border-2 border-[#008b4b] animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* POPUP ĐĂNG NHẬP */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200 overflow-hidden text-gray-800">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full p-1.5 transition-colors z-10"><X size={20} strokeWidth={2.5} /></button>
            <div id="recaptcha-container"></div>
            {loginStep === 'phone' ? (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Thông tin cá nhân</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">Mời Anh/Chị <strong>đăng nhập</strong> để mua hàng nhanh chóng và nhận nhiều ưu đãi hơn.</p>
                <div className="relative mb-6">
                  <input type="tel" placeholder="Nhập số điện thoại *" className="w-full px-5 py-4 border-2 border-gray-100 rounded-xl outline-none focus:border-[#008b4b] text-lg transition-all" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={(e) => { if (e.key === 'Enter' && !isProcessing) handleSendOTP(); }} maxLength={11} autoFocus />
                </div>
                <button onClick={handleSendOTP} disabled={isProcessing || phoneNumber.length < 9} className="w-full py-4 bg-[#008b4b] text-white font-bold rounded-xl disabled:bg-gray-200 disabled:text-gray-400 uppercase tracking-wide shadow-lg shadow-green-100 transition-all flex items-center justify-center">{isProcessing ? <Loader2 className="animate-spin" size={24} /> : 'TIẾP TỤC'}</button>
                <p className="text-[11px] text-gray-400 mt-6 text-center">Bằng cách đăng ký, bạn đồng ý với các <span className="text-blue-500 cursor-pointer">Điều khoản sử dụng</span> của Bách Hóa Lan Hảo.</p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <h2 className="text-lg font-medium text-gray-700 mb-2">Xác nhận số điện thoại</h2>
                <p className="text-sm text-gray-400 mb-8">Mã xác thực đã được gửi tới số <br/><strong className="text-gray-800 text-lg">{phoneNumber}</strong></p>
                <div className="flex justify-center mb-8">
                  <input type="text" maxLength={6} placeholder="------" className="w-48 px-4 py-4 border-2 border-gray-100 rounded-xl text-center text-3xl font-bold tracking-[0.5em] outline-none focus:border-[#008b4b] transition-all" value={otpCode} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setOtpCode(val); if (val.length === 6) handleVerifyOTP(val); }} autoFocus />
                </div>
                {isProcessing && <div className="mb-4 flex justify-center"><Loader2 className="animate-spin text-[#008b4b]" size={32} /></div>}
                <button onClick={() => setLoginStep('phone')} className="text-[#008b4b] font-bold text-sm hover:underline">Thay đổi số điện thoại</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}