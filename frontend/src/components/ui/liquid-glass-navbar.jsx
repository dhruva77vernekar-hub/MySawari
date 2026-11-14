/**
 * Nimbus UI · Liquid Water Navbar — "Waterline Crystal"
 * Pure WebGL Caustic Water Shader + Liquid Mercury Morphing Drop
 * Tabs: HOME · SAWARI AI · PROFILE · RIDE BUDDY
 */
import * as React from "react"

const PAD = 16

/* ---------- CSS ---------- */
const NIMBUS_CSS = `
.nimbus-nav {
  --n-tint: rgba(255, 255, 255, 0.45);
  --n-fg: #0B132B;
  --n-fg-soft: rgba(11, 19, 43, 0.65);
  --n-rim: rgba(255, 255, 255, 0.95);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 5px;
  border-radius: 999px;
  isolation: isolate;
  font-family: ui-sans-serif, -apple-system, "SF Pro Text", "Segoe UI", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 
    0 10px 30px -5px rgba(58, 77, 255, 0.14),
    0 4px 12px rgba(0, 0, 0, 0.04),
    inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95),
    inset 0 -1.5px 2px 0 rgba(58, 77, 255, 0.08);
}

.nimbus-pill {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  z-index: 1;
  transition: transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform, width;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(235, 243, 255, 0.88) 100%);
  box-shadow: 
    0 4px 20px rgba(58, 77, 255, 0.22),
    0 1px 3px rgba(0, 0, 0, 0.06),
    inset 0 1px 1px rgba(255, 255, 255, 1),
    inset 0 -1px 2px rgba(58, 77, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.nimbus-canvas {
  position: absolute;
  inset: -${PAD}px;
  border-radius: 999px;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.nimbus-item {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6.5px 14px;
  border-radius: 999px;
  cursor: pointer;
  border: none;
  background: none;
  color: var(--n-fg-soft);
  transition: color 0.18s, transform 0.15s;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}

.nimbus-item:hover {
  color: #0A0A14;
}

.nimbus-item:active {
  transform: scale(0.96);
}

.nimbus-item.active {
  color: #0A0A14;
}

.nimbus-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1;
}

.nimbus-ripple {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(circle, rgba(58, 77, 255, 0.28) 0%, rgba(69, 224, 242, 0.18) 50%, transparent 70%);
  animation: nv-ripple 0.55s ease-out forwards;
  z-index: 3;
}

@keyframes nv-ripple {
  from { opacity: 0.65; transform: scale(0); }
  to { opacity: 0; transform: scale(2.6); }
}

@keyframes nv-fx-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes nv-fx-glow {
  0%, 100% { filter: drop-shadow(0 0 0 transparent); }
  50% { filter: drop-shadow(0 0 6px rgba(58, 77, 255, 0.9)); }
}

@keyframes nv-fx-wave {
  0% { transform: scaleY(1); }
  25% { transform: scaleY(0.85); }
  50% { transform: scaleY(1.15); }
  75% { transform: scaleY(0.92); }
  100% { transform: scaleY(1); }
}

@keyframes nv-fx-pop {
  0% { transform: scale(1); }
  30% { transform: scale(1.32); }
  60% { transform: scale(0.88); }
  100% { transform: scale(1); }
}
`

