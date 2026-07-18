'use client';
import { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import { rrulestr } from 'rrule';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '@/lib/axios';
import { Button, Spin, message } from 'antd';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import EventModal from './EventModal';
import EventDetailModal from './EventDetailModal';
import EventCategoryManageModal from './EventCategoryManageModal';
import CustomToolbar from './CustomToolbar';
import CustomAgendaView from './CustomAgendaView';
import { SettingOutlined } from '@ant-design/icons';
import './modal-override.css';

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isManageCategoryOpen, setIsManageCategoryOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [draggedEvent, setDraggedEvent] = useState<any>(null);
  const draggedEventRef = useRef<any>(null);
  const [calendarKey, setCalendarKey] = useState(0);

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('month');

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');

      const viewStart = dayjs(date).subtract(2, 'year').toDate();
      const viewEnd = dayjs(date).add(2, 'year').toDate();

      const expandedEvents: any[] = [];

      res.data.forEach((evt: any) => {
        if (evt.recurrenceRule) {
          try {
            const ruleString = evt.recurrenceRule.replace(/^RRULE:/, '');
            const rule = rrulestr(`RRULE:${ruleString}`, { dtstart: new Date(evt.startTime) });
            const occurrences = rule.between(viewStart, viewEnd, true);
            const originalDuration = new Date(evt.endTime).getTime() - new Date(evt.startTime).getTime();

            occurrences.forEach((occ: Date) => {
              expandedEvents.push({
                ...evt,
                start: occ,
                end: new Date(occ.getTime() + originalDuration),
                allDay: evt.isAllDay,
                isRecurringInstance: true
              });
            });
          } catch (e) {
            console.error("Lỗi parse RRULE:", e);
            expandedEvents.push({
              ...evt,
              start: new Date(evt.startTime),
              end: new Date(evt.endTime),
              allDay: evt.isAllDay,
            });
          }
        } else {
          expandedEvents.push({
            ...evt,
            start: new Date(evt.startTime),
            end: new Date(evt.endTime),
            allDay: evt.isAllDay,
          });
        }
      });

      setEvents(expandedEvents);
    } catch (error) {
      message.error('Không thể tải dữ liệu lịch');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/event-categories');
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, [date]); // Refetch/expand when date changes heavily (though we expanded +/- 2 years)

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleSelectSlot = ({ start, end }: any) => {
    setSelectedEvent({ start, end });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const handleDragStart = (title: string, color: string, categoryId?: number) => {
    const evt = { id: Date.now(), title, color, categoryId };
    setDraggedEvent(evt);
    draggedEventRef.current = evt;
  };

  const onDropFromOutside = async ({ start, allDay }: any) => {
    if (!draggedEventRef.current) return;

    const eventToCreate = { ...draggedEventRef.current };
    draggedEventRef.current = null; // Synchronously clear to prevent late dragover from recreating ghost
    setDraggedEvent(null);
    setCalendarKey(prev => prev + 1); // Force remount to destroy the ghost element

    // Create an end time that is exactly 1 hour after start to prevent row spanning
    const endDate = new Date(start.getTime() + 60 * 60 * 1000);

    // Optimistic update
    const tempEvent = {
      id: eventToCreate.id,
      title: eventToCreate.title,
      start: new Date(start),
      end: endDate,
      color: eventToCreate.color,
      allDay: allDay !== undefined ? allDay : true,
    };
    // Disabled optimistic update because it conflicts with react-big-calendar's internal layout packing algorithm
    // setEvents((prev: any) => [...prev, tempEvent]);

    try {
      await api.post('/events', {
        title: eventToCreate.title,
        description: '',
        isAllDay: allDay !== undefined ? allDay : true,
        startTime: start.toISOString(),
        endTime: endDate.toISOString(),
        categoryId: eventToCreate.categoryId,
        color: eventToCreate.color,
      });

      fetchEvents();
      message.success('Tạo sự kiện thành công');
    } catch (error) {
      message.error('Có lỗi xảy ra khi tạo sự kiện');
      fetchEvents();
    }
  };

  const onEventDrop = async ({ event, start, end }: any) => {
    try {
      await api.patch(`/events/${event.id}`, {
        startTime: start,
        endTime: end
      });
      fetchEvents();
      message.success('Cập nhật thời gian thành công');
    } catch (error) {
      message.error('Có lỗi xảy ra');
    }
  };

  const eventStyleGetter = (event: any) => {
    const colorCode = event.category?.color || event.colorCode || event.color;
    let backgroundColor = colorCode || '#3174ad';

    // Default mapped colors based on legend
    if (!colorCode) {
      if (event.title.includes('Planning')) backgroundColor = '#4ade80';
      else if (event.title.includes('Meeting')) backgroundColor = '#60a5fa';
      else if (event.title.includes('Report')) backgroundColor = '#fbbf24';
      else if (event.title.includes('theme')) backgroundColor = '#f87171';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: '#fff',
        border: '0px',
        display: 'block'
      }
    };
  };

  const upcomingEvents = events
    .filter((e: any) => dayjs(e.start).isAfter(dayjs()))
    .sort((a: any, b: any) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf())
    .slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f3f9] dark:bg-gray-900 w-full min-w-0">
      <header className="bg-white dark:bg-gray-800 shadow-sm px-6 py-3 flex justify-between items-center z-10 border-b border-gray-100 dark:border-gray-700 relative min-w-0">
        <h1 className="text-[1.1rem] font-bold text-gray-800 dark:text-white tracking-tight font-oswald uppercase truncate">LỊCH CÁ NHÂN</h1>
        <div className="flex gap-4 items-center min-w-0">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Ứng dụng {'>'} <span className="text-gray-400 dark:text-gray-500">Lịch trình</span></span>
        </div>
      </header>

      <div className="flex-1 flex flex-col xl:flex-row px-4 xl:px-8 py-6 gap-6 relative z-0 max-w-[1600px] w-full mx-auto min-w-0 box-border">
        <aside className="w-full xl:w-[300px] flex-shrink-0 flex flex-col xl:pr-2 xl:pb-10 min-w-0 max-w-full">

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <button
              onClick={() => { setSelectedEvent(null); setIsModalOpen(true); }}
              className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white py-3 rounded-md font-medium transition-colors shadow-md mb-6"
            >
              + Tạo Sự Kiện Mới
            </button>

            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 leading-relaxed">
              Kéo thả sự kiện hoặc bấm vào lịch để thêm mới
            </p>

            <div className="flex flex-col gap-3 min-w-0">
              {categories.map((cat: any) => (
                <div
                  key={cat.id}
                  draggable={true}
                  onDragStart={() => handleDragStart(cat.name, cat.color, cat.id)}
                  onDragEnd={() => setDraggedEvent(null)}
                  className="flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer hover:opacity-90 active:cursor-grabbing min-w-0 text-gray-700 dark:text-gray-200"
                  style={{ backgroundColor: `${cat.color}15` }}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></div>
                  <span className="font-medium text-sm truncate">{cat.name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsManageCategoryOpen(true)}
              className="mt-4 w-full text-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center justify-center gap-2 cursor-pointer bg-transparent border-none outline-none py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <SettingOutlined /> Quản lý danh mục
            </button>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[1.05rem] font-bold text-[#3b5998] dark:text-blue-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Sự kiện sắp tới
              </h2>
              {upcomingEvents.length > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/40 text-[#3b5998] dark:text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {upcomingEvents.length}
                </span>
              )}
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-[13px] mb-4 leading-relaxed">
              {upcomingEvents.length === 0
                ? 'Thời gian tới chưa có lịch trình nào, bạn có thể thảnh thơi nghỉ ngơi!'
                : 'Đừng bỏ lỡ các lịch trình quan trọng của bạn'}
            </p>

            <div className="space-y-3 min-w-0 w-full max-h-[350px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              {upcomingEvents.length > 0 && (
                upcomingEvents.map((evt: any) => {
                  const eventColor = evt.color || evt.category?.color || evt.colorCode || '#3b5998';
                  const isAllDay = evt.allDay || evt.isAllDay || false;

                  return (
                    <div
                      key={`${evt.id}-${evt.start.getTime()}`}
                      className="group p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500 shadow-sm hover:shadow-[0_4px_12px_-4px_rgba(59,89,152,0.15)] transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col gap-2"
                      onClick={() => handleSelectEvent(evt)}
                    >
                      {/* Left colored accent bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: eventColor }}></div>

                      <div className="ml-1.5 flex flex-col gap-1.5">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-[13px] leading-tight truncate group-hover:text-[#3b5998] dark:group-hover:text-blue-400 transition-colors">{evt.title}</h3>

                        <div className="flex flex-wrap items-center text-[11px] text-gray-500 dark:text-gray-400 gap-y-1">
                          <div className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{dayjs(evt.start).format('DD/MM/YYYY')}</span>
                          </div>

                          <span className="mx-1.5 text-gray-300">•</span>

                          <div className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {isAllDay
                                ? 'Cả ngày'
                                : `${dayjs(evt.start).format('HH:mm')} - ${dayjs(evt.end).format('HH:mm')}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside >

        <main className="flex-1 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col xl:max-h-[900px] overflow-hidden relative min-w-0 mb-10 xl:mb-0 max-w-full box-border">
          <div className="flex-1 overflow-x-auto overflow-y-hidden h-full w-full min-w-0 flex flex-col">
            <div className="w-full min-w-[800px] h-full min-h-[750px] xl:min-h-[715px] flex flex-col">
              {loading ? (
                <div className="flex-1 flex justify-center items-center"><Spin size="large" /></div>
              ) : (
                <DragAndDropCalendar
                  key={calendarKey}
                  localizer={localizer}
                  events={events}
                  formats={{
                    dayFormat: (date: Date) => {
                      let weekday = date.toLocaleString('vi-VN', { weekday: 'long' });
                      weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
                      return `${weekday} ${date.getDate()}/${date.getMonth() + 1}`;
                    },
                    dayHeaderFormat: (date: Date) => {
                      let weekday = date.toLocaleString('vi-VN', { weekday: 'long' });
                      weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
                      return weekday;
                    }
                  }}
                  messages={{
                    allDay: 'Cả ngày'
                  }}
                  startAccessor={(event: any) => new Date(event.start)}
                  endAccessor={(event: any) => new Date(event.end)}
                  style={{ height: '100%' }}
                  selectable
                  date={date}
                  onNavigate={(newDate) => setDate(newDate)}
                  view={view as any}
                  onView={(newView) => setView(newView)}
                  onDrillDown={(date) => {
                    setDate(date);
                    setView('day');
                  }}
                  views={{
                    month: true,
                    week: true,
                    day: true,
                    agenda: CustomAgendaView as any,
                  }}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  onEventDrop={onEventDrop}
                  dragFromOutsideItem={() => draggedEventRef.current}
                  onDropFromOutside={onDropFromOutside}
                  resizable={false}
                  eventPropGetter={eventStyleGetter}
                  components={{
                    toolbar: CustomToolbar,
                    timeGutterHeader: () => (
                      <div className="flex items-center justify-center h-full w-full font-medium text-gray-500 text-xs py-2">
                        Cả ngày
                      </div>
                    )
                  }}
                  className="custom-calendar font-sans flex-1 text-sm"
                />
              )}
            </div>
          </div>
        </main>
      </div >

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventData={selectedEvent}
        onSuccess={fetchEvents}
      />

      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        eventData={selectedEvent}
        onEdit={() => {
          setIsDetailModalOpen(false);
          setTimeout(() => {
            setIsModalOpen(true);
          }, 150);
        }}
        onSuccess={fetchEvents}
      />

      <EventCategoryManageModal
        isOpen={isManageCategoryOpen}
        onClose={() => {
          setIsManageCategoryOpen(false);
          fetchCategories();
        }}
      />
    </div >
  );
}
