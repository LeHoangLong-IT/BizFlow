import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '@/lib/axios';

interface EventCategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryData?: any; // null if creating new
  onSuccess: () => void;
}

const CATEGORY_COLORS = [
  '#a7f3d0', '#fef08a', '#fde68a', '#fecaca', '#e9d5ff',
  '#34d399', '#fbbf24', '#f59e0b', '#f87171', '#a855f7',
  '#059669', '#b45309', '#d97706', '#dc2626', '#7e22ce',
  '#bfdbfe', '#bae6fd', '#d9f99d', '#fbcfe8', '#e5e7eb',
  '#60a5fa', '#38bdf8', '#a3e635', '#f472b6', '#9ca3af',
  '#2563eb', '#0284c7', '#4d7c0f', '#db2777', '#4b5563',
];

const getContrastColor = (hexcolor: string) => {
  if (!hexcolor) return '#000000';
  const hex = hexcolor.replace('#', '');
  if (hex.length !== 6) return '#000000';
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 170) ? '#000000' : '#ffffff';
};

export default function EventCategoryEditModal({ isOpen, onClose, categoryData, onSuccess }: EventCategoryEditModalProps) {
  const [form] = Form.useForm();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (categoryData) {
        form.setFieldsValue({ name: categoryData.name });
        setSelectedColor(categoryData.color || null);
      } else {
        form.resetFields();
        setSelectedColor(CATEGORY_COLORS[10]); // Default to a green
      }
    }
  }, [isOpen, categoryData, form]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const safeColor = selectedColor || '#3b5998';

      const payload = {
        name: values.name?.trim() || '',
        color: safeColor,
      };

      if (categoryData?.id) {
        await api.patch(`/event-categories/${categoryData.id}`, payload);
        message.success('Cập nhật loại sự kiện thành công');
      } else {
        await api.post('/event-categories', payload);
        message.success('Tạo loại sự kiện mới thành công');
      }

      onSuccess();
      onClose();
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={400}
      styles={{ body: { padding: 0 } }}
      destroyOnHidden
      zIndex={1050}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-[1.15rem] font-bold text-gray-800 m-0">{categoryData ? 'Chỉnh sửa loại' : 'Tạo loại mới'}</h2>
        <Button type="text" icon={<CloseOutlined />} onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full" />
      </div>

      <div className="p-4">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="name"
            label={<span className="text-[13px] font-semibold text-gray-600">Tiêu đề</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên loại' }]}
            className="mb-4"
          >
            <Input
              placeholder="Tên loại..."
              size="large"
              autoFocus
              className="rounded-lg text-[14px]"
              suffix={
                <div
                  className="w-5 h-5 rounded"
                  style={{ backgroundColor: selectedColor || '#ccc' }}
                />
              }
            />
          </Form.Item>

          <div className="mb-6">
            <div className="text-[13px] font-semibold text-gray-600 mb-2">Chọn một màu</div>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORY_COLORS.map(color => (
                <div
                  key={color}
                  className="w-full h-8 rounded-md cursor-pointer flex items-center justify-center transition-all hover:scale-105 shadow-sm"
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <CheckOutlined style={{ color: getContrastColor(color) }} className="text-base font-bold drop-shadow-sm" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 mt-4">
            <Button onClick={onClose} size="large" className="rounded-lg font-medium">Hủy</Button>
            <Button type="primary" htmlType="submit" loading={loading} size="large" className="rounded-lg font-medium bg-blue-600 hover:bg-blue-700">
              Lưu
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
