import React, { useState } from 'react';

const MODELS = [
  {
    id: 'claude-opus-4-8',
    alias: 'opus',
    name: 'Opus 4.8',
    context: '1,000,000',
    inputPriceM: 15,
    outputPriceM: 75,
    cachePriceM: 1.5,
    tier: 5,
    color: '#d2a8ff',
    badge: 'NEWEST',
    description: 'Most capable model for the hardest problems. Frontier reasoning, complex architecture decisions, ambiguous requirements analysis.',
    bestFor: ['Architectural design', 'Complex multi-system debugging', 'Ambiguous problem solving', 'Research-grade analysis', 'Novel algorithm design'],
    notFor: ['Simple edits', 'Bulk formatting', 'Standard feature work'],
  },
  {
    id: 'claude-opus-4-7',
    alias: null,
    name: 'Opus 4.7',
    context: '1,000,000',
    inputPriceM: 15,
    outputPriceM: 75,
    cachePriceM: 1.5,
    tier: 4,
    color: '#c084fc',
    badge: null,
    description: 'Highly capable for complex reasoning and architecture with 1M context window. Default for xhigh effort sessions.',
    bestFor: ['Complex debugging', 'System design', 'Large codebase analysis', 'xhigh effort tasks'],
    notFor: ['Simple edits', 'Bulk operations'],
  },
  {
    id: 'claude-opus-4-6',
    alias: null,
    name: 'Opus 4.6',
    context: '1,000,000',
    inputPriceM: 15,
    outputPriceM: 75,
    cachePriceM: 1.5,
    tier: 4,
    color: '#a78bfa',
    badge: null,
    description: 'Powerful analysis for heavy documentation tasks and long documents requiring deep understanding.',
    bestFor: ['Long document analysis', 'Comprehensive reviews', 'Heavy analysis tasks'],
    notFor: ['Quick tasks', 'Bulk operations'],
  },
  {
    id: 'claude-sonnet-4-6',
    alias: 'sonnet',
    name: 'Sonnet 4.6',
    context: '200,000',
    inputPriceM: 3,
    outputPriceM: 15,
    cachePriceM: 0.3,
    tier: 3,
    color: '#58a6ff',
    badge: 'DEFAULT',
    description: 'The best balance of quality and speed for daily development work. Default model for most Claude Code sessions.',
    bestFor: ['Daily feature development', 'Code review', 'Test writing', 'Standard debugging', 'Documentation'],
    notFor: ['Frontier reasoning', 'Complex architecture'],
  },
  {
    id: 'claude-haiku-4-5',
    alias: 'haiku',
    name: 'Haiku 4.5',
    context: '200,000',
    inputPriceM: 0.8,
    outputPriceM: 4,
    cachePriceM: 0.08,
    tier: 1,
    color: '#7ee787',
    badge: 'FASTEST',
    description: 'Optimized for speed and cost. 10-20x cheaper than Opus. Ideal for bulk operations, CI/CD pipelines, and simple edits.',
    bestFor: ['Bulk file operations', 'CI/CD pipelines', 'Simple formatting', 'Quick edits', 'Cost-sensitive automation'],
    notFor: ['Complex reasoning', 'Architecture decisions'],
  },
];

