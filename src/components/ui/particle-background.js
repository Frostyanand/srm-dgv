"use client";

import React, { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles = [];
    let animationFrameId;
    let mouse = { x: -1000, y: -1000 };

    // Configuration base
    const maxRadius = 2.0;
    const minRadius = 1.0;
    const mouseInteractRadius = 200;
    const connectionRadius = 100;
    const mouseAttractForce = 0.02;

    // Responsive configuration
    let numParticles = 120;
    let textRect = { x: 0, y: 0, w: 0, h: 0 };

    // Helper to spawn a particle at the edge of the screen
    const spawnAtEdge = () => {
      const edge = Math.floor(Math.random() * 4);
      let px, py;
      if (edge === 0) { px = Math.random() * canvas.width; py = -10; } // Top
      else if (edge === 1) { px = canvas.width + 10; py = Math.random() * canvas.height; } // Right
      else if (edge === 2) { px = Math.random() * canvas.width; py = canvas.height + 10; } // Bottom
      else { px = -10; py = Math.random() * canvas.height; } // Left
      
      return {
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
        radius: Math.random() * (maxRadius - minRadius) + minRadius,
        life: 0 // Start invisible, fade in
      };
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 0.8; 
      
      // Responsive particles
      numParticles = window.innerWidth < 768 ? 60 : 120;
      
      // Calculate central text bounding box (approximate)
      const isMobile = window.innerWidth < 768;
      const boxW = isMobile ? window.innerWidth * 0.9 : 800;
      const boxH = isMobile ? 180 : 250;
      textRect = {
        x: (canvas.width - boxW) / 2,
        y: (canvas.height - boxH) / 2,
        w: boxW,
        h: boxH
      };

      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        // Initially spawn them randomly anywhere outside the text box
        let p;
        do {
          p = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * (maxRadius - minRadius) + minRadius,
            life: Math.random() // Random initial fade-in state
          };
        } while (
          p.x > textRect.x && p.x < textRect.x + textRect.w &&
          p.y > textRect.y && p.y < textRect.y + textRect.h
        );
        particles.push(p);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // If we are missing particles (due to absorption), spawn new ones
      while (particles.length < numParticles) {
        particles.push(spawnAtEdge());
      }

      let trappedCount = 0;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Fade in new particles
        if (p.life < 1) {
          p.life = Math.min(1, p.life + 0.02);
        }

        // Mouse attraction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distanceToMouse = Math.sqrt(dx * dx + dy * dy);

        // Particle logic near the mouse center
        if (distanceToMouse < 10 && mouse.x > 0 && mouse.y > 0) {
          trappedCount++;
          // If this is the primary trapped particle, keep it alive and center it.
          // If it's a secondary trapped particle, fade it out.
          if (trappedCount > 1) {
            p.life -= 0.05; // Fade out fast
            if (p.life <= 0) {
              particles.splice(i, 1);
              continue;
            }
          } else {
            // Primary trapped particle stays alive and strictly anchors to mouse
            p.life = 1;
            p.vx = 0;
            p.vy = 0;
            p.x = mouse.x;
            p.y = mouse.y;
          }
        } else if (distanceToMouse < mouseInteractRadius && mouse.x > 0 && mouse.y > 0) {
          const forceDirectionX = dx / distanceToMouse;
          const forceDirectionY = dy / distanceToMouse;
          const force = (mouseInteractRadius - distanceToMouse) / mouseInteractRadius;
          
          p.vx += forceDirectionX * force * mouseAttractForce;
          p.vy += forceDirectionY * force * mouseAttractForce;
          
          p.vx *= 0.95; // friction
          p.vy *= 0.95;
        }

        // Apply constant velocity limits
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 1.5) {
          p.vx = (p.vx / speed) * 1.5;
          p.vy = (p.vy / speed) * 1.5;
        }

        // Text Bounding Box Collision (Bounce)
        let nextX = p.x + p.vx;
        let nextY = p.y + p.vy;
        
        if (
          nextX > textRect.x && nextX < textRect.x + textRect.w &&
          nextY > textRect.y && nextY < textRect.y + textRect.h
        ) {
          const distLeft = Math.abs(nextX - textRect.x);
          const distRight = Math.abs(nextX - (textRect.x + textRect.w));
          const distTop = Math.abs(nextY - textRect.y);
          const distBottom = Math.abs(nextY - (textRect.y + textRect.h));
          
          const minDist = Math.min(distLeft, distRight, distTop, distBottom);
          
          if (minDist === distLeft || minDist === distRight) p.vx *= -1;
          if (minDist === distTop || minDist === distBottom) p.vy *= -1;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges gracefully
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.y > canvas.height + 20) p.y = -20;
      }

      // Draw constellation lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Draw connections between particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionRadius) {
            // Prevent drawing lines over the text box
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const isOverText = (
              midX > textRect.x && midX < textRect.x + textRect.w &&
              midY > textRect.y && midY < textRect.y + textRect.h
            );
            
            if (!isOverText) {
              const baseOpacity = 1 - (distance / connectionRadius);
              // Multiply opacity by life to ensure fading particles fade their connections
              const opacity = baseOpacity * p1.life * p2.life;
              ctx.beginPath();
              ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.15})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }

        // Draw connection to mouse
        const dxMouse = mouse.x - p1.x;
        const dyMouse = mouse.y - p1.y;
        const distanceToMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        if (distanceToMouse < mouseInteractRadius && mouse.x > 0 && mouse.y > 0) {
          const midX = (p1.x + mouse.x) / 2;
          const midY = (p1.y + mouse.y) / 2;
          const isOverText = (
            midX > textRect.x && midX < textRect.x + textRect.w &&
            midY > textRect.y && midY < textRect.y + textRect.h
          );

          if (!isOverText) {
            const baseOpacity = 1 - (distanceToMouse / mouseInteractRadius);
            const opacity = baseOpacity * p1.life;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.2})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * p1.life})`;
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-auto z-0"
      style={{ opacity: 1 }}
    />
  );
}
