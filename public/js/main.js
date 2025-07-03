// Select all elements with the .choice-card class
document.querySelectorAll(".choice-card").forEach((card) => {
    // When the mouse moves over the card, apply the tilt effect
    card.addEventListener("mousemove", (e) => handleTilt(e, card));

    // When the mouse leaves the card, reset the tilt back to normal
    card.addEventListener("mouseleave", () => resetTilt(card));
});

//This function calculates and applies the tilt based on mouse position
function handleTilt(event, element) {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left; // x within card
    const y = event.clientY - rect.top;  // y within card

    //get center point of card
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation angles (in degrees)
    // Negative sign flips the direction for a natural tilt effect
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    element.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    element.style.transition = "transform 0.1s ease-out";
}

//This function resets the tilt to the default (no rotation)
function resetTilt(element) {
    element.style.transform = "rotateX(0deg) rotateY(0deg)";
    element.style.transition = "transform 0.3s ease-out";
}
