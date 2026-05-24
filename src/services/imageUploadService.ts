import { supabaseClient } from './supabaseClient';

const BUCKET_NAME = 'productos';
const MAX_FILE_SIZE = 500 * 1024; // 500KB
const USE_LOCAL_MODE = !supabaseClient;

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  isLocalMode?: boolean;
}

export interface ImageFile {
  file: File;
  preview: string;
}

export const isLocalMode = (): boolean => USE_LOCAL_MODE;

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Solo se permiten imágenes (JPEG, PNG, WebP, GIF)' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `La imagen excede el tamaño máximo de ${MAX_FILE_SIZE / 1024}KB` };
  }
  
  return { valid: true };
};

export const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Error al comprimir la imagen'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = URL.createObjectURL(file);
  });
};

export const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'jpg';
  return `product_${timestamp}_${random}.${extension}`;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const uploadImageToSupabase = async (file: File, folder = 'productos'): Promise<UploadResult> => {
  if (USE_LOCAL_MODE) {
    try {
      let fileToUpload = file;
      
      if (file.size > MAX_FILE_SIZE) {
        fileToUpload = await compressImage(file);
      }
      
      const base64 = await fileToBase64(fileToUpload);
      const uniqueName = generateUniqueFileName(file.name);
      const localUrl = `data:image/jpeg;base64,${base64.split(',')[1]}`;
      
      console.log(`[MODO LOCAL] Imagen guardada: ${uniqueName}`);
      
      return { 
        success: true, 
        url: localUrl, 
        isLocalMode: true 
      };
    } catch (error) {
      console.error('Error en modo local:', error);
      return { success: false, error: 'Error al procesar imagen en modo local' };
    }
  }

  if (!supabaseClient) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    console.log('Usuario al subir imagen:', user?.id ?? 'NO AUTENTICADO');

    let fileToUpload = file;
    
    if (file.size > MAX_FILE_SIZE) {
      fileToUpload = await compressImage(file);
    }
    
    const fileName = generateUniqueFileName(fileToUpload.name);
    const filePath = `${folder}/${fileName}`;
    
    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileToUpload.type,
      });

    if (error) {
      console.error('Error uploading to Supabase:', error);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (urlData?.publicUrl) {
      return { success: true, url: urlData.publicUrl };
    }

    return { success: false, error: 'No se pudo obtener la URL pública' };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: 'Error al subir la imagen' };
  }
};

export const uploadMultipleImages = async (files: File[]): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (const file of files) {
    const result = await uploadImageToSupabase(file);
    results.push(result);
  }
  
  return results;
};

export const deleteImageFromSupabase = async (imageUrl: string): Promise<{ success: boolean; error?: string }> => {
  if (USE_LOCAL_MODE || imageUrl.startsWith('data:')) {
    console.log('[MODO LOCAL] Eliminación simulada:', imageUrl);
    return { success: true };
  }

  if (!supabaseClient) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  try {
    const urlParts = imageUrl.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      return { success: false, error: 'URL de imagen inválida' };
    }
    
    const filePath = urlParts[1];
    
    const { error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: 'Error al eliminar la imagen' };
  }
};

export const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

export const revokeImagePreview = (previewUrl: string): void => {
  URL.revokeObjectURL(previewUrl);
};
