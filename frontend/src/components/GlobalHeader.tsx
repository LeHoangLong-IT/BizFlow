'use client';
import React, { useState, useRef, useEffect } from 'react';
import { BellOutlined, SettingOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

export default function GlobalHeader() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#1f3b6c] text-white flex items-center justify-between px-6 py-2.5 shadow-md sticky top-0 z-50">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        {/* Placeholder Icon */}
        <div className="w-10 h-10 flex-shrink-0">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white w-full h-full">
            <rect width="40" height="40" rx="8" fill="rgba(255,255,255,0.1)"/>
            <path d="M12 20h16M20 12l8 8-8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xl tracking-wide leading-tight">BizFlow</span>
          <span className="text-[10px] text-blue-200 tracking-wider uppercase font-medium">Làm Việc Thông Minh</span>
        </div>
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-6">
        <button className="text-white hover:text-blue-200 transition-colors bg-transparent border-none outline-none cursor-pointer p-0 flex items-center">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
        <button className="text-white hover:text-blue-200 transition-colors bg-transparent border-none outline-none cursor-pointer p-0 flex items-center relative">
          <BellOutlined className="text-[20px]" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1f3b6c]"></span>
        </button>

        <div className="relative ml-2" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-transparent border-none outline-none cursor-pointer p-0"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-[#6366f1] text-white flex items-center justify-center font-bold text-lg">
                S
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#1f3b6c] rounded-full"></div>
            </div>
          </button>

          {/* User Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden text-gray-800 z-50">
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#6366f1] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  S
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm truncate text-gray-900">Staff Nguyễn Văn A</span>
                  <span className="text-xs text-gray-500 truncate">Nhân sự</span>
                </div>
              </div>
              <div className="py-2">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                  <UserOutlined className="text-gray-400 text-base" /> Hồ Sơ
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                  <SettingOutlined className="text-gray-400 text-base" /> Cài Đặt
                </button>
              </div>
              <div className="p-2 border-t border-gray-100">
                <button 
                  onClick={() => {
                    localStorage.removeItem('token');
                    import('antd').then(({ message }) => {
                      message.success('Đã đăng xuất thành công!');
                    });
                    setIsDropdownOpen(false);
                    router.push('/login');
                  }}
                  className="w-full bg-[#ff4d4f] hover:bg-[#ff7875] text-white font-medium py-2 rounded-md text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer border-none outline-none"
                >
                  Đăng Xuất <LogoutOutlined />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
