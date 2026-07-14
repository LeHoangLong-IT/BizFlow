'use client';
import { Form, Input, Button, message } from 'antd';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { LoginOutlined } from '@ant-design/icons';

export default function Login() {
  const router = useRouter();

  const onFinish = async (values: any) => {
    try {
      const res = await api.post('/auth/login', values);
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      message.success('Đăng nhập thành công!');
      router.push('/calendar');
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Lỗi đăng nhập');
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
            <LoginOutlined />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight font-oswald">BizFlow Login</h1>
        </div>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
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
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
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
            Đăng nhập
          </Button>
        </Form>

        <div className="text-center mt-6 text-sm text-gray-500">
          Chưa có tài khoản?{' '}
          <a href="/register" className="text-[#1e3a8a] font-semibold hover:underline">
            Đăng ký ngay
          </a>
        </div>
      </div>
    </div>
  );
}
