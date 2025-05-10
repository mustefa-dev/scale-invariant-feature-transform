
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ObjectTracking from "./pages/ObjectTracking";
import PanoramaStitching from "./pages/PanoramaStitching";
import ObjectDetection from "./pages/ObjectDetection";
import ImageStitching from "./pages/ImageStitching";
import ObjectRecognition from "./pages/ObjectRecognition";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/object-tracking" element={<ObjectTracking />} />
          <Route path="/panorama-stitching" element={<PanoramaStitching />} />
          <Route path="/object-detection" element={<ObjectDetection />} />
          <Route path="/image-stitching" element={<ImageStitching />} />
          <Route path="/object-recognition" element={<ObjectRecognition />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
