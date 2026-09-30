import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

export type VirtualMessageListHandle = {
  scrollToIndex: (
    index: number,
    options?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: ScrollBehavior }
  ) => void;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
};

type Props<T> = {
  items: T[];
  estimatedItemHeight?: number;
  overscan?: number;
  initialItemIndex?: number;
  getItemKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
};

class HeightIndex {
  private tree: Float64Array;
  private size: number;

  constructor(size: number) {
    this.size = size;
    this.tree = new Float64Array(size + 1);
  }

  update(index: number, delta: number) {
    for (let i = index + 1; i <= this.size; i += i & -i) {
      this.tree[i] += delta;
    }
  }

  sum(count: number) {
    let result = 0;
    for (let i = Math.min(count, this.size); i > 0; i -= i & -i) {
      result += this.tree[i];
    }
    return result;
  }
}

const VirtualRow = ({
  index,
  children,
  onMeasure,
}: {
  index: number;
  children: React.ReactNode;
  onMeasure: (index: number, element: HTMLDivElement | null) => void;
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = rowRef.current;
    if (!element) return;

    onMeasure(index, element);

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => onMeasure(index, element));
    observer.observe(element);

    return () => observer.disconnect();
  }, [index, onMeasure]);

  return (
    <div ref={rowRef}>
      {children}
    </div>
  );
};

export const VirtualMessageList = forwardRef(function VirtualMessageList<T>(
  {
    items,
    estimatedItemHeight = 72,
    overscan = 8,
    initialItemIndex,
    getItemKey,
    renderItem,
    className,
  }: Props<T>,
  ref: React.ForwardedRef<VirtualMessageListHandle>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heightsRef = useRef<Map<number, number>>(new Map());
  const indexRef = useRef<HeightIndex | null>(null);
  const previousCountRef = useRef(0);
  const rangeStartRef = useRef(0);
  const [scrollState, setScrollState] = useState({ top: 0, height: 0 });

  if (previousCountRef.current !== items.length) {
    indexRef.current = new HeightIndex(items.length);
    heightsRef.current = new Map();
    previousCountRef.current = items.length;
  }

  const heightIndex = indexRef.current!;

  const getOffset = useCallback(
    (index: number) =>
      Math.max(0, index * estimatedItemHeight + heightIndex.sum(index)),
    [estimatedItemHeight, heightIndex]
  );

  const getTotalHeight = useCallback(
    () => Math.max(0, items.length * estimatedItemHeight + heightIndex.sum(items.length)),
    [estimatedItemHeight, heightIndex, items.length]
  );

  const findIndexAtOffset = useCallback(
    (offset: number) => {
      let low = 0;
      let high = items.length;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (getOffset(mid) < offset) low = mid + 1;
        else high = mid;
      }
      return Math.max(0, Math.min(items.length - 1, low));
    },
    [getOffset, items.length]
  );

  const updateRange = useCallback((top: number, height: number) => {
    const safeHeight = Math.max(1, height);
    const overscanPx = Math.max(estimatedItemHeight, overscan * estimatedItemHeight);
    const start = items.length
      ? Math.max(0, findIndexAtOffset(Math.max(0, top - overscanPx)))
      : 0;
    const end = items.length
      ? Math.min(items.length, findIndexAtOffset(top + safeHeight + overscanPx) + 1)
      : 0;

    rangeStartRef.current = start;
    setScrollState({ top, height: safeHeight });

    return { start, end };
  }, [estimatedItemHeight, findIndexAtOffset, items.length, overscan]);

  const measure = useCallback(
    (index: number, element: HTMLDivElement | null) => {
      if (!element) return;

      const actual = element.getBoundingClientRect().height;
      if (!Number.isFinite(actual) || actual <= 0) return;

      const previous = heightsRef.current.get(index) ?? estimatedItemHeight;
      const nextDelta = actual - estimatedItemHeight;
      const previousDelta = previous - estimatedItemHeight;

      if (Math.abs(previous - actual) < 0.5) return;

      heightsRef.current.set(index, actual);
      heightIndex.update(index, nextDelta - previousDelta);

      const container = containerRef.current;
      if (container && index < rangeStartRef.current) {
        const delta = actual - previous;
        if (Math.abs(delta) > 0.5) {
          container.scrollTop += delta;
        }
      }

      setScrollState((state) => ({ ...state }));
    },
    [estimatedItemHeight, heightIndex]
  );

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    updateRange(container.scrollTop, container.clientHeight);
  }, [updateRange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateRange(container.scrollTop, container.clientHeight);

    const observer = new ResizeObserver(() => {
      updateRange(container.scrollTop, container.clientHeight);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [updateRange]);

  const totalHeight = getTotalHeight();
  const viewportTop = scrollState.top;
  const viewportHeight = scrollState.height;

  const start = items.length
    ? Math.max(0, findIndexAtOffset(Math.max(0, viewportTop - viewportHeight * 2)))
    : 0;
  const end = items.length
    ? Math.min(items.length, findIndexAtOffset(viewportTop + viewportHeight * 3) + 1)
    : 0;

  useEffect(() => {
    if (initialItemIndex == null || !items.length || !containerRef.current) return;

    const frame = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;

      const index = Math.max(0, Math.min(items.length - 1, initialItemIndex));
      container.scrollTop = Math.max(0, getOffset(index) - container.clientHeight * 0.7);
      updateRange(container.scrollTop, container.clientHeight);
    });

    return () => cancelAnimationFrame(frame);
  }, [getOffset, initialItemIndex, items.length, updateRange]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex(index, options = {}) {
        const container = containerRef.current;
        if (!container || !items.length) return;

        const safeIndex = Math.max(0, Math.min(items.length - 1, index));
        const itemTop = getOffset(safeIndex);
        const itemHeight = heightsRef.current.get(safeIndex) ?? estimatedItemHeight;
        const align = options.align ?? 'center';
        let target = itemTop;

        if (align === 'center') {
          target = itemTop - (container.clientHeight - itemHeight) / 2;
        } else if (align === 'end') {
          target = itemTop - container.clientHeight + itemHeight;
        }

        container.scrollTo({
          top: Math.max(0, target),
          behavior: options.behavior ?? 'smooth',
        });
      },
      scrollToBottom(behavior = 'auto') {
        const container = containerRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior });
      },
    }),
    [estimatedItemHeight, getOffset, items.length]
  );

  const visibleItems = useMemo(
    () => items.slice(start, end),
    [end, items, start]
  );

  return (
    <div
      ref={containerRef}
      data-testid="virtual-message-list"
      className={className}
      onScroll={handleScroll}
    >
      <div style={{ height: getOffset(start) }} aria-hidden="true" />

      {visibleItems.map((item, localIndex) => {
        const index = start + localIndex;
        return (
          <VirtualRow
            key={getItemKey(item, index)}
            index={index}
            onMeasure={measure}
          >
            {renderItem(item, index)}
          </VirtualRow>
        );
      })}

      <div
        style={{ height: Math.max(0, totalHeight - getOffset(end)) }}
        aria-hidden="true"
      />
    </div>
  );
}) as <T>(
  props: Props<T> & { ref?: React.Ref<VirtualMessageListHandle> }
) => React.ReactElement;

