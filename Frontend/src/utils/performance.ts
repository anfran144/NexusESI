/**
 * Utilidades de Optimización de Performance
 * 
 * Este archivo contiene funciones para mejorar el rendimiento
 * de la aplicación y medir tiempos de carga.
 */

/**
 * Debounce: Retrasa la ejecución de una función hasta que
 * haya pasado un tiempo determinado sin que se llame de nuevo
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle: Limita la frecuencia con la que se puede ejecutar una función
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize: Cachea los resultados de una función
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Lazy Load: Carga componentes de forma diferida
 * Nota: Esta función debe usarse con React.lazy directamente
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return React.lazy(factory);
}

/**
 * Performance Monitor: Mide el tiempo de ejecución de una función
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  func: T,
  label: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = func(...args);

    if (result instanceof Promise) {
      return result.then((value) => {
        const end = performance.now();
        console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
        return value;
      });
    }

    const end = performance.now();
    console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }) as T;
}

/**
 * Image Optimization: Carga imágenes de forma optimizada
 */
export function optimizeImage(
  src: string,
  _options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  }
): string {
  // Si la imagen es externa, retornar tal cual
  if (src.startsWith('http')) {
    return src;
  }

  // Aquí podrías integrar con un servicio de optimización de imágenes
  // como Cloudinary, Imgix, etc.
  // Las opciones se pueden usar para configurar el servicio de optimización
  return src;
}

/**
 * Prefetch: Precarga recursos antes de que se necesiten
 */
export function prefetchResource(url: string, type: 'script' | 'style' | 'image' = 'script'): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = type;
  document.head.appendChild(link);
}

/**
 * Virtual Scroll: Renderiza solo los elementos visibles en una lista grande
 */
export function useVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    offsetY,
    totalHeight: items.length * itemHeight,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

/**
 * Cache Manager: Gestiona el caché de datos
 */
export class CacheManager {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl: number; // Time to live en milisegundos

  constructor(ttl: number = 5 * 60 * 1000) {
    // 5 minutos por defecto
    this.ttl = ttl;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Performance Metrics: Recopila métricas de rendimiento
 */
export class PerformanceMetrics {
  private metrics: Map<string, number[]> = new Map();

  record(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    this.metrics.get(metric)!.push(value);
  }

  getAverage(metric: string): number {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) return 0;

    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  getMedian(metric: string): number {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
  }

  getPercentile(metric: string, percentile: number): number {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  report(): void {
    console.log('📊 Performance Metrics Report:');
    console.log('================================');
    for (const [metric, values] of this.metrics.entries()) {
      console.log(`\n${metric}:`);
      console.log(`  Count: ${values.length}`);
      console.log(`  Average: ${this.getAverage(metric).toFixed(2)}ms`);
      console.log(`  Median: ${this.getMedian(metric).toFixed(2)}ms`);
      console.log(`  P95: ${this.getPercentile(metric, 95).toFixed(2)}ms`);
      console.log(`  P99: ${this.getPercentile(metric, 99).toFixed(2)}ms`);
    }
    console.log('================================');
  }

  clear(): void {
    this.metrics.clear();
  }
}

// Instancia global de métricas
export const performanceMetrics = new PerformanceMetrics();

// Instancia global de caché
export const globalCache = new CacheManager();

// Exportar React para el lazy load
import React from 'react';

