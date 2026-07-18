"use client";
import React, { useState, useEffect } from 'react';
import { Input, Button, Checkbox, Spin, message, DatePicker } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import api from '@/lib/axios';
import dayjs from 'dayjs';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskContent, setNewTaskContent] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e?: any) => {
    e?.preventDefault();
    if (!newTaskContent.trim()) return;

    try {
      const res = await api.post('/tasks', {
        content: newTaskContent,
        isCompleted: false,
      });
      setTasks([...tasks, res.data]);
      setNewTaskContent('');
      message.success('Đã thêm công việc');
    } catch (error) {
      message.error('Lỗi khi tạo công việc');
    }
  };

  const handleToggleTask = async (task: any) => {
    try {
      const updated = { isCompleted: !task.isCompleted };
      await api.patch(`/tasks/${task.id}`, updated);
      setTasks(tasks.map(t => t.id === task.id ? { ...t, ...updated } : t));
    } catch (error) {
      message.error('Lỗi khi cập nhật công việc');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
      message.success('Đã xóa công việc');
    } catch (error) {
      message.error('Lỗi khi xóa công việc');
    }
  };

  const incompleteTasks = tasks.filter(t => !t.isCompleted);
  const completeTasks = tasks.filter(t => t.isCompleted);

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f3f9] dark:bg-gray-900 w-full min-w-0">
      <header className="bg-white dark:bg-gray-800 shadow-sm px-6 py-3 flex justify-between items-center z-10 border-b border-gray-100 dark:border-gray-700 relative min-w-0">
        <h1 className="text-[1.1rem] font-bold text-gray-800 dark:text-white tracking-tight font-oswald uppercase truncate">CÔNG VIỆC CỦA TÔI</h1>
        <div className="flex gap-4 items-center min-w-0">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Ứng dụng {'>'} <span className="text-gray-400 dark:text-gray-500">Công việc</span></span>
        </div>
      </header>

      <div className="flex-1 flex px-4 py-6 max-w-[800px] w-full mx-auto box-border">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 w-full p-6 flex flex-col">
          <form onSubmit={handleCreateTask} className="flex gap-3 mb-8">
            <Input
              size="large"
              placeholder="Thêm công việc mới..."
              value={newTaskContent}
              onChange={e => setNewTaskContent(e.target.value)}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <Button size="large" type="primary" onClick={handleCreateTask} icon={<PlusOutlined />} className="bg-[#3b5998] hover:bg-[#2d4373]">
              Thêm
            </Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-10"><Spin /></div>
          ) : (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Chưa hoàn thành ({incompleteTasks.length})</h3>
                <div className="flex flex-col gap-2">
                  {incompleteTasks.map(task => (
                    <div key={task.id} className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 bg-white dark:bg-gray-800 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={false} onChange={() => handleToggleTask(task)} className="transform scale-125" />
                        <span className="text-gray-700 dark:text-gray-200">{task.content}</span>
                      </div>
                      <Button type="text" danger icon={<DeleteOutlined />} className="opacity-0 group-hover:opacity-100" onClick={() => handleDeleteTask(task.id)} />
                    </div>
                  ))}
                  {incompleteTasks.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-sm">Bạn đã hoàn thành mọi thứ!</p>}
                </div>
              </div>

              {completeTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Đã hoàn thành ({completeTasks.length})</h3>
                  <div className="flex flex-col gap-2">
                    {completeTasks.map(task => (
                      <div key={task.id} className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={true} onChange={() => handleToggleTask(task)} className="transform scale-125" />
                          <span className="text-gray-400 dark:text-gray-500 line-through">{task.content}</span>
                        </div>
                        <Button type="text" danger icon={<DeleteOutlined />} className="opacity-0 group-hover:opacity-100" onClick={() => handleDeleteTask(task.id)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
