'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  BellOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  MoonOutlined,
  SunOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import api from '@/lib/axios';

export default function GlobalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };

    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUser();
    } else if (!pathname?.startsWith('/login') && !pathname?.startsWith('/register')) {
      router.push('/login');
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [pathname, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Lịch trình', path: '/calendar' },
    { name: 'Ghi chú', path: '/notes' },
    { name: 'Tài chính', path: '/finance' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    import('antd').then(({ message }) => {
      message.success('Đã đăng xuất thành công!');
    });
    setIsDropdownOpen(false);
    router.push('/login');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Không hiển thị Header ở trang đăng nhập/đăng ký
  if (!pathname || pathname.startsWith('/login') || pathname.startsWith('/register')) return null;

  return (
    <>
      <header className="bg-[#1f3b6c] dark:bg-gray-950 text-white flex items-center justify-between px-4 md:px-6 py-3 shadow-md sticky top-0 z-50 transition-colors">

        {/* Left: Mobile Menu Icon & Logo */}
        <div className="flex items-center gap-3 md:gap-4">

          {/* Mobile menu button (Offcanvas Trigger) */}
          <button
            className="md:hidden text-white flex flex-col justify-center items-center w-8 h-8 bg-transparent border-none outline-none cursor-pointer"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            {/* Custom Staggered Hamburger Icon as seen in image */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H21M3 12H15M3 18H21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 bg-white/20 rounded-md flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white w-5 h-5">
                <path d="M7 12l5 5L22 7M2 12l5 5M12 7l5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="hidden sm:flex flex-col ml-1">
              <span className="font-bold text-lg tracking-tight leading-none text-white">BizFlow</span>
              <span className="text-[9px] text-blue-200 tracking-wider uppercase font-semibold mt-0.5">Workspace</span>
            </div>
          </Link>
        </div>

        {/* Middle: Navigation & Search (Desktop Only) */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-8 px-4">
          <nav className="flex items-center gap-2 lg:gap-4">
            {navLinks.map((link) => {
              const isActive = pathname?.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 text-center ${isActive
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Search Bar */}
          <div className="relative w-64 max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm nhanh..."
              className="w-full bg-black/10 border border-white/20 text-white placeholder-blue-200 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:bg-black/20 focus:border-blue-300 focus:ring-1 focus:ring-blue-300 transition-all"
            />
            <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-200" />
          </div>
        </div>

        {/* Right: Actions & User */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg border border-transparent text-white hover:bg-white/20 transition-colors bg-white/10 cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình (F11)'}
          >
            {isFullscreen ? <FullscreenExitOutlined className="text-base" /> : <FullscreenOutlined className="text-base" />}
          </button>

          {/* Notifications */}
          <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-transparent text-white hover:bg-white/20 transition-colors bg-white/10 cursor-pointer relative">
            <BellOutlined className="text-base" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#1f3b6c] dark:border-gray-950"></span>
          </button>

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex w-9 h-9 items-center justify-center rounded-lg border border-transparent text-white hover:bg-white/20 transition-colors bg-white/10 cursor-pointer"
              title={theme === 'dark' ? 'Chế độ Sáng' : 'Chế độ Tối'}
            >
              {theme === 'dark' ? <SunOutlined className="text-base" /> : <MoonOutlined className="text-base" />}
            </button>
          )}

          <div className="hidden sm:block w-[1px] h-6 bg-white/20 mx-1"></div>

          {/* User Dropdown */}
          <div className="relative ml-1" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-transparent border-none outline-none cursor-pointer p-0"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-[#8b5cf6] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {user ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#1f3b6c] dark:border-gray-950 rounded-full"></div>
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-3 w-[280px] bg-white dark:bg-gray-900 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-gray-800 overflow-hidden text-gray-800 dark:text-gray-200 z-50">
                {/* Dropdown Header */}
                <div className="p-3">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex items-center gap-3 border border-transparent dark:border-gray-700/50">
                    <div className="w-11 h-11 rounded-xl bg-[#8b5cf6] text-white flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm">
                      {user ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-[15px] truncate text-gray-900 dark:text-white">
                        {user ? user.name : 'Đang tải...'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        Administrator
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dropdown Menu Items */}
                <div className="px-2 py-1 flex flex-col gap-0.5">
                  <button className="w-full px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md flex items-center gap-3 transition-colors bg-transparent border-none cursor-pointer">
                    <UserOutlined className="text-gray-400 dark:text-gray-500 text-base" />
                    Hồ sơ người dùng
                  </button>
                  <button className="w-full px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md flex items-center gap-3 transition-colors bg-transparent border-none cursor-pointer">
                    <BellOutlined className="text-gray-400 dark:text-gray-500 text-base" />
                    Thông báo
                  </button>
                  <button className="w-full px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md flex items-center gap-3 transition-colors bg-transparent border-none cursor-pointer">
                    <QuestionCircleOutlined className="text-gray-400 dark:text-gray-500 text-base" />
                    Trợ giúp & Hỗ trợ
                  </button>
                  <button className="w-full px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md flex items-center gap-3 transition-colors bg-transparent border-none cursor-pointer">
                    <SettingOutlined className="text-gray-400 dark:text-gray-500 text-base" />
                    Cài đặt
                  </button>
                </div>

                <div className="p-2 border-t border-gray-100 dark:border-gray-800 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2.5 text-left text-sm text-[#d93025] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center gap-3 transition-colors bg-transparent border-none cursor-pointer font-medium"
                  >
                    <LogoutOutlined className="text-[#d93025] text-base" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Offcanvas Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Sidebar */}
          <div className="relative w-64 max-w-[80%] bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-slide-right">
            <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <span className="font-bold text-lg text-gray-900 dark:text-white">BizFlow Menu</span>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-transparent border-none outline-none cursor-pointer p-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <CloseOutlined className="text-lg" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Search Bar in Mobile Menu */}
              <div className="relative w-full mb-6">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-transparent dark:border-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"
                />
                <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = pathname?.startsWith(link.path);
                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${isActive
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 px-2">Cài đặt hiển thị</p>
                {mounted && (
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-transparent border-none cursor-pointer"
                  >
                    <span>{theme === 'dark' ? 'Giao diện Tối' : 'Giao diện Sáng'}</span>
                    {theme === 'dark' ? <MoonOutlined className="text-base text-blue-400" /> : <SunOutlined className="text-base text-orange-400" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