export default function ModelsDiagram() {
  const [activeTab, setActiveTab] = useState('comparison');
  const [selectedModel, setSelectedModel] = useState(null);
  const [inputK, setInputK] = useState(100);
  const [outputK, setOutputK] = useState(30);
  const [cacheHit, setCacheHit] = useState(80);

  const tabs = [
    { id: 'comparison', label: 'Model Comparison' },
    { id: 'decision', label: 'Decision Guide' },
    { id: 'pricing', label: 'Pricing Calculator' },
  ];

  const calcCost = (model, inputTokens, outputTokens, cacheHitPct) => {
    const cacheRatio = cacheHitPct / 100;
    const freshInput = inputTokens * (1 - cacheRatio);
    const cachedInput = inputTokens * cacheRatio;
    return (
      (freshInput / 1_000_000) * model.inputPriceM +
      (cachedInput / 1_000_000) * model.cachePriceM +
      (outputTokens / 1_000_000) * model.outputPriceM
    );
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #30363d' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 18px',
              border: 'none',
              background: activeTab === t.id ? '#1f6feb' : 'transparent',
              color: activeTab === t.id ? '#fff' : '#8b949e',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === t.id ? 600 : 400,
              fontSize: 14,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Model Comparison */}
      {activeTab === 'comparison' && (
        <div>
          <p style={{ color: '#8b949e', fontSize: 13, marginBottom: 20 }}>
            Click any model card to see details. Models ordered by capability (highest first).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MODELS.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedModel(selectedModel?.id === m.id ? null : m)}
                style={{
                  border: `1px solid ${selectedModel?.id === m.id ? m.color : '#30363d'}`,
                  borderRadius: 8,
                  padding: '14px 18px',
                  cursor: 'pointer',
                  background: selectedModel?.id === m.id ? 'rgba(30,40,50,0.8)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%',
                      background: m.color, flexShrink: 0,
                    }} />
                    <code style={{ color: m.color, fontSize: 15, fontWeight: 600 }}>{m.id}</code>
                    {m.alias && (
                      <span style={{
                        fontSize: 11, padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(88,166,255,0.15)', color: '#58a6ff',
                      }}>
                        alias: {m.alias}
                      </span>
                    )}
                    {m.badge && (
                      <span style={{
                        fontSize: 11, padding: '2px 6px', borderRadius: 4,
                        background: m.badge === 'NEWEST' ? 'rgba(210,168,255,0.2)' :
                                    m.badge === 'DEFAULT' ? 'rgba(88,166,255,0.2)' : 'rgba(126,231,135,0.2)',
                        color: m.badge === 'NEWEST' ? '#d2a8ff' :
                               m.badge === 'DEFAULT' ? '#58a6ff' : '#7ee787',
                        fontWeight: 700,
                      }}>
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#8b949e' }}>{m.context} ctx</span>
                    <span style={{ fontSize: 12, color: '#8b949e' }}>${m.inputPriceM}/M in</span>
                    <span style={{ fontSize: 12, color: '#8b949e' }}>${m.outputPriceM}/M out</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{
                          width: 8, height: 8, borderRadius: 2,
                          background: i <= m.tier ? m.color : '#30363d',
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
                {selectedModel?.id === m.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #30363d' }}>
                    <p style={{ color: '#c9d1d9', fontSize: 14, margin: '0 0 12px' }}>{m.description}</p>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#7ee787', fontWeight: 600, marginBottom: 6 }}>✓ Best for</div>
                        {m.bestFor.map(b => (
                          <div key={b} style={{ fontSize: 13, color: '#8b949e', marginBottom: 3 }}>• {b}</div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#f78166', fontWeight: 600, marginBottom: 6 }}>✗ Not ideal for</div>
                        {m.notFor.map(n => (
                          <div key={n} style={{ fontSize: 13, color: '#8b949e', marginBottom: 3 }}>• {n}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Decision Guide */}
      {activeTab === 'decision' && (
        <div>
          <p style={{ color: '#8b949e', fontSize: 13, marginBottom: 20 }}>
            Use this guide to choose the right model for your task. Match task characteristics to the recommended model.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[
              {
                title: 'Simple / Bulk Tasks',
                model: 'claude-haiku-4-5',
                color: '#7ee787',
                tasks: ['Rename variables across files', 'Format/lint fixes', 'Simple one-liner changes', 'CI/CD quick scans', 'Bulk boilerplate generation'],
                why: '10-20x cheaper than Opus. Use it for anything that does not require reasoning.',
              },
              {
                title: 'Standard Development',
                model: 'claude-sonnet-4-6',
                color: '#58a6ff',
                tasks: ['Add a new feature', 'Write unit tests', 'Code review', 'Fix a specific bug', 'Write documentation', 'Refactoring with clear scope'],
                why: 'Best balance of quality and speed. The right default for 80% of daily work.',
              },
              {
                title: 'Complex Analysis',
                model: 'claude-opus-4-7',
                color: '#c084fc',
                tasks: ['Debug a systemic issue', 'Review security model', 'Plan a major refactor', 'Understand unfamiliar large codebase', 'xhigh effort sessions'],
                why: '1M context window with strong reasoning. For tasks where Sonnet gives unsatisfying answers.',
              },
              {
                title: 'Frontier Problems',
                model: 'claude-opus-4-8',
                color: '#d2a8ff',
                tasks: ['Novel algorithm design', 'Ambiguous architectural decisions', 'Cross-cutting system redesign', 'Hardest debugging problems', 'Research-grade analysis'],
                why: 'Most capable model. Use when Opus 4.7 isn\\'t cutting it \\u2014 for the hardest 5% of problems.',
              },
            ].map(card => (
              <div key={card.title} style={{
                border: `1px solid ${card.color}40`,
                borderRadius: 8,
                padding: 16,
                background: `${card.color}08`,
              }}>
                <div style={{ fontWeight: 700, color: card.color, marginBottom: 4, fontSize: 15 }}>{card.title}</div>
                <code style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 10 }}>{card.model}</code>
                <div style={{ marginBottom: 10 }}>
                  {card.tasks.map(t => (
                    <div key={t} style={{ fontSize: 13, color: '#c9d1d9', marginBottom: 4 }}>• {t}</div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#8b949e', fontStyle: 'italic', borderTop: `1px solid ${card.color}30`, paddingTop: 8 }}>
                  {card.why}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, padding: 16, border: '1px solid #30363d', borderRadius: 8, background: 'rgba(30,40,50,0.5)' }}>
            <div style={{ fontWeight: 600, color: '#c9d1d9', marginBottom: 10 }}>Switch model mid-session</div>
            <code style={{ display: 'block', fontSize: 13, color: '#7ee787', marginBottom: 6 }}>/model claude-opus-4-8</code>
            <code style={{ display: 'block', fontSize: 13, color: '#7ee787', marginBottom: 6 }}>/model claude-haiku-4-5</code>
            <code style={{ display: 'block', fontSize: 13, color: '#7ee787', marginBottom: 6 }}>--model claude-sonnet-4-6  # CLI flag</code>
            <code style={{ display: 'block', fontSize: 13, color: '#7ee787' }}>/fast  # Toggle Fast Mode (Opus, faster output)</code>
          </div>
        </div>
      )}

      {/* TAB 3: Pricing Calculator */}
      {activeTab === 'pricing' && (
        <div>
          <p style={{ color: '#8b949e', fontSize: 13, marginBottom: 20 }}>
            Estimate cost per session. Adjust input/output tokens and cache hit rate to see real-time cost comparison across all models.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ padding: 16, border: '1px solid #30363d', borderRadius: 8 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b949e', marginBottom: 4 }}>
                Input tokens: <strong style={{ color: '#c9d1d9' }}>{(inputK * 1000).toLocaleString()}</strong>
              </label>
              <input type="range" min={1} max={1000} value={inputK}
                onChange={e => setInputK(Number(e.target.value))}
                style={{ width: '100%' }} />
            </div>
            <div style={{ padding: 16, border: '1px solid #30363d', borderRadius: 8 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b949e', marginBottom: 4 }}>
                Output tokens: <strong style={{ color: '#c9d1d9' }}>{(outputK * 1000).toLocaleString()}</strong>
              </label>
              <input type="range" min={1} max={200} value={outputK}
                onChange={e => setOutputK(Number(e.target.value))}
                style={{ width: '100%' }} />
            </div>
            <div style={{ padding: 16, border: '1px solid #30363d', borderRadius: 8 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b949e', marginBottom: 4 }}>
                Cache hit rate: <strong style={{ color: '#c9d1d9' }}>{cacheHit}%</strong>
              </label>
              <input type="range" min={0} max={100} value={cacheHit}
                onChange={e => setCacheHit(Number(e.target.value))}
                style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MODELS.map(m => {
              const cost = calcCost(m, inputK * 1000, outputK * 1000, cacheHit);
              const cheapestCost = calcCost(MODELS[MODELS.length - 1], inputK * 1000, outputK * 1000, cacheHit);
              const ratio = cheapestCost > 0 ? cost / cheapestCost : 1;
              return (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', border: '1px solid #30363d', borderRadius: 8,
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                  <code style={{ color: m.color, fontSize: 13, minWidth: 200 }}>{m.id}</code>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      height: 8, borderRadius: 4, background: m.color + '30',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: `${Math.min((ratio / (MODELS[0].inputPriceM / MODELS[MODELS.length-1].inputPriceM)) * 100, 100)}%`,
                        background: m.color,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: '#c9d1d9', minWidth: 80, textAlign: 'right',
                  }}>
                    ${cost < 0.01 ? cost.toFixed(4) : cost.toFixed(3)}
                  </div>
                  {ratio > 1 && (
                    <div style={{ fontSize: 12, color: '#8b949e', minWidth: 60, textAlign: 'right' }}>
                      {ratio.toFixed(1)}×
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, padding: 12, border: '1px solid #30363d', borderRadius: 8, fontSize: 13, color: '#8b949e' }}>
            <strong style={{ color: '#7ee787' }}>Tip:</strong> Increase cache hit rate to 80%+ for repeated sessions with the same CLAUDE.md.
            Cache hit rate above 80% reduces Sonnet session cost by ~70%.
          </div>
        </div>
      )}
    </div>
  );
}
