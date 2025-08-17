'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { RefreshCw, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';

interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  domContentLoaded: number;
  loadComplete: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Get current path safely
    setCurrentPath(window.location.pathname);

    // Only show in development and ONLY on super admin dashboard
    if (process.env.NODE_ENV === 'development') {
      const path = window.location.pathname;
      
      // Only show on super admin dashboard page
      const isSuperAdminPage = path === '/dashboard/super-admin';
      
      if (isSuperAdminPage) {
        setIsVisible(true);
        measurePerformance();
      } else {
        setIsVisible(false);
      }
    }

    // Add keyboard shortcut to toggle performance monitor (Ctrl+Shift+P) - only on super admin pages
    const handleKeyPress = (event: KeyboardEvent) => {
      if (process.env.NODE_ENV === 'development') {
        const path = window.location.pathname;
        const isSuperAdminPage = path === '/dashboard/super-admin';
        
        if (event.ctrlKey && event.shiftKey && event.key === 'P' && isSuperAdminPage) {
          event.preventDefault();
          setIsVisible(prev => !prev);
          if (!metrics) {
            measurePerformance();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [metrics]);

  const measurePerformance = () => {
    if (typeof window === 'undefined' || !window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    const lcp = paint.find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0;
    
    const newMetrics: PerformanceMetrics = {
      fcp: Math.round(fcp),
      lcp: Math.round(lcp),
      fid: 0, // First Input Delay - would need to be measured on user interaction
      cls: 0, // Cumulative Layout Shift - would need to be measured over time
      ttfb: Math.round(navigation.responseStart - navigation.requestStart),
      domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
      loadComplete: Math.round(navigation.loadEventEnd - navigation.fetchStart),
    };

    setMetrics(newMetrics);
  };

  const getPerformanceScore = (metric: keyof PerformanceMetrics): { score: number; color: string; label: string } => {
    if (!metrics) return { score: 0, color: 'bg-gray-500', label: 'Unknown' };

    const value = metrics[metric];
    let score = 0;
    let color = 'bg-gray-500';
    let label = 'Unknown';

    switch (metric) {
      case 'fcp':
        if (value <= 1800) { score = 100; color = 'bg-green-500'; label = 'Good'; }
        else if (value <= 3000) { score = 65; color = 'bg-yellow-500'; label = 'Needs Improvement'; }
        else { score = 0; color = 'bg-red-500'; label = 'Poor'; }
        break;
      case 'lcp':
        if (value <= 2500) { score = 100; color = 'bg-green-500'; label = 'Good'; }
        else if (value <= 4000) { score = 65; color = 'bg-yellow-500'; label = 'Needs Improvement'; }
        else { score = 0; color = 'bg-red-500'; label = 'Poor'; }
        break;
      case 'ttfb':
        if (value <= 800) { score = 100; color = 'bg-green-500'; label = 'Good'; }
        else if (value <= 1800) { score = 65; color = 'bg-yellow-500'; label = 'Needs Improvement'; }
        else { score = 0; color = 'bg-red-500'; label = 'Poor'; }
        break;
      default:
        score = 100;
        color = 'bg-green-500';
        label = 'Good';
    }

    return { score, color, label };
  };

  // Don't render anything until we're on the client side
  if (typeof window === 'undefined') {
    return null;
  }

  // Show a small indicator when hidden in development mode - only on super admin pages
  if (!isVisible) {
    if (process.env.NODE_ENV === 'development') {
      const isSuperAdminPage = currentPath === '/dashboard/super-admin';
      
      if (isSuperAdminPage) {
        return (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded cursor-pointer opacity-50 hover:opacity-100 transition-opacity" 
                 onClick={() => setIsVisible(true)}>
              Ctrl+Shift+P
            </div>
          </div>
        );
      }
    }
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance Monitor
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? '−' : '+'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={measurePerformance}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {metrics && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">FCP:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono">{metrics.fcp}ms</span>
                    <Badge className={`h-2 w-2 p-0 ${getPerformanceScore('fcp').color}`} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">LCP:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono">{metrics.lcp}ms</span>
                    <Badge className={`h-2 w-2 p-0 ${getPerformanceScore('lcp').color}`} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">TTFB:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono">{metrics.ttfb}ms</span>
                    <Badge className={`h-2 w-2 p-0 ${getPerformanceScore('ttfb').color}`} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">DOM Ready:</span>
                  <span className="font-mono">{metrics.domContentLoaded}ms</span>
                </div>
              </div>

              {isExpanded && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Load Complete:</span>
                      <span className="font-mono">{metrics.loadComplete}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Time:</span>
                      <span className="font-mono">{metrics.loadComplete}ms</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      <p>Performance scores are based on Core Web Vitals thresholds.</p>
                      <p className="mt-1">Green: Good, Yellow: Needs Improvement, Red: Poor</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
