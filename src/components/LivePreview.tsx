import { useState } from 'react';
import { LiveProvider, LivePreview as ReactLivePreview, LiveError } from 'react-live';

type Viewport = 'mobile' | 'tablet' | 'desktop';

const VIEWPORT_LABELS: Record<Viewport, string> = {
  mobile: '모바일',
  tablet: '태블릿',
  desktop: '데스크탑',
};

const VIEWPORT_MAX_WIDTHS: Record<Viewport, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '100%',
};

interface LivePreviewProps {
  code: string;
}

export function LivePreview({ code }: LivePreviewProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop');

  return (
    <div className="preview-panel">
      <div className="panel-header">
        <h3>미리보기</h3>
        <div className="viewport-toggle">
          {(['mobile', 'tablet', 'desktop'] as Viewport[]).map((v) => (
            <button
              key={v}
              className={`btn-viewport${viewport === v ? ' btn-viewport--active' : ''}`}
              onClick={() => setViewport(v)}
              title={v === 'desktop' ? '데스크탑 (전체 폭)' : `${VIEWPORT_LABELS[v]} (${VIEWPORT_MAX_WIDTHS[v]})`}
            >
              {VIEWPORT_LABELS[v]}
            </button>
          ))}
        </div>
      </div>
      <div className="preview-content">
        <LiveProvider code={code} noInline>
          <div className="preview-render">
            <div
              className="preview-viewport"
              style={{ maxWidth: VIEWPORT_MAX_WIDTHS[viewport] }}
            >
              <ReactLivePreview />
            </div>
          </div>
          <LiveError className="preview-error" />
        </LiveProvider>
      </div>
    </div>
  );
}
