import { useEffect, useRef, useCallback } from "react";

interface NumberParticle {
  x: number;
  y: number;
  z: number;
  value: number;
  size: number;
  sequenceIndex: number;
  valueIndex: number;
}

const sequences = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 3, 5, 7, 9, 1, 3, 5, 7, 9],
  [0, 2, 4, 6, 8, 0, 2, 4, 6, 8],
  [3, 5, 1, 8, 9, 2, 4, 7, 6, 0],
];

export default function NumberParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<NumberParticle[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const updateIntervalRef = useRef<number>(67);

  const initParticles = useCallback((width: number, height: number) => {
    const particles: NumberParticle[] = [];
    const columns = 35;
    const rows = 35;
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    const fillProbability = 0.85;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (Math.random() > fillProbability) continue;
        const baseX = col * cellWidth + cellWidth / 2;
        const baseY = row * cellHeight + cellHeight / 2;
        const randomOffset = 15;

        // Create x and y coordinates using the base variables and offset.
        const x = baseX + (Math.random() - 0.5) * randomOffset;
        const y = baseY + (Math.random() - 0.5) * randomOffset;

        // Get initial index values for the particles.
        const sequenceIndex = Math.floor(Math.random() * sequences.length);
        const valueIndex = Math.floor(
          Math.random() * sequences[sequenceIndex].length,
        );

        const initialValue = sequences[sequenceIndex][valueIndex];

        // Create the "particle".
        particles.push({
          x: x,
          y: y,
          z: Math.random(),
          value: initialValue,
          size: 15 + Math.random() * 10,
          sequenceIndex: sequenceIndex,
          valueIndex: valueIndex,
        });
      }
    }

    particlesRef.current = particles;
  }, []);

  // Calculate the distance of each number from the mouse using Pythagorean theorem.
  const getDistanceFromMouse = (particle: NumberParticle) => {
    const dx = particle.x - mouseRef.current.x;
    const dy = particle.y - mouseRef.current.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Change the number of each "particle".
  const updateAllNumbers = useCallback(() => {
    const particles = particlesRef.current;
    particles.forEach((particle) => {
      // Get this particle's sequence
      const sequence = sequences[particle.sequenceIndex];

      // Move to next position in sequence (loop back to start if at end)
      particle.valueIndex = (particle.valueIndex + 1) % sequence.length;

      // Update the actual displayed value
      particle.value = sequence[particle.valueIndex];
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

      // Check whether or not 35ms has passed.
      if (timestamp - lastUpdateRef.current > updateIntervalRef.current) {
        updateAllNumbers();
        lastUpdateRef.current = timestamp;
      }

      // Fill the canvas with black color to avoid fading effect.
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

      particles.forEach((particle) => {
        const distance = getDistanceFromMouse(particle);

        let size = particle.size * (0.4 + (1 - particle.z) * 0.6);

        // If the distance between the mouse and the particle is smaller than the interaction mouseInteractionRadius
        // then make the number smaller.
        if (distance < mouseInteractionRadius) {
          const proximityFactor = 1 - distance / mouseInteractionRadius;
          size *= 1 - proximityFactor * 0.7;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 - particle.z * 0.5})`;
        ctx.font = `${size}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(particle.value.toString(), particle.x, particle.y);
      });
    },
    [],
  );

  // This entire thing handles the canvas animation. It also changes the size to fit the screen all the time.
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
