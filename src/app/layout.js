import { Inter } from "next/font/google";
import "./globals.css";
import { MobileCategoryNav, DesktopSidebar } from '@/components/Sidebar';
// Nếu bạn đã tách Header ra file riêng thì import nó vào đây
// import Header from '@/components/Header'; 

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata = {
  title: "Bách Hóa Lan Hảo",
  description: "Hệ thống thực phẩm sạch tại Dĩ An",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-[#f1f1f1] font-sans pb-10`}>
        
        {/* 1. Để Header ở đây để nó cố định luôn */}
        {/* <Header /> */}

        {/* 2. Menu Mobile cố định */}
        <MobileCategoryNav />

        {/* 3. Khung chứa Sidebar và Nội dung thay đổi */}
        <div className="max-w-7xl mx-auto px-4 mt-4 flex gap-4 lg:gap-6">
          
          {/* Sidebar nằm cố định bên trái */}
          <DesktopSidebar />

          {/* Phần {children} này sẽ tự động thay đổi thành nội dung của Trang chủ, Giỏ hàng, Tìm kiếm... tùy vào link bạn bấm */}
          <main className="flex-1 min-w-0 space-y-6">
            {children}
          </main>

        </div>

      </body>
    </html>
  );
}