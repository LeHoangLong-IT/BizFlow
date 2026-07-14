'use client';
import { Modal, Form, Input, Button, Popconfirm, message, ColorPicker, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';
import api from '@/lib/axios';

interface EventCategoryManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EventCategoryManageModal({ isOpen, onClose }: EventCategoryManageModalProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);

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
      form.resetFields();
      setEditingId(null);
    }
  }, [isOpen, form]);

  const onFinish = async (values: any) => {
    try {
      const payload = {
        name: values.name,
        color: typeof values.color === 'string' ? values.color : values.color.toHexString(),
      };

      if (editingId) {
        await api.patch(`/event-categories/${editingId}`, payload);
        message.success('Cập nhật thành công');
      } else {
        await api.post('/event-categories', payload);
        message.success('Thêm mới thành công');
      }
      form.resetFields();
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      message.error('Có lỗi xảy ra');
    }
  };

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
    setEditingId(category.id);
    form.setFieldsValue({
      name: category.name,
      color: category.color,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.resetFields();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={480}
      styles={{ body: { padding: 0 }, content: { padding: 0, overflow: 'hidden', borderRadius: '12px' } }}
      destroyOnHidden
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

      <div className="p-5 bg-white rounded-b-xl">
        <div className="mb-5">
          <Form form={form} onFinish={onFinish} className="flex w-full gap-2 items-start">
            <div className="flex-1 min-w-0">
              <Form.Item name="name" rules={[{ required: true, message: 'Nhập tên' }]} className="m-0" style={{ width: '100%' }}>
                <Input 
                  placeholder="Tên loại sự kiện..." 
                  className="w-full" 
                  suffix={
                    <Tooltip title="Chọn màu cho loại sự kiện">
                      <Form.Item name="color" initialValue="#3b5998" noStyle>
                        <ColorPicker size="small" className="border !border-gray-400 rounded" />
                      </Form.Item>
                    </Tooltip>
                  }
                />
              </Form.Item>
            </div>
            <Form.Item className="m-0 flex-shrink-0">
              <Button type="primary" htmlType="submit" className="bg-[#1677ff]">
                {editingId ? 'Cập nhật' : 'Thêm'}
              </Button>
            </Form.Item>
            {editingId && (
              <Form.Item className="m-0 flex-shrink-0">
                <Button onClick={handleCancelEdit}>Hủy</Button>
              </Form.Item>
            )}
          </Form>
        </div>

        {loading ? (
          <div className="text-center py-4 text-gray-500">Đang tải...</div>
        ) : (
          <ul className="m-0 p-0 list-none border border-gray-100 rounded-md divide-y divide-gray-100 max-h-[300px] overflow-y-auto bg-[#f8f9fa]">
            {categories.length === 0 ? (
              <li className="p-4 text-center text-gray-400">Chưa có danh mục nào</li>
            ) : (
              categories.map((item) => (
                <li key={item.id} className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-700 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(item)} />
                    <Popconfirm
                      title="Xóa loại sự kiện?"
                      description="Các sự kiện thuộc loại này sẽ trở thành Không phân loại."
                      onConfirm={() => handleDelete(item.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </Modal>
  );
}
