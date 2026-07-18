import React, { useState, useEffect } from 'react';
import { Button, Checkbox, Select, DatePicker, TimePicker } from 'antd';
import { LeftOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

interface NoteDateTimePickerProps {
  initialStartDate: string | null;
  initialDueDate: string | null;
  initialRecurrence: string | null;
  onSave: (data: { startDate: string | null, dueDate: string | null, recurrenceRule: string | null }) => void;
  onClose: () => void;
}

export default function NoteDateTimePicker({
  initialStartDate,
  initialDueDate,
  initialRecurrence,
  onSave,
  onClose
}: NoteDateTimePickerProps) {
  const [hasStartDate, setHasStartDate] = useState<boolean>(!!initialStartDate);
  const [hasDueDate, setHasDueDate] = useState<boolean>(!!initialDueDate);

  const [startDate, setStartDate] = useState<Dayjs | null>(initialStartDate ? dayjs(initialStartDate) : null);
  const [dueDate, setDueDate] = useState<Dayjs | null>(initialDueDate ? dayjs(initialDueDate) : dayjs().add(1, 'day').startOf('day').add(1, 'hour'));

  const [recurrence, setRecurrence] = useState<string>(initialRecurrence || 'NONE');
  const [reminder, setReminder] = useState<string>('1_DAY_BEFORE');

  const handleSave = () => {
    onSave({
      startDate: hasStartDate && startDate ? startDate.toISOString() : null,
      dueDate: hasDueDate && dueDate ? dueDate.toISOString() : null,
      recurrenceRule: recurrence === 'NONE' ? null : recurrence,
    });
    onClose();
  };

  const handleRemove = () => {
    onSave({
      startDate: null,
      dueDate: null,
      recurrenceRule: null,
    });
    onClose();
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <Button type="text" icon={<LeftOutlined />} size="small" onClick={onClose} className="text-gray-500" />
        <span className="font-semibold text-gray-700">Ngày</span>
        <Button type="text" icon={<CloseOutlined />} size="small" onClick={onClose} className="text-gray-500" />
      </div>

      <div className="overflow-y-auto custom-scrollbar">
        {/* Start Date */}
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-600 mb-1">Ngày bắt đầu</div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={hasStartDate}
              onChange={(e) => {
                setHasStartDate(e.target.checked);
                if (e.target.checked && !startDate) setStartDate(dayjs());
              }}
            />
            <DatePicker
              disabled={!hasStartDate}
              value={startDate}
              onChange={(date) => setStartDate(date)}
              format="DD/MM/YYYY"
              placeholder="N/T/NNNN"
              className="flex-1"
              allowClear={false}
            />
          </div>
        </div>

        {/* Due Date */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-600 mb-1">Ngày hết hạn</div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={hasDueDate}
              onChange={(e) => {
                setHasDueDate(e.target.checked);
                if (e.target.checked && !dueDate) setDueDate(dayjs().add(1, 'day'));
              }}
            />
            <DatePicker
              disabled={!hasDueDate}
              value={dueDate}
              onChange={(date) => setDueDate(prev => date ? date.hour(prev?.hour() || 0).minute(prev?.minute() || 0) : null)}
              format="DD/MM/YYYY"
              placeholder="N/T/NNNN"
              className="flex-1"
              allowClear={false}
            />
            <TimePicker
              disabled={!hasDueDate}
              value={dueDate}
              onChange={(time) => setDueDate(prev => prev ? prev.hour(time?.hour() || 0).minute(time?.minute() || 0) : time)}
              format="HH:mm"
              placeholder="00:00"
              className="w-[88px] text-center"
              allowClear={false}
            />
          </div>
        </div>

        {/* Recurrence */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-600 mb-1">Định kỳ</div>
          <Select
            className="w-full"
            value={recurrence}
            onChange={setRecurrence}
            options={[
              { value: 'NONE', label: 'Không bao giờ' },
              { value: 'FREQ=DAILY', label: 'Hằng ngày' },
              { value: 'FREQ=WEEKLY', label: 'Hằng tuần' },
              { value: 'FREQ=MONTHLY', label: 'Hằng tháng' },
              { value: 'FREQ=YEARLY', label: 'Hằng năm' },
            ]}
          />
        </div>

        {/* Reminder */}
        <div className="mb-2">
          <div className="text-xs font-semibold text-gray-600 mb-1">Thiết lập Nhắc nhở</div>
          <Select
            className="w-full"
            value={reminder}
            onChange={setReminder}
            options={[
              { value: 'NONE', label: 'Không nhắc' },
              { value: 'AT_TIME', label: 'Tại thời điểm hết hạn' },
              { value: '15_MINS_BEFORE', label: 'Trước 15 phút' },
              { value: '1_HOUR_BEFORE', label: 'Trước 1 giờ' },
              { value: '1_DAY_BEFORE', label: 'Trước 1 ngày' },
            ]}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-5">
          <Button type="primary" className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] h-9 font-medium" onClick={handleSave}>
            Lưu
          </Button>
          <Button className="w-full h-9 font-medium text-gray-700 bg-gray-50" onClick={handleRemove}>
            Gỡ bỏ
          </Button>
        </div>
      </div>
    </div>
  );
}
