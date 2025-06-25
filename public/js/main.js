// Apply effect only when hovering over the card
document.querySelectorAll(".choice-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => handleTilt(e, card));
    card.addEventListener("mouseleave", () => resetTilt(card));
});

function handleTilt(event, element) {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left; // x within card
    const y = event.clientY - rect.top;  // y within card

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -15; // flip direction for natural tilt
    const rotateY = ((x - centerX) / centerX) * 15;

    element.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    element.style.transition = "transform 0.1s ease-out";
}

function resetTilt(element) {
    element.style.transform = "rotateX(0deg) rotateY(0deg)";
    element.style.transition = "transform 0.3s ease-out";
}
