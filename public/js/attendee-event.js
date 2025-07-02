    document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('.booking-form');
    form.addEventListener('submit', function (e) {
    const eventTitle = document.getElementById('event_title').value;
    const eventDate = document.getElementById('event_date').value;
    const fullQty = parseInt(document.getElementById('full_quantity').value) || 0;
    const concessionQty = parseInt(document.getElementById('concession_quantity').value) || 0;

    let message = `Booking confirmation:\n`;

    if (fullQty > 0) {
        message += `- ${fullQty} Full Ticket(s)\n`;
    }
    if (concessionQty > 0) {
        message += `- ${concessionQty} Concession Ticket(s)\n`;
    }
    if (fullQty === 0 && concessionQty === 0) {
        message += `- No tickets selected\n`;
    }

    message += `\nFor event ${eventTitle} on ${eventDate}?`;

    const confirmed = confirm(message);
    if (!confirmed) {
        e.preventDefault();
    }
  });
});
