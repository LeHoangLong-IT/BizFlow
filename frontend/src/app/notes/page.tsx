"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Button, Input, Spin, message, Dropdown, MenuProps, Popover, DatePicker, Select, Checkbox, Tooltip, Popconfirm, Modal } from 'antd';
import { SearchOutlined, PlusOutlined, MoreOutlined, PushpinOutlined, PushpinFilled, DeleteOutlined, FileTextOutlined, CheckSquareOutlined, ArrowLeftOutlined, DownOutlined, RightOutlined, TagOutlined, ClockCircleOutlined, PaperClipOutlined, ControlOutlined, FolderOutlined, CloseOutlined, EditOutlined, LeftOutlined, CalendarOutlined, EllipsisOutlined } from '@ant-design/icons';
import api from '@/lib/axios';
import dayjs from 'dayjs';
import TaskCard from '@/components/TaskCard';
import 'react-quill-new/dist/quill.snow.css';
import NoteDateTimePicker from './NoteDateTimePicker';
import TagEditModal from './TagEditModal';

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [editingNoteContent, setEditingNoteContent] = useState(false);
  const [isNoteContentOpen, setIsNoteContentOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [tagSearchText, setTagSearchText] = useState('');
  const [isTagEditModalOpen, setIsTagEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTaskPopoverOpen, setIsTaskPopoverOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchNotes();
    fetchCategories();
    fetchTags();

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchTags = async () => {
    try {
      const res = await api.get('/tags');
      setTags(res.data);
    } catch (error) {
      console.error('Lỗi khi tải nhãn:', error);
    }
  };

  const getContrastColor = (hexcolor: string) => {
    if (!hexcolor) return '#ffffff';
    const hex = hexcolor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 170) ? '#1f2937' : '#ffffff'; // dark gray for light backgrounds, white for dark backgrounds
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/event-categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notes');
      setNotes(res.data);
      if (res.data.length > 0) {
        setNotes((prevNotes) => {
          // using state updater just in case, but res.data is fresh
          return res.data;
        });

        setSelectedNote((prevSelected: any) => {
          if (!prevSelected) {
            setContent(res.data[0].contentMarkdown || '');
            return res.data[0];
          } else {
            const updated = res.data.find((n: any) => n.id === prevSelected.id);
            if (updated) {
              return updated;
            }
            return prevSelected;
          }
        });
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách ghi chú');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNote = (note: any) => {
    setSelectedNote(note);
    setContent(note.contentMarkdown || '');
    setEditingNoteContent(false);
    setIsNoteContentOpen(false);
  };

  const handleCreateNote = async (isTodo: boolean = false) => {
    try {
      setSaving(true);
      const res = await api.post('/notes', {
        title: isTodo ? 'Danh sách công việc mới' : 'Ghi chú mới',
        contentMarkdown: '',
      });
      // The API returns the note without tasks yet, so initialize it
      const newNote = { ...res.data, tasks: [] };
      setNotes([newNote, ...notes]);
      setSelectedNote(newNote);
      setContent('');
      message.success('Đã tạo mới');
    } catch (error) {
      message.error('Lỗi khi tạo');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async (id: number, data: any) => {
    try {
      setSaving(true);
      await api.patch(`/notes/${id}`, data);

      let updatedData = { ...data };
      // Optimistically update tags array if tagIds is provided
      if (data.tagIds !== undefined) {
        updatedData.tags = tags.filter(t => data.tagIds.includes(t.id));
      }

      setNotes(notes.map(n => n.id === id ? { ...n, ...updatedData } : n));
      if (selectedNote?.id === id) {
        setSelectedNote({ ...selectedNote, ...updatedData });
      }
    } catch (error) {
      message.error('Lỗi khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNoteContent = async () => {
    await handleUpdateNote(selectedNote.id, { contentMarkdown: content });
    setEditingNoteContent(false);
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await api.delete(`/notes/${id}`);
      const newNotes = notes.filter(n => n.id !== id);
      setNotes(newNotes);
      if (selectedNote?.id === id) {
        if (newNotes.length > 0) {
          setSelectedNote(newNotes[0]);
          setContent(newNotes[0].contentMarkdown || '');
        } else {
          setSelectedNote(null);
          setContent('');
        }
      }
      message.success('Đã xóa');
    } catch (error) {
      message.error('Lỗi khi xóa');
    }
  };

  const handleCreateTaskForNote = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newTaskInput.trim() || !selectedNote) return;
    try {
      const res = await api.post('/tasks', {
        content: newTaskInput,
        noteId: selectedNote.id
      });
      // API might return task without subtasks, init it
      const newTask = { ...res.data, subtasks: [] };
      const updatedNote = { ...selectedNote, tasks: [...(selectedNote.tasks || []), newTask] };
      setSelectedNote(updatedNote);
      setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
      setNewTaskInput('Việc cần làm');
      setIsTaskPopoverOpen(false);
      setIsTaskModalOpen(false);
    } catch (error) {
      message.error('Lỗi khi thêm công việc');
    }
  };

  const handleTaskUpdated = (updatedTask: any) => {
    if (!selectedNote) return;
    const updatedTasks = selectedNote.tasks.map((t: any) => t.id === updatedTask.id ? updatedTask : t);
    const updatedNote = { ...selectedNote, tasks: updatedTasks };
    setSelectedNote(updatedNote);
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const handleTaskDeleted = (taskId: number) => {
    if (!selectedNote) return;
    const updatedTasks = selectedNote.tasks.filter((t: any) => t.id !== taskId);
    const updatedNote = { ...selectedNote, tasks: updatedTasks };
    setSelectedNote(updatedNote);
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  const getMenuProps = (note: any): MenuProps => ({
    items: [
      {
        key: 'pin',
        icon: note.isPinned ? <PushpinFilled /> : <PushpinOutlined />,
        label: note.isPinned ? 'Bỏ ghim' : 'Ghim',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          handleUpdateNote(note.id, { isPinned: !note.isPinned });
        }
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Xóa',
        danger: true,
        onClick: (e) => {
          e.domEvent.stopPropagation();
          handleDeleteNote(note.id);
        }
      }
    ]
  });

  const getNoteIcon = (note: any) => {
    const hasText = !!note.contentMarkdown;
    const hasTasks = note.tasks && note.tasks.length > 0;
    if (hasTasks && !hasText) return <CheckSquareOutlined className="text-green-500" />;
    if (!hasTasks && hasText) return <FileTextOutlined className="text-blue-500" />;
    return <FileTextOutlined className="text-gray-500" />; // Mixed or empty
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const renderTagPopoverContent = () => (
    <div className={`${isMobile ? 'w-full' : 'w-[280px]'} p-3 flex flex-col gap-3 font-sans`}>
      <div className="flex items-center justify-between pb-2">
        <Button type="text" icon={<LeftOutlined />} size="small" className="text-gray-500" onClick={() => setIsTagPopoverOpen(false)} />
        <span className="font-semibold text-gray-700 text-[15px]">Nhãn</span>
        <Button type="text" icon={<CloseOutlined />} size="small" className="text-gray-500" onClick={() => setIsTagPopoverOpen(false)} />
      </div>
      <div>
        <Input
          placeholder="Tìm nhãn..."
          value={tagSearchText}
          onChange={e => setTagSearchText(e.target.value)}
          className="rounded-md bg-gray-50 hover:bg-white focus:bg-white"
        />
      </div>
      <div className="text-[13px] font-semibold text-gray-500 px-1 mt-1 uppercase tracking-wider">Nhãn</div>
      <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto custom-scrollbar">
        {tags.filter(t => t.name.toLowerCase().includes(tagSearchText.toLowerCase())).map(tag => {
          const isSelected = selectedNote?.tags?.some((t: any) => t.id === tag.id);
          return (
            <div key={tag.id} className="flex items-center gap-2 group ps-1 overflow-hidden">
              <Checkbox
                checked={isSelected}
                onChange={(e) => {
                  let newTagIds;
                  if (e.target.checked) {
                    newTagIds = [...(selectedNote.tags?.map((t: any) => t.id) || []), tag.id];
                  } else {
                    newTagIds = (selectedNote.tags?.map((t: any) => t.id) || []).filter((id: number) => id !== tag.id);
                  }
                  handleUpdateNote(selectedNote.id, { tagIds: newTagIds });
                }}
                className="scale-110 shrink-0"
              />
              <div
                className="flex-1 min-w-0 rounded-md px-3 py-1.5 font-medium text-sm truncate shadow-sm transition-opacity hover:opacity-90 cursor-pointer min-h-[32px] flex items-center"
                style={{ backgroundColor: tag.color || '#10b981', color: getContrastColor(tag.color || '#10b981') }}
                onClick={() => {
                  let newTagIds;
                  if (!isSelected) {
                    newTagIds = [...(selectedNote.tags?.map((t: any) => t.id) || []), tag.id];
                  } else {
                    newTagIds = (selectedNote.tags?.map((t: any) => t.id) || []).filter((id: number) => id !== tag.id);
                  }
                  handleUpdateNote(selectedNote.id, { tagIds: newTagIds });
                }}
              >
                {tag.name}
              </div>
              <Button
                type="text"
                className="shrink-0"
                icon={<EditOutlined className="text-gray-400 group-hover:text-gray-600 transition-colors" />}
                size="small"
                onClick={() => {
                  setEditingTag(tag);
                  setIsTagEditModalOpen(true);
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="pt-2 border-t border-gray-100">
        <Button
          className="w-full rounded-md font-medium text-gray-600 hover:text-blue-600 border-gray-200 hover:border-blue-400 transition-colors"
          onClick={() => {
            setEditingTag(null);
            setIsTagEditModalOpen(true);
          }}
        >
          Tạo nhãn mới
        </Button>
      </div>
    </div>
  );

  const renderDatePickerContent = () => {
    if (!selectedNote) return null;
    return (
      <NoteDateTimePicker
        initialStartDate={selectedNote.startDate}
        initialDueDate={selectedNote.dueDate}
        initialRecurrence={selectedNote.recurrenceRule}
        onSave={(data) => {
          handleUpdateNote(selectedNote.id, {
            startDate: data.startDate,
            dueDate: data.dueDate,
            recurrenceRule: data.recurrenceRule
          });
          setIsDatePickerOpen(false);
        }}
        onClose={() => setIsDatePickerOpen(false)}
      />
    );
  };

  const renderTaskInputContent = () => (
    <div className="w-64 sm:w-72 flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
        <Button type="text" icon={<LeftOutlined />} size="small" onClick={() => { setIsTaskPopoverOpen(false); setIsTaskModalOpen(false); }} className="text-gray-500" />
        <span className="font-semibold text-gray-700">Thêm danh sách công việc</span>
        <Button type="text" icon={<CloseOutlined />} size="small" onClick={() => { setIsTaskPopoverOpen(false); setIsTaskModalOpen(false); }} className="text-gray-500" />
      </div>
      <div>
        <div className="mb-1 text-xs font-semibold text-gray-600">Tiêu đề</div>
        <Input
          value={newTaskInput}
          onChange={(e) => setNewTaskInput(e.target.value)}
          onPressEnter={handleCreateTaskForNote}
          autoFocus
          className="mb-3 text-[14px]"
        />
        <Button type="primary" className="w-full font-medium mt-4" onClick={handleCreateTaskForNote}>
          Thêm
        </Button>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen flex flex-col bg-[#f3f3f9] dark:bg-gray-900 w-full min-w-0">
      <header className="bg-white dark:bg-gray-800 shadow-sm px-6 py-3 flex justify-between items-center z-10 border-b border-gray-100 dark:border-gray-700 relative min-w-0">
        <h1 className="text-[1.1rem] font-bold text-gray-800 dark:text-white tracking-tight font-oswald uppercase truncate">GHI CHÚ & CÔNG VIỆC</h1>
      </header>

      <div className="flex-1 flex px-4 py-6 gap-6 max-w-[1600px] w-full mx-auto min-w-0 box-border h-[calc(100vh-65px)] relative overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-full md:w-[320px] flex-shrink-0 flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <Dropdown menu={{
              items: [
                { key: '1', label: 'Tạo Ghi chú', icon: <FileTextOutlined />, onClick: () => handleCreateNote(false) },
                { key: '2', label: 'Tạo To-do', icon: <CheckSquareOutlined />, onClick: () => handleCreateNote(true) },
              ]
            }}>
              <Button type="primary" icon={<PlusOutlined />} className="w-full bg-[#3b5998] hover:bg-[#2d4373] h-10 mb-4" loading={saving}>
                Tạo mới
              </Button>
            </Dropdown>
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 rounded-md"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center p-10"><Spin /></div>
            ) : (
              <>
                {pinnedNotes.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Đã ghim</div>
                    {pinnedNotes.map(note => (
                      <div
                        key={note.id}
                        onClick={() => handleSelectNote(note)}
                        className={`group relative flex flex-col p-4 mx-2 my-2 rounded-xl cursor-pointer transition-colors ${selectedNote?.id === note.id ? 'bg-[#f0f7ff] dark:bg-blue-900/30 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className={`text-[16px] font-semibold tracking-tight line-clamp-1 ${selectedNote?.id === note.id ? 'text-[#3b5998] dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                            {note.title}
                          </h4>
                          <span className="flex-shrink-0 mt-0.5 text-lg">
                            {getNoteIcon(note)}
                          </span>
                        </div>

                        <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 mb-3 pr-6 leading-relaxed">
                          {stripHtml(note.contentMarkdown)?.substring(0, 80) || 'Chưa có nội dung...'}
                        </p>

                        <div className="flex items-center gap-3 mt-auto">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${selectedNote?.id === note.id ? 'bg-white border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-700 dark:border-gray-600'}`}>
                            {(note.tasks && note.tasks.length > 0) ? `${note.tasks.filter((t: any) => t.isCompleted).length}/${note.tasks.length} task` : 'Ghi chú'}
                          </div>
                          <span className="text-xs text-gray-400 font-medium">
                            {dayjs(note.updatedAt).format('DD-MM-YYYY')}
                          </span>
                        </div>

                        <div className="absolute bottom-3 right-3">
                          <Dropdown menu={getMenuProps(note)} trigger={['click']}>
                            <Button type="text" size="small" icon={<MoreOutlined />} className="opacity-0 group-hover:opacity-100 dark:text-gray-300" onClick={e => e.stopPropagation()} />
                          </Dropdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  {pinnedNotes.length > 0 && <div className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Khác</div>}
                  {otherNotes.map(note => (
                    <div
                      key={note.id}
                      onClick={() => handleSelectNote(note)}
                      className={`group relative flex flex-col p-4 mx-2 my-2 rounded-xl cursor-pointer transition-colors ${selectedNote?.id === note.id ? 'bg-[#f0f7ff] dark:bg-blue-900/30 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-[16px] font-semibold tracking-tight line-clamp-1 ${selectedNote?.id === note.id ? 'text-[#3b5998] dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                          {note.title}
                        </h4>
                        <span className="flex-shrink-0 mt-0.5 text-lg">
                          {getNoteIcon(note)}
                        </span>
                      </div>

                      <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 mb-3 pr-6 leading-relaxed">
                        {stripHtml(note.contentMarkdown)?.substring(0, 80) || 'Chưa có nội dung...'}
                      </p>

                      <div className="flex items-center gap-3 mt-auto">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${selectedNote?.id === note.id ? 'bg-white border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-700 dark:border-gray-600'}`}>
                          {(note.tasks && note.tasks.length > 0) ? `${note.tasks.filter((t: any) => t.isCompleted).length}/${note.tasks.length} task` : 'Ghi chú'}
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                          {dayjs(note.updatedAt).format('DD-MM-YYYY')}
                        </span>
                      </div>

                      <div className="absolute bottom-3 right-3">
                        <Dropdown menu={getMenuProps(note)} trigger={['click']}>
                          <Button type="text" size="small" icon={<MoreOutlined />} className="opacity-0 group-hover:opacity-100 dark:text-gray-300" onClick={e => e.stopPropagation()} />
                        </Dropdown>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`absolute inset-x-4 inset-y-6 md:static md:inset-auto z-20 md:z-0 flex-1 flex-col min-w-0 flex transition-transform duration-300 ease-out bg-[#f3f3f9] dark:bg-gray-900 md:bg-transparent ${selectedNote ? 'translate-x-0' : 'translate-x-[120%] md:translate-x-0'}`}>
          {selectedNote ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">

              <div className="p-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10 flex items-start gap-3">
                <Button
                  icon={<ArrowLeftOutlined className="text-lg" />}
                  type="text"
                  className="md:!hidden -ml-2 text-gray-500 mt-1"
                  onClick={() => setSelectedNote(null)}
                />
                <div className="flex-1 min-w-0">
                  <Input.TextArea
                    value={selectedNote.title}
                    onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                    onBlur={() => handleUpdateNote(selectedNote.id, { title: selectedNote.title })}
                    variant="borderless"
                    autoSize
                    className="!text-[20px] md:!text-[26px] font-bold !text-gray-800 dark:!text-white px-0 focus:shadow-none tracking-tight leading-tight w-full"
                    placeholder="Tiêu đề..."
                  />
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-2 ml-auto shrink-0 mt-1">
                  <Tooltip title={selectedNote.isPinned ? "Bỏ ghim" : "Ghim"}>
                    <Button
                      type="default"
                      size="large"
                      className="flex items-center justify-center border-gray-200"
                      icon={selectedNote.isPinned ? <PushpinFilled className="text-blue-500 text-[20px]" /> : <PushpinOutlined className="text-gray-400 hover:text-gray-600 text-[20px]" />}
                      onClick={() => handleUpdateNote(selectedNote.id, { isPinned: !selectedNote.isPinned })}
                    />
                  </Tooltip>
                  <Tooltip title="Xem trên lịch">
                    <Button
                      type="default"
                      size="large"
                      className="flex items-center justify-center border-gray-200"
                      icon={<CalendarOutlined className="text-gray-400 hover:text-gray-600 text-[20px]" />}
                      onClick={() => router.push('/calendar')}
                    />
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <Button
                      type="default"
                      danger
                      size="large"
                      className="flex items-center justify-center"
                      icon={<DeleteOutlined className="text-[20px]" />}
                      onClick={() => {
                        setNoteToDelete(selectedNote.id);
                        setIsDeleteModalOpen(true);
                      }}
                    />
                  </Tooltip>
                </div>

                {/* Mobile Actions Dropdown */}
                <div className="flex md:hidden items-center ml-auto shrink-0 mt-1">
                  <Dropdown
                    trigger={['click']}
                    placement="bottomRight"
                    menu={{
                      items: [
                        {
                          key: 'pin',
                          icon: selectedNote.isPinned ? <PushpinFilled className="text-blue-500" /> : <PushpinOutlined className="text-gray-500" />,
                          label: selectedNote.isPinned ? 'Bỏ ghim' : 'Ghim',
                          onClick: () => handleUpdateNote(selectedNote.id, { isPinned: !selectedNote.isPinned })
                        },
                        {
                          key: 'calendar',
                          icon: <CalendarOutlined className="text-gray-500" />,
                          label: 'Xem trên lịch',
                          onClick: () => router.push('/calendar')
                        },
                        {
                          type: 'divider'
                        },
                        {
                          key: 'delete',
                          icon: <DeleteOutlined />,
                          danger: true,
                          label: 'Xóa ghi chú',
                          onClick: () => {
                            setNoteToDelete(selectedNote.id);
                            setIsDeleteModalOpen(true);
                          }
                        }
                      ]
                    }}
                  >
                    <Button
                      type="default"
                      size="large"
                      className="flex items-center justify-center border-gray-200"
                      icon={<EllipsisOutlined className="text-[20px] text-gray-500" />}
                    />
                  </Dropdown>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

                {/* Note Toolbar */}
                <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [
                        { key: 'tag', icon: <TagOutlined />, label: 'Nhãn', onClick: () => setIsTagPopoverOpen(true) },
                        { key: 'date', icon: <ClockCircleOutlined />, label: 'Ngày', onClick: () => setIsDatePickerOpen(true) },
                        { key: 'todo', icon: <CheckSquareOutlined />, label: 'Việc cần làm', onClick: () => { setNewTaskInput('Việc cần làm'); isMobile ? setIsTaskModalOpen(true) : setIsTaskPopoverOpen(true); } },
                        { key: 'attach', icon: <PaperClipOutlined />, label: 'Đính kèm', onClick: () => message.info('Tính năng đính kèm đang phát triển') },
                        { key: 'custom', icon: <ControlOutlined />, label: 'Trường tùy chỉnh', onClick: () => message.info('Tính năng trường tùy chỉnh đang phát triển') },
                      ]
                    }}
                  >
                    <Button icon={<PlusOutlined />} className="bg-gray-100 text-gray-700 border-none font-medium">Thêm</Button>
                  </Dropdown>

                  {!selectedNote.categoryId && (
                    <Dropdown
                      trigger={['click']}
                      menu={{
                        items: categories.map(cat => ({
                          key: cat.id,
                          label: (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#ccc' }}></div>
                              {cat.name}
                            </div>
                          ),
                          onClick: () => handleUpdateNote(selectedNote.id, { categoryId: cat.id })
                        }))
                      }}
                    >
                      <Button icon={<FolderOutlined />} className="text-gray-600 border-gray-200">
                        Danh mục
                      </Button>
                    </Dropdown>
                  )}

                  {(!selectedNote.tags || selectedNote.tags.length === 0) && (
                    isMobile ? (
                      <Button icon={<TagOutlined />} className="text-gray-600 border-gray-200 font-medium" onClick={() => setIsTagPopoverOpen(true)}>
                        Nhãn
                      </Button>
                    ) : (
                      <Popover
                        content={renderTagPopoverContent()}
                        trigger="click"
                        open={isTagPopoverOpen}
                        onOpenChange={(open) => {
                          if (!open && isTagEditModalOpen) return;
                          setIsTagPopoverOpen(open);
                        }}
                        placement="bottomLeft"
                        zIndex={40}
                        styles={{ container: { padding: 0, borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' } }}
                      >
                        <Button icon={<TagOutlined />} className="text-gray-600 border-gray-200 font-medium">
                          Nhãn
                        </Button>
                      </Popover>
                    )
                  )}

                  {isMobile ? (
                    <Button icon={<CheckSquareOutlined />} className="bg-[#4a5568] text-white border-none font-medium hover:!bg-[#3a4558] hover:!text-white" onClick={() => { setNewTaskInput('Việc cần làm'); setIsTaskModalOpen(true); }}>
                      Việc cần làm
                    </Button>
                  ) : (
                    <Popover
                      content={renderTaskInputContent()}
                      trigger="click"
                      open={isTaskPopoverOpen}
                      onOpenChange={setIsTaskPopoverOpen}
                      placement="bottomLeft"
                      zIndex={40}
                    >
                      <Button icon={<CheckSquareOutlined />} className="bg-[#4a5568] text-white border-none font-medium hover:!bg-[#3a4558] hover:!text-white" onClick={() => setNewTaskInput('Việc cần làm')}>
                        Việc cần làm
                      </Button>
                    </Popover>
                  )}


                  {(!selectedNote.startDate && !selectedNote.dueDate) && (
                    isMobile ? (
                      <Button icon={<ClockCircleOutlined />} className="text-gray-600 border-gray-200" onClick={() => setIsDatePickerOpen(true)}>
                        Thời gian
                      </Button>
                    ) : (
                      <Popover
                        trigger="click"
                        placement="bottomLeft"
                        open={isDatePickerOpen}
                        onOpenChange={setIsDatePickerOpen}
                        content={renderDatePickerContent()}
                      >
                        <Button icon={<ClockCircleOutlined />} className="text-gray-600 border-gray-200">
                          Thời gian
                        </Button>
                      </Popover>
                    )
                  )}
                </div>

                {/* Summary Blocks */}
                {((selectedNote.tags && selectedNote.tags.length > 0) || selectedNote.startDate || selectedNote.dueDate || selectedNote.categoryId) && (
                  <div className="flex flex-wrap items-start gap-x-8 gap-y-4 mb-6">
                    {/* Category Summary */}
                    {selectedNote.categoryId && (
                      <div className="flex flex-col gap-2">
                        <div className="text-[14px] font-semibold text-gray-500">Danh mục</div>
                        <Dropdown
                          trigger={['click']}
                          menu={{
                            items: categories.map(cat => ({
                              key: cat.id,
                              label: (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#ccc' }}></div>
                                  {cat.name}
                                </div>
                              ),
                              onClick: () => handleUpdateNote(selectedNote.id, { categoryId: cat.id })
                            }))
                          }}
                        >
                          <div className="inline-flex items-center gap-2 px-3 h-8 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors bg-white shadow-sm">
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: categories.find(c => c.id === selectedNote.categoryId)?.color || '#ccc' }}></div>
                            <span className="text-gray-700 text-[14px] font-medium">
                              {categories.find(c => c.id === selectedNote.categoryId)?.name || 'Danh mục'}
                            </span>
                            <DownOutlined className="text-gray-500 text-[10px] ml-1" />
                          </div>
                        </Dropdown>
                      </div>
                    )}

                    {/* Tags Summary */}
                    {(selectedNote.tags && selectedNote.tags.length > 0) && (
                      <div className="flex flex-col gap-2">
                        <div className="text-[14px] font-semibold text-gray-500">Nhãn</div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {selectedNote.tags.map((tag: any) => (
                            <Tooltip key={tag.id} title={tag.name}>
                              <div
                                className={`min-w-11 w-auto ${tag.name ? 'px-2' : ''} h-8 rounded-md shadow-sm flex items-center justify-center font-medium text-xs truncate max-w-[120px]`}
                                style={{ backgroundColor: tag.color || '#ccc', color: getContrastColor(tag.color || '#ccc') }}
                              >
                                {tag.name || ''}
                              </div>
                            </Tooltip>
                          ))}
                          {isMobile ? (
                            <Button className="w-11 h-8 p-0 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm" onClick={() => setIsTagPopoverOpen(true)}>
                              <PlusOutlined className="text-lg" />
                            </Button>
                          ) : (
                            <Popover
                              content={renderTagPopoverContent()}
                              trigger="click"
                              open={isTagPopoverOpen}
                              onOpenChange={(open) => {
                                if (!open && isTagEditModalOpen) return;
                                setIsTagPopoverOpen(open);
                              }}
                              placement="bottomLeft"
                              zIndex={40}
                              styles={{ container: { padding: 0, borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' } }}
                            >
                              <Button className="w-11 h-8 p-0 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
                                <PlusOutlined className="text-lg" />
                              </Button>
                            </Popover>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Date Summary */}
                    {(selectedNote.startDate || selectedNote.dueDate) && (
                      <div className="flex flex-col gap-2">
                        <div className="text-[14px] font-semibold text-gray-500">
                          {selectedNote.startDate && selectedNote.dueDate
                            ? 'Ngày'
                            : selectedNote.startDate
                              ? 'Ngày bắt đầu'
                              : 'Ngày hết hạn'}
                        </div>
                        {isMobile ? (
                          <div className="inline-flex items-center gap-2 px-3 h-8 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors bg-white shadow-sm" onClick={() => setIsDatePickerOpen(true)}>
                            <span className="text-gray-700 text-[14px]">
                              {selectedNote.startDate && selectedNote.dueDate
                                ? `${dayjs(selectedNote.startDate).format('D [thg] M')} - ${dayjs(selectedNote.dueDate).format('H:mm D [thg] M')}`
                                : selectedNote.dueDate
                                  ? dayjs(selectedNote.dueDate).format('H:mm D [thg] M')
                                  : dayjs(selectedNote.startDate).format('H:mm D [thg] M')}
                            </span>
                            {selectedNote.dueDate && (
                              selectedNote.status === 'DONE' ? (
                                <span className="text-[12px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 font-medium ml-1">Hoàn thành</span>
                              ) : dayjs().isAfter(dayjs(selectedNote.dueDate)) ? (
                                <span className="text-[12px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 font-medium ml-1">Quá hạn</span>
                              ) : dayjs(selectedNote.dueDate).diff(dayjs(), 'hour') <= 24 ? (
                                <span className="text-[12px] px-1.5 py-0.5 rounded bg-[#facc15] text-gray-900 font-medium ml-1 shadow-sm">Sắp hết hạn</span>
                              ) : null
                            )}
                            <DownOutlined className="text-gray-500 text-[10px] ml-1" />
                          </div>
                        ) : (
                          <Popover
                            trigger="click"
                            placement="bottomLeft"
                            open={isDatePickerOpen}
                            onOpenChange={setIsDatePickerOpen}
                            content={renderDatePickerContent()}
                          >
                            <div className="inline-flex items-center gap-2 px-3 h-8 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors bg-white shadow-sm">
                              <span className="text-gray-700 text-[14px]">
                                {selectedNote.startDate && selectedNote.dueDate
                                  ? `${dayjs(selectedNote.startDate).format('D [thg] M')} - ${dayjs(selectedNote.dueDate).format('H:mm D [thg] M')}`
                                  : selectedNote.dueDate
                                    ? dayjs(selectedNote.dueDate).format('H:mm D [thg] M')
                                    : dayjs(selectedNote.startDate).format('H:mm D [thg] M')}
                              </span>
                              {selectedNote.dueDate && (
                                selectedNote.status === 'DONE' ? (
                                  <span className="text-[12px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 font-medium ml-1">Hoàn thành</span>
                                ) : dayjs().isAfter(dayjs(selectedNote.dueDate)) ? (
                                  <span className="text-[12px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 font-medium ml-1">Quá hạn</span>
                                ) : dayjs(selectedNote.dueDate).diff(dayjs(), 'hour') <= 24 ? (
                                  <span className="text-[12px] px-1.5 py-0.5 rounded bg-[#facc15] text-gray-900 font-medium ml-1 shadow-sm">Sắp hết hạn</span>
                                ) : null
                              )}
                              <DownOutlined className="text-gray-500 text-[10px] ml-1" />
                            </div>
                          </Popover>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Note Content Block (Compact) */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h5
                      className="text-[16px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 cursor-pointer select-none hover:text-[#3b5998] transition-colors"
                      onClick={() => setIsNoteContentOpen(!isNoteContentOpen)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="18" x2="15" y2="18"></line>
                      </svg>
                      Nội dung Ghi chú
                      {isNoteContentOpen ? <DownOutlined className="text-xs ml-1" /> : <RightOutlined className="text-xs ml-1" />}
                    </h5>
                    <div className={`transition-opacity duration-300 ${isNoteContentOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      {editingNoteContent ? (
                        content !== (selectedNote.contentMarkdown || '') && (
                          <span className="text-[10px] font-bold text-orange-500 border border-orange-300 rounded px-2 py-0.5 uppercase tracking-wide">
                            Các thay đổi chưa được lưu
                          </span>
                        )
                      ) : (
                        <Button onClick={() => setEditingNoteContent(true)} className="text-gray-600 font-medium">Chỉnh sửa</Button>
                      )}
                    </div>
                  </div>

                  <div className={`grid transition-all duration-300 ease-in-out ${isNoteContentOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      {editingNoteContent ? (
                        <div>
                          <div className="border-2 border-blue-500 rounded-md overflow-hidden bg-white dark:bg-gray-800">
                            <ReactQuill
                              theme="snow"
                              value={content}
                              onChange={setContent}
                              className="h-[250px] mb-12"
                              modules={{
                                toolbar: [
                                  [{ 'header': [1, 2, 3, false] }],
                                  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                  [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }, { 'align': [] }],
                                  ['link', 'image', 'code-block'],
                                  ['clean']
                                ],
                              }}
                            />
                          </div>
                          <div className="mt-4 flex items-center justify-end gap-4">
                            <span
                              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer"
                              onClick={() => { setEditingNoteContent(false); setContent(selectedNote.contentMarkdown || ''); }}
                            >
                              Hủy
                            </span>
                            <Button type="primary" onClick={handleSaveNoteContent} loading={saving} className="bg-[#1a73e8] font-medium px-6">
                              Lưu
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[15px] text-gray-700 dark:text-gray-300 min-h-[60px] overflow-hidden whitespace-normal mt-2 pl-7 w-full max-w-full">
                          {selectedNote.contentMarkdown ? (
                            <div className="quill-content [&_*]:max-w-full w-full" dangerouslySetInnerHTML={{ __html: selectedNote.contentMarkdown.replace(/&nbsp;/g, ' ') }} />
                          ) : (
                            <span className="italic text-gray-400">Thêm nội dung ghi chú...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tasks List Block */}
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200 text-[15px] mb-4 flex items-center gap-2">
                    <CheckSquareOutlined /> Các việc cần làm
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-start">
                    {selectedNote.tasks?.map((task: any) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onTaskUpdated={handleTaskUpdated}
                        onTaskDeleted={handleTaskDeleted}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              Chọn một ghi chú để bắt đầu
            </div>
          )}
        </main>
      </div>

      <Modal
        open={isMobile && isTagPopoverOpen}
        onCancel={() => setIsTagPopoverOpen(false)}
        footer={null}
        closable={false}
        centered
        width={320}
        styles={{ body: { padding: 0 } }}
        zIndex={1000}
      >
        {renderTagPopoverContent()}
      </Modal>

      <Modal
        open={isMobile && isDatePickerOpen}
        onCancel={() => setIsDatePickerOpen(false)}
        footer={null}
        closable={false}
        centered
        width={320}
        styles={{ body: { padding: 16 } }}
        zIndex={1000}
      >
        {renderDatePickerContent()}
      </Modal>

      <TagEditModal
        isOpen={isTagEditModalOpen}
        onClose={() => setIsTagEditModalOpen(false)}
        tagData={editingTag}
        onSuccess={() => {
          fetchNotes();
          fetchTags();
        }}
      />

      <Modal
        open={isMobile && isTaskModalOpen}
        onCancel={() => setIsTaskModalOpen(false)}
        footer={null}
        closable={false}
        centered
        width={350}
        styles={{ body: { padding: 16 } }}
        zIndex={1000}
      >
        {renderTaskInputContent()}
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        footer={null}
        closable={false}
        centered
        width={400}
        styles={{
          body: { padding: 0 },
        }}
        modalRender={(node) => (
          <div className="rounded-[16px] overflow-hidden bg-white dark:bg-gray-800 border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-0">
            {node}
          </div>
        )}
        zIndex={1000}
      >
        <div className="relative flex pt-8 pb-4 px-2 flex-col items-center text-center rounded-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-red-500/10 dark:bg-red-500/20 blur-[50px] pointer-events-none" />

          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-ping opacity-70" style={{ animationDuration: '3s' }} />
            <div className="relative w-16 h-16 bg-gradient-to-tr from-red-500 to-rose-400 rounded-full flex items-center justify-center shadow-xl shadow-red-500/20 ring-4 ring-white dark:ring-gray-800 z-10">
              <DeleteOutlined className="text-3xl text-white" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight font-sans">
            Xóa Ghi Chú?
          </h3>

          <p className="text-gray-500 dark:text-gray-400 text-[15px] leading-relaxed mb-8 max-w-[280px]">
            Ghi chú này sẽ bị xóa vĩnh viễn và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?
          </p>

          <div className="flex flex-col gap-3 w-full">
            <Button
              danger
              type="primary"
              className="w-full h-12 text-[16px] font-semibold bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 border-none rounded-lg shadow-lg shadow-red-500/25 transition-all hover:-translate-y-0.5"
              onClick={() => {
                if (noteToDelete) {
                  handleDeleteNote(noteToDelete);
                  setIsDeleteModalOpen(false);
                }
              }}
            >
              Vâng, Xóa Ngay
            </Button>
            <Button
              className="w-full h-12 text-[16px] font-medium text-gray-600 dark:text-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-all"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Giữ Lại
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
