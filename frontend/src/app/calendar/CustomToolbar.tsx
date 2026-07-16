import React from 'react';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

const CustomToolbar = (toolbar: any) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  const label = () => {
    const date = new Date(toolbar.date);
    const view = toolbar.view;
    const year = date.getFullYear();
    const monthStr = date.toLocaleString('vi-VN', { month: 'long' });

    if (view === 'day') {
      let weekday = date.toLocaleString('vi-VN', { weekday: 'long' });
      weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      return `${weekday}, ${date.getDate()} ${monthStr} ${year}`.toUpperCase();
    }

    if (view === 'week') {
      const start = new Date(date);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const startMonthStr = start.toLocaleString('vi-VN', { month: 'long' });
      const endMonthStr = end.toLocaleString('vi-VN', { month: 'long' });

      if (start.getFullYear() !== end.getFullYear()) {
        return `${start.getDate()} ${startMonthStr} ${start.getFullYear()} - ${end.getDate()} ${endMonthStr} ${end.getFullYear()}`.toUpperCase();
      } else if (start.getMonth() !== end.getMonth()) {
        return `${start.getDate()} ${startMonthStr} - ${end.getDate()} ${endMonthStr} ${end.getFullYear()}`.toUpperCase();
      } else {
        return `${start.getDate()} - ${end.getDate()} ${startMonthStr} ${year}`.toUpperCase();
      }
    }

    return `${monthStr} ${year}`.toUpperCase();
  };

  const views = [
    { id: 'month', label: 'Tháng' },
    { id: 'week', label: 'Tuần' },
    { id: 'day', label: 'Ngày' },
    { id: 'list', label: 'Danh sách' }
  ];

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 mt-2 bg-white dark:bg-transparent rounded-lg z-50 relative rbc-custom-toolbar">
      <div className="flex items-center gap-1 w-full md:w-auto justify-center md:justify-start">
        <div className="flex bg-[#f1f5f9] dark:bg-gray-700 rounded-lg p-1 shadow-inner border border-gray-100 dark:border-gray-600">
          <button onClick={goToBack} className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-600 hover:text-[#3b5998] dark:hover:text-blue-400 hover:shadow-sm rounded-md transition-all border-none outline-none cursor-pointer">
            <LeftOutlined className="text-xs" />
          </button>
          <button onClick={goToNext} className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-600 hover:text-[#3b5998] dark:hover:text-blue-400 hover:shadow-sm rounded-md transition-all border-none outline-none cursor-pointer">
            <RightOutlined className="text-xs" />
          </button>
        </div>
        <button onClick={goToCurrent} className="px-5 h-[40px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#3b5998] dark:hover:text-blue-400 hover:border-[#3b5998]/30 transition-all ml-3 shadow-sm outline-none cursor-pointer">
          Hôm nay
        </button>
      </div>

      <div className="text-lg font-bold text-gray-800 dark:text-white tracking-wide font-oswald uppercase text-center w-full md:w-auto">
        {label()}
      </div>

      <div className="flex bg-[#f1f5f9] dark:bg-gray-700 rounded-lg p-1 shadow-inner border border-gray-100 dark:border-gray-600 w-full md:w-auto overflow-x-auto justify-start md:justify-end">
        {views.map(v => {
          const isActive = toolbar.view === v.id || (toolbar.view === 'agenda' && v.id === 'list');
          return (
            <button
              key={v.id}
              onClick={() => toolbar.onView(v.id === 'list' ? 'agenda' : v.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all border-none outline-none cursor-pointer whitespace-nowrap ${isActive
                ? 'bg-white dark:bg-gray-800 text-[#3b5998] dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-600'
                }`}
            >
              {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CustomToolbar;
