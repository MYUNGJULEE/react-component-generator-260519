import { useState } from 'react';
import type { StreamingComponent } from '../types';

interface StreamingCardProps {
  component: StreamingComponent;
}

type Tab = 'preview' | 'code';

export function StreamingCard({ component }: StreamingCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('code');

  return (
    <div className="component-card" style={{ opacity: 0.9 }}>
      <div className="card-header">
        <div className="card-title-group">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                animation: 'pulse 1.2s ease-in-out infinite',
              }}
            />
            생성 중...
          </span>
          <p className="card-prompt">{component.prompt}</p>
        </div>
      </div>

      <div className="card-tabs">
        <button
          className={`tab ${activeTab === 'preview' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          미리보기
        </button>
        <button
          className={`tab ${activeTab === 'code' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          코드
        </button>
      </div>

      <div className="card-content">
        {activeTab === 'preview' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: '#888',
              fontSize: '14px',
            }}
          >
            코드 생성이 완료된 후 미리보기를 확인할 수 있습니다.
          </div>
        ) : (
          <div className="code-panel">
            <div className="panel-header">
              <h3>코드</h3>
            </div>
            <pre className="code-block">
              <code>
                {component.streamingCode}
                <span
                  style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '1em',
                    backgroundColor: 'currentColor',
                    marginLeft: '1px',
                    verticalAlign: 'text-bottom',
                    animation: 'blink 0.8s step-end infinite',
                  }}
                />
              </code>
            </pre>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
