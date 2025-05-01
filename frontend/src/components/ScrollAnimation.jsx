import React, { useEffect, useRef, useState } from 'react';

const ScrollAnimation = ({ children, className, animationType }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      // If the element is visible
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        // No need to keep observing after it's visible
        observer.unobserve(domRef.current);
      }
    });
    
    observer.observe(domRef.current);
    
    return () => {
      if (domRef.current) {
        observer.unobserve(domRef.current);
      }
    };
  }, []);

  // Determine which animation class to use
  const animationClass = animationType === 'slide-left' 
    ? 'slide-in-left' 
    : animationType === 'slide-right' 
      ? 'slide-in-right' 
      : 'fade-in-section';

  return (
    <div
      className={`${className} ${animationClass} ${isVisible ? 'is-visible' : ''}`}
      ref={domRef}
    >
      {children}
    </div>
  );
};

export default ScrollAnimation;
