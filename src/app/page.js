"use client";

import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Ticket, Phone, ChevronRight } from 'lucide-react';

// ⚠️ KHI CHẠY TRÊN VS CODE CỦA BẠN: Hãy bỏ comment dòng dưới đây và XÓA phần MOCK COMPONENT đi nhé!
import Link from 'next/link';


// Component hiển thị thẻ sản phẩm (Tốt nhất bạn nên tách cái này ra file riêng src/components/ProductCard.js trong tương lai)
const ProductCard = ({ product, quantity, onAdd, onRemove }) => {
  const discountPercent = product.on_sale && product.regular_price > product.price
    ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100) 
    : 0;

  return (
    <div className={`bg-white rounded-lg p-3 hover:shadow-lg transition-shadow border flex flex-col h-full relative group ${quantity > 0 ? 'border-[#008b4b]' : 'border-gray-100'}`}>
      {discountPercent > 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded z-10">
          -{discountPercent}%
        </div>
      )}
      
      <Link href={`/product?id=${product.id}`} className="block w-full aspect-square mb-3 relative overflow-hidden rounded-md bg-white border p-1">
        <img 
          src={product.images[0]?.src || '/api/placeholder/200/200'} 
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      <div className="flex flex-col flex-1">
        <Link href={`/product?id=${product.id}`}>
          <h3 className="text-sm text-gray-800 font-medium line-clamp-2 min-h-[40px] mb-2 hover:text-green-600 cursor-pointer">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto flex flex-col">
          <div className="mb-2">
            {product.on_sale && product.regular_price > product.price && (
              <div className="text-xs text-gray-400 line-through mb-0.5">
                {product.regular_price.toLocaleString('vi-VN')}₫
              </div>
            )}
            <span className="text-red-600 font-bold text-base">
              {product.price.toLocaleString('vi-VN')}₫
            </span>
          </div>

          {quantity === 0 ? (
            <button 
              onClick={() => onAdd(product)}
              className="w-full py-2 bg-[#f0f9f4] text-[#008b4b] font-bold text-center rounded border border-transparent hover:border-[#008b4b] transition-all"
            >
              MUA
            </button>
          ) : (
            <div className="flex items-center justify-between w-full py-1 px-2 bg-[#f0f9f4] rounded border border-[#008b4b]">
              <button 
                onClick={() => onRemove(product.id)}
                className="w-8 h-8 flex items-center justify-center text-[#008b4b] text-2xl font-bold hover:bg-[#e0f0e8] rounded"
              >
                -
              </button>
              <span className="font-bold text-gray-800 text-lg">{quantity}</span>
              <button 
                onClick={() => onAdd(product)}
                className="w-8 h-8 flex items-center justify-center text-[#008b4b] text-2xl font-bold hover:bg-[#e0f0e8] rounded"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy giỏ hàng từ localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('lanHaoCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Lỗi đọc dữ liệu giỏ hàng:", error);
      }
    }
  }, []);

  // Lưu giỏ hàng
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('lanHaoCart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('lanHaoCart');
    }
  }, [cart]);

  // Fetch sản phẩm mặc định cho trang chủ
  useEffect(() => {
    let isMounted = true; 
    
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const wpDomain = 'https://bachhoalanhao.com';
        const consumerKey = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
        const consumerSecret = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';

        // Lấy 100 sản phẩm mới nhất làm data cho trang chủ, lọc bớt các trường thừa
        const apiUrl = `${wpDomain}/wp-json/wc/v3/products?per_page=100&_fields=id,name,price,regular_price,images,categories,on_sale&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (!Array.isArray(data)) {
           throw new Error("Không lấy được dữ liệu");
        }
        
        const formattedProducts = data.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price ? parseInt(item.price) : 0,
          regular_price: item.regular_price ? parseInt(item.regular_price) : 0,
          images: item.images || [],
          categories: item.categories || [],
          on_sale: item.on_sale || false,
        }));

        if (isMounted) {
            setProducts(formattedProducts);
            setLoading(false);
        }
      } catch (error) {
        console.log("Lỗi tải sản phẩm trang chủ:", error.message);
        if (isMounted) {
          // Fallback mock data
          setProducts([
            { id: 1, name: 'Sữa tươi tiệt trùng Vinamilk 100% không đường 1 lít', price: 35000, regular_price: 38000, images: [{src: '/api/placeholder/200/200'}], categories: [{name: 'Sữa'}], on_sale: true },
            { id: 2, name: 'Thùng 48 hộp sữa tươi tiệt trùng có đường TH true MILK 180ml', price: 440000, regular_price: 440000, images: [{src: '/api/placeholder/200/200'}], categories: [{name: 'Sữa'}], on_sale: false },
            { id: 3, name: 'Snack khoai tây vị tự nhiên Lay\'s gói 52g', price: 12000, regular_price: 13000, images: [{src: '/api/placeholder/200/200'}], categories: [{name: 'Snack'}], on_sale: true },
            { id: 7, name: 'Bánh gạo nướng An vị Tảo Biển', price: 21000, regular_price: 25000, images: [{src: '/api/placeholder/200/200'}], categories: [{name: 'BÁNH KẸO CÁC LOẠI'}], on_sale: true },
            { id: 8, name: 'Kẹo mút Chupa Chups hương trái cây', price: 35000, regular_price: 35000, images: [{src: '/api/placeholder/200/200'}], categories: [{name: 'BÁNH KẸO CÁC LOẠI'}], on_sale: false },
          ]);
          setLoading(false);
        }
      }
    };

    fetchProducts();
    
    return () => { isMounted = false; };
  }, []);

  const handleAddQuantity = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveQuantity = (productId) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing.quantity === 1) return prev.filter(item => item.id !== productId);
      return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
    });
  };

  const getProductQuantity = (productId) => {
    const item = cart.find(i => i.id === productId);
    return item ? item.quantity : 0;
  };

  // --- CÁC BỘ LỌC HIỂN THỊ SẢN PHẨM TRÊN TRANG CHỦ ---
  const flashSaleProducts = products.filter(p => p.on_sale).slice(0, 5);
  
  const candyProducts = products.filter(p => 
    p.categories && p.categories.some(cat => 
        cat.name.toUpperCase() === 'BÁNH KẸO CÁC LOẠI' ||
        cat.name.toLowerCase().includes('bánh kẹo') ||
        cat.name.toLowerCase().includes('bánh') ||
        cat.name.toLowerCase().includes('kẹo')
    )
  ).slice(0, 10);

  const dairySnackProducts = products.filter(p => 
    p.categories && p.categories.some(cat => 
        cat.name.toLowerCase().includes('sữa') || 
        cat.name.toLowerCase().includes('snack')
    )
  ).slice(0, 10);

  return (
    <>
      {/* Banner Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gradient-to-r from-green-500 to-green-400 rounded-xl p-6 h-48 sm:h-64 flex items-center justify-between text-white shadow-sm overflow-hidden relative">
          <div className="z-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">ĐẠI TIỆC RAU CỦ</h2>
            <p className="text-lg mb-4 text-green-100">Giảm giá lên đến 50% mỗi ngày</p>
            <button className="bg-yellow-400 text-green-900 px-6 py-2 rounded-full font-bold hover:bg-yellow-300">
              Mua ngay
            </button>
          </div>
          <div className="absolute right-0 bottom-0 opacity-50 md:opacity-100">
              <span className="text-9xl">🥬</span>
          </div>
        </div>
        <div className="hidden md:flex flex-col space-y-4">
          <div className="bg-gradient-to-r from-orange-400 to-red-400 rounded-xl p-4 flex-1 text-white shadow-sm flex items-center">
            <div>
              <h3 className="font-bold text-lg">Thịt heo VietGAP</h3>
              <p className="text-sm opacity-90">Tươi ngon mỗi ngày</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl p-4 flex-1 text-white shadow-sm flex items-center">
            <div>
              <h3 className="font-bold text-lg">Hải sản nhập khẩu</h3>
              <p className="text-sm opacity-90">Miễn phí giao hàng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cấu trúc các tiện ích */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full text-green-600"><Clock size={24} /></div>
            <div><p className="font-bold text-sm">Giao hàng đúng giờ</p><p className="text-xs text-gray-500">Miễn phí đơn từ 300k</p></div>
        </div>
        <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full text-green-600"><ShieldCheck size={24} /></div>
            <div><p className="font-bold text-sm">100% Tươi ngon</p><p className="text-xs text-gray-500">Hoàn tiền nếu không tươi</p></div>
        </div>
        <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full text-green-600"><Ticket size={24} /></div>
            <div><p className="font-bold text-sm">Khuyến mãi mỗi ngày</p><p className="text-xs text-gray-500">Deal sốc giảm đến 50%</p></div>
        </div>
        <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full text-green-600"><Phone size={24} /></div>
            <div><p className="font-bold text-sm">Hỗ trợ 24/7</p><p className="text-xs text-gray-500">Hotline: 1900 xxxx</p></div>
        </div>
      </div>

      {/* Flash Sale Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border-t-4 border-red-500 flex flex-col">
        <div className="bg-gradient-to-r from-red-600 to-orange-500 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white italic tracking-wider">⚡ GIÁ SỐC HÔM NAY</h2>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {flashSaleProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              quantity={getProductQuantity(product.id)}
              onAdd={handleAddQuantity}
              onRemove={handleRemoveQuantity}
            />
          ))}
        </div>
        {flashSaleProducts.length > 0 && (
          <div className="border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors">
            <Link href="/search?on_sale=true" className="py-3.5 w-full flex items-center justify-center text-red-500 text-sm font-bold">
              Xem tất cả sản phẩm khuyến mãi <ChevronRight size={18} className="ml-1" />
            </Link>
          </div>
        )}
      </div>

      {/* Category Block: BÁNH KẸO CÁC LOẠI */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border-t-4 border-orange-400 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 uppercase flex items-center">
            <span className="text-2xl mr-2">🍬</span> Bánh kẹo các loại
          </h2>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {candyProducts.length > 0 ? candyProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              quantity={getProductQuantity(product.id)}
              onAdd={handleAddQuantity}
              onRemove={handleRemoveQuantity}
            />
          )) : (
            <div className="col-span-full py-10 text-center text-gray-400 italic">
              {loading ? 'Đang tải dữ liệu sản phẩm từ hệ thống...' : 'Chưa có sản phẩm nào thuộc danh mục này.'}
            </div>
          )}
        </div>
        {candyProducts.length > 0 && (
          <div className="border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors">
            <Link href="/search?categorySlug=banh-keo-cac-loai" className="py-3.5 w-full flex items-center justify-center text-orange-500 text-sm font-bold">
              Xem tất cả Bánh kẹo các loại <ChevronRight size={18} className="ml-1" />
            </Link>
          </div>
        )}
      </div>

      {/* Category Block: Sữa, Snack */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border-t-4 border-[#008b4b] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 uppercase flex items-center">
            <span className="text-2xl mr-2">🥛</span> Sữa, Snack
          </h2>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {dairySnackProducts.length > 0 ? dairySnackProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              quantity={getProductQuantity(product.id)}
              onAdd={handleAddQuantity}
              onRemove={handleRemoveQuantity}
            />
          )) : (
            <div className="col-span-full py-10 text-center text-gray-400 italic">
              {loading ? 'Đang tải dữ liệu sản phẩm từ hệ thống...' : 'Không có sản phẩm nào thuộc danh mục này.'}
            </div>
          )}
        </div>
        {dairySnackProducts.length > 0 && (
          <div className="border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors">
            <Link href="/search?categorySlug=sua" className="py-3.5 w-full flex items-center justify-center text-[#008b4b] text-sm font-bold">
              Xem tất cả Sữa, Snack <ChevronRight size={18} className="ml-1" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}