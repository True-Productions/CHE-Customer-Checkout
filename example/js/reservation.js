var globalVar;

Vue.component('errorsection',{
    template:'#errorsection',
    props:['error'],
});

Vue.component('passenger-total', {
    template: '#passenger-total',
    props:['total_passengers'],
    methods: {
        increase_total: function(){
            if (this.total_passengers < 6){
                newTotal = this.total_passengers;
                ++newTotal;
                this.$emit('update_passenger_total', newTotal);
            }
        },
        decrease_total: function(){
            if (this.total_passengers > 1){
                newTotal = this.total_passengers;
                --newTotal;
                this.$emit('update_passenger_total', newTotal);
            }
        }
    }
});

Vue.component('calendar-picker', {
    props: ["saved_date"],
    template: '#calendar-picker',
    methods: {
        update_calendar:function(){
            this.$emit('update_calendar', this.date);
        },
        getDate:function(){
            //Build a string for viewing on the Form
            if (this.saved_date.length == 0){
                return "";
            }
            let d = new Date(this.saved_date);
            return d.getMonth()+1 + "/" +d.getDate()+"/"+d.getFullYear();
        }
    },
    mounted: function(){
        console.log(this.saved_date);
        this.datePicker = datepicker('#datePicker',{
            formatter: (input,date,instance) => {
                const value = date.toLocaleDateString();
                input.value = value;
            },
            startDate: new Date( new Date().getTime() + 60*60*24*1000 ), //Tomorrow
            onSelect: (instance, date) => {

                let event = new Event('input', { bubbles: true });
                instance.el.dispatchEvent(event);

                //comp.update_calendar();
            },
            position:'br',
        });

        globalVar = this.datePicker;
    },
    data: function(){
        return {
        date:this.getDate(),
        };
    },
    watch: {
        saved_date() {
            //console.log(this.saved_date);
            this.date = this.getDate();
            this.datePicker.setDate(this.saved_date);
        }
    },
});

Vue.component('chosen-date',{
    props: ["date"],
    template: '#chosen-date',
    methods: {
        dayOfWeek : function(){
            let dayNum = new Date(this.date).getDay();
            let days = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
            ];

            return days[dayNum];
        },
        next_day: function(){
            this.$emit('next_day');
        },
        prev_day: function(){
            this.$emit('prev_day');
        },
    },
    data : function(){
        return {
            dow : this.dayOfWeek(),
        };
    },
    watch : {
        date(){
            this.dow = this.dayOfWeek();
        },
    },
});

Vue.component('no-flights',{
    template:'#no-flights',
});

Vue.component('flight-times',{
    props:['time', 'selected_flight'],
    methods:{
        select_time:function(){
            this.$emit('select_time', this.time);
        }
    },
    mounted : function(){
        this.$parent.scrollToBottom();
    },
    computed : {
        flightTime : function(){
            let t = this.time.startTime.toLocaleTimeString();
            let locA = t.search(/[:][0-9]{2}[ ]/g);
            let locB = t.search(/[aApPmM]{2}/g);

            return t.substr(0, locA)+ ' ' +t.substr(locB, 2);
        },
        flightSelected : function(){
            if (this.selected_flight == this.time.Id){
                return true;
            } else {
                return false;
            }
            
        },
    },
    template:'#flight-times'
});

Vue.component('customer-info', {
    props: ['first_nameprop', 'last_nameprop', 'phoneprop', 'emailprop', 'weightprop'],
    methods: {
        update_customer: function(){
        
            this.$emit('update_customer',{
                'firstName' : this.firstName,
                'lastName' : this.lastName,
                'phone' : this.phone,
                'email' : this.email,
                'weight' : this.weight,
            });
        },
        showWarning:function(){
            this.$el.querySelector('.popUpWarning').classList.remove('hidePopup');
        },
        hideWarning:function(){
            this.$el.querySelector('.popUpWarning').classList.add('hidePopup');
        },
    },
    data: function() {
        return {
            firstName : this.first_nameprop,
            lastName : this.last_nameprop,
            phone : this.phoneprop,
            email : this.emailprop,
            weight : this.weightprop,
        };
    },
    template: '#customer-info',
    mounted:function(){
        this.$parent.scrollToBottom();
    },
});

