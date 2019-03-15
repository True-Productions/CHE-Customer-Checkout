(function() {
    
    // Initialize all input of type date.
    var calendars = bulmaCalendar.attach('[type="date"]');

    // Loop on each calendar initialized.
    for(var i = 0; i < calendars.length; i++) {
        // Add listener to date:selected event.
        calendars[i].on('select', date => {
            console.log(date);
        });
    }

    // To access to bulmaCalendar instance of an element.
    var element = document.querySelector('#calendar-time');
    if (element) {
        // bulmaCalendar instance is available as element.bulmaCalendar.
        element.bulmaCalendar.on('select', function(datepicker) {
            console.log(datepicker.data.value());
        });
    }

    var currDate = new Date();
    var dateClass = document.querySelectorAll('.datepicker-days .datepicker-date');
    for (var i = 0; i < dateClass.length; i++) {
        var dataDate = dateClass[i].getAttribute('data-date');
        var prevDate = (currDate > new Date(dataDate));
        if (prevDate) {
            dateClass[i].classList.add('is-past-date');
        }
    }

})();