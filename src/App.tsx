import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Kho from "./pages/Kho";
import BanHang from "./pages/BanHang";
import ThuNgan from "./pages/ThuNgan";
import QuanLy from "./pages/QuanLy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/kho" element={<ProtectedRoute><Kho /></ProtectedRoute>} />
          <Route path="/ban-hang" element={<ProtectedRoute><BanHang /></ProtectedRoute>} />
          <Route path="/thu-ngan" element={<ProtectedRoute><ThuNgan /></ProtectedRoute>} />
          <Route path="/quan-ly" element={<ProtectedRoute><QuanLy /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