Vue.component('passenger-info', {
    template: '#passenger-info',
    props: ['passid', 'nameprop', 'weightprop', 'pass'],
    methods: {
        update_passenger: function(){
            let weight = 0
            
            if ( !isNaN( parseInt(this.weight) ) ){
                weight = parseInt(this.weight);
            }

            this.$emit('update_passenger', {
                'id':this.passid,
                'name':this.name,
                'weight':this.weight,
            });
        },
        showWarning:function(){
            this.$el.querySelector('.popUpWarning').classList.remove('hidePopup');
        },
        hideWarning:function(){
            this.$el.querySelector('.popUpWarning').classList.add('hidePopup');
        },
    },
    data: function(){
        return {
            'name':this.nameprop,
            'weight':this.weightprop,
        };
  },
  mounted: function(){
    
  }
});

Vue.component('bookbutton',{
    template:'#bookbutton',
    props:['bookable'],
    methods: {
        book:function(){
            this.$emit('book');
        },
    },
});

let reservation = new Vue({
    el : '#reservation-app',
    data : {
        customerData : {
            'firstName' : '',
            'lastName' : '',
            'phone' : '',
            'email' : '',
            'weight' : '',
        },
        total_passengers : 1,
        passengers:{
            2:{'name':'', 'weight':'',},
            3:{'name':'', 'weight':'',},
            4:{'name':'', 'weight':'',},
            5:{'name':'', 'weight':'',},
            6:{'name':'', 'weight':'',},
        },
        currentStep:1,
        date:'',
        flights: {},
        // bookable: false,
        errors: [],
        flightController: new AbortController(),
        selectedFlight: '',
    },
    created : function(){

    },
    computed : {
        renderedPassengers:function(){
            if (this.total_passengers <= 1){
                return {};
            }
            
            let copy = {};
            for (let x=2; x<=this.total_passengers; ++x){
                copy[x] = this.passengers[x];
            }

            return copy;
        },
        availableFlights:function(){
            //Cycle through the flights, pull only one potential flight from
            //each group into an array. Pull the highest priority flight
            //Pull all available flights into an array.
            //Check total passengers against seats available.
            /*
            object structure:
                Id: Salesforce ID for the flight or schedule template
                availableSeats: number 0-6
                group: number re group
                heli: helicopter model
                priority: number 1-12
                startTime: string
                tourType: day/night/etc
                type: actual/potential
            */
            let availableFlights = [];
            Object.keys(this.flights).forEach((key) => {
                let groupFlights = [];
                if (this.flights[key]["actual"].length > 0){
                    this.flights[key]["actual"].forEach((flight) => {
                        
                        if (this.total_passengers < flight.availableSeats){
                            let d = new Date(this.date.toLocaleDateString()+' '+flight.startTime);
                            let f = {
                                Id: flight.Id,
                                startTime: d,
                                tourType:flight.tourType,
                                type: flight.type,
                            };
                            //flight.startTime = d;
                            groupFlights.push(f);
                        } else {
                            //console.log("No Seats Available");
                        }
                    });
                }
                
                if (groupFlights.length == 0){
                    let flight = this.flights[key]["potential"][0];
                    d = new Date(this.date.toLocaleDateString()+' '+flight.startTime);
                    let f = {
                        Id: flight.Id,
                        startTime: d,
                        tourType:flight.tourType,
                        type: flight.type,
                    };
                    //flight.startTime = d;
                    groupFlights.push(f);
                }
                availableFlights = availableFlights.concat(groupFlights);
            });

            availableFlights.sort(this.timeCompare);

            if (this.selectedFlight != ''){
                let flightIncluded = false;
                availableFlights.some((f) => {
                    if (f.Id == this.selectedFlight){
                        flightIncluded = true;
                        return true;
                    }
                });
                if (!flightIncluded){
                    this.currentStep = 2;
                    this.selectedFlight = '';
                }

            }
            
            return availableFlights;
        },
        no_flights:function(){
            if (this.date != "" && this.availableFlights.length == 0){
                //return true;
            }
            return false;
        },
        bookable:function(){
            //Default state is true. Change to false only when a field is incorrect
            var bookable = true;

            //Check that customer information fields aren't blank
            Object.keys(this.customerData).some((key) => {

                if (this.customerData[key].length <= 0){
                    bookable = false;
                    return true;
                }

                //Check that weight is a number and between 40-290
                if (
                    key == 'weight' &&
                    (
                        isNaN( Number(this.customerData[key]) ) ||
                        this.customerData[key] < 40 ||
                        this.customerData[key] > 250
                    )
                ){
                    bookable = false;
                    return true;
                }
            });


            if (!bookable){
                return false;
            }

            //check the passengers fields to make sure that the fields aren't blank
            for (let x=2; x<=this.total_passengers; ++x){
                Object.keys(this.passengers[x]).some((key) => {
                    if (this.passengers[x][key].length <= 0){
                        bookable = false;
                        return true;
                    }

                    //Check that weight is a number and between 40-290
                    if (
                        key == 'weight' &&
                        (
                            isNaN( Number(this.passengers[x][key]) ) ||
                            this.passengers[x][key] < 40 ||
                            this.passengers[x][key] > 250
                        )
                    ){
                        bookable = false;
                        return true;
                    }
                    
                });
            }

            if (!bookable){
                return false;
            }

            return bookable;
        },
    },
    methods: {
        update_passengers: function(val){

            if (val == ''){
                this.currentStep = 1;
            } else {
                this.currentStep = (this.currentStep > 2) ? this.currentStep : 2;
            }

            this.passengers = val;
        
        },
        update_passenger_total:function(newTotal){
            this.total_passengers = newTotal;
            // this.checkBookable();
        },
        update_calendar: function(val){
            let date = new Date(val);
            if (date < Date.now()){
                this.showError('You Must Select a Date in the Future');
                return;
            }

            this.date = date;
            this.get_flights();
            this.currentStep = 2;
        },
        prev_day:function(){
            let newDate = new Date(this.date).getTime() - (60*60*24*1000);
            this.update_calendar(newDate);
        },
        next_day:function(){
            let newDate = new Date(this.date).getTime() + (60*60*24*1000);
            this.update_calendar(newDate);
        },
        get_flights: function(){
            //Cancel the previous fetch, then make new controller
            this.flightController.abort();
            this.flightController = new AbortController();

            this.flights = {};
            let d = this.date;
            let date = d.getMonth()+1 + "/" +d.getDate()+"/"+d.getFullYear();
            let url = encodeURI("flightFinder.php?date="+date);
            let response = fetch('/api/'+url ,{
                signal:this.flightController.signal,
            }).then((response) => {
                return response.json();
            }).then((response) => {
                this.flights = response;
            }).catch((e) => {
                //console.log(e.message);
            });

            //console.log(this.flightController);
            //let flights = await response.json();
            //this.flights = flights;
        },
        update_customer: function(customerData){
            this.customerData = customerData;
            //   this.checkBookable();
        },
        update_passenger:function(passenger){
        this.passengers[passenger.id] = {
            'name':passenger.name,
            'weight':passenger.weight,
        };
        //   this.checkBookable();
        },
        select_time: function(val){
            this.selectedFlight = val.Id;
            this.currentStep = 3;
        
        },
        check_time: function(){
            //Checks that the currently selected time is available in the availableFlights
            if (this.selectedFlight == ''){
                return;
            }
        },
        bookflight: function(){
            alert('thanks for booking your flight!');
        },
        showError: function(errorMsg){
            id = this.randomId(16);
            this.errors.push({
                'id':id,
                'msg':errorMsg,
            });

            window.setTimeout(() => {
                this.removeError(id);
            }, 5000);
        },
        removeError: function(id){
            Object.keys(this.errors).forEach((el)=>{
                if (this.errors[el].id == id){
                this.errors.splice(el, 1);
                }
            });
        },
        randomId: function(size){
            let possibleChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
            let id = '';
            for (let x=0; x<size;++x){
                pos = Math.trunc( Math.random() * ( possibleChars.length + 1 ) )
                id += possibleChars.substr(pos, 1);
            }

            return id;
        },
        timeCompare: function(a, b){
            if (a.startTime < b.startTime)
                return -1;
            if (a.startTime < b.startTime)
                return 1;
            return 0;
        },
        scrollToBottom: function(){
            //total scrollable height subtracted by window height
            //bottom represents the amount of pixels to scroll
            let bottom = document.body.scrollHeight - window.innerHeight;

            if (bottom < 0){
                return;
            }

            let totalHeight = bottom - document.documentElement.scrollTop;

            //console.log(document.body.scrollHeight);
            // console.log(window.innerHeight);

            // console.log(totalHeight);
            // console.log(bottom);

            //time to transition in milliseconds
            let totalTime = 700;
            let interval = 10;

            let iterations = (totalTime/interval);
            let i = 0;

            let scrollInterval = setInterval(() => {
                if (document.documentElement.scrollTop == bottom || i > iterations){
                clearInterval(scrollInterval);
                }

                let addition = Math.round( totalHeight * (interval/totalTime) );
                document.documentElement.scrollTop += addition;
                ++i;

            }, interval);
        }, 
        find_seating_arrangement: function(){

        },
    }
});

