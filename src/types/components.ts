export interface BaseLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}