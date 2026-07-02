import { ToastContainer, type ToastOptions } from 'react-toastify';

export const toastOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export function AppToastContainer() {
  return (
    <ToastContainer
      {...toastOptions}
      theme="colored"
      toastClassName="!rounded-xl !font-sans !text-sm"
    />
  );
}
