import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/app/providers/AuthContext';
import { ToastProvider } from '@/shared/components/toast/ToastProvider';
import { router } from '@/app/router';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  );
}
