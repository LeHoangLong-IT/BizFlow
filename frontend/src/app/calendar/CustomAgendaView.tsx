import React from 'react';
import moment from 'moment';

const CustomAgendaView = ({ events, date, length = 30, localizer }: any) => {
  // Calculate the range of the agenda
  const end = moment(date).add(length, 'days').toDate();

  // Filter events that fall within the range
  const agendaEvents = events.filter((event: any) => {
    const eventStart = new Date(event.start);
    return eventStart >= date && eventStart < end;
  });

  // Sort events by start time
  agendaEvents.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Group events by date (formatted string)
  const groupedEvents = agendaEvents.reduce((acc: any, event: any) => {
    const day = moment(event.start).startOf('day').format('YYYY-MM-DD');
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(event);
    return acc;
  }, {});

  const dates = Object.keys(groupedEvents).sort();

  if (dates.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 min-h-[400px] flex items-center justify-center">
        Không có sự kiện nào trong khoảng thời gian này
      </div>
    );
  }

  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || !hex.startsWith('#')) return `rgba(49, 116, 173, ${alpha})`; // Default blue
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(49, 116, 173, ${alpha})`;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getEventColor = (event: any) => {
    let colorCode = event.category?.color || event.colorCode || event.color;
    if (!colorCode) {
      if (event.title.includes('Planning')) colorCode = '#4ade80';
      else if (event.title.includes('Meeting')) colorCode = '#60a5fa';
      else if (event.title.includes('Report')) colorCode = '#fbbf24';
      else if (event.title.includes('theme')) colorCode = '#f87171';
      else colorCode = '#3174ad';
    }
    return colorCode;
  };

  return (
    <div className="bg-white dark:bg-gray-800">
      {dates.map(day => {
        const dayEvents = groupedEvents[day];
        const mDate = moment(day);

        let weekday = mDate.toDate().toLocaleString('vi-VN', { weekday: 'long' });
        weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

        // Format as DD/MM/YYYY
        const dateStr = mDate.format('DD/MM/YYYY');

        return (
          <div key={day} className="mb-0">
            {/* Date Header */}
            <div className="flex justify-between items-center py-3 px-4 border-b-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-200">
              <span className="text-sm">{dateStr}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{weekday}</span>
            </div>

            {/* Events List */}
            <div className="flex flex-col">
              {dayEvents.map((event: any, index: number) => {
                const color = getEventColor(event);
                const bgColor = hexToRgba(color, 0.15);
                const isAllDay = event.allDay || event.isAllDay || false;

                let timeStr = 'all-day';
                if (!isAllDay) {
                  timeStr = `${moment(event.start).format('h:mma')} - ${moment(event.end).format('h:mma')}`;
                }

                return (
                  <div
                    key={`${day}-${index}`}
                    className="flex items-center py-3 px-4 border-b border-gray-50 dark:border-gray-700/50"
                    style={{ backgroundColor: bgColor }}
                  >
                    {/* Time */}
                    <div className="w-[150px] text-sm text-gray-500 dark:text-gray-300 font-medium whitespace-nowrap">
                      {timeStr}
                    </div>

                    {/* Dot */}
                    <div className="w-[40px] flex justify-center flex-shrink-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      ></div>
                    </div>

                    {/* Title */}
                    <div className="flex-1 text-sm font-medium text-[#3b5998] dark:text-blue-400">
                      {event.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

CustomAgendaView.title = (start: Date, { length = 30, localizer }: any) => {
  const end = moment(start).add(length, 'days').toDate();
  return `${localizer.format(start, 'dateRangeStartFormat')} - ${localizer.format(end, 'dateRangeEndFormat')}`;
};

CustomAgendaView.navigate = (date: Date, action: string, { length = 30 }: any) => {
  switch (action) {
    case 'PREV':
      return moment(date).subtract(length, 'days').toDate();
    case 'NEXT':
      return moment(date).add(length, 'days').toDate();
    default:
      return date;
  }
};

export default CustomAgendaView;
