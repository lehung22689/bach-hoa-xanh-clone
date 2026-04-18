import { Inter } from "next/font/google";
import "./globals.css";

// Import các component giao diện
import Header from "@/components/Header";
import { MobileCategoryNav, DesktopSidebar } from "@/components/Sidebar";

// Import Kho chứa Giỏ hàng (Context)
import { CartProvider } from "@/context/CartContext";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata = {
  title: "Bách Hóa Lan Hảo",
  description: "Hệ thống thực phẩm sạch tại Dĩ An",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-[#f1f1f1] font-sans pb-10 overflow-y-scroll`}>
        
        {/* BỌC TOÀN BỘ ỨNG DỤNG BẰNG CART PROVIDER */}
        <CartProvider>
          
          {/* Header và Menu Mobile (Cố định toàn trang) */}
          <Header />
          <MobileCategoryNav />

          {/* Khung chứa Sidebar và Phần nội dung ruột */}
          <div className="max-w-7xl mx-auto px-4 mt-4 flex gap-4 lg:gap-6">
            <DesktopSidebar />
            
            <main className="flex-1 min-w-0 space-y-6 min-h-screen">
              {children}
            </main>
          </div>

        </CartProvider>
        
      </body>
    </html>
  );
}