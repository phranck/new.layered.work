import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/features/auth/AuthContext.tsx";
import { getSegmentedStorageKey } from "@/lib/segmented-storage.ts";

interface ResizableDialogCardProps extends ComponentPropsWithoutRef<"div"> {
  /** Base key for localStorage, e.g. "submissions:review-modal-size" */
  storageKey: string;
  /** Default width in px, used when no stored size exists */
  defaultWidth?: number;
  /** Minimum width in px */
  minWidth?: number;
  /** Minimum height in px */
  minHeight?: number;
}

interface DialogSize {
  h?: number;
  w: number;
}

interface ResizeDragState {
  pointerId: number;
  startHeight: number;
  startWidth: number;
  startX: number;
  startY: number;
}

function readStoredSize(storageKey: string, defaultWidth: number): DialogSize {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.w === "number" && typeof parsed.h === "number") {
        return { w: parsed.w, h: parsed.h };
      }
    }
  } catch {
    // ignore
  }
  return { w: defaultWidth };
}

export const ResizableDialogCard = forwardRef<HTMLDivElement, ResizableDialogCardProps>(
  function ResizableDialogCard(
    {
      storageKey,
      defaultWidth = 448,
      minWidth = 320,
      minHeight = 200,
      className,
      style,
      children,
      ...rest
    },
    forwardedRef,
  ) {
    const innerRef = useRef<HTMLDivElement>(null);
    const resizeDragRef = useRef<ResizeDragState | null>(null);
    useImperativeHandle(forwardedRef, () => innerRef.current as HTMLDivElement);

    const { user } = useAuth();
    const fullKey = getSegmentedStorageKey(user?.id, storageKey);
    const [dialogSize, setDialogSize] = useState<DialogSize>(() =>
      readStoredSize(fullKey, defaultWidth),
    );

    useEffect(() => {
      setDialogSize(readStoredSize(fullKey, defaultWidth));
    }, [defaultWidth, fullKey]);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const box = entry.borderBoxSize?.[0];
          if (!box || box.inlineSize < minWidth || box.blockSize < minHeight) return;
          try {
            localStorage.setItem(
              fullKey,
              JSON.stringify({ w: Math.round(box.inlineSize), h: Math.round(box.blockSize) }),
            );
          } catch {
            // ignore
          }
        }
      });

      observer.observe(el);
      return () => observer.disconnect();
    }, [fullKey, minWidth, minHeight]);

    const handleResizePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
      const element = innerRef.current;
      if (!element) return;

      event.preventDefault();
      event.stopPropagation();

      const rect = element.getBoundingClientRect();
      resizeDragRef.current = {
        pointerId: event.pointerId,
        startHeight: rect.height,
        startWidth: rect.width,
        startX: event.clientX,
        startY: event.clientY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    }, []);

    const handleResizePointerMove = useCallback(
      (event: ReactPointerEvent<HTMLDivElement>) => {
        const dragState = resizeDragRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) return;

        event.preventDefault();

        const maxWidth =
          typeof window === "undefined" ? Number.POSITIVE_INFINITY : window.innerWidth - 32;
        const maxHeight =
          typeof window === "undefined" ? Number.POSITIVE_INFINITY : window.innerHeight - 32;

        setDialogSize({
          w: Math.min(
            Math.max(minWidth, Math.round(dragState.startWidth + event.clientX - dragState.startX)),
            Math.max(minWidth, maxWidth),
          ),
          h: Math.min(
            Math.max(
              minHeight,
              Math.round(dragState.startHeight + event.clientY - dragState.startY),
            ),
            Math.max(minHeight, maxHeight),
          ),
        });
      },
      [minHeight, minWidth],
    );

    const handleResizePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
      const dragState = resizeDragRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      resizeDragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }, []);

    const mergedStyle: React.CSSProperties = {
      width: dialogSize.w,
      minWidth,
      minHeight,
      ...(dialogSize.h === undefined ? {} : { height: dialogSize.h }),
      ...style,
    };

    return (
      <div
        ref={innerRef}
        className={[
          "relative bg-[var(--ds-surface)] border border-[rgba(255,255,255,0.06)] max-w-[calc(100vw-2rem)] overflow-hidden",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={mergedStyle}
        {...rest}
      >
        {children}
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 z-10 size-5 cursor-nwse-resize touch-none bg-transparent"
          data-overlay-resize-handle="true"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerUp}
        />
      </div>
    );
  },
);
