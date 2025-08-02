// components/LazyComponents.js
import { lazy, Suspense } from 'react';

// Lazy load todo components
export const LazyLoadingSpinner = lazy(() => import('./LoadingSpinner'));
export const LazyEmptyState = lazy(() => import('./EmptyState'));
export const LazySearchInput = lazy(() => import('./SearchInput'));
export const LazyProgressBar = lazy(() => import('./ProgressBar'));
export const LazyTodoFilters = lazy(() => import('./TodoFilters'));
export const LazyTodoForm = lazy(() => import('./TodoForm'));
export const LazyTodoItem = lazy(() => import('./TodoItem'));

// Lazy load main components
export const LazyTodoList = lazy(() => import('./TodoList'));
export const LazyAICreator = lazy(() => import('./AICreator'));

// Loading fallback component
export const ComponentLoader = ({ className = "" }) => (
  <div className={`flex items-center justify-center p-4 ${className}`}>
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
  </div>
);


export const withLazyLoading = (Component, fallback = <ComponentLoader />) => {
  return (props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};


export const preloadComponents = () => {
  // Preload critical components after initial render
  setTimeout(() => {
    LazyTodoForm.preload?.();
    LazyTodoItem.preload?.();
    LazySearchInput.preload?.();
  }, 100);

  setTimeout(() => {
    LazyEmptyState.preload?.();
    LazyTodoFilters.preload?.();
  }, 500);
};