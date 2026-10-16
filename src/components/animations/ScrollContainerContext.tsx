import React, { createContext, useContext, useRef, useState, useEffect } from 'react';

interface ScrollContainerContextType {
  scrollRef: React.RefObject<HTMLElement | null>;
  scrollY: number;
  scrollProgress: number;
}

const ScrollContainerContext = createContext<ScrollContainerContextType>({
  scrollRef: { current: null },
  scrollY: 0,
  scrollProgress: 0,
});

export const useScrollContainer = () => useContext(ScrollContainerContext);

interface ScrollContainerProviderProps {
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLElement | null>;
}

export const ScrollContainerProvider: React.FC<ScrollContainerProviderProps> = ({
  children,
  containerRef,
}) => {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const top = el.scrollTop;
          const maxScroll = el.scrollHeight - el.clientHeight;
          const progress = maxScroll > 0 ? top / maxScroll : 0;
          setScrollY(top);
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef]);

  return (
    <ScrollContainerContext.Provider
      value={{
        scrollRef: containerRef,
        scrollY,
        scrollProgress,
      }}
    >
      {children}
    </ScrollContainerContext.Provider>
  );
};
