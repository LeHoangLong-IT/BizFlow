'use client';
import { Modal, Button, message } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, MessageOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/lib/axios';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: any;
  onEdit: () => void;
  onSuccess: () => void;
}

export default function EventDetailModal({ isOpen, onClose, eventData, onEdit, onSuccess }: EventDetailModalProps) {
  if (!eventData) return null;

  const handleDelete = async () => {
    try {
      await api.delete(`/events/${eventData.id}`);
      message.success('Xóa sự kiện thành công');
      onSuccess();
      onClose();
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa');
    }
  };

  const startDate = dayjs(eventData.startTime || eventData.start);
  const endDate = dayjs(eventData.endTime || eventData.end);

  return (
    <Modal
      open={isOpen}
      centered
      onCancel={onClose}
      footer={null}
      closable={false}
      width={450}
      className="event-detail-modal"
      styles={{ body: { padding: 0 } }}
    >
      <div className="bg-white p-5 flex justify-between items-center relative border-b border-gray-100 rounded-t-xl">
        <h2 className="text-[1.25rem] font-bold text-gray-800 m-0 pr-8 tracking-tight">{eventData.title}</h2>
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-transparent border-none outline-none cursor-pointer p-0"
        >
          <CloseOutlined />
        </button>
      </div>

      <div className="p-5 bg-white rounded-b-xl">
        <div className="flex flex-col gap-5 mb-5">
          <div className="flex items-start gap-4">
            <CalendarOutlined className="text-gray-400 text-lg mt-0.5" />
            <span className="text-gray-700 font-semibold text-[15px]">{startDate.format('DD/MM/YYYY')}</span>
          </div>

          <div className="flex items-start gap-4">
            <ClockCircleOutlined className="text-gray-400 text-lg mt-0.5" />
            <span className="text-gray-700 font-semibold text-[15px]">
              {startDate.format('h:mm A')} - {endDate.format('h:mm A')}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <EnvironmentOutlined className="text-gray-400 text-lg mt-0.5" />
            <span className="text-gray-700 font-semibold text-[15px]">
              {eventData.location || 'Chưa có địa điểm'}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <MessageOutlined className="text-gray-400 text-lg mt-0.5" />
            <span className="text-gray-500 text-[15px] leading-relaxed">
              {eventData.description || 'Chưa có mô tả'}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-2">
          <button
            onClick={handleDelete}
            className="bg-[#fff1f0] text-[#ff4d4f] border-none hover:bg-[#ffccc7] font-medium h-[36px] px-5 rounded-md cursor-pointer transition-colors outline-none"
          >
            Xóa
          </button>
          <button
            onClick={onEdit}
            className="bg-[#f0f5ff] text-[#2f54eb] border-none font-medium hover:bg-[#d6e4ff] h-[36px] px-6 rounded-md cursor-pointer transition-colors outline-none"
          >
            Chỉnh sửa
          </button>
        </div>
      </div>
    </Modal>
  );
}
