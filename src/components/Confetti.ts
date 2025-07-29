import confetti from 'canvas-confetti';

export function launchConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.7 },
    colors: ['#00bfff', '#ff69b4', '#ffd700', '#32cd32', '#ff6347'],
  });
}
