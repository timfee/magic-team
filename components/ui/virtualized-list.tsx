"use client";

import { FixedSizeList as List } from "react-window";
import { useEffect, useState } from "react";

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscanCount?: number;
}

/**
 * VirtualizedList - High-performance list rendering for large datasets
 * Only renders visible items to improve performance with 100+ items
 */
export function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  overscanCount = 5,
}: VirtualizedListProps<T>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="animate-pulse bg-zinc-100 dark:bg-zinc-800"
      />
    );
  }

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => <div style={style}>{renderItem(items[index], index)}</div>;

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={overscanCount}>
      {Row}
    </List>
  );
}
