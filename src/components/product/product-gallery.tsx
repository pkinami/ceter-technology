"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductVisual } from "@/components/product/product-visual";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const slideIntervalMs = 5000;

export function ProductGallery({ product }: { product: Product }) {
  const images = useMemo(() => Array.from(new Set(product.images.filter(Boolean))), [product.images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [manualUntil, setManualUntil] = useState(0);
  const reducedMotion = useRef(false);
  const safeActiveIndex = images.length ? Math.min(activeIndex, images.length - 1) : 0;
  const active = images[safeActiveIndex] ?? null;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedMotion.current = query.matches;
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const move = useCallback((direction: 1 | -1, manual = false) => {
    if (images.length < 2) return;
    if (manual) setManualUntil(Date.now() + slideIntervalMs);
    setActiveIndex((index) => (index + direction + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length < 2 || paused) return;
    const timer = window.setInterval(() => {
      if (document.hidden || reducedMotion.current || Date.now() < manualUntil) return;
      move(1);
    }, slideIntervalMs);
    return () => window.clearInterval(timer);
  }, [images.length, manualUntil, move, paused]);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white">
        {active ? (
          <div className="relative aspect-[4/3] bg-slate-100">
            <Image src={active} alt={product.name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain p-6" />
          </div>
        ) : (
          <div className="aspect-[4/3]">
            <ProductVisual product={product} className="h-full rounded-none" />
          </div>
        )}
        {images.length > 1 ? (
          <>
            <button type="button" onClick={() => move(-1, true)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md bg-white/95 text-slate-950 shadow" aria-label="Previous product image">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => move(1, true)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md bg-white/95 text-slate-950 shadow" aria-label="Next product image">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
        {active ? (
          <button type="button" onClick={() => setZoomOpen(true)} className="absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white shadow-lg" aria-label="View larger image">
            <Maximize2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid min-h-24 grid-cols-3 gap-3 sm:grid-cols-4">
        {images.slice(0, 8).map((image, index) => (
          <button key={image} type="button" onClick={() => { setManualUntil(Date.now() + slideIntervalMs); setActiveIndex(index); }} className={cn("relative aspect-square overflow-hidden rounded-md border bg-slate-100", safeActiveIndex === index ? "border-orange-400 ring-2 ring-orange-200" : "border-slate-200")} aria-label={`View product image ${index + 1}`} aria-current={safeActiveIndex === index}>
            <Image src={image} alt={`${product.name} thumbnail ${index + 1}`} fill sizes="120px" className="object-contain p-2" />
          </button>
        ))}
        {images.length === 0 ? (
          <div className="col-span-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500 sm:col-span-4">
            Product image pending validation
          </div>
        ) : null}
      </div>
      {zoomOpen && active ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/85 p-4" role="dialog" aria-modal="true" aria-label="Product image viewer">
          <button type="button" onClick={() => setZoomOpen(false)} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-md bg-white text-slate-950" aria-label="Close image viewer">
            <X className="h-5 w-5" />
          </button>
          <div className="relative h-[82vh] w-full max-w-5xl rounded-md bg-white">
            <Image src={active} alt={product.name} fill sizes="90vw" className="object-contain p-6" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
