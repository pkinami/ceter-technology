"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";

export type HomepageOfferSlide = {
  id: string;
  imageUrl: string | null;
  heading: string;
  text: string;
  price: number | null;
  discountPrice: number | null;
  primaryHref: string;
  primaryLabel: string;
  quoteHref: string;
  showQuote: boolean;
};

const intervalMs = 6000;

export function HomepageOfferCarousel({ slides }: { slides: HomepageOfferSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [manualUntil, setManualUntil] = useState(0);
  const touchStart = useRef<number | null>(null);
  const reducedMotion = useRef(false);

  const move = useCallback((direction: 1 | -1, manual = false) => {
    if (slides.length < 2) return;
    if (manual) setManualUntil(Date.now() + intervalMs);
    setIndex((current) => (current + direction + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedMotion.current = query.matches;
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const timer = window.setInterval(() => {
      if (document.hidden || reducedMotion.current || Date.now() < manualUntil) return;
      move(1);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [manualUntil, move, paused, slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[index] ?? slides[0];
  const currentPrice = slide.discountPrice ?? slide.price;

  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-md bg-slate-950 text-white"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) return;
            const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
            if (Math.abs(delta) > 40) move(delta > 0 ? -1 : 1, true);
            touchStart.current = null;
          }}
        >
          <div className="relative min-h-[360px]">
            {slide.imageUrl ? <Image src={slide.imageUrl} alt="" fill sizes="100vw" className="object-cover opacity-70" /> : null}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/15" />
            <div className="relative grid min-h-[360px] content-center p-6 sm:p-10 lg:max-w-3xl">
              <p className="text-xs font-black uppercase tracking-wide text-orange-200">Current offer</p>
              <h2 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">{slide.heading}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-100 sm:text-base">{slide.text}</p>
              {currentPrice !== null ? (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-black">{formatCurrency(currentPrice)}</span>
                  {slide.discountPrice && slide.price ? <span className="font-semibold text-slate-300 line-through">{formatCurrency(slide.price)}</span> : null}
                </div>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={slide.primaryHref} className="inline-flex min-h-11 items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-black text-white hover:bg-orange-600">
                  {slide.primaryLabel}
                </Link>
                {slide.showQuote ? (
                  <Link href={slide.quoteHref} className="inline-flex min-h-11 items-center rounded-md border border-white/30 bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/20">
                    Request a Quote
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
          {slides.length > 1 ? (
            <>
              <button type="button" onClick={() => move(-1, true)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md bg-white/95 text-slate-950 shadow" aria-label="Previous offer">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => move(1, true)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md bg-white/95 text-slate-950 shadow" aria-label="Next offer">
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {slides.map((item, dotIndex) => (
                  <button key={item.id} type="button" aria-label={`Show offer ${dotIndex + 1}`} aria-current={dotIndex === index} onClick={() => { setManualUntil(Date.now() + intervalMs); setIndex(dotIndex); }} className={`h-2.5 w-2.5 rounded-full ${dotIndex === index ? "bg-orange-400" : "bg-white/70"}`} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
