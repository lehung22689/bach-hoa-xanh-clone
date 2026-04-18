"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, MapPin, X, Loader2, User, LogOut, 
  Ticket, Sparkles, ShoppingBag, Shield, PhoneCall, 
  Headphones, Store, FileText, ChevronRight, Trash2, Plus,
  Navigation, ChevronDown, Check, Map as MapIcon
} from 'lucide-react';

// ⚠️ KHI CHẠY TRÊN VS CODE: Hãy BỎ COMMENT các dòng import dưới đây và XÓA phần MOCK COMPONENT đi nhé!
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { getAuth, signInWithPhoneNumber, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";



// ID dự án Firebase của bạn
const APP_ID = "bach-hoa-lan-hao-v1";

export default function Header() {
  const { 
    cart, user, profile, showLoginModal, setShowLoginModal,
    showAddressModal, setShowAddressModal, addresses, selectedAddressId, setSelectedAddressId
  } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();

  // --- STATE QUẢN LÝ FLOW ĐỊA CHỈ ---
  const [addressStep, setAddressStep] = useState('list'); // 'list' | 'province' | 'ward' | 'form' | 'map'
  const [editingId, setEditingId] = useState(null); 
  const [isMapLocked, setIsMapLocked] = useState(true); // Khóa bản đồ mặc định
  const [newAddrData, setNewAddrData] = useState({
    province: '',
    ward: '',
    detail: '',
    name: '',
    phone: ''
  });
  const [searchKey, setSearchKey] = useState('');
  const [tempAddrId, setTempAddrId] = useState(selectedAddressId);

  const displayName = profile?.displayName || profile?.fullName || user?.phoneNumber || "Đăng nhập";
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const [phoneNumber, setPhoneNumber] = useState('');
  const auth = typeof getAuth === 'function' ? getAuth() : {};

  const mockProvinces = ["Thành phố Hồ Chí Minh", "Bình Dương", "Thành phố Cần Thơ", "Thành phố Đà Nẵng", "Thành phố Hải Phòng", "Thành phố Huế", "Tỉnh An Giang", "Tỉnh Bắc Ninh"];
  const mockWards = ["Phường Đông Hòa", "Phường Dĩ An", "Xã Cần Giờ", "Xã Củ Chi", "Xã Bình Khánh", "Xã An Thới Đông", "Xã Hưng Long"];

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.trim().length === 0) { setSearchResults([]); return; }
      setIsSearching(true);
      try {
        const wpDomain = 'https://bachhoalanhao.com';
        const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
        const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';
        const apiUrl = `${wpDomain}/wp-json/wc/v3/products?search=${encodeURIComponent(searchQuery)}&per_page=5&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (Array.isArray(data)) setSearchResults(data);
      } catch (e) {
        console.error("Lỗi tìm kiếm:", e);
      } finally { setIsSearching(false); }
    };
    const tid = setTimeout(fetchResults, 500);
    return () => clearTimeout(tid);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => { 
    try { await signOut(auth); } catch (e) { console.error("Lỗi đăng xuất:", e); } 
  };

  const handleCloseModal = () => { 
    setShowLoginModal(false); 
    setPhoneNumber(''); 
  };

  const openAddressPopup = () => {
    setTempAddrId(selectedAddressId);
    setAddressStep('list');
    setShowAddressModal(true);
  };

  const startAddAddress = () => {
    setEditingId(null); 
    setNewAddrData({
      province: '', ward: '', detail: '', 
      name: profile?.fullName || '', 
      phone: user?.phoneNumber?.replace('+84', '0') || ''
    });
    setAddressStep('province');
  };

  const handleStartEdit = (addr) => {
    const parts = addr.address.split(', ');
    const province = parts.length >= 3 ? parts[parts.length - 1] : '';
    const ward = parts.length >= 2 ? parts[parts.length - 2] : '';
    const detail = parts.slice(0, Math.max(1, parts.length - 2)).join(', ');

    setNewAddrData({
      province,
      ward,
      detail,
      name: addr.name,
      phone: addr.phone
    });
    setEditingId(addr.id);
    setAddressStep('form'); 
  };

  const selectProvince = (prov) => {
    setNewAddrData(prev => ({ ...prev, province: prov }));
    setAddressStep('ward');
    setSearchKey('');
  };

  const selectWard = (ward) => {
    setNewAddrData(prev => ({ ...prev, ward: ward }));
    setAddressStep('form');
    setSearchKey('');
  };

  const goToMapConfirm = () => {
    if (!newAddrData.detail || !newAddrData.name || !newAddrData.phone) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setIsMapLocked(true); // Khóa bản đồ khi mới vào
    setAddressStep('map');
  };

  const finishAddAddress = async () => {
    setIsSearching(true); 
    try {
      const fullAddress = `${newAddrData.detail}, ${newAddrData.ward}, ${newAddrData.province}`;
      const db = typeof getFirestore === 'function' ? getFirestore() : {};
      
      const addrRef = editingId 
        ? doc(db, 'artifacts', APP_ID, 'users', user.uid, 'addresses', editingId)
        : collection(db, 'artifacts', APP_ID, 'users', user.uid, 'addresses');

      const data = {
        name: newAddrData.name,
        phone: newAddrData.phone,
        address: fullAddress,
        // Lưu trữ tọa độ (Mô phỏng: Trong thực tế bạn cần dùng thư viện Map thực thụ để lấy lat/lng thực)
        coords: {
            lat: 10.8491, // Ví dụ tọa độ Dĩ An
            lng: 106.7725,
            isManuallyAdjusted: !isMapLocked // Đánh dấu nếu khách đã tự tay sửa vị trí trên map
        },
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        if (typeof updateDoc === 'function') await updateDoc(addrRef, data);
      } else {
        if (typeof addDoc === 'function') await addDoc(addrRef, { ...data, createdAt: new Date().toISOString() });
      }

      setAddressStep('list');
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu địa chỉ. Vui lòng thử lại.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa địa chỉ này?")) return;
    const db = typeof getFirestore === 'function' ? getFirestore() : {};
    try {
      if (typeof deleteDoc === 'function') await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'addresses', id));
    } catch (e) { console.error(e); }
  };

  // --- RENDER MODAL CONTENT DỰA TRÊN STEP ---
  const renderAddressContent = () => {
    switch(addressStep) {
      case 'list':
        return (
          <>
            <div className="p-4 border-b flex justify-between items-center bg-white relative">
              <h2 className="w-full text-center font-bold text-gray-800">Thông tin nhận hàng</h2>
              <button onClick={() => setShowAddressModal(false)} className="absolute right-4 text-gray-400 bg-gray-100 rounded-full p-1.5 hover:bg-gray-200 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh] bg-gray-50/50 text-gray-800">
              {addresses.map(addr => (
                <div key={addr.id} onClick={() => setTempAddrId(addr.id)} className={`bg-white p-4 rounded-xl border-2 cursor-pointer transition-all ${tempAddrId === addr.id ? 'border-[#008b4b] bg-green-50/30' : 'border-gray-100'}`}>
                  <div className="flex items-start">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 mr-3 ${tempAddrId === addr.id ? 'border-[#008b4b]' : 'border-gray-300'}`}>
                      {tempAddrId === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-[#008b4b]"></div>}
                    </div>
                    <div className="flex-1 pr-24 relative"> 
                      <div className="font-bold text-[15px]">{addr.name}, {addr.phone}</div>
                      <div className="text-gray-500 text-sm mt-1 leading-relaxed line-clamp-2">{addr.address}</div>
                      <div className="absolute top-0 right-0 flex gap-2">
                        <button onClick={(e) => {e.stopPropagation(); handleStartEdit(addr);}} className="bg-[#f1f2f6] text-[#4a4a4a] text-[12px] font-bold px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors">Sửa</button>
                        <button onClick={(e) => {e.stopPropagation(); handleDelete(addr.id);}} className="bg-[#f1f2f6] text-[#4a4a4a] text-[12px] font-bold px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors">Xóa</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={startAddAddress} className="w-full py-3.5 flex items-center justify-center text-[#008b4b] font-bold text-[15px] bg-white border border-dashed border-[#008b4b] rounded-xl hover:bg-green-50 transition-colors">
                <Plus size={18} className="mr-1" /> Thêm thông tin nhận hàng
              </button>
            </div>
            <div className="p-4 border-t bg-white">
              <button onClick={() => { setSelectedAddressId(tempAddrId); setShowAddressModal(false); }} className="w-full py-4 bg-[#7cb53b] text-white font-bold rounded-xl uppercase shadow-lg hover:bg-[#6ba52a] active:scale-95 transition-all">XÁC NHẬN</button>
            </div>
          </>
        );

      case 'province':
      case 'ward':
        const isProvince = addressStep === 'province';
        const listData = isProvince ? mockProvinces : mockWards;
        return (
          <>
            <div className="p-4 border-b flex items-center bg-white sticky top-0 z-10 text-gray-800">
              <button onClick={() => setAddressStep(isProvince ? 'list' : 'province')} className="text-gray-600"><ChevronRight size={24} className="rotate-180" /></button>
              <h2 className="flex-1 text-center font-bold">{isProvince ? 'Chọn Tỉnh/Thành phố' : 'Chọn Phường/Xã'}</h2>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 bg-gray-100 rounded-full p-1"><X size={20} /></button>
            </div>
            <div className="p-4 bg-gray-50/50 text-gray-800">
              <button className="w-full py-3 bg-white border border-green-100 rounded-lg flex items-center justify-center text-[#008b4b] font-medium shadow-sm mb-4">
                <Navigation size={18} className="mr-2" /> Lấy vị trí hiện tại
              </button>
              <div className="relative mb-4">
                <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                <input type="text" placeholder={isProvince ? "Tìm nhanh Tỉnh/Thành" : "Tìm nhanh Phường/Xã"} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#008b4b] bg-white text-gray-800" value={searchKey} onChange={(e) => setSearchKey(e.target.value)} />
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[50vh] bg-white rounded-xl border border-gray-100 text-gray-800 font-medium">
                {listData.filter(item => item.toLowerCase().includes(searchKey.toLowerCase())).map((item, idx) => (
                  <div key={idx} onClick={() => isProvince ? selectProvince(item) : selectWard(item)} className="p-4 text-[15px] border-b last:border-0 hover:bg-gray-50 cursor-pointer">{item}</div>
                ))}
              </div>
            </div>
          </>
        );

      case 'form':
        return (
          <>
            <div className="p-4 border-b flex items-center bg-white text-gray-800">
              <button onClick={() => setAddressStep('list')} className="text-gray-600"><ChevronRight size={24} className="rotate-180" /></button>
              <h2 className="flex-1 text-center font-bold">Địa chỉ nhận hàng</h2>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 bg-gray-100 rounded-full p-1"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 bg-gray-50/50">
               <div className="space-y-3">
                <div onClick={() => setAddressStep('province')} className="relative cursor-pointer bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 group hover:border-[#008b4b] transition-colors">
                   <label className="absolute left-4 -top-2 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase">Tỉnh/Thành phố</label>
                   <div className="flex justify-between items-center text-[15px] font-medium">{newAddrData.province || "Chọn Tỉnh/Thành phố"} <ChevronDown size={18} className="text-gray-400" /></div>
                </div>
                <div onClick={() => { if(newAddrData.province) setAddressStep('ward') }} className={`relative cursor-pointer bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 group hover:border-[#008b4b] transition-colors ${!newAddrData.province && 'opacity-50'}`}>
                   <label className="absolute left-4 -top-2 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase">Phường/Xã</label>
                   <div className="flex justify-between items-center text-[15px] font-medium">{newAddrData.ward || "Chọn Phường/Xã"} <ChevronDown size={18} className="text-gray-400" /></div>
                </div>
                <div className="relative">
                   <label className="absolute left-4 top-2 text-[10px] font-bold text-gray-400 uppercase">Số nhà, tên đường</label>
                   <input type="text" placeholder="Nhập số nhà, tên đường" className="w-full px-4 pt-6 pb-2 border border-gray-200 rounded-lg outline-none focus:border-[#008b4b] bg-white text-[15px] text-gray-800" value={newAddrData.detail} onChange={(e) => setNewAddrData({...newAddrData, detail: e.target.value})} />
                </div>
                <div className="pt-2 text-gray-800"><p className="text-sm">Người nhận: <strong className="font-bold">{newAddrData.name} - {newAddrData.phone}</strong></p></div>
              </div>
              <div className="pt-10">
                <button onClick={goToMapConfirm} className="w-full py-4 bg-[#008b4b] text-white font-bold rounded-xl uppercase shadow-md active:scale-95 transition-all">Tiếp tục</button>
              </div>
            </div>
          </>
        );

      case 'map':
        const fullAddressString = `${newAddrData.detail}, ${newAddrData.ward}, ${newAddrData.province}`;
        const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddressString)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

        return (
          <>
            <div className="p-4 border-b flex items-center bg-white sticky top-0 z-10 text-gray-800">
              <button onClick={() => setAddressStep('form')} className="text-gray-600"><ChevronRight size={24} className="rotate-180" /></button>
              <h2 className="flex-1 text-center font-bold">Xác nhận vị trí</h2>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 bg-gray-100 rounded-full p-1"><X size={20} /></button>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden relative">
               
               {/* 🗺️ HIỂN THỊ BẢN ĐỒ VÀ LỚP PHỦ KHÓA DI CHUYỂN */}
               <div className="flex-1 relative min-h-[380px] bg-gray-100">
                  <iframe width="100%" height="100%" frameBorder="0" scrolling="no" src={mapUrl} className="absolute inset-0" title="Google Map" />
                  
                  {/* Lớp phủ chặn tương tác khi đang bị khóa (isMapLocked === true) */}
                  {isMapLocked && (
                    <div className="absolute inset-0 z-20 cursor-not-allowed bg-black/5 flex items-start justify-center pt-4">
                        <span className="bg-white/90 px-3 py-1.5 rounded-full text-[12px] font-bold text-gray-600 shadow-sm flex items-center border border-gray-100">
                            Nhấn "Sửa địa chỉ" để di chuyển bản đồ
                        </span>
                    </div>
                  )}

                  {/* Pin định vị luôn ở giữa màn hình */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none mb-4 z-30">
                    <MapPin size={44} className="text-red-500 fill-red-500 drop-shadow-2xl" />
                  </div>
               </div>

               <div className="p-5 bg-white shadow-2xl z-10 text-gray-800">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-5">
                    <div className="flex items-center text-[#008b4b] mb-1 font-bold text-[13px] uppercase tracking-wider">
                        <MapIcon size={16} className="mr-1.5" /> Vị trí hiện tại:
                    </div>
                    <p className="text-[15px] leading-relaxed font-bold">{fullAddressString}</p>
                  </div>
                  
                  <div className="flex gap-3">
                    {/* Nút Sửa vị trí: Khi nhấn sẽ mở khóa bản đồ (image_e2aadf.png) */}
                    <button 
                      onClick={() => setIsMapLocked(false)} 
                      className={`flex-1 py-3.5 border font-bold rounded-xl text-[15px] transition-all ${!isMapLocked ? 'bg-green-50 border-[#008b4b] text-[#008b4b]' : 'bg-white border-gray-300 text-gray-700'}`}
                    >
                      {isMapLocked ? 'Sửa địa chỉ' : '📍 Đang sửa...'}
                    </button>
                    
                    <button onClick={finishAddAddress} disabled={isSearching} className="flex-[2] py-3.5 bg-[#008b4b] text-white font-bold rounded-xl text-[15px] flex items-center justify-center shadow-lg active:scale-95 transition-all">
                      {isSearching ? <Loader2 className="animate-spin" /> : 'Hoàn tất'}
                    </button>
                  </div>
               </div>
            </div>
          </>
        );
    }
  };

  return (
    <>
      <header className="bg-[#008b4b] text-white sticky top-0 z-50 shadow-md font-sans">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <Link href="/" className="flex items-center space-x-2 font-bold text-2xl tracking-tighter">
              <div className="bg-yellow-400 text-green-800 p-1 rounded-md text-xl md:text-2xl">BÁCH HÓA</div>
              <span className="hidden sm:inline">LAN HẢO</span>
            </Link>
            <div className="hidden lg:flex items-center space-x-1 bg-[#00703c] px-3 py-2 rounded-lg text-sm ml-4 cursor-pointer hover:bg-[#006030] transition-colors">
              <MapPin size={16} />
              <span>Giao tới: <strong className="text-yellow-300 text-xs">Dĩ An, Bình Dương</strong></span>
            </div>
            <div className="flex-1 max-w-2xl mx-4 relative hidden md:block" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-white rounded-lg overflow-hidden shadow-inner">
                <input type="text" placeholder="Tìm sản phẩm tại Bách Hóa Lan Hảo..." className="w-full bg-transparent px-4 py-2.5 text-gray-800 focus:outline-none placeholder-gray-400" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setIsSearchFocused(true)} />
                <button type="submit" className="px-4 py-2.5 text-gray-400 border-l hover:text-[#008b4b] transition-colors">
                  {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </button>
              </form>
              {isSearchFocused && searchQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border overflow-hidden z-50 text-gray-800">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map(p => (
                        <Link key={p.id} href={`/product?id=${p.id}`} className="flex items-center p-3 hover:bg-gray-50 border-b last:border-0" onClick={() => setIsSearchFocused(false)}>
                          <div className="w-10 h-10 flex-shrink-0 mr-3"><img src={p.images?.[0]?.src} className="w-full h-full object-contain rounded" alt={p.name} /></div>
                          <span className="text-sm font-medium line-clamp-1">{p.name}</span>
                        </Link>
                      ))}
                    </div>
                  ) : !isSearching && (
                    <div className="p-4 text-center text-gray-400 text-sm italic">Không tìm thấy sản phẩm</div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {user ? (
                <div className="group relative flex items-center space-x-1.5 cursor-pointer bg-[#00703c] hover:bg-[#006030] transition-colors p-2 rounded-lg text-sm font-medium">
                  <User size={22} />
                  <span className="hidden xl:inline max-w-[120px] truncate">{displayName}</span>
                  <div className="absolute top-full right-0 pt-2 w-[320px] hidden group-hover:block z-[60] cursor-default animate-in fade-in slide-in-from-top-2">
                    <div className="bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-gray-200 overflow-hidden text-gray-800 flex flex-col max-h-[85vh] overflow-y-auto">
                      <div className="p-4 bg-gray-50 flex justify-between items-center border-b border-gray-100">
                        <div className="flex flex-col min-w-0">
                           <span className="font-bold text-[15px] truncate">{profile?.fullName || "Thành viên"}</span>
                           <span className="text-[11px] text-gray-400">{user.phoneNumber}</span>
                        </div>
                        <span className="text-[10px] bg-yellow-400 text-green-800 px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap">0 ĐIỂM</span>
                      </div>
                      <div className="p-2 border-b border-gray-100 font-medium">
                        <Link href="/profile" className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item">
                          <div className="flex items-center space-x-3 text-gray-700"><User size={18} className="text-gray-400 group-hover/item:text-[#008b4b]" /><span className="text-[14px]">Sửa thông tin cá nhân</span></div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </Link>
                        <div onClick={openAddressPopup} className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item transition-colors cursor-pointer">
                          <div className="flex items-center space-x-3 text-gray-700"><MapPin size={18} className="text-gray-400 group-hover/item:text-[#008b4b]" /><span className="text-[14px]">Địa chỉ nhận hàng ({addresses.length})</span></div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </div>
                        <Link href="/orders" className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group/item">
                          <div className="flex items-center space-x-3 text-gray-700"><ShoppingBag size={18} className="text-gray-400 group-hover/item:text-[#008b4b]" /><span className="text-[14px]">Đơn hàng từng mua</span></div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </Link>
                      </div>
                      <div className="p-3 bg-gray-50 border-t border-gray-100">
                        <button onClick={handleLogout} className="w-full py-2.5 text-red-600 border border-red-100 bg-white hover:bg-red-50 rounded-lg font-bold transition-all text-[14px] flex items-center justify-center shadow-sm">
                          <LogOut size={18} className="mr-2" /> ĐĂNG XUẤT
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowLoginModal(true)} className="flex items-center space-x-1.5 p-2 rounded-lg text-sm font-medium hover:bg-[#00703c] transition-colors border border-transparent hover:border-yellow-400">
                  <User size={22} /><span className="hidden xl:inline uppercase tracking-tight">Đăng nhập</span>
                </button>
              )}
              <Link href="/cart" className="relative bg-[#00703c] p-2.5 rounded-lg flex items-center space-x-2 hover:bg-[#006030] transition-colors border border-transparent hover:border-yellow-400">
                <ShoppingCart size={22} /><span className="hidden sm:inline font-medium text-sm">Giỏ hàng</span>
                {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-600 font-bold rounded-full h-6 w-6 flex items-center justify-center text-xs border-2 border-[#008b4b] animate-in zoom-in">{cartCount}</span>}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 text-gray-800">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative p-8"><button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full p-1.5"><X size={20} /></button><h2 className="text-2xl font-bold mb-2 text-center">Đăng nhập</h2><p className="text-sm text-gray-500 mb-6 text-center italic">Nhập số điện thoại để đồng bộ thông tin.</p><input type="tel" placeholder="Số điện thoại *" className="w-full p-4 border border-gray-200 rounded-xl mb-6 outline-none focus:border-[#008b4b] text-lg" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /><button disabled className="w-full py-4 bg-[#008b4b] text-white font-bold rounded-xl shadow-lg uppercase tracking-wide">Tiếp tục</button></div>
        </div>
      )}

      {showAddressModal && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden h-auto max-h-[95vh]">{renderAddressContent()}</div>
        </div>
      )}
    </>
  );
}