'use client';
import { Modal, Form, Input, DatePicker, TimePicker, Select, message, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import api from '@/lib/axios';
import { CloseOutlined, SettingOutlined } from '@ant-design/icons';
import EventCategoryManageModal from './EventCategoryManageModal';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: any;
  onSuccess: () => void;
}



export default function EventModal({ isOpen, onClose, eventData, onSuccess }: EventModalProps) {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<any[]>([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/event-categories');
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setTimeout(() => {
        if (eventData) {
          const isValidTime = eventData.startTime || eventData.start;
          const startDate = isValidTime ? dayjs(eventData.startTime || eventData.start) : undefined;
          const endDate = isValidTime ? dayjs(eventData.endTime || eventData.end) : undefined;

          form.setFieldsValue({
            title: eventData.title || '',
            description: eventData.description || '',
            location: eventData.location || '',
            dateRange: isValidTime ? [startDate, endDate] : undefined,
            startTime: isValidTime ? startDate : undefined,
            endTime: isValidTime ? endDate : undefined,
            categoryId: eventData.categoryId || null,
            recurrenceRule: eventData.recurrenceRule || 'NONE',
          });
        } else {
          form.setFieldsValue({
            categoryId: null,
            recurrenceRule: 'NONE'
          });
        }
      }, 0);
    }
  }, [isOpen, eventData, form]);

  const onFinish = async (values: any) => {
    try {
      const startDateTime = dayjs(`${values.dateRange[0].format('YYYY-MM-DD')} ${values.startTime.format('HH:mm:ss')}`).toISOString();
      const endDateTime = dayjs(`${values.dateRange[1].format('YYYY-MM-DD')} ${values.endTime.format('HH:mm:ss')}`).toISOString();

      const payload = {
        title: values.title,
        description: values.description,
        location: values.location,
        isAllDay: false,
        startTime: startDateTime,
        endTime: endDateTime,
        categoryId: values.categoryId,
        recurrenceRule: values.recurrenceRule === 'NONE' ? null : values.recurrenceRule,
      };

      if (eventData?.id) {
        await api.patch(`/events/${eventData.id}`, payload);
        message.success('Cập nhật sự kiện thành công');
      } else {
        await api.post('/events', payload);
        message.success('Tạo sự kiện thành công');
      }
      onSuccess();
      onClose();
    } catch (error) {
      message.error('Có lỗi xảy ra');
    }
  };

  return (
    <>
      <Modal
        open={isOpen}
        centered
        mask={{
          closable: false,
        }}
        onCancel={onClose}
        footer={null}
        closable={false}
        width={800}
        className="event-edit-modal"
        styles={{ body: { padding: 0 } }}
        destroyOnHidden
      >
        <div className="bg-white p-5 flex justify-between items-center relative border-b border-gray-100 rounded-t-xl">
          <h2 className="text-[1.25rem] font-bold text-gray-800 m-0 tracking-tight">{eventData?.id ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện'}</h2>
          <button
            onClick={onClose}
            className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-transparent border-none outline-none cursor-pointer p-0"
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="p-5 bg-white rounded-b-xl">
          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} className="mb-0">

            <div className="flex flex-col md:grid md:grid-cols-2 md:gap-x-8">
              {/* 1. Tên sự kiện (Desktop: Trái 1, Mobile: 1) */}
              <Form.Item name="title" label={<span className="font-semibold text-gray-700 text-[13px]">Tên sự kiện</span>} rules={[{ required: true, message: 'Vui lòng nhập tên sự kiện' }]} className="order-1 md:order-1">
                <Input size="large" placeholder="Nhập tên sự kiện" className="rounded-md" />
              </Form.Item>

              {/* 2. Loại sự kiện (Desktop: Phải 1, Mobile: 2) */}
              <Form.Item label={<span className="font-semibold text-gray-700 text-[13px]">Loại sự kiện</span>} className="order-2 md:order-2">
                <div className="flex gap-2">
                  <Form.Item name="categoryId" noStyle>
                    <Select size="large" className="rounded-md flex-1" placeholder="Chọn loại sự kiện (Không bắt buộc)" allowClear>
                      {categories.map(type => (
                        <Select.Option key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                            {type.name}
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <button
                    type="button"
                    onClick={() => setIsManageModalOpen(true)}
                    className="h-[40px] px-3 bg-gray-50 border border-gray-200 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer outline-none"
                  >
                    <SettingOutlined />
                  </button>
                </div>
              </Form.Item>

              {/* 3. Ngày diễn ra (Desktop: Trái 2, Mobile: 3) */}
              <Form.Item name="dateRange" label={<span className="font-semibold text-gray-700 text-[13px]">Ngày diễn ra</span>} rules={[{ required: true, message: 'Vui lòng chọn ngày' }]} className="order-3 md:order-3">
                <DatePicker.RangePicker format="YYYY-MM-DD" separator="->" size="large" className="w-full rounded-md" placeholder={['Ngày bắt đầu', 'Ngày kết thúc']} />
              </Form.Item>

              {/* 4. Địa điểm (Desktop: Phải 2, Mobile: 6) */}
              <Form.Item name="location" label={<span className="font-semibold text-gray-700 text-[13px]">Địa điểm</span>} className="order-6 md:order-4">
                <Input size="large" placeholder="Nhập địa điểm" className="rounded-md" />
              </Form.Item>

              {/* 5. Giờ bắt đầu / kết thúc (Desktop: Trái 3, Mobile: 4) */}
              <div className="flex gap-4 order-4 md:order-5">
                <Form.Item name="startTime" label={<span className="font-semibold text-gray-700 text-[13px]">Giờ bắt đầu</span>} rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]} className="flex-1">
                  <TimePicker format="HH:mm" size="large" className="w-full rounded-md" placeholder="Giờ bắt đầu" />
                </Form.Item>

                <Form.Item name="endTime" label={<span className="font-semibold text-gray-700 text-[13px]">Giờ kết thúc</span>} rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc' }]} className="flex-1">
                  <TimePicker format="HH:mm" size="large" className="w-full rounded-md" placeholder="Giờ kết thúc" />
                </Form.Item>
              </div>

              {/* 6. Mô tả (Desktop: Phải 3, Mobile: 7) */}
              <Form.Item name="description" label={<span className="font-semibold text-gray-700 text-[13px]">Mô tả</span>} className="order-7 md:order-6 md:row-span-2 mb-0">
                <Input.TextArea rows={5} placeholder="Nhập mô tả chi tiết" className="rounded-md resize-none" style={{ padding: "10px" }} />
              </Form.Item>

              {/* 7. Lặp lại định kỳ (Desktop: Trái 4, Mobile: 5) */}
              <Form.Item name="recurrenceRule" label={<span className="font-semibold text-gray-700 text-[13px]">Lặp lại định kỳ</span>} className="order-5 md:order-7">
                <Select
                  size="large"
                  className="w-full rounded-md"
                  options={[
                    { value: 'NONE', label: 'Không bao giờ' },
                    { value: 'FREQ=DAILY', label: 'Hằng ngày' },
                    { value: 'FREQ=WEEKLY', label: 'Hằng tuần' },
                    { value: 'FREQ=MONTHLY', label: 'Hằng tháng' },
                    { value: 'FREQ=YEARLY', label: 'Hằng năm' },
                  ]}
                />
              </Form.Item>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-800 font-medium h-[36px] px-5 rounded-md cursor-pointer transition-colors outline-none"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="bg-[#1abc9c] hover:bg-[#16a085] text-white font-medium h-[36px] px-6 rounded-md transition-colors shadow-sm border-none outline-none cursor-pointer"
              >
                {eventData?.id ? 'Lưu thay đổi' : 'Tạo sự kiện'}
              </button>
            </div>
          </Form>
        </div>
      </Modal>
      <EventCategoryManageModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          fetchCategories();
        }}
      />
    </>
  );
}
