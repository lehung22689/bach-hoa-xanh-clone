"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, CheckCircle2, User } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, enableIndexedDbPersistence } from "firebase/firestore";

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

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form State
  const [gender, setGender] = useState('anh');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // 1. Khởi tạo Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Init Error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Tải dữ liệu Profile
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Đường dẫn cố định theo Rule 1 của hệ thống
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profileInfo', 'data');
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setGender(data.gender || 'anh');
          setFullName(data.fullName || '');
          setEmail(data.email || '');
        }
      } catch (error) {
        // Nếu vẫn báo offline, có thể do cache Firestore bị lỗi, chúng ta thử lấy lại
        console.warn("Retrying profile fetch due to connection state...");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, appId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Bạn cần đăng nhập để lưu thông tin!");
      return;
    }
    
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profileInfo', 'data'), {
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
      alert("Lỗi: Không thể kết nối với máy chủ Firebase. Vui lòng kiểm tra lại cấu hình Rules trên Console.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex flex-col items-center justify-center -mt-4">
        <Loader2 className="animate-spin text-[#008b4b] mb-4" size={40} />
        <p className="text-gray-500 font-medium text-[15px]">Đang kết nối hệ thống...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex flex-col items-center justify-center p-4 -mt-4 text-center">
        <User size={64} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Yêu cầu đăng nhập</h2>
        <p className="text-gray-500 mb-6">Vui lòng đăng nhập bằng số điện thoại để sửa thông tin cá nhân.</p>
        <button onClick={() => window.history.back()} className="bg-[#008b4b] text-white px-8 py-3 rounded-xl font-bold">Quay lại trang chủ</button>
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
               <label className="absolute left-4 top-2 text-[11px] font-bold text-[#008b4b] uppercase transition-colors group-focus-within:text-green-600">Họ và tên *</label>
               <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  className="w-full px-4 pt-6 pb-2 border border-gray-200 rounded-xl outline-none focus:border-[#008b4b] focus:ring-1 focus:ring-green-100 text-[16px] text-gray-800 bg-white"
                  required
               />
            </div>

            {/* SĐT (Read only) */}
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
                className="w-full py-4 bg-gradient-to-r from-[#008b4b] to-[#00a85d] text-white font-bold text-[17px] rounded-xl hover:shadow-lg hover:from-[#00703c] transition-all shadow-md active:scale-[0.98] flex items-center justify-center disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none"
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