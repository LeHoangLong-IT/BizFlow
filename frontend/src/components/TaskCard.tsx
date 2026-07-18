"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Button, Checkbox, Popconfirm, Input, Progress, Tooltip, Dropdown } from 'antd';
import { DeleteOutlined, EditOutlined, HistoryOutlined, CheckOutlined, MoreOutlined } from '@ant-design/icons';
import api from '@/lib/axios';
import dayjs from 'dayjs';

export default function TaskCard({ task, onTaskUpdated, onTaskDeleted }: { task: any, onTaskUpdated: (task: any) => void, onTaskDeleted: (id: number) => void }) {
  const [newSubTask, setNewSubTask] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingSubTaskId, setEditingSubTaskId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isEditingMainTask, setIsEditingMainTask] = useState(false);
  const [mainTaskContent, setMainTaskContent] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const completedSubTasks = task.subtasks?.filter((s: any) => s.isCompleted).length || 0;
  const totalSubTasks = task.subtasks?.length || 0;
  const progress = totalSubTasks === 0 ? 0 : Math.round((completedSubTasks / totalSubTasks) * 100);

  // Close the add box when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsAdding(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleToggleTask = async () => {
    try {
      const updated = { isCompleted: !task.isCompleted };
      await api.patch(`/tasks/${task.id}`, updated);
      onTaskUpdated({ ...task, ...updated });
    } catch (error) {
      console.error(error);
    }
  };

  const checkAutoCompleteness = async (newSubTasks: any[]) => {
    if (newSubTasks.length === 0) return task.isCompleted;
    const isAllCompleted = newSubTasks.every((s: any) => s.isCompleted);
    if (isAllCompleted !== task.isCompleted) {
      try {
        await api.patch(`/tasks/${task.id}`, { isCompleted: isAllCompleted });
        return isAllCompleted;
      } catch (error) {
        console.error(error);
      }
    }
    return task.isCompleted;
  };

  const startEditingMainTask = () => {
    setIsEditingMainTask(true);
    setMainTaskContent(task.content);
  };

  const handleUpdateMainTask = async () => {
    if (!mainTaskContent.trim() || mainTaskContent === task.content) {
      setIsEditingMainTask(false);
      return;
    }
    try {
      await api.patch(`/tasks/${task.id}`, { content: mainTaskContent });
      onTaskUpdated({ ...task, content: mainTaskContent });
      setIsEditingMainTask(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddSubTask = async (e?: any) => {
    if (e) e.preventDefault();
    if (!newSubTask.trim()) return;
    try {
      const res = await api.post(`/tasks/${task.id}/subtasks`, { content: newSubTask });
      const newSubTasks = [...(task.subtasks || []), res.data];
      const newIsCompleted = await checkAutoCompleteness(newSubTasks);
      onTaskUpdated({ ...task, subtasks: newSubTasks, isCompleted: newIsCompleted });
      setNewSubTask('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleSubTask = async (sub: any) => {
    try {
      const updated = { isCompleted: !sub.isCompleted };
      await api.patch(`/tasks/subtasks/${sub.id}`, updated);
      const newSubTasks = task.subtasks.map((s: any) => s.id === sub.id ? { ...s, ...updated } : s);
      const newIsCompleted = await checkAutoCompleteness(newSubTasks);
      onTaskUpdated({ ...task, subtasks: newSubTasks, isCompleted: newIsCompleted });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteSubTask = async (subId: number) => {
    try {
      await api.delete(`/tasks/subtasks/${subId}`);
      const newSubTasks = task.subtasks.filter((s: any) => s.id !== subId);
      const newIsCompleted = await checkAutoCompleteness(newSubTasks);
      onTaskUpdated({ ...task, subtasks: newSubTasks, isCompleted: newIsCompleted });
    } catch (error) {
      console.error(error);
    }
  };

  const startEditingSubTask = (sub: any) => {
    setEditingSubTaskId(sub.id);
    setEditingContent(sub.content);
  };

  const handleUpdateSubTaskContent = async (subId: number) => {
    if (!editingContent.trim()) return;
    try {
      await api.patch(`/tasks/subtasks/${subId}`, { content: editingContent });
      const newSubTasks = task.subtasks.map((s: any) => s.id === subId ? { ...s, content: editingContent } : s);
      onTaskUpdated({ ...task, subtasks: newSubTasks });
      setEditingSubTaskId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const [showActivity, setShowActivity] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [newActivity, setNewActivity] = useState('');
  const [loadingActivities, setLoadingActivities] = useState(false);

  const fetchActivities = async () => {
    try {
      setLoadingActivities(true);
      const res = await api.get(`/tasks/${task.id}/activities`);
      setActivities(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (showActivity) {
      fetchActivities();
    }
  }, [showActivity, task.id]);

  const handleAddActivity = async (e: any) => {
    e.preventDefault();
    if (!newActivity.trim()) return;
    try {
      const res = await api.post(`/tasks/${task.id}/activities`, { content: newActivity, type: 'COMMENT' });
      setActivities([res.data, ...activities]);
      setNewActivity('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    try {
      await api.delete(`/tasks/activities/${activityId}`);
      setActivities(activities.filter(a => a.id !== activityId));
    } catch (error) {
      console.error(error);
    }
  };

  const menuItems: any = [
    {
      key: 'activity',
      icon: <HistoryOutlined />,
      label: showActivity ? 'Ẩn nhật ký' : 'Xem nhật ký',
      onClick: () => setShowActivity(!showActivity)
    },
    {
      key: 'edit',
      icon: isEditMode ? <CheckOutlined /> : <EditOutlined />,
      label: isEditMode ? 'Xong chỉnh sửa' : 'Chỉnh sửa',
      onClick: () => setIsEditMode(!isEditMode)
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      danger: true,
      icon: <DeleteOutlined />,
      label: (
        <Popconfirm title="Xóa danh sách này?" onConfirm={() => onTaskDeleted(task.id)}>
          <div onClick={(e) => e.stopPropagation()}>Xóa danh sách</div>
        </Popconfirm>
      ),
    }
  ];

  return (
    <div className="mb-10 md:mb-0 group bg-white dark:bg-gray-800 p-1 md:p-5 rounded-xl md:border md:border-gray-200 md:dark:border-gray-700 md:shadow-sm h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 group/main">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Checkbox checked={task.isCompleted} onChange={handleToggleTask} className="transform scale-125 mt-1 shrink-0" />
          {isEditingMainTask ? (
            <Input
              autoFocus
              value={mainTaskContent}
              onChange={e => setMainTaskContent(e.target.value)}
              onPressEnter={handleUpdateMainTask}
              onBlur={handleUpdateMainTask}
              className="text-[16px] font-bold py-1 px-2 h-8 w-full max-w-[400px]"
            />
          ) : (
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <h4 className={`text-[16px] font-bold ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'} break-words flex-1 min-w-0 mt-0.5`}>
                {task.content || 'Việc cần làm'}
              </h4>
              {isEditMode && (
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  className="text-gray-400 hover:text-blue-500 opacity-100 md:opacity-0 group-hover/main:opacity-100 transition-opacity shrink-0"
                  onClick={startEditingMainTask}
                />
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined className="text-lg" />} className="text-gray-500 hover:bg-gray-100" />
          </Dropdown>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3 mb-5 pl-[30px]">
        <span className="text-[13px] text-gray-500 font-medium">{progress}%</span>
        <Progress
          percent={progress}
          showInfo={false}
          size="small"
          className="m-0 flex-1"
          strokeColor={progress === 100 ? '#52c41a' : '#1a73e8'}
          railColor="#f0f0f0"
        />
      </div>

      {/* SubTasks List */}
      <div className="flex flex-col gap-3 mb-4 pl-[30px]">
        {task.subtasks?.map((sub: any) => (
          <div key={sub.id} className="group/item flex items-start gap-4">
            <Checkbox checked={sub.isCompleted} onChange={() => handleToggleSubTask(sub)} className="mt-0.5 transform scale-110" />
            <div className="flex-1 min-w-0 flex items-start justify-between group-hover/item:bg-gray-50 dark:group-hover/item:bg-gray-700 rounded-md transition-colors -mt-1 py-1 px-2 -ml-2">
              {editingSubTaskId === sub.id ? (
                <Input
                  autoFocus
                  value={editingContent}
                  onChange={e => setEditingContent(e.target.value)}
                  onPressEnter={() => handleUpdateSubTaskContent(sub.id)}
                  onBlur={() => handleUpdateSubTaskContent(sub.id)}
                  className="text-[15px] py-0 px-2 h-7"
                />
              ) : (
                <>
                  <span className={`text-[15px] ${sub.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'} break-words mt-0.5`}>
                    {sub.content}
                  </span>
                  {isEditMode && (
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <Button type="text" size="small" icon={<EditOutlined />} className="text-gray-500 hover:text-blue-500" onClick={() => startEditingSubTask(sub)} />
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} className="-mr-1" onClick={() => handleDeleteSubTask(sub.id)} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add SubTask Input */}
      <div className="mt-4 pl-[30px]" ref={wrapperRef}>
        {!isAdding ? (
          <div
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer py-1"
            onClick={() => setIsAdding(true)}
          >
            <span className="text-xl leading-none -mt-0.5">+</span>
            <span className="text-[15px]">Thêm một mục</span>
          </div>
        ) : (
          <>
            <Input
              autoFocus
              placeholder="Thêm một mục"
              value={newSubTask}
              onChange={e => setNewSubTask(e.target.value)}
              onPressEnter={handleAddSubTask}
              className="text-[15px] py-2.5 px-3 rounded-md transition-all border-blue-500 shadow-[0_0_0_2px_rgba(24,144,255,0.2)]"
            />
            <div className="flex items-center gap-3 mt-3 animate-fade-in">
              <Button type="primary" className="bg-[#1a73e8] font-medium px-5" onClick={handleAddSubTask}>Thêm</Button>
              <Button type="text" className="text-gray-600 font-medium px-4" onClick={() => { setIsAdding(false); setNewSubTask(''); }}>Huỷ</Button>
            </div>
          </>
        )}
      </div>

      {/* Activity Feed */}
      {showActivity && (
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 pl-[30px]">
          <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-[14px]">Nhật ký hoạt động</h5>

          <form onSubmit={handleAddActivity} className="mb-6 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
              ME
            </div>
            <div className="flex-1">
              <Input
                value={newActivity}
                onChange={e => setNewActivity(e.target.value)}
                placeholder="Thêm cập nhật hoặc bình luận..."
                className="rounded-md border-gray-300"
              />
            </div>
          </form>

          <div className="flex flex-col gap-4">
            {loadingActivities ? (
              <div className="text-gray-400 text-sm italic">Đang tải...</div>
            ) : activities.length === 0 ? (
              <div className="text-gray-400 text-sm italic">Chưa có hoạt động nào.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex gap-3 items-center group/act relative">
                  <div className="shrink-0 mt-0.5">
                    {act.type === 'COMMENT' ? (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        ME
                      </div>
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center text-gray-400">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      </div>
                    )}
                  </div>
                  <div className={`flex-1 ${act.type === 'COMMENT' ? 'bg-gray-50 dark:bg-gray-700 p-3 rounded-xl rounded-tl-none' : 'pt-1'} relative`}>
                    <div className={`text-[14px] pr-6 ${act.type === 'COMMENT' ? 'text-gray-800 dark:text-gray-200 mb-1' : 'text-gray-500 dark:text-gray-400'}`}>
                      {act.type === 'SYSTEM' ? (
                        <span className="font-medium text-gray-600">{act.content}</span>
                      ) : (
                        act.content
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {dayjs(act.createdAt).format('HH:mm DD/MM')}
                    </div>
                  </div>

                  <Popconfirm title="Xóa bản ghi này?" onConfirm={() => handleDeleteActivity(act.id)}>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      className={`absolute ${act.type === 'COMMENT' ? 'top-1 right-1' : 'top-0 right-0'} opacity-100 md:opacity-0 group-hover/act:opacity-100 transition-opacity`}
                    />
                  </Popconfirm>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
