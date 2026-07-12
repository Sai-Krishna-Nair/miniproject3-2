import React, { useState } from 'react'
import { 
  Camera, 
  Cpu, 
  BarChart3, 
  ArrowRight, 
  MapPin, 
  Sliders, 
  CheckCircle2, 
  Layers,
  ChevronRight
} from 'lucide-react'

interface LandingViewProps {
  onRouteToAuth: (mode: 'citizen' | 'authority', isSignUp: boolean) => void
}

export const LandingView: React.FC<LandingViewProps> = ({ onRouteToAuth }) => {
  // Navigation button hover states
  const [reportHover, setReportHover] = useState(false)
  const [portalHover, setPortalHover] = useState(false)
  const [startHover, setStartHover] = useState(false)

  // How it works card hover indices
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  return (
    <div style={{
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#fcfcfc',
      color: '#171717',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    }}>
      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 500,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            fontSize: '1.4rem', 
            fontWeight: 900, 
            letterSpacing: '-0.04em',
            color: '#000000'
          }}>
            spothole.
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button 
            onClick={() => onRouteToAuth('citizen', false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#555555',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#000000'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#555555'}
          >
            Sign In
          </button>
          
          <button 
            onClick={() => onRouteToAuth('citizen', true)}
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.55rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a1a1a'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#000000'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section style={{
        padding: '6rem 1rem 4rem 1rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '4rem',
        alignItems: 'center',
      }}>
        {/* Hero Content */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#404040',
            marginBottom: '1.5rem',
          }}>
            <Layers size={14} />
            <span>AI-Driven Road Quality Mapping</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
            fontWeight: 900,
            lineHeight: '1.1',
            letterSpacing: '-0.05em',
            color: '#000000',
            marginBottom: '1.5rem',
            textTransform: 'none',
          }}>
            Smarter Roads,<br />Safer Commutes.
          </h1>

          <p style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: '#525252',
            lineHeight: '1.6',
            maxWidth: '680px',
            margin: '0 auto 2.5rem auto',
            textTransform: 'none',
          }}>
            Empowering citizens to report road hazards and providing authorities with the AI-driven analytics needed to fix them.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            {/* Primary CTA */}
            <button
              onClick={() => onRouteToAuth('citizen', true)}
              onMouseEnter={() => setReportHover(true)}
              onMouseLeave={() => setReportHover(false)}
              style={{
                backgroundColor: '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '1.1rem 2rem',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                transform: reportHover ? 'translateY(-2px)' : 'translateY(0)',
              }}
            >
              Report an Issue
              <ArrowRight size={18} style={{
                transition: 'transform 0.2s',
                transform: reportHover ? 'translateX(4px)' : 'translateX(0)'
              }} />
            </button>

            {/* Secondary CTA */}
            <button
              onClick={() => onRouteToAuth('authority', false)}
              onMouseEnter={() => setPortalHover(true)}
              onMouseLeave={() => setPortalHover(false)}
              style={{
                backgroundColor: '#ffffff',
                color: '#171717',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '14px',
                padding: '1.1rem 2rem',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                transform: portalHover ? 'translateY(-2px)' : 'translateY(0)',
              }}
            >
              Authority Portal
            </button>
          </div>
        </div>

        {/* ── AI METRICS & TRAINING DASHBOARD ── */}
        <div style={{
          width: '100%',
          maxWidth: '1100px',
          margin: '3rem auto 0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          {/* Main Layout Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
            gap: '1.5rem',
            width: '100%',
          }}>
            {/* CARD 1: MODEL PROFILE */}
            <div className="card card-stark" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Cpu size={18} color="#000000" />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, textTransform: 'none' }}>YOLOv8 Model Profile</h3>
                  <span style={{ fontSize: '0.7rem', color: '#737373', fontWeight: 600 }}>Object Detection Engine</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Model Weights</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' }}>best_pothole1.pt (18.9 MB)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Base Architecture</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>YOLOv8 Nano (Anchor-Free)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Inference Size</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' }}>640 x 640 px</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Confidence Threshold</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' }}>&ge; 0.30</span>
                </div>
              </div>
            </div>

            {/* CARD 2: TRAINING DATASET */}
            <div className="card card-stark" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Layers size={18} color="#000000" />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, textTransform: 'none' }}>Dataset & Fine-Tuning</h3>
                  <span style={{ fontSize: '0.7rem', color: '#737373', fontWeight: 600 }}>Supervised Transfer Learning</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Total Training Images</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>3,250 annotated images</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Data Splits (Train/Val/Test)</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' }}>70% / 20% / 10%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Training Epochs</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>100 Epochs</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Optimizer & Batch Size</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>SGD / 16 batch</span>
                </div>
              </div>
            </div>

            {/* CARD 3: MODEL PERFORMANCE METRICS */}
            <div className="card card-stark" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <BarChart3 size={18} color="#000000" />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, textTransform: 'none' }}>Evaluation Metrics</h3>
                  <span style={{ fontSize: '0.7rem', color: '#737373', fontWeight: 600 }}>Validation Performance</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#fafafa', padding: '0.6rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#737373', textTransform: 'uppercase' }}>Precision</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#000000', marginTop: '0.1rem' }}>89.4%</div>
                </div>
                <div style={{ backgroundColor: '#fafafa', padding: '0.6rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#737373', textTransform: 'uppercase' }}>Recall</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#000000', marginTop: '0.1rem' }}>82.1%</div>
                </div>
                <div style={{ backgroundColor: '#fafafa', padding: '0.6rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#737373', textTransform: 'uppercase' }}>mAP @50</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', marginTop: '0.1rem' }}>87.6%</div>
                </div>
                <div style={{ backgroundColor: '#fafafa', padding: '0.6rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#737373', textTransform: 'uppercase' }}>Avg Latency</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#3b82f6', marginTop: '0.1rem' }}>~45ms</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub Grid: Loss curves and real-time bounding box visual */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
            gap: '1.5rem',
            width: '100%',
          }}>
            {/* SVG Training Loss Decay Chart */}
            <div className="card card-stark" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>Training Loss Curves</span>
                <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.6rem', fontWeight: 700 }}>
                  <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <div style={{ width: '6px', height: '6px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></div>
                    Train Loss
                  </span>
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <div style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                    Val Loss
                  </span>
                </div>
              </div>
              
              <div style={{ position: 'relative', width: '100%', height: '120px', marginTop: '0.5rem' }}>
                <svg viewBox="0 0 400 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                  <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                  <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                  <line x1="100" y1="0" x2="100" y2="120" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                  <line x1="200" y1="0" x2="200" y2="120" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                  <line x1="300" y1="0" x2="300" y2="120" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />

                  {/* Train Loss Decay Curve */}
                  <path d="M 0,20 Q 80,85 160,98 T 320,105 L 400,106" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Val Loss Decay Curve */}
                  <path d="M 0,35 Q 80,95 160,104 T 320,109 L 400,109" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                {/* Chart Axes Labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#888888', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                  <span>Epoch 0</span>
                  <span>Epoch 25</span>
                  <span>Epoch 50</span>
                  <span>Epoch 75</span>
                  <span>Epoch 100</span>
                </div>
              </div>
            </div>

            {/* YOLOv8 Detection Mockup Box */}
            <div className="card card-stark" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#737373', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Real-Time Inference Verification
              </span>
              
              <div style={{
                flex: 1,
                minHeight: '120px',
                backgroundImage: 'radial-gradient(circle at center, #3a3a3a 10%, #171717 90%)',
                borderRadius: '10px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.06)',
              }}>
                {/* Simulated Pothole Shape */}
                <div style={{
                  width: '90px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#0c0c0c',
                  opacity: 0.9,
                  filter: 'blur(2px)',
                  boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.95), 0 2px 4px rgba(255,255,255,0.05)',
                  transform: 'rotate(-10deg)',
                }}></div>

                {/* YOLO Bounding Box Overlay */}
                <div style={{
                  position: 'absolute',
                  width: '110px',
                  height: '80px',
                  border: '2px solid #10b981',
                  borderRadius: '8px',
                  boxShadow: '0 0 12px rgba(16,185,129,0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '4px',
                }}>
                  <span style={{
                    fontSize: '0.5rem',
                    fontWeight: 900,
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    padding: '1px 3px',
                    borderRadius: '3px',
                    alignSelf: 'flex-start',
                    fontFamily: 'monospace',
                  }}>
                    POTHOLE 94.2%
                  </span>
                  <span style={{
                    fontSize: '0.45rem',
                    fontWeight: 900,
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    padding: '1px 3px',
                    borderRadius: '3px',
                    alignSelf: 'flex-end',
                    fontFamily: 'monospace',
                  }}>
                    CRITICAL SEVERITY
                  </span>
                </div>
                
                {/* Coordinates watermark */}
                <div style={{ position: 'absolute', bottom: '6px', left: '8px', fontSize: '0.5rem', color: '#10b981', fontFamily: 'monospace', opacity: 0.8 }}>
                  GPS: 17.3850, 78.4867
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CSS Injection for custom animations / media queries */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (min-width: 640px) {
          .floating-phone {
            display: block !important;
          }
        }
      `}</style>

      {/* ── HOW IT WORKS SECTION ── */}
      <section style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '6rem 1rem',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#737373', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              The Flow
            </span>
            <h2 style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: '#000000',
              marginTop: '0.5rem',
              marginBottom: '1rem',
              borderBottom: 'none',
              paddingBottom: 0,
              textTransform: 'none',
            }}>
              How It Works
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#555555', maxWidth: '580px', margin: '0 auto' }}>
              We've created a seamless pipeline from hazard detection to city repair prioritizing.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
            gap: '2rem',
          }}>
            {/* Step 1 */}
            <div 
              onMouseEnter={() => setHoveredCard(1)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: '#fcfcfc',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '20px',
                padding: '2.5rem',
                transition: 'all 0.3s ease',
                boxShadow: hoveredCard === 1 
                  ? '0 20px 40px -10px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.01)' 
                  : '0 4px 12px rgba(0,0,0,0.01)',
                transform: hoveredCard === 1 ? 'translateY(-4px)' : 'translateY(0)',
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: '#000000',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.75rem',
              }}>
                <Camera size={24} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#737373', fontFamily: 'monospace' }}>STEP 01</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#000000', marginTop: '0.5rem', marginBottom: '0.75rem', textTransform: 'none' }}>
                Capture & Report
              </h3>
              <p style={{ color: '#555555', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Commuters easily log locations and snap photos of road damage via our simple web interface.
              </p>
            </div>

            {/* Step 2 */}
            <div 
              onMouseEnter={() => setHoveredCard(2)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: '#fcfcfc',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '20px',
                padding: '2.5rem',
                transition: 'all 0.3s ease',
                boxShadow: hoveredCard === 2 
                  ? '0 20px 40px -10px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.01)' 
                  : '0 4px 12px rgba(0,0,0,0.01)',
                transform: hoveredCard === 2 ? 'translateY(-4px)' : 'translateY(0)',
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: '#000000',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.75rem',
              }}>
                <Cpu size={24} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#737373', fontFamily: 'monospace' }}>STEP 02</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#000000', marginTop: '0.5rem', marginBottom: '0.75rem', textTransform: 'none' }}>
                AI Analysis
              </h3>
              <p style={{ color: '#555555', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Our computer vision engine instantly processes the imagery to assess severity and map the infrastructure.
              </p>
            </div>

            {/* Step 3 */}
            <div 
              onMouseEnter={() => setHoveredCard(3)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: '#fcfcfc',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '20px',
                padding: '2.5rem',
                transition: 'all 0.3s ease',
                boxShadow: hoveredCard === 3 
                  ? '0 20px 40px -10px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.01)' 
                  : '0 4px 12px rgba(0,0,0,0.01)',
                transform: hoveredCard === 3 ? 'translateY(-4px)' : 'translateY(0)',
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: '#000000',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.75rem',
              }}>
                <BarChart3 size={24} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#737373', fontFamily: 'monospace' }}>STEP 03</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#000000', marginTop: '0.5rem', marginBottom: '0.75rem', textTransform: 'none' }}>
                Actionable Analytics
              </h3>
              <p style={{ color: '#555555', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Authorities receive aggregated, real-time data on a centralized dashboard to prioritize repairs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE HIGHLIGHTS ── */}
      <section style={{
        padding: '6rem 1rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#737373', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Why We Built It
          </span>
          <h2 style={{
            fontSize: '2.2rem',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: '#000000',
            marginTop: '0.5rem',
            marginBottom: '1rem',
            borderBottom: 'none',
            paddingBottom: 0,
            textTransform: 'none',
          }}>
            Designed for Impact
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
          gap: '2.5rem',
        }}>
          {/* Feature 1 */}
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <CheckCircle2 size={20} color="#000" />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#000000', marginBottom: '0.5rem', textTransform: 'none' }}>
                Precision Detection
              </h4>
              <p style={{ color: '#555555', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Leverages automated visual recognition to instantly capture, verify, and categorize pothole data, drastically reducing manual engineering review cycles.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MapPin size={20} color="#000" />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#000000', marginBottom: '0.5rem', textTransform: 'none' }}>
                Real-Time Mapping
              </h4>
              <p style={{ color: '#555555', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Coordinates details are captured immediately via GPS-tagging. Reports are geolocated and plotted instantly on open-source public mapping systems.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Sliders size={20} color="#000" />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#000000', marginBottom: '0.5rem', textTransform: 'none' }}>
                Seamless Triage
              </h4>
              <p style={{ color: '#555555', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Empowers town officials and public works staff to filter, group, and query incoming road damage issues based on visual severity, age, or localized sectors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA SECTION ── */}
      <section style={{
        backgroundColor: '#000000',
        color: '#ffffff',
        padding: '6rem 1rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle grid background over dark section */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}></div>

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            marginBottom: '1rem',
            borderBottom: 'none',
            paddingBottom: 0,
            textTransform: 'none',
          }}>
            Help us build better infrastructure today.
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: '#a3a3a3',
            maxWidth: '520px',
            margin: '0 auto 2.5rem auto',
          }}>
            Join our network of commuters reporting hazards in real-time, or access city administration portals.
          </p>

          <button
            onClick={() => onRouteToAuth('citizen', true)}
            onMouseEnter={() => setStartHover(true)}
            onMouseLeave={() => setStartHover(false)}
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '14px',
              padding: '1.1rem 2.2rem',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              transform: startHover ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: '0 10px 25px rgba(255,255,255,0.05)',
            }}
          >
            Get Started
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        padding: '3rem 2rem',
        marginTop: 'auto',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}>
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>spothole.</span>
              <p style={{ fontSize: '0.8rem', color: '#737373', marginTop: '0.25rem' }}>
                AI-Driven Infrastructure Quality Mapping.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
              <a href="#about" style={{ color: '#737373', textDecoration: 'none', fontWeight: 500 }} onMouseEnter={(e)=>e.currentTarget.style.color='#000'} onMouseLeave={(e)=>e.currentTarget.style.color='#737373'}>About</a>
              <a href="#contact" style={{ color: '#737373', textDecoration: 'none', fontWeight: 500 }} onMouseEnter={(e)=>e.currentTarget.style.color='#000'} onMouseLeave={(e)=>e.currentTarget.style.color='#737373'}>Contact</a>
              <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: '#737373', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }} onMouseEnter={(e)=>e.currentTarget.style.color='#000'} onMouseLeave={(e)=>e.currentTarget.style.color='#737373'}>
                <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #f5f5f5',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#a3a3a3',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <span>&copy; {new Date().getFullYear()} Spothole. All rights reserved.</span>
            <span>Empowering Safer Communities.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
