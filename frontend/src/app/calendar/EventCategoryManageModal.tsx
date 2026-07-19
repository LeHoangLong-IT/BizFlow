'use client';
import { Modal, Button, Popconfirm, message, Input } from 'antd';
import { useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import api from '@/lib/axios';
import EventCategoryEditModal from './EventCategoryEditModal';

interface EventCategoryManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EventCategoryManageModal({ isOpen, onClose }: EventCategoryManageModalProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [searchText, setSearchText] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/event-categories');
      setCategories(res.data);
    } catch (error) {
      message.error('Không thể tải danh sách loại sự kiện');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);



  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/event-categories/${id}`);
      message.success('Xóa thành công');
      fetchCategories();
    } catch (error) {
      message.error('Không thể xóa loại sự kiện');
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={480}
      styles={{ body: { padding: 0 } }}
      destroyOnHidden
      className="overflow-hidden rounded-xl"
    >
      <div className="bg-white p-5 flex justify-between items-center relative border-b border-gray-100 rounded-t-xl">
        <h2 className="text-[1.25rem] font-bold text-gray-800 m-0 tracking-tight">Quản lý Loại Sự Kiện</h2>
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-transparent border-none outline-none cursor-pointer p-0"
        >
          <CloseOutlined />
        </button>
      </div>

      <div className="p-0 bg-white rounded-b-xl flex flex-col max-h-[60vh]">
        <div className="px-4 py-3 border-b border-gray-100">
          <Input 
            variant="borderless" 
            placeholder="Tìm kiếm loại sự kiện..." 
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="px-0 shadow-none focus:ring-0"
            prefix={<SearchOutlined className="text-gray-400 mr-2" />}
          />
        </div>


        {loading ? (
          <div className="text-center py-4 text-gray-500">Đang tải...</div>
        ) : (
          <ul className="m-0 p-0 list-none divide-y divide-gray-100 overflow-y-auto custom-scrollbar flex-1">
            {categories.filter(c => c.name.toLowerCase().includes(searchText.toLowerCase())).length === 0 ? (
              <li className="p-4 text-center text-gray-400">Không tìm thấy loại sự kiện nào</li>
            ) : (
              categories.filter(c => c.name.toLowerCase().includes(searchText.toLowerCase())).map((item) => (
                <li key={item.id} className="p-3 px-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-700 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="text" icon={<EditOutlined className="text-gray-400 hover:text-gray-600" />} onClick={() => handleEdit(item)} size="small" />
                    <Popconfirm
                      title="Xóa loại sự kiện?"
                      description="Các sự kiện thuộc loại này sẽ trở thành Không phân loại."
                      onConfirm={() => handleDelete(item.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button type="text" danger icon={<DeleteOutlined className="text-red-400 hover:text-red-600" />} size="small" />
                    </Popconfirm>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
        
        <div className="p-4 border-t border-gray-100 mt-auto">
          <Button
            className="w-full rounded-md font-medium text-gray-600 hover:text-blue-600 border-gray-200 hover:border-blue-400 transition-colors"
            onClick={() => {
              setEditingCategory(null);
              setIsEditModalOpen(true);
            }}
          >
            Tạo loại sự kiện mới
          </Button>
        </div>
      </div>

      <EventCategoryEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        categoryData={editingCategory}
        onSuccess={fetchCategories}
      />
    </Modal>
  );
}
