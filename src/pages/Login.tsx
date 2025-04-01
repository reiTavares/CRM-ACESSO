import { LoginForm } from "@/components/auth/login-form";

const Login = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-white to-gray-100">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
