"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, CheckCircle2, User, AlertTriangle, RefreshCw } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// --- INITIALIZE FIREBASE ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Khởi tạo app an toàn
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
// Quan trọng: Sử dụng appId cố định để tránh lỗi path undefined
const APP_ID = "bach-hoa-lan-hao-v1"; 

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  // Form State
  const [gender, setGender] = useState('anh');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // 1. Theo dõi trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchProfile(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Hàm tải dữ liệu (có cơ chế bắt lỗi chi tiết)
  const fetchProfile = async (uid) => {
    setLoading(true);
    setErrorStatus(null);
    try {
      // Kiểm tra API Key có tồn tại không
      if (!firebaseConfig.apiKey) {
        throw new Error("Thiếu API Key trong .env.local");
      }

      const profileRef = doc(db, 'artifacts', APP_ID, 'users', uid, 'profileInfo', 'data');
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setGender(data.gender || 'anh');
        setFullName(data.fullName || '');
        setEmail(data.email || '');
      }
    } catch (error) {
      console.error("Lỗi Firestore:", error);
      setErrorStatus(error.message.includes('offline') 
        ? "Không thể kết nối máy chủ Firebase (Offline). Hãy kiểm tra file .env.local và khởi động lại npm run dev." 
        : error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profileInfo', 'data');
      await setDoc(profileRef, {
        gender,
        fullName,
        email,
        phoneNumber: user.phoneNumber || 'N/A',
        updatedAt: new Date().toISOString()
      });
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Lưu thất bại:", error);
      alert("Lỗi lưu dữ liệu: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex flex-col items-center justify-center -mt-4">
        <Loader2 className="animate-spin text-[#008b4b] mb-4" size={40} />
        <p className="text-gray-500 font-medium">Đang kiểm tra dữ liệu khách hàng...</p>
      </div>
    );
  }

  // Giao diện khi gặp lỗi kết nối
  if (errorStatus) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex flex-col items-center justify-center p-6 -mt-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">Lỗi kết nối Firebase</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">{errorStatus}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center justify-center w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
          >
            <RefreshCw size={18} className="mr-2" /> Thử kết nối lại
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex flex-col items-center justify-center p-4 -mt-4 text-center">
        <User size={64} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Yêu cầu đăng nhập</h2>
        <p className="text-gray-500 mb-6 italic text-sm text-gray-400">Vui lòng đăng nhập để đồng bộ thông tin cá nhân của bạn trên hệ thống.</p>
        <button onClick={() => window.history.back()} className="bg-[#008b4b] text-white px-10 py-3 rounded-xl font-bold shadow-md">QUAY LẠI TRANG CHỦ</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f1f1] font-sans pb-20 relative -mt-4">
      <style dangerouslySetInnerHTML={{__html: `aside { display: none !important; }`}} />

      <header className="bg-white sticky top-[60px] md:top-[70px] z-30 shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between text-gray-800">
          <button onClick={() => window.history.back()} className="text-gray-600 hover:text-[#008b4b] p-1 -ml-1">
            <ChevronLeft size={28} />
          </button>
          <h1 className="font-bold text-lg flex-1 text-center pr-8">
            Sửa thông tin cá nhân
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto mt-6 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 md:p-10">
          <h2 className="text-center text-lg font-bold text-gray-800 mb-8 uppercase tracking-wide">Thông tin tài khoản</h2>
          
          <form onSubmit={handleSave} className="space-y-6 max-w-md mx-auto">
            {/* Giới tính */}
            <div className="flex items-center justify-center space-x-12 mb-8">
              <label className="flex items-center cursor-pointer group">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-2 transition-all ${gender === 'anh' ? 'border-[#008b4b]' : 'border-gray-300'}`}>
                  {gender === 'anh' && <div className="w-3 h-3 rounded-full bg-[#008b4b]"></div>}
                </div>
                <input type="radio" className="hidden" checked={gender === 'anh'} onChange={() => setGender('anh')} />
                <span className={`text-[17px] ${gender === 'anh' ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>Anh</span>
              </label>

              <label className="flex items-center cursor-pointer group">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-2 transition-all ${gender === 'chi' ? 'border-[#008b4b]' : 'border-gray-300'}`}>
                  {gender === 'chi' && <div className="w-3 h-3 rounded-full bg-[#008b4b]"></div>}
                </div>
                <input type="radio" className="hidden" checked={gender === 'chi'} onChange={() => setGender('chi')} />
                <span className={`text-[17px] ${gender === 'chi' ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>Chị</span>
              </label>
            </div>

            {/* Họ tên */}
            <div className="relative group">
               <label className="absolute left-4 top-2 text-[11px] font-bold text-[#008b4b] uppercase">Họ và tên *</label>
               <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  className="w-full px-4 pt-6 pb-2 border border-gray-200 rounded-xl outline-none focus:border-[#008b4b] focus:ring-1 focus:ring-green-100 text-[16px] text-gray-800 bg-white"
                  required
               />
            </div>

            {/* SĐT */}
            <div className="relative">
               <label className="absolute left-4 top-2 text-[11px] font-bold text-gray-400 uppercase">Số điện thoại *</label>
               <input 
                  type="tel" 
                  value={user?.phoneNumber || 'Đang xác thực...'} 
                  readOnly
                  className="w-full px-4 pt-6 pb-2 border border-gray-100 rounded-xl text-[16px] text-gray-400 bg-gray-50 cursor-not-allowed"
               />
            </div>

            {/* Email */}
            <div className="relative group">
               <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (không bắt buộc)"
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl outline-none focus:border-[#008b4b] focus:ring-1 focus:ring-green-100 text-[16px] text-gray-800 bg-white"
               />
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={isSaving}
                className="w-full py-4 bg-gradient-to-r from-[#008b4b] to-[#00a85d] text-white font-bold text-[17px] rounded-xl hover:shadow-lg transition-all shadow-md active:scale-[0.98] flex items-center justify-center disabled:from-gray-400 disabled:to-gray-500"
              >
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : 'Lưu chỉnh sửa'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {showSuccess && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-8 py-3.5 rounded-full flex items-center space-x-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
          <CheckCircle2 size={20} className="text-green-400" />
          <span className="text-[15px] font-bold">Cập nhật thông tin thành công!</span>
        </div>
      )}
    </div>
  );
}