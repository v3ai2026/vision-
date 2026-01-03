# Performance Best Practices Guide

This guide outlines best practices for maintaining and improving the performance of the NovaUI application.

## React Performance

### 1. Component Optimization

#### Use React.memo for Pure Components
```tsx
// ❌ Bad: Re-renders on every parent render
export const MyComponent = ({ name, onAction }) => {
  return <div onClick={onAction}>{name}</div>;
};

// ✅ Good: Only re-renders when props change
export const MyComponent = React.memo(({ name, onAction }) => {
  return <div onClick={onAction}>{name}</div>;
});
```

#### Memoize Expensive Computations
```tsx
// ❌ Bad: Recalculates on every render
const MyComponent = ({ items }) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return <div>Total: {total}</div>;
};

// ✅ Good: Only recalculates when items change
const MyComponent = ({ items }) => {
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  );
  return <div>Total: {total}</div>;
};
```

#### Memoize Callbacks
```tsx
// ❌ Bad: Creates new function on every render
const MyComponent = ({ onSave }) => {
  const handleClick = () => {
    // complex logic
    onSave();
  };
  return <button onClick={handleClick}>Save</button>;
};

// ✅ Good: Stable function reference
const MyComponent = ({ onSave }) => {
  const handleClick = useCallback(() => {
    // complex logic
    onSave();
  }, [onSave]);
  return <button onClick={handleClick}>Save</button>;
};
```

#### Memoize Service Instances
```tsx
// ❌ Bad: Creates new service on every render
const MyComponent = () => {
  const [service] = useState(() => new MyService());
  // ...
};

// ✅ Better: Use useMemo for explicit memoization
const MyComponent = () => {
  const service = useMemo(() => new MyService(), []);
  // ...
};
```

### 2. State Management

#### Avoid Unnecessary State
```tsx
// ❌ Bad: Derived state stored separately
const [items, setItems] = useState([]);
const [itemCount, setItemCount] = useState(0);

// ✅ Good: Derive from existing state
const [items, setItems] = useState([]);
const itemCount = items.length;
```

#### Split State When Appropriate
```tsx
// ❌ Bad: Single large state object
const [state, setState] = useState({
  user: null,
  settings: {},
  notifications: [],
});

// ✅ Good: Split unrelated state
const [user, setUser] = useState(null);
const [settings, setSettings] = useState({});
const [notifications, setNotifications] = useState([]);
```

### 3. Lazy Loading

#### Lazy Load Heavy Components
```tsx
// ❌ Bad: Imports everything upfront
import { HeavyEditor } from './HeavyEditor';

// ✅ Good: Lazy load when needed
const HeavyEditor = lazy(() => import('./HeavyEditor'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyEditor />
    </Suspense>
  );
}
```

#### Route-Based Code Splitting
```tsx
// ✅ Good: Split by route
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const Settings = lazy(() => import('./pages/Settings'));
```

## Error Handling

### 1. Comprehensive Error Handling

```tsx
// ❌ Bad: Generic error handling
try {
  await fetchData();
} catch (e) {
  console.error(e);
}

// ✅ Good: Specific error handling with context
try {
  await fetchData();
} catch (error) {
  console.error('Failed to fetch data:', error);
  alert('Unable to load data. Please try again.');
}
```

### 2. Input Validation

```tsx
// ❌ Bad: No validation
export const processData = async (input: string) => {
  const result = await api.process(input);
  return result;
};

// ✅ Good: Validate before processing
export const processData = async (input: string) => {
  if (!input || input.trim().length === 0) {
    throw new Error('Input cannot be empty');
  }
  
  const result = await api.process(input);
  return result;
};
```

### 3. Error Boundaries

```tsx
// ✅ Good: Use error boundaries for component errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <ComplexComponent />
</ErrorBoundary>
```

## Bundle Optimization

### 1. Tree Shaking

```tsx
// ❌ Bad: Import entire library
import _ from 'lodash';
const result = _.debounce(fn, 300);

// ✅ Good: Import only what you need
import debounce from 'lodash/debounce';
const result = debounce(fn, 300);
```

### 2. Dynamic Imports

```tsx
// ❌ Bad: Import everything upfront
import { heavyUtil } from './utils';

// ✅ Good: Import only when needed
const handleClick = async () => {
  const { heavyUtil } = await import('./utils');
  heavyUtil();
};
```

