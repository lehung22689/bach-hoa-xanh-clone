"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

// Giao diện Skeleton Loading chuẩn Bách Hóa Xanh
const ProductSkeleton = () => (
  <div className="min-h-screen bg-[#f1f1f1] font-sans pb-10">
    <Header cartCount={0} />
    <div className="max-w-7xl mx-auto px-4 flex gap-6 mt-4">
      <aside className="hidden md:block w-64 flex-shrink-0">
        <div className="bg-white rounded-xl h-80 animate-pulse"></div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col lg:flex-row gap-8 animate-pulse">
          <div className="w-full lg:w-3/5">
            <div className="bg-gray-200 rounded-xl aspect-[4/3] w-full mb-4"></div>
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="bg-gray-200 w-20 h-20 rounded-lg"></div>)}
            </div>
          </div>
          <div className="w-full lg:w-2/5 flex flex-col space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-24 bg-gray-100 rounded-xl"></div>
            <div className="h-14 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </main>
    </div>
  </div>
);

function ProductPageContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const wpDomain = 'https://bachhoalanhao.com';
        const ck = 'ck_efbecb883c9732a5235e08233b5cf7944c46bc46';
        const cs = 'cs_f57adfdf629057a9fc5af629d48fd6e85046403f';
        
        // TỐI ƯU TỐC ĐỘ: Chỉ lấy các trường cần thiết để giảm thời gian phản hồi từ server
        const fields = 'id,name,price,regular_price,description,short_description,images,categories,on_sale';
        const apiUrl = `${wpDomain}/wp-json/wc/v3/products/${productId}?consumer_key=${ck}&consumer_secret=${cs}&_fields=${fields}`;
        
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          data.price = data.price ? parseInt(data.price) : 0;
          data.regular_price = data.regular_price ? parseInt(data.regular_price) : 0;
          setProduct(data);
        }
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) return <ProductSkeleton />;

  return (
    <div className="min-h-screen bg-[#f1f1f1]">
      <ProductDetailClient initialProduct={product} productId={productId} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductPageContent />
    </Suspense>
  );
}