
//Wait until entire DOM loaded before running the js
document.addEventListener('DOMContentLoaded', function () {
    //Select booking form element
    const form = document.querySelector('.booking-form');
    //add submit event listener 
    form.addEventListener('submit', function (e) {
        const eventTitle = document.getElementById('event_title').value;
        const eventDate = document.getElementById('event_date').value;
        const fullQty = parseInt(document.getElementById('full_quantity').value) || 0;
        const concessionQty = parseInt(document.getElementById('concession_quantity').value) || 0;

        //Beginning of building message for booking confirmation
        let message = `Booking confirmation:\n`;

        //if any full tickets selected append info
        if (fullQty > 0) {
            message += `- ${fullQty} Full Ticket(s)\n`;
        }
        //if any concession tickets selected append info
        if (concessionQty > 0) {
            message += `- ${concessionQty} Concession Ticket(s)\n`;
        }
        //if no tickets selected show message 
        if (fullQty === 0 && concessionQty === 0) {
            message += `- No tickets selected\n`;
        }

        //add event title and date to confirmation message
        message += `\nFor event ${eventTitle} on ${eventDate}?`;

        //send confirmation message to users
        const confirmed = confirm(message);
        //if user clicks cancel, prevent form submission
        if (!confirmed) {
            e.preventDefault();
        }
    });
});