### 3. Image Optimization

```tsx
// ❌ Bad: Large unoptimized images
<img src="/large-image.jpg" />

// ✅ Good: Responsive images with modern formats
<picture>
  <source srcSet="/image.webp" type="image/webp" />
  <source srcSet="/image.jpg" type="image/jpeg" />
  <img src="/image.jpg" alt="Description" loading="lazy" />
</picture>
```

## Accessibility

### 1. Semantic HTML

```tsx
// ❌ Bad: Non-semantic markup
<div onClick={handleClick}>Click me</div>

// ✅ Good: Semantic button
<button onClick={handleClick}>Click me</button>
```

### 2. ARIA Attributes

```tsx
// ❌ Bad: No accessibility context
<div onClick={toggleMenu}>☰</div>

// ✅ Good: Proper ARIA labels
<button
  onClick={toggleMenu}
  aria-label="Open menu"
  aria-expanded={isOpen}
>
  ☰
</button>
```

### 3. Keyboard Navigation

```tsx
// ✅ Good: Support keyboard navigation
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Action
</button>
```

## API Calls

### 1. Debounce User Input

```tsx
// ❌ Bad: Call API on every keystroke
const [search, setSearch] = useState('');

useEffect(() => {
  fetchResults(search);
}, [search]);

// ✅ Good: Debounce API calls
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 500);

useEffect(() => {
  if (debouncedSearch) {
    fetchResults(debouncedSearch);
  }
}, [debouncedSearch]);
```

### 2. Cache API Responses

```tsx
// ✅ Good: Use React Query for caching
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### 3. Cancel Pending Requests

```tsx
// ✅ Good: Cancel on unmount
useEffect(() => {
  const controller = new AbortController();
  
  fetch('/api/data', { signal: controller.signal })
    .then(response => response.json())
    .then(data => setData(data));
  
  return () => controller.abort();
}, []);
```

## Development Workflow

### 1. Use React DevTools Profiler

```tsx
// Enable in development
if (process.env.NODE_ENV === 'development') {
  // Use Profiler to identify performance bottlenecks
}
```

### 2. Monitor Bundle Size

```bash
# Check bundle size after build
npm run build

# Analyze bundle
npx vite-bundle-visualizer
```

### 3. Performance Testing

```tsx
// Measure render time
import { Profiler } from 'react';

<Profiler id="MyComponent" onRender={onRenderCallback}>
  <MyComponent />
</Profiler>
```

## Common Pitfalls

### 1. Inline Objects/Arrays in Props

```tsx
// ❌ Bad: Creates new object on every render
<Component config={{ theme: 'dark' }} />

// ✅ Good: Memoize or define outside
const config = useMemo(() => ({ theme: 'dark' }), []);
<Component config={config} />
```

### 2. Missing Dependencies in useEffect

```tsx
// ❌ Bad: Stale closure
useEffect(() => {
  fetchData(userId); // userId might be stale
}, []); // Missing userId

// ✅ Good: Include all dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### 3. Large Component Files

```tsx
// ❌ Bad: 1000+ line component
const MyComponent = () => {
  // Too much logic
};

// ✅ Good: Split into smaller components
const MyComponent = () => {
  return (
    <>
      <Header />
      <Content />
      <Footer />
    </>
  );
};
```

## Checklist for New Features

- [ ] Use appropriate React hooks (useMemo, useCallback)
- [ ] Add React.memo for pure components
- [ ] Implement error boundaries
- [ ] Add input validation
- [ ] Include proper error handling
- [ ] Add ARIA attributes for accessibility
- [ ] Use semantic HTML
- [ ] Implement lazy loading for heavy components
- [ ] Test on mobile devices
- [ ] Check bundle size impact
- [ ] Add loading states
- [ ] Test keyboard navigation
- [ ] Verify screen reader compatibility

## Tools and Resources

### Development Tools
- React DevTools (Performance Profiler)
- Chrome DevTools (Lighthouse)
- Bundle Analyzer (vite-bundle-visualizer)

### Testing Tools
- Vitest (Unit Testing)
- Testing Library (Component Testing)
- axe DevTools (Accessibility Testing)

### Documentation
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web.dev Performance](https://web.dev/performance/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

Following these best practices will help maintain optimal performance and user experience as the application grows.
