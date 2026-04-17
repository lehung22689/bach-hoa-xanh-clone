import { Inter } from "next/font/google";
import "./globals.css";

// IMPORT HEADER VÀ SIDEBAR VÀO ĐÂY
import Header from "@/components/Header";
import { MobileCategoryNav, DesktopSidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata = {
  title: "Bách Hóa Lan Hảo",
  description: "Hệ thống thực phẩm sạch tại Dĩ An",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-[#f1f1f1] font-sans pb-10 overflow-y-scroll`}>
        
        {/* 1. HEADER LUÔN NẰM TRÊN CÙNG CHIẾM 100% CHIỀU NGANG */}
        <Header />

        {/* 2. MENU MOBILE CỐ ĐỊNH (Chỉ hiện trên điện thoại) */}
        <MobileCategoryNav />

        {/* 3. KHUNG CHỨA SIDEBAR VÀ PHẦN RUỘT BÊN TRONG */}
        <div className="max-w-7xl mx-auto px-4 mt-4 flex gap-4 lg:gap-6">
          
          {/* Sidebar nằm cố định bên trái */}
          <DesktopSidebar />

          {/* Phần {children} này chính là nội dung của page.js, search/page.js... */}
          <main className="flex-1 min-w-0 space-y-6 min-h-screen">
            {children}
          </main>

        </div>

      </body>
    </html>
  );
}