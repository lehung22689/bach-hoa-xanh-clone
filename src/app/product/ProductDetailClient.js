"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, MapPin, Menu, ChevronRight, ChevronLeft, SearchX } from 'lucide-react';

const mockCategories = [
  { id: 1, name: 'Thịt, cá, hải sản', icon: '🥩' },
  { id: 2, name: 'Rau, củ, trái cây', icon: '🥬' },
  { id: 3, name: 'Sữa các loại', icon: '🥛' },
  { id: 4, name: 'Bia, nước giải khát', icon: '🍺' },
  { id: 5, name: 'Mì, miến, cháo, phở', icon: '🍜' },
  { id: 6, name: 'Dầu ăn, gia vị', icon: '🧂' },
  { id: 7, name: 'Gạo, bột, đồ khô', icon: '🍚' },
  { id: 8, name: 'Bánh kẹo các loại', icon: '🍬' },
];

const Header = ({ cartCount }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (searchQuery.trim() !== '') {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-[#008b4b] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center space-x-2 font-bold text-2xl tracking-tighter cursor-pointer">
            <div className="bg-yellow-400 text-green-800 p-1 rounded-md">BÁCH HÓA</div>
            <span>LAN HẢO</span>
          </Link>
          <div className="hidden md:flex items-center space-x-1 bg-[#00703c] px-3 py-2 rounded-lg text-sm">
            <MapPin size={16} />
            <span>Giao tới: <strong className="text-yellow-300">Dĩ An, Bình Dương</strong></span>
          </div>
          <div className="flex-1 max-w-2xl mx-4 relative hidden sm:block">
            <input
              type="text"
              placeholder="Tìm sản phẩm tại Bách Hóa Lan Hảo..."
              className="w-full px-4 py-2.5 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
          </div>
          <Link href="/cart" className="relative bg-[#00703c] p-2.5 rounded-lg flex items-center space-x-2">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-600 font-bold rounded-full h-6 w-6 flex items-center justify-center text-xs border-2 border-[#008b4b]">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default function ProductDetailClient({ initialProduct, productId }) {
  const [cart, setCart] = useState([]);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem('lanHaoCart');
    if (savedCart) { try { setCart(JSON.parse(savedCart)); } catch (e) {} }
  }, []);

  useEffect(() => {
    if (cart.length > 0) localStorage.setItem('lanHaoCart', JSON.stringify(cart));
    else localStorage.removeItem('lanHaoCart');
  }, [cart]);

  const handleAddQuantity = () => {
    setCart(prev => {
      const existing = prev.find(item => item.id === initialProduct.id);
      if (existing) return prev.map(item => item.id === initialProduct.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...initialProduct, quantity: 1 }];
    });
  };

  const handleRemoveQuantity = () => {
    setCart(prev => {
      const existing = prev.find(item => item.id === initialProduct.id);
      if (existing && existing.quantity === 1) return prev.filter(item => item.id !== initialProduct.id);
      return prev.map(item => item.id === initialProduct.id ? { ...item, quantity: item.quantity - 1 } : item);
    });
  };

  if (!initialProduct) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-20">
        <SearchX size={64} className="text-gray-300 mb-4" />
        <h3 className="text-lg font-bold">Sản phẩm không tồn tại</h3>
        <Link href="/" className="mt-4 text-[#008b4b]">Quay lại trang chủ</Link>
      </div>
    );
  }

  const currentQuantity = cart.find(i => i.id === initialProduct.id)?.quantity || 0;
  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const discountPercent = initialProduct.on_sale && initialProduct.regular_price > initialProduct.price
    ? Math.round(((initialProduct.regular_price - initialProduct.price) / initialProduct.regular_price) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#f1f1f1] font-sans pb-10">
      <Header cartCount={cartTotalCount} />
      <div className="max-w-7xl mx-auto px-4 mt-4 flex gap-6">
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-[88px]">
            <div className="bg-[#008b4b] text-white font-bold p-3 flex items-center space-x-2">
              <Menu size={20} /> <span>DANH MỤC</span>
            </div>
            <ul className="py-2">
              {mockCategories.map(cat => (
                <li key={cat.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center text-sm border-b last:border-0">
                  <span className="mr-3">{cat.icon}</span> {cat.name}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-3/5">
              <div className="border rounded-xl p-4 mb-4 relative flex items-center justify-center aspect-[4/3]">
                {discountPercent > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">GIẢM {discountPercent}%</div>
                )}
                <img src={initialProduct.images[activeImage]?.src} alt={initialProduct.name} className="max-h-full object-contain" />
              </div>
            </div>

            <div className="w-full lg:w-2/5 flex flex-col">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">{initialProduct.name}</h1>
              <div className="bg-gray-50 border-l-4 border-[#008b4b] p-5 mb-6">
                <div className="text-3xl font-bold text-[#008b4b]">{initialProduct.price.toLocaleString('vi-VN')}₫</div>
                {discountPercent > 0 && <div className="text-gray-400 line-through">{initialProduct.regular_price.toLocaleString('vi-VN')}₫</div>}
              </div>

              {currentQuantity === 0 ? (
                <button onClick={handleAddQuantity} className="w-full py-4 bg-[#008b4b] text-white font-bold rounded-xl uppercase">CHỌN MUA</button>
              ) : (
                <div className="flex items-center justify-between p-2 bg-[#f0f9f4] rounded-xl border border-[#008b4b]">
                  <button onClick={handleRemoveQuantity} className="w-12 h-12 text-[#008b4b] text-2xl font-bold">-</button>
                  <span className="font-bold text-xl">{currentQuantity}</span>
                  <button onClick={handleAddQuantity} className="w-12 h-12 text-[#008b4b] text-2xl font-bold">+</button>
                </div>
              )}
              
              <div className="mt-8 border-t pt-4">
                <h3 className="font-bold uppercase text-sm mb-2">Thông tin sản phẩm</h3>
                <div className="text-sm text-gray-600" dangerouslySetInnerHTML={{__html: initialProduct.short_description || initialProduct.description}} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}