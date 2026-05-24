import { useState } from 'react';
import { useStore } from '../../store';
import { Modal } from '../../components/ui/Modal';
import { Category } from '../../types';

export function Categories() {
  const { categories, openCategoryModal, isCategoryModalOpen, selectedCategory, closeCategoryModal, addCategory, updateCategory, openDeleteModal } = useStore();
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    description: '',
    image: '',
  });

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setFormData(category);
    } else {
      setFormData({
        name: '',
        description: '',
        image: '',
      });
    }
    openCategoryModal(category);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory) {
      updateCategory(selectedCategory.id, formData);
    } else {
      const newCategory: Category = {
        ...formData as Category,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      addCategory(newCategory);
    }
    closeCategoryModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 mt-1">Gestiona tus categorías</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          + Nueva Categoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="card overflow-hidden">
            <img
              src={category.image || 'https://placehold.co/300x200'}
              alt={category.name}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{category.description}</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleOpenModal(category)}
                  className="btn btn-outline text-xs py-1 px-3 flex-1"
                >
                  Editar
                </button>
                <button
                  onClick={() => openDeleteModal(category.id, 'category')}
                  className="btn btn-danger text-xs py-1 px-3"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="card p-8 text-center text-gray-500">
          No hay categorías creadas
        </div>
      )}

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        title={selectedCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        footer={
          <>
            <button onClick={closeCategoryModal} className="btn btn-outline">
              Cancelar
            </button>
            <button onClick={handleSubmit} className="btn btn-primary">
              {selectedCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
            />
          </div>

          <div>
            <label className="label">URL de Imagen</label>
            <input
              type="url"
              value={formData.image || ''}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://..."
              className="input"
            />
            {formData.image && (
              <img
                src={formData.image}
                alt="Preview"
                className="mt-2 w-32 h-20 object-cover rounded"
              />
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
