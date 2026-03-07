import { useState } from "react";

export const useModals = () => {
  const [priceModal, setPriceModal] = useState<{
    isOpen: boolean; id: number; name: string; price: number;
  }>({ isOpen: false, id: 0, name: "", price: 0 });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean; id: number; name: string;
  }>({ isOpen: false, id: 0, name: "" });

  const [imageModal, setImageModal] = useState<{
    isOpen: boolean; id: number; name: string; imageUrl: string | null;
  }>({ isOpen: false, id: 0, name: "", imageUrl: null });

  const openPriceModal = (id: number, currentPrice: number, name: string) =>
    setPriceModal({ isOpen: true, id, name, price: currentPrice });

  const closePriceModal = () =>
    setPriceModal((p) => ({ ...p, isOpen: false }));

  const openDeleteModal = (id: number, name: string) =>
    setDeleteModal({ isOpen: true, id, name });

  const closeDeleteModal = () =>
    setDeleteModal((p) => ({ ...p, isOpen: false }));

  const openImageModal = (id: number, name: string, imageUrl: string | null) =>
    setImageModal({ isOpen: true, id, name, imageUrl });

  const closeImageModal = () =>
    setImageModal((p) => ({ ...p, isOpen: false }));

  return {
    priceModal, openPriceModal, closePriceModal,
    deleteModal, openDeleteModal, closeDeleteModal,
    imageModal, openImageModal, closeImageModal,
  };
};