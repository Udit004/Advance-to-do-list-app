import React, { useEffect, useRef, useState } from 'react';

const InfiniteScroll = ({ 
  loadMore, 
  hasMore, 
  loading, 
  loader = <div className="text-center my-3"><div className="spinner-border text-primary" role="status"></div></div>,
  endMessage = <p className="text-center my-3">No more items to load</p>,
  children 
}) => {
  const [element, setElement] = useState(null);
  
  const observer = useRef(
    new IntersectionObserver(
      entries => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    )
  );
  
  useEffect(() => {
    const currentElement = element;
    const currentObserver = observer.current;
    
    if (currentElement) {
      currentObserver.observe(currentElement);
    }
    
    return () => {
      if (currentElement) {
        currentObserver.unobserve(currentElement);
      }
    };
  }, [element]);

  return (
    <>
      {children}
      {loading && loader}
      {!hasMore && !loading && endMessage}
      {hasMore && <div ref={setElement} style={{ height: '10px' }}></div>}
    </>
  );
};

export default InfiniteScroll;