//Taken is a boolean for seats that will be taken up in the function below
//Filled is a boolean for seats that have been filled up by already taken reservations
let seatsTaken = [
    {'num':1,'taken':false, 'filled': false, 'passenger': ''},
    {'num':2,'taken':false, 'filled': false, 'passenger': ''},
    {'num':3,'taken':false, 'filled': false, 'passenger': ''},
    {'num':4,'taken':false, 'filled': false, 'passenger': ''},
    {'num':5,'taken':false, 'filled': false, 'passenger': ''},
    {'num':6,'taken':true, 'filled': true, 'passenger': ''},
];

function deepDive(pass, totalPass, seatsTaken){
    for (let x = 0; x < seatsTaken.length; ++x){
        let seats = cloneSeatMap(seatsTaken);

        if (seats[x].taken == true){
            continue;
        }

        seats[x].taken = true;
        seats[x].passenger = pass;
        // console.log(pass+ " " +x);

        if (pass < totalPass){
            deepDive(pass+1, totalPass, seats);
        } else {
            seatCombos.push(seats);
        }
    }

    return seatCombos;
}

function cloneSeatMap(seatsRoot){
    var seats = [];
    seatsRoot.forEach(function(seat){
        let s = {
            'num' : seat.num,
            'taken' : seat.taken,
            'filled' : seat.filled,
            'passenger' : seat.passenger,
        };
        seats.push(s);
    })

    return seats;
}

