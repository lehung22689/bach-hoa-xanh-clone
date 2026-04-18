"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, onSnapshot, collection } from "firebase/firestore";

const firebaseConfig = {
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
const APP_ID = "bach-hoa-lan-hao-v1"; 

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); 
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // --- STATE QUẢN LÝ ĐỊA CHỈ TOÀN CỤC ---
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setAddresses([]);
      return;
    }

    // Lắng nghe Profile
    const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profileInfo', 'data');
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const nameParts = (data.fullName || "").trim().split(" ");
        const firstName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : "";
        let genderPrefix = data.gender === 'anh' ? "Anh" : (data.gender === 'chi' ? "Chị" : "");
        setProfile({ ...data, displayName: firstName ? `${genderPrefix} ${firstName}`.trim() : data.fullName });
      }
    });

    // Lắng nghe Danh sách địa chỉ (Rule 1: artifacts/appId/users/userId/addresses)
    const addrCol = collection(db, 'artifacts', APP_ID, 'users', user.uid, 'addresses');
    const unsubscribeAddr = onSnapshot(addrCol, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAddresses(list);
      if (list.length > 0 && !selectedAddressId) setSelectedAddressId(list[0].id);
    });

    return () => { unsubscribeProfile(); unsubscribeAddr(); };
  }, [user]);

  // Quản lý giỏ hàng...
  useEffect(() => {
    const savedCart = localStorage.getItem('lanHaoCart');
    if (savedCart) { try { setCart(JSON.parse(savedCart)); } catch (e) {} }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      if (cart.length > 0) localStorage.setItem('lanHaoCart', JSON.stringify(cart));
      else localStorage.removeItem('lanHaoCart');
    }
  }, [cart, isLoaded]);

  const addToCart = (product) => {
    if (!user) { setShowLoginModal(true); return; }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity === 1) return prev.filter(item => item.id !== productId);
      return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
    });
  };

  return (
    <CartContext.Provider value={{ 
      cart, user, profile, showLoginModal, setShowLoginModal,
      showAddressModal, setShowAddressModal, addresses, selectedAddressId, setSelectedAddressId,
      addToCart, removeFromCart, clearCart: () => setCart([]), 
      removeItem: (id) => setCart(prev => prev.filter(i => i.id !== id)),
      getProductQuantity: (id) => cart.find(i => i.id === id)?.quantity || 0,
      isLoaded
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);