import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '@/lib/axios';

interface TagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagData?: any; // null if creating new
  onSuccess: () => void;
}

import { ColorPicker, Tooltip } from 'antd';

const TAG_COLORS = [
  '#a7f3d0', '#fef08a', '#fde68a', '#fecaca', '#e9d5ff',
  '#34d399', '#fbbf24', '#f59e0b', '#f87171', '#a855f7',
  '#059669', '#b45309', '#d97706', '#dc2626', '#7e22ce',
  '#bfdbfe', '#bae6fd', '#d9f99d', '#fbcfe8', '#e5e7eb',
  '#60a5fa', '#38bdf8', '#a3e635', '#f472b6', '#9ca3af',
  '#2563eb', '#0284c7', '#4d7c0f', '#db2777', '#4b5563',
];

export default function TagEditModal({ isOpen, onClose, tagData, onSuccess }: TagEditModalProps) {
  const [form] = Form.useForm();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (tagData) {
        form.setFieldsValue({ name: tagData.name });
        setSelectedColor(tagData.color || null);
      } else {
        form.resetFields();
        setSelectedColor(TAG_COLORS[5]); // Default to green
      }
    }
  }, [isOpen, tagData, form]);

  const onFinish = async (values: any) => {

    try {
      setLoading(true);

      let safeColor = '#34d399';
      if (typeof selectedColor === 'string') {
        safeColor = selectedColor;
      } else if (selectedColor && typeof (selectedColor as any).toHexString === 'function') {
        safeColor = (selectedColor as any).toHexString();
      }

      const payload = {
        name: values.name?.trim() || '',
        color: safeColor,
      };

      if (tagData?.id) {
        await api.patch(`/tags/${tagData.id}`, payload);
        message.success('Cập nhật nhãn thành công');
      } else {
        await api.post('/tags', payload);
        message.success('Tạo nhãn thành công');
      }
      onSuccess();
      onClose();
    } catch (error) {
      message.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tagData?.id) return;
    try {
      setLoading(true);
      await api.delete(`/tags/${tagData.id}`);
      message.success('Xóa nhãn thành công');
      onSuccess();
      onClose();
    } catch (error) {
      message.error('Lỗi khi xóa nhãn');
    } finally {
      setLoading(false);
    }
  };

  const getContrastColor = (hexcolor: string | null) => {
    if (!hexcolor) return '#ffffff';
    const hex = hexcolor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 170) ? '#1f2937' : '#ffffff';
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      destroyOnHidden
      width={360}
      centered
      zIndex={1050}
      className="tag-edit-modal font-sans overflow-hidden rounded-xl"
    >
      <div className="bg-white pb-4 flex justify-between items-center border-b border-gray-100">
        <h2 className="text-[1.25rem] font-bold text-gray-800 m-0 tracking-tight">
          {tagData ? 'Chỉnh sửa nhãn' : 'Tạo nhãn mới'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-transparent border-none outline-none cursor-pointer p-0"
        >
          <CloseOutlined />
        </button>
      </div>

      <div className="pt-4 bg-white flex flex-col">
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label={<span className="font-semibold text-gray-700">Tiêu đề</span>}
            name="name"
            className="mb-4"
          >
            <Input
              placeholder="Tên nhãn..."
              size="large"
              className="rounded-md"
              suffix={
                <Tooltip title="Tùy chỉnh màu sắc">
                  <ColorPicker
                    size="small"
                    value={typeof selectedColor === 'string' ? selectedColor : '#e5e7eb'}
                    onChange={(color) => {
                      if (!color) return;
                      const hex = typeof color === 'string' ? color : (color.toHexString ? color.toHexString() : '#34d399');
                      setSelectedColor(hex);
                    }}
                    className="border !border-gray-300 rounded cursor-pointer"
                  />
                </Tooltip>
              }
            />
          </Form.Item>

          <div className="mb-2 font-semibold text-gray-700">Chọn một màu</div>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {TAG_COLORS.map(color => (
              <div
                key={color}
                onClick={() => setSelectedColor(color)}
                className="w-full h-9 rounded-md cursor-pointer flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && <CheckOutlined style={{ color: getContrastColor(color) }} className="text-lg font-bold drop-shadow-sm" />}
              </div>
            ))}
          </div>

          <div className="flex justify-end items-center pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              {tagData && (
                <Button
                  danger
                  onClick={handleDelete}
                  loading={loading}
                  className="font-medium rounded-md px-6 bg-white"
                >
                  Xóa
                </Button>
              )}
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="bg-[#1d4ed8] font-medium rounded-md px-6"
              >
                Lưu
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