/* ---------- WebGL Water Caustics Shaders ---------- */
const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_t;
uniform float u_mx;
uniform float u_my;
#define TAU 6.2831853

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  
  // Water wave distortion
  float t = u_t * 0.9;
  vec2 wave = vec2(
    sin(uv.y * 12.0 + t) * 0.03 + sin(uv.x * 8.0 - t * 0.7) * 0.02,
    cos(uv.x * 10.0 + t * 0.8) * 0.025 + cos(uv.y * 7.0 - t * 0.5) * 0.015
  );
  
  vec2 p = uv + wave;
  
  // Water caustic reflections
  float c1 = sin(p.x * 16.0 + t + sin(p.y * 14.0 + t * 0.6));
  float c2 = cos(p.y * 18.0 - t * 1.2 + cos(p.x * 12.0 - t * 0.8));
  float caustic = pow(clamp(c1 * c2 + 0.5, 0.0, 1.0), 3.0) * 0.45;
  
  // Water droplet meniscus near mouse
  float dMouse = length(uv - vec2(u_mx, u_my));
  float meniscus = smoothstep(0.22, 0.0, dMouse) * 0.35;
  
  // Top-left water surface rim specular gleam
  float rim = smoothstep(0.75, 0.98, 1.0 - uv.y) * 0.45;
  
  // Vivid crystal water coloration (cyan/aqua + light indigo)
  vec3 waterBase = vec3(0.94, 0.97, 1.0);
  vec3 waterAqua = vec3(0.68, 0.88, 1.0);
  vec3 waterCausticCol = vec3(0.85, 0.95, 1.0);
  
  vec3 col = mix(waterBase, waterAqua, caustic * 0.8 + meniscus * 0.5);
  col += waterCausticCol * (caustic * 0.6 + rim * 0.5);
  
  float alpha = clamp(caustic * 0.5 + meniscus * 0.6 + rim * 0.4 + 0.12, 0.0, 0.82);
  
  gl_FragColor = vec4(col, alpha);
}
`

function useWebGL(canvasRef) {
  const glRef = React.useRef(null)
  const progRef = React.useRef(null)
  const rafRef = React.useRef(null)
  const startRef = React.useRef(performance.now())
  const mouseRef = React.useRef({ x: 0.5, y: 0.5 })

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false })
    if (!gl) return
    glRef.current = gl

    function mkShader(type, src) {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    progRef.current = prog
    gl.useProgram(prog)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, width * (window.devicePixelRatio || 1))
      canvas.height = Math.max(1, height * (window.devicePixelRatio || 1))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      const t = (performance.now() - startRef.current) * 0.001
      gl.clearColor(0,0,0,0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform2f(gl.getUniformLocation(prog,'u_res'), canvas.width, canvas.height)
      gl.uniform1f(gl.getUniformLocation(prog,'u_t'), t)
      gl.uniform1f(gl.getUniformLocation(prog,'u_mx'), mouseRef.current.x)
      gl.uniform1f(gl.getUniformLocation(prog,'u_my'), mouseRef.current.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    tick()

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1 - (e.clientY - rect.top) / rect.height
      }
    }
    canvas.addEventListener('mousemove', onMouseMove)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMouseMove)
      gl.deleteProgram(prog)
    }
  }, [])
}

function NimbusIcon({ type }) {
  const paths = {
    home: (
      <>
        <path d="M3.5 11.2 12 4l8.5 7.2"/>
        <path d="M6 9.6V20h12V9.6"/>
        <path d="M10 20v-5h4v5Z"/>
      </>
    ),
    sparkle: (
      <>
        <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5Z"/>
        <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75Z"/>
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8.5" r="3.8"/>
        <path d="M4.8 20c1.2-3.4 4-5 7.2-5s6 1.6 7.2 5"/>
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3.2"/>
        <path d="M3 20c1-2.8 3.3-4.2 6-4.2s5 1.4 6 4.2"/>
        <circle cx="17" cy="8" r="2.5"/>
        <path d="M21 20c-.8-2.2-2.5-3.5-4-3.8"/>
      </>
    ),
  }
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  )
}

const DEFAULT_ITEMS = [
  { label: 'HOME', iconType: 'home', fx: 'glow', tab: 'normal' },
  { label: 'SAWARI AI', iconType: 'sparkle', fx: 'spin', tab: 'ai' },
  { label: 'PROFILE', iconType: 'user', fx: 'wave', tab: 'profile' },
  { label: 'RIDE BUDDY', iconType: 'users', fx: 'pop', tab: 'pass' },
]

const FX_ANIM = {
  spin: 'nv-fx-spin .55s ease forwards',
  glow: 'nv-fx-glow .6s ease forwards',
  wave: 'nv-fx-wave .5s ease forwards',
  pop: 'nv-fx-pop .4s ease forwards',
}

export default function LiquidNavbar({ activeTab, onChange, compact = false, className = '' }) {
  const items = DEFAULT_ITEMS
  const activeIndex = items.findIndex(item => item.tab === activeTab)
  const [pillRect, setPillRect] = React.useState(null)
  const [fxMap, setFxMap] = React.useState({})
  const itemRefs = React.useRef([])
  const containerRef = React.useRef(null)
  const canvasRef = React.useRef(null)

  useWebGL(canvasRef)

  const updatePill = React.useCallback(() => {
    const el = itemRefs.current[activeIndex]
    const container = containerRef.current
    if (!el || !container) return
    const cr = container.getBoundingClientRect()
    const er = el.getBoundingClientRect()
    setPillRect({
      left: er.left - cr.left,
      top: er.top - cr.top,
      width: er.width,
      height: er.height,
    })
  }, [activeIndex])

  React.useEffect(() => {
    updatePill()
    window.addEventListener('resize', updatePill)
    return () => window.removeEventListener('resize', updatePill)
  }, [updatePill])

  const handleClick = (item, idx, e) => {
    const rippleId = Date.now()
    if (item.fx && FX_ANIM[item.fx]) {
      setFxMap(prev => ({ ...prev, [idx]: { id: rippleId, anim: FX_ANIM[item.fx] } }))
      setTimeout(() => setFxMap(prev => { const n = { ...prev }; delete n[idx]; return n }), 600)
    }

    if (onChange) onChange(item.tab)
  }

  const pillStyle = pillRect ? {
    transform: `translate(${pillRect.left}px, ${pillRect.top}px)`,
    width: pillRect.width,
    height: pillRect.height,
  } : {}

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: NIMBUS_CSS }} />
      <nav
        ref={containerRef}
        className={`nimbus-nav ${className}`}
        role="tablist"
        aria-label="Main navigation"
      >
        {/* WebGL liquid water canvas */}
        <canvas
          ref={canvasRef}
          className="nimbus-canvas"
          style={{
            position: 'absolute',
            inset: `-${PAD}px`,
            borderRadius: '999px',
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
            width: `calc(100% + ${PAD * 2}px)`,
            height: `calc(100% + ${PAD * 2}px)`,
          }}
        />

        {/* Morphing water drop background pill */}
        {pillRect && (
          <div className="nimbus-pill" style={pillStyle} />
        )}

        {/* Nav items */}
        {items.map((item, idx) => {
          const isActive = idx === activeIndex
          const fx = fxMap[idx]
          return (
            <button
              key={item.tab}
              ref={el => { itemRefs.current[idx] = el }}
              role="tab"
              aria-selected={isActive}
              className={`nimbus-item${isActive ? ' active' : ''}`}
              onClick={(e) => handleClick(item, idx, e)}
              style={{
                color: isActive ? '#0A0A14' : 'rgba(11, 19, 43, 0.65)',
              }}
            >
              <span
                style={fx ? { animation: fx.anim, display: 'inline-flex' } : { display: 'inline-flex' }}
                className={isActive ? 'text-[#3A4DFF]' : ''}
              >
                <NimbusIcon type={item.iconType} />
              </span>
              {!compact && (
                <span className={`nimbus-label ${isActive ? 'text-[#0A0A14] font-extrabold' : ''}`}>
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </>
  )
}