function displaySeats(seats){
    var output = '';
    seats.forEach((seat) => {
        if (seat.taken && !seat.filled){
            output += seat.passenger;
        } else {
            output += '_';
        }
    });
    console.log(output);
}

//Each Array starts with 0, not 1
const sixSeater = [
    [0,1],
    [2,3,4,5],
];

//Each Array starts with 0, not 1
const threeSeater = [
    [0],
    [1,2],
];

//Returns True or False if the passengers are sitting next to each other
function onSameRow(seats, totalSeats){
    let rows = '';
    if (totalSeats == 6){
        rows = sixSeater;
    } else {
        rows = threeSeater;
    }

    var taken = {
        'rowOne' : [],
        'rowTwo' : [],
    };

    let rowOne = false;
    let rowTwo = false;
    for (let x=0; x<seats.length; ++x){
        if (seats[x].taken == true && seats[x].filled == false){
            
            if (rows[0].includes(x)){
                taken.rowOne.push(x);
                rowOne = true;

            } else if ( rows[1].includes(x) ) {

                taken.rowTwo.push(x);
                rowTwo = true;

            }
        }
    }

    console.log(taken);
    Object.keys(taken).forEach( (key) => {
        //makes my life easier
        let t = taken[key];
        if (t.length == 0){return;}
        console.log(t);

        let last = '';
        
        t.forEach( (val) => {
            if (last != ''){
                last = val;
                return;
            }

            
            
        } );
    });

    if (rowOne && rowTwo){
        return false;
    } else if (rowOne || rowTwo ){
        return true;
    } else {
        return false;
    }
    
}

function sittingNextToEachOther(seats, totalSeats){
    let rows = '';
    if (totalSeats == 6){
        rows = sixSeater;
    } else {
        rows = threeSeater;
    }

    var filled = [];
    for(let x=0; x<seats.length; ++x){
        if (seats[x].taken == true && seats[x].filled == false){
            filled.push(x);
        }
    }
    
    console.log(filled);
}

var seatCombos = [];
deepDive(1, 3, seatsTaken);

seatCombos.forEach((seats)=>{
    // displaySeats(seats);
});