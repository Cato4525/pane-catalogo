import { useStore } from '../../store';
import { Modal } from '../../components/ui/Modal';

export function DeleteModal() {
  const { isDeleteModalOpen, closeDeleteModal, confirmDelete, deleteItemType } = useStore();

  return (
    <Modal
      isOpen={isDeleteModalOpen}
      onClose={closeDeleteModal}
      title={`Eliminar ${deleteItemType === 'product' ? 'Producto' : 'Categoría'}`}
      footer={
        <>
          <button onClick={closeDeleteModal} className="btn btn-outline">
            Cancelar
          </button>
          <button onClick={confirmDelete} className="btn btn-danger">
            Eliminar
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--text-muted)' }}>
        ¿Estás seguro de que deseas eliminar este {deleteItemType}? Esta acción no se puede deshacer.
      </p>
    </Modal>
  );
}
