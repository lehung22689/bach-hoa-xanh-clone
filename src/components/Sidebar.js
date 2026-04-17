"use client";

import React, { useState } from 'react';
import { Menu, ChevronRight, ChevronDown } from 'lucide-react';

// ⚠️ KHI CHẠY TRÊN VS CODE: Hãy BỎ COMMENT dòng dưới đây và XÓA phần MOCK COMPONENT đi nhé!
import Link from 'next/link';


// 1. DATA ĐỒNG BỘ 100% VỚI WORDPRESS "CATEGORIES IMAGE" MENU
export const categoriesData = [
  { id: 1, name: 'Bánh kẹo các loại', icon: '🍬', slug: 'banh-keo-cac-loai' },
  { id: 2, name: 'Bia, nước giải khát', icon: '🍺', slug: 'bia-nuoc-co-con' },
  { id: 3, name: 'DẦU ĂN, NƯỚC CHẤM, GIA VỊ', icon: '🧂', slug: 'dau-an-gia-vi' },
  { 
    id: 4, 
    name: 'MÌ, MIẾN, CHÁO, PHỞ', 
    icon: '🍜', 
    slug: 'mi-mien-chao-pho',
    // Cấu trúc Sub-menu (Menu con) cho Custom Links
    subItems: [
      { id: 41, name: 'Asparagus', slug: 'asparagus' },
      { id: 42, name: 'Beetroot', slug: 'beetroot' },
      { id: 43, name: 'Sweetcorn', slug: 'sweetcorn' },
    ]
  },
  { id: 5, name: 'Dairy & Eggs', icon: '🥚', slug: 'dairy-eggs' },
  { id: 6, name: 'Milk & Drinks', icon: '🥛', slug: 'milk-drinks' },
  { id: 7, name: 'Frozen Foods', icon: '🧊', slug: 'frozen-foods' },
];

// 2. Menu trượt ngang trên Điện thoại (Chỉ hiện các menu cha)
export const MobileCategoryNav = () => (
  <nav className="bg-white shadow-sm border-b md:hidden">
    <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
      <ul className="flex items-center space-x-6 py-3 min-w-max">
        <li className="flex items-center space-x-1 font-bold text-gray-800 cursor-pointer hover:text-green-600">
          <Menu size={20} />
          <span>DANH MỤC</span>
        </li>
        {categoriesData.map(cat => (
          <li key={cat.id} className="text-sm font-medium text-gray-700 cursor-pointer hover:text-green-600 flex items-center whitespace-nowrap">
            <Link href={`/search?categorySlug=${cat.slug}`} className="flex items-center">
              <span className="mr-1">{cat.icon}</span> {cat.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </nav>
);

// 3. Cột Menu bên trái trên Máy tính (Hỗ trợ Dropdown)
export const DesktopSidebar = () => {
  // State quản lý việc đóng/mở menu con
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleMenu = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  return (
    <aside className="hidden md:block w-60 lg:w-64 flex-shrink-0 relative">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-[88px]">
        <div className="bg-[#008b4b] text-white font-bold p-3 flex items-center space-x-2">
          <Menu size={20} />
          <span>DANH MỤC SẢN PHẨM</span>
        </div>
        <ul className="py-2">
          {categoriesData.map(cat => (
            <li key={cat.id} className="border-b border-gray-50 last:border-0 group">
              {/* Kiểm tra xem danh mục này có subItems hay không */}
              {cat.subItems ? (
                <div className="flex flex-col">
                  {/* Nút cha để bấm xổ xuống */}
                  <div 
                    onClick={() => toggleMenu(cat.id)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center transition-colors"
                  >
                    <span className="mr-3 text-xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <span className={`text-sm font-medium transition-colors ${openDropdown === cat.id ? 'text-[#008b4b]' : 'text-gray-700 group-hover:text-[#008b4b]'}`}>
                      {cat.name}
                    </span>
                    {openDropdown === cat.id ? (
                      <ChevronDown size={16} className="ml-auto text-[#008b4b]" />
                    ) : (
                      <ChevronRight size={16} className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-[#008b4b] transition-opacity" />
                    )}
                  </div>
                  
                  {/* Nội dung Menu con xổ xuống */}
                  <div className={`overflow-hidden transition-all duration-300 ${openDropdown === cat.id ? 'max-h-48' : 'max-h-0'}`}>
                    <ul className="bg-gray-50 py-1">
                      {cat.subItems.map(sub => (
                        <li key={sub.id}>
                          <Link href={`/search?categorySlug=${sub.slug}`} className="block pl-11 pr-4 py-2 text-sm text-gray-600 hover:text-[#008b4b] hover:bg-green-50 transition-colors">
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                /* Nút bình thường không có menu con */
                <Link href={`/search?categorySlug=${cat.slug}`} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center transition-colors group">
                  <span className="mr-3 text-xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#008b4b]">{cat.name}</span>
                  <ChevronRight size={16} className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-[#008b4b] transition-opacity" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};