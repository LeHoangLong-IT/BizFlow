'use client';
import { Form, Input, Button, message } from 'antd';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { UserAddOutlined } from '@ant-design/icons';

export default function Register() {
  const router = useRouter();

  const onFinish = async (values: any) => {
    try {
      await api.post('/auth/register', values);
      message.success('Đăng ký thành công!');
      router.push('/login');
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Lỗi đăng ký');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center relative overflow-hidden bg-gray-50">
      {/* Subtle Mesh Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-3xl"></div>
        <div className="absolute top-[60%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-100/50 blur-3xl"></div>
      </div>

      <div className="w-full max-w-[360px] p-8 bg-white/95 rounded-2xl shadow-[0_20px_50px_rgba(30,58,138,0.15)] relative z-10 border border-white backdrop-blur-md">
        <div className="flex flex-col items-center mb-4">
          <div className="w-12 h-12 bg-[#1e3a8a] rounded-full flex items-center justify-center mb-1 text-white text-xl shadow-md">
            <UserAddOutlined />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight font-oswald">BizFlow Register</h1>
        </div>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label={<span className="text-gray-600 font-medium text-sm">Họ và Tên</span>}
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input
              size="large"
              className="bg-white border-gray-200 hover:border-blue-400 focus:border-blue-500 rounded-lg h-11"
              placeholder="Nhập họ và tên"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-gray-600 font-medium text-sm">Số điện thoại</span>}
            name="phone"
          >
            <Input
              size="large"
              className="bg-white border-gray-200 hover:border-blue-400 focus:border-blue-500 rounded-lg h-11"
              placeholder="Nhập số điện thoại"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-gray-600 font-medium text-sm">Email</span>}
            name="email"
            rules={[{ required: true, message: 'Vui lòng nhập email', type: 'email' }]}
          >
            <Input
              size="large"
              className="bg-[#f0f4f8] border-transparent hover:border-blue-400 focus:border-blue-500 focus:bg-white rounded-lg h-11"
              placeholder="superadmin@bizhub.vn"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-gray-600 font-medium text-sm">Mật khẩu</span>}
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu', min: 6 }]}
          >
            <Input.Password
              size="large"
              className="bg-[#f0f4f8] border-transparent hover:border-blue-400 focus:border-blue-500 focus:bg-white rounded-lg h-11"
              placeholder="••••••"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            className="mt-2 h-11 rounded-lg bg-[#1e3a8a] hover:bg-[#152c6e] font-medium text-base border-none"
          >
            Đăng ký
          </Button>
        </Form>

        <div className="text-center mt-6 text-sm text-gray-500">
          Đã có tài khoản?{' '}
          <a href="/login" className="text-[#1e3a8a] font-semibold hover:underline">
            Đăng nhập
          </a>
        </div>
      </div>
    </div>
  );
}
