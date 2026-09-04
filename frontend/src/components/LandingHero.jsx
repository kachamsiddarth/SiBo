import React from 'react';

export function LandingHero({ onNavigate }) {
  return (
    <div style={{
      position: 'relative',
      minHeight: 'calc(100vh - 73px)',
      background: 'transparent',
      overflow: 'hidden'
    }}>
      {/* Bluish Splash — concentrated on right side, deeper intensity + smoother fade */}
      <div
        style={{
          position: 'absolute',
          top: '-12%',
          right: '-18%',
          width: '78%',
          height: '135%',
          background: 'radial-gradient(ellipse at 68% 33%, rgba(128, 168, 215, 0.78) 0%, rgba(148, 186, 228, 0.65) 18%, rgba(175, 205, 237, 0.50) 40%, rgba(196, 220, 242, 0.28) 62%, rgba(215, 232, 245, 0.10) 82%, transparent 95%)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Architectural Flowing Contour Lines — coordinated family: ALL lines enter from TOP, flow DOWN-RIGHT, single bend zone, fan to RIGHT + BOTTOM-RIGHT. No crossings. */}
      <svg
        style={{
          position: 'absolute',
          top: '-5%',
          right: '0%',
          width: '100%',
          height: '115%',
          zIndex: 0,
          pointerEvents: 'none'
        }}
        viewBox="0 0 1200 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMaxYMid slice"
      >
        {/*
          FAMILY STRUCTURE (10 parallel-ish curves, each with same overall bend-shape):
          Each path = M topEntry C cp1(drift down-right), cp2(push toward bend), bendInflection C cp3(push right-out), cp4(fan to exit), exitPoint

          INEQUALITY INVARIANTS (no path crossings):
            For i < j (Line i is OUTER, Line j is INNER):
              entry_x[i] < entry_x[j]         (ordered left→right at top)
              bend_x[i]  < bend_x[j]          (bend happens more left for outer lines)
              bend_y[i]  < bend_y[j]          (bend happens higher for outer lines)
              exit_y[i]  < exit_y[j]          (outer lines exit higher on right / inner lines exit lower / bottom)

          Opacity descends outer→inner (0.62 → 0.22) for depth.
        */}

        {/* Line A — OUTERMOST / TOPMOST: enters left-of-center top, shallowest descent, exits high on right edge */}
        <path
          d="M 640 -40 C 665 80, 710 220, 770 345 C 860 375, 1020 340, 1220 305"
          stroke="#0F172A"
          strokeWidth="1.1"
          opacity="0.62"
          fill="none"
          strokeLinecap="round"
        />
        {/* Line B — Outer-2: entry +28px right of A, bend slightly deeper/lower, exits right edge a little below A */}
        <path
          d="M 668 -40 C 693 85, 738 230, 795 365 C 882 400, 1035 380, 1220 355"
          stroke="#0F172A"
          strokeWidth="1.1"
          opacity="0.58"
          fill="none"
          strokeLinecap="round"
        />
        {/* Line 1 — Outer-3: enters top band x=696 */}
        <path
          d="M 696 -40 C 721 92, 766 242, 820 390 C 905 430, 1050 425, 1220 408"
          stroke="#0F172A"
          strokeWidth="1.05"
          opacity="0.54"
          fill="none"
          strokeLinecap="round"
        />
        {/* Line 2 — Outer-4: x=724 */}
        <path
          d="M 724 -40 C 749 98, 794 255, 845 415 C 928 462, 1062 475, 1220 462"
          stroke="#0F172A"
          strokeWidth="1.05"
          opacity="0.50"
          fill="none"
          strokeLinecap="round"
        />
        {/* Line 3 — Mid-1: x=752, starts bending more to vertical exit */}
        <path
          d="M 752 -40 C 776 105, 820 268, 870 442 C 950 495, 1072 530, 1220 522"
          stroke="#0F172A"
          strokeWidth="1.0"
          opacity="0.46"
          fill="none"
          strokeLinecap="round"
        />
        {/* Line 4 — Mid-2: x=780, exits still on right edge but lower */}
        <path
          d="M 780 -40 C 803 112, 846 282, 895 472 C 972 532, 1080 600, 1215 595"
          stroke="#0F172A"
          strokeWidth="1.0"
          opacity="0.42"
          fill="none"
          strokeLinecap="round"
        />
        {/* Line 5 — Mid-3: x=808, first one to exit the BOTTOM-RIGHT corner instead of right edge */}
        <path
          d="M 808 -40 C 830 118, 872 298, 920 505 C 995 575, 1085 720, 1145 920"
          stroke="#0F172A"
          strokeWidth="0.95"
          opacity="0.38"
          fill="none"
          strokeLinecap="round"
        />
        {/* Line 6 — Inner-3: x=836, exits bottom edge ~x=1040 */}
        <path
          d="M 836 -40 C 857 125, 898 315, 945 540 C 1018 620, 1020 760, 1040 920"
          stroke="#0F172A"
          strokeWidth="0.9"
          opacity="0.33"
          fill="none"
          strokeLinecap="round"
        />
        {/* Line 7 — Inner-2: x=864, exits bottom edge ~x=940 */}
        <path
          d="M 864 -40 C 884 132, 924 332, 970 575 C 1040 665, 970 790, 935 920"
          stroke="#0F172A"
          strokeWidth="0.88"
          opacity="0.28"
          fill="none"
          strokeLinecap="round"
        />
        {/* Line 8 — INNERMOST: x=892, tightest bend, exits bottom edge ~x=830 (furthest left fanned) */}
        <path
          d="M 892 -40 C 910 138, 950 348, 995 610 C 1062 710, 910 820, 830 920"
          stroke="#0F172A"
          strokeWidth="0.85"
          opacity="0.22"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      <div className="container" style={{
        position: 'relative',
        zIndex: 1,
        paddingTop: 'clamp(4rem, 12vh, 8rem)',
        paddingBottom: 'var(--sibo-space-3xl)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        minHeight: 'calc(100vh - 73px)'
      }}>
        {/* Left Side Content - Matching Reference */}
        <div style={{ maxWidth: '680px' }}>
          {/* Eyebrow Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(37, 99, 235, 0.1)',
            color: 'var(--sibo-primary)',
            borderRadius: 'var(--sibo-radius-md)',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: 'var(--sibo-space-xl)',
            border: '1px solid rgba(37, 99, 235, 0.2)'
          }}>
           
            
            
          </div>

          {/* Huge Editorial Headline - Matching Reference Exactly */}
          <h1 style={{
            fontSize: 'clamp(2.75rem, 6vw, 4.5rem)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-0.04em',
            color: 'var(--sibo-text-primary)',
            marginBottom: 'var(--sibo-space-xl)',
            maxWidth: '800px'
          }}>
            Reconcile Payments.<br />
            Resolve Exceptions.<br />
            With Intelligence
          </h1>

          {/* Description - Matching Reference Exactly */}
          <p style={{
            fontSize: '1.125rem',
            lineHeight: 1.7,
            color: 'var(--sibo-text-secondary)',
            marginBottom: 'var(--sibo-space-2xl)',
            maxWidth: '500px'
          }}>
           Turn payment and settlement data into a clear financial picture. SiBo detects discrepancies, explains exceptions, and helps teams resolve them faster.
          </p>

          {/* Single CTA - Matching Reference exactly: tall square button with top-left external icon */}
          <button
            onClick={() => onNavigate('/reconcile')}
            className="btn btn-outline"
            style={{
              padding: '1.25rem 1.5rem',
              fontSize: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              border: '1.5px solid var(--sibo-line-dark)',
              borderRadius: '10px',
              backgroundColor: 'transparent',
              transition: 'all 0.15s ease',
              width: '230px',
              height: '120px',
              textAlign: 'left',
              boxShadow: 'none'
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7"></path>
              <path d="M7 7h10v10"></path>
            </svg>
            <span style={{ fontWeight: 600, color: 'var(--sibo-text-primary)' }}>Start Reconciliation</span>
          </button>
        </div>
      </div>

      {/* TVL Card - Dark on Right Side (outside container for proper edge alignment) */}
      <div style={{
        position: 'absolute',
        right: 'clamp(1rem, 4vw, 3.5rem)',
        bottom: 'clamp(2rem, 6vw, 5rem)',
        zIndex: 2,
        width: '340px',
        maxWidth: 'calc(100vw - 2rem)',
        background: '#0F172A',
        borderRadius: '14px',
        padding: '1.75rem',
        color: 'white',
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.35)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2.5rem'
        }}>
          <div style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)'
          }}>
            SAVINGS TVL
          </div>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6">
            <rect x="5" y="2" width="4" height="20" rx="1" />
            <rect x="10" y="2" width="4" height="20" rx="1" />
            <rect x="15" y="2" width="4" height="20" rx="1" />
          </svg>
        </div>

        <div style={{
          fontSize: '3.75rem',
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          color: 'white',
          marginBottom: '2rem'
        }}>
          $4.07B
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '30%',
            height: '100%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.5) 100%)',
            borderRadius: '3px'
          }} />
        </div>
      </div>
    </div>
  );
}
