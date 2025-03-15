import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from '@/lib/contexts/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 min-h-screen bg-gray-50">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
