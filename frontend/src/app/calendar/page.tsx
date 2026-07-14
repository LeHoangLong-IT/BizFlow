'use client';
import { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '@/lib/axios';
import { Button, Spin, message } from 'antd';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import EventModal from './EventModal';
import EventDetailModal from './EventDetailModal';
import EventCategoryManageModal from './EventCategoryManageModal';
import CustomToolbar from './CustomToolbar';
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
      const formattedEvents = res.data.map((evt: any) => ({
        ...evt,
        start: new Date(evt.startTime),
        end: new Date(evt.endTime),
        allDay: evt.isAllDay,
      }));
      setEvents(formattedEvents);
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
  }, []);

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
    <div className="h-screen flex flex-col bg-[#f3f3f9] overflow-hidden w-full min-w-0">
      <header className="bg-white shadow-sm px-6 py-3 flex justify-between items-center z-10 border-b border-gray-100 relative min-w-0">
        <h1 className="text-[1.1rem] font-bold text-gray-800 tracking-tight font-oswald uppercase truncate">LỊCH CÁ NHÂN</h1>
        <div className="flex gap-4 items-center min-w-0">
          <span className="text-sm text-gray-500 font-medium truncate">Ứng dụng {'>'} <span className="text-gray-400">Lịch trình</span></span>
        </div>
      </header>

      <div className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden px-4 xl:px-8 py-6 gap-6 relative z-0 max-w-[1600px] w-full mx-auto min-w-0 box-border">
        <aside className="w-full xl:w-[300px] flex-shrink-0 flex flex-col xl:overflow-y-auto xl:pr-2 xl:pb-10 min-w-0 max-w-full">

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
            <button
              onClick={() => { setSelectedEvent(null); setIsModalOpen(true); }}
              className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white py-3 rounded-md font-medium transition-colors shadow-md mb-6"
            >
              + Tạo Sự Kiện Mới
            </button>

            <p className="text-gray-500 text-sm mb-4 leading-relaxed">
              Kéo thả sự kiện hoặc bấm vào lịch để thêm mới
            </p>

            <div className="flex flex-col gap-3 min-w-0">
              {categories.map((cat: any) => (
                <div
                  key={cat.id}
                  draggable={true}
                  onDragStart={() => handleDragStart(cat.name, cat.color, cat.id)}
                  onDragEnd={() => setDraggedEvent(null)}
                  className="flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer hover:opacity-90 active:cursor-grabbing min-w-0 bg-opacity-10"
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></div>
                  <span className="font-medium text-sm truncate">{cat.name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsManageCategoryOpen(true)}
              className="mt-4 w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 cursor-pointer bg-transparent border-none outline-none py-2 hover:bg-gray-50 rounded-md transition-colors"
            >
              <SettingOutlined /> Quản lý danh mục
            </button>
          </div>

          <h2 className="text-[1.1rem] font-bold text-[#3b5998] mb-1">Sự kiện sắp tới</h2>
          <p className="text-gray-400 text-sm mb-4">Đừng bỏ lỡ các lịch trình quan trọng</p>

          <div className="space-y-4 min-w-0 w-full">
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-sm">Không có sự kiện sắp tới</p>
            ) : (
              upcomingEvents.map((evt: any) => (
                <div key={evt.id} className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer relative" onClick={() => handleSelectEvent(evt)}>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: evt.color || '#1565c0' }}></div>
                      <span className="text-sm font-semibold text-gray-800 truncate">{dayjs(evt.start).format('DD/MM/YYYY')}</span>
                    </div>
                    <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex-shrink-0 whitespace-nowrap">
                      {dayjs(evt.start).format('h:mm A')} - {dayjs(evt.end).format('h:mm A')}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-700 text-sm truncate">{evt.title}</h3>
                </div>
              ))
            )}
          </div>
        </aside >

        <main className="flex-1 bg-white p-4 xl:p-8 py-3 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[600px] xl:h-[calc(100vh-140px)] xl:max-h-[900px] overflow-hidden relative min-w-0 mb-10 xl:mb-0 max-w-full box-border">
          <div className="flex-1 overflow-x-auto overflow-y-hidden h-full w-full min-w-0">
            <div className="w-full xl:min-w-[800px] h-full pr-2 min-w-0">
              {loading ? (
                <div className="flex-1 flex justify-center items-center"><Spin size="large" /></div>
              ) : (
                <DragAndDropCalendar
                  key={calendarKey}
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  selectable
                  date={date}
                  onNavigate={(newDate) => setDate(newDate)}
                  view={view as any}
                  onView={(newView) => setView(newView)}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  onEventDrop={onEventDrop}
                  dragFromOutsideItem={() => draggedEventRef.current}
                  onDropFromOutside={onDropFromOutside}
                  resizable={false}
                  eventPropGetter={eventStyleGetter}
                  components={{
                    toolbar: CustomToolbar
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
