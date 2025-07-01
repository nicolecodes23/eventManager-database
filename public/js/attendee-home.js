    document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('cardsContainer');
    const dots = document.querySelectorAll('.scroll-indicator .dot');
    const cards = container.querySelectorAll('.event-card');

  dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            // Get the left offset of the target card relative to the container
            const card = cards[index];
            const leftPos = card.offsetLeft;

            // Scroll smoothly to this position
            container.scrollTo({
                left: leftPos,
                behavior: 'smooth'
            });

            // Update active dot
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        });
  });

  // Optional: update active dot on manual scroll
  container.addEventListener('scroll', () => {
        let closestIndex = 0;
    let closestDistance = Infinity;
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - container.scrollLeft);
    if (dist < closestDistance) {
        closestDistance = dist;
    closestIndex = i;
      }
    });
    dots.forEach(d => d.classList.remove('active'));
    dots[closestIndex].classList.add('active');
  });
});
