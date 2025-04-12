import React, { useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ko'; 
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../css/calendar.css';

moment.locale('ko');
const localizer = momentLocalizer(moment);

const myEventsList = [
  {
    title: 'Conference',
    start: new Date(2025, 10, 10, 10, 0),
    end: new Date(2025, 10, 10, 12, 0),
  },
  {
    title: 'Meeting',
    start: new Date(2025, 10, 12, 14, 0),
    end: new Date(2025, 10, 12, 15, 0),
  },
];

const CalendarContent = () => {
  const [date, setDate] = useState(new Date(2025, 3)); // 2025년 4월

  const goToPrevMonth = () => {
    const newDate = moment(date).subtract(1, 'month').toDate();
    setDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = moment(date).add(1, 'month').toDate();
    setDate(newDate);
  };

  const formattedDate = moment(date).format('YYYY년 M월');

  return (
    <div className="calendarPage">
      <div className="calendarContainer">
        <div className="calendarHeader">
          <button onClick={goToPrevMonth} className="arrowButton">◀</button>
          <span className="calendarTitle">{formattedDate}</span>
          <button onClick={goToNextMonth} className="arrowButton">▶</button>
        </div>
        <Calendar
          localizer={localizer}
          events={myEventsList}
          date={date}
          view={Views.MONTH}
          toolbar={false}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '93.%' }}
        />
      </div>
    </div>
  );
};

export default CalendarContent;
