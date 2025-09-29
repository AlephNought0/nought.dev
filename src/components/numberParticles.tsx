import { useEffect, useRef, useCallback } from "react";

interface NumberParticle {
  x: number;
  y: number;
  z: number;
  value: number;
  size: number;
}

export default function NumberParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<NumberParticle[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const updateIntervalRef = useRef<number>(35);

  const initParticles = useCallback((width: number, height: number) => {
    const particles: NumberParticle[] = [];
    const columns = 45;
    const rows = 45;
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    const fillProbability = 0.85;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (Math.random() > fillProbability) continue;
        const baseX = col * cellWidth + cellWidth / 2;
        const baseY = row * cellHeight + cellHeight / 2;
        const randomOffset = 15;
        const x = baseX + (Math.random() - 0.5) * randomOffset;
        const y = baseY + (Math.random() - 0.5) * randomOffset;

        particles.push({
          x: x,
          y: y,
          z: Math.random(),
          value: Math.floor(Math.random() * 10),
          size: 15 + Math.random() * 10,
        });
      }
    }

    particlesRef.current = particles;
  }, []);

  const getDistanceFromMouse = (particle: NumberParticle) => {
    const dx = particle.x - mouseRef.current.x;
    const dy = particle.y - mouseRef.current.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const updateAllNumbers = useCallback(() => {
    const particles = particlesRef.current;
    particles.forEach((particle) => {
      let newValue;
      do {
        newValue = Math.floor(Math.random() * 10);
      } while (newValue === particle.value);

      particle.value = newValue;
    });
  }, []);

  const updateParticles = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      timestamp: number,
    ) => {
      const particles = particlesRef.current;
      const mouseInteractionRadius = 200;

      if (timestamp - lastUpdateRef.current > updateIntervalRef.current) {
        updateAllNumbers();
        lastUpdateRef.current = timestamp;
      }

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

      particles.forEach((particle) => {
        const distance = getDistanceFromMouse(particle);

        let size = particle.size * (0.3 + particle.z * 0.7);

        if (distance < mouseInteractionRadius) {
          const proximityFactor = 1 - distance / mouseInteractionRadius;
          size *= 1 - proximityFactor * 0.7;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + particle.z * 0.3})`;
        ctx.font = `${size}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(particle.value.toString(), particle.x, particle.y);
      });
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas.width, canvas.height);
    };

    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);

    const animate = (timestamp: number) => {
      updateParticles(ctx, canvas.width, canvas.height, timestamp);
      requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [initParticles, updateParticles]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        background: "black",
      }}
    />
  );
}
