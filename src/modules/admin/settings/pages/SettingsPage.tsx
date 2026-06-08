import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../../../store';
import { THEME_PRESETS, ThemeType, Color, Talla, Modelo, Catalogo, EstadoCatalogo, TipoCatalogo, SocialNetwork } from '../../../../types';
import './SettingsPage.css';

function Card({ children, style, themeColors }: { children: React.ReactNode; style?: React.CSSProperties; themeColors: typeof THEME_PRESETS.moderno }) {
  return <div style={{ background: `linear-gradient(135deg,${themeColors.surface} 0%,${themeColors.background} 100%)`, border: `1px solid ${themeColors.border}`, borderRadius: 16, padding: 20, ...style }}>{children}</div>;
}

function SHead({ title, themeColors }: { title: string; themeColors: typeof THEME_PRESETS.moderno }) {
  return <h3 style={{ fontSize: 16, fontWeight: 600, color: themeColors.text, margin: '0 0 20px', borderBottom: `1px solid ${themeColors.border}`, paddingBottom: 12 }}>{title}</h3>;
}

function SectionTab({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px', background: active ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
      border: `1px solid ${active ? '#2563eb' : 'var(--border)'}`, borderRadius: 8,
      color: active ? '#2563eb' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600
    }}>
      {icon} {label}
    </button>
  );
}

function ItemRow({ item, onToggle, onDelete, themeColors }: { item: any; onToggle: () => void; onDelete: () => void; themeColors: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: themeColors.background, borderRadius: 10, marginBottom: 8, border: `1px solid ${themeColors.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {item.codigo_hex && (
          <div style={{ width: 28, height: 28, borderRadius: 6, background: item.codigo_hex, border: '1px solid rgba(255,255,255,0.1)' }} />
        )}
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: themeColors.text }}>{item.nombre}</p>
          {item.descripcion && <p style={{ margin: '2px 0 0', fontSize: 11, color: themeColors.textMuted }}>{item.descripcion}</p>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onToggle} style={{
          padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500,
          background: item.status === 'active' || item.activo ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)',
          color: item.status === 'active' || item.activo ? '#4ade80' : '#94a3b8'
        }}>
          {item.status === 'active' || item.activo ? 'Activo' : 'Inactivo'}
        </button>
        <button onClick={onDelete} style={{
          padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14,
          background: 'rgba(239, 68, 68, 0.15)', color: '#f87171'
        }}>
          ×
        </button>
      </div>
    </div>
  );
}

function CategoryCard({ category, onEdit, onDelete, onToggle, themeColors }: { category: any; onEdit: () => void; onDelete: () => void; onToggle: () => void; themeColors: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: themeColors.background, borderRadius: 10, marginBottom: 8, border: `1px solid ${themeColors.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={category.image || 'https://placehold.co/60x60'} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: themeColors.text }}>{category.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: themeColors.textMuted }}>{category.description}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onToggle} style={{
          padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500,
          background: category.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)',
          color: category.status === 'active' ? '#4ade80' : '#94a3b8'
        }}>
          {category.status === 'active' ? 'Activo' : 'Inactivo'}
        </button>
        <button onClick={onEdit} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>Editar</button>
        <button onClick={onDelete} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>×</button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, setSettings, updateTheme, categories, addCategory, updateCategory, deleteCategory, 
    colors, addColor, updateColor, deleteColor, toggleColorStatus,
    tallas, addTalla, updateTalla, deleteTalla, toggleTallaStatus,
    modelos, addModelo, updateModelo, deleteModelo, toggleModeloStatus,
    catalogos, addCatalogo, updateCatalogo, deleteCatalogo, toggleCatalogoActivo,
    addSocialNetwork, updateSocialNetwork, deleteSocialNetwork,
    addShippingField, updateShippingField, deleteShippingField } = useStore();
  
  const socialNetworks = settings?.socialNetworks || [];
  
  const [activeTab, setActiveTab] = useState<'tienda' | 'temas' | 'atributos' | 'categorias' | 'envios' | 'redes' | 'nosotros'>('tienda');
  const [activeAttrTab, setActiveAttrTab] = useState<'colores' | 'tallas' | 'modelos' | 'catalogos'>('colores');
  
  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialLink, setNewSocialLink] = useState('');
  const [newSocialIcon, setNewSocialIcon] = useState('');
  
  const [storeName, setStoreName] = useState(settings.storeName || '');
  const [storeUrl, setStoreUrl] = useState(settings.storeUrl || '');
  const [costoEnvio, setCostoEnvio] = useState(settings.costo_envio ?? 5);
  const [logo, setLogo] = useState(settings.logo || '');
  const [previewLogo, setPreviewLogo] = useState(settings.logo || '');
  const [bgImage, setBgImage] = useState(settings.backgroundImage || '');
  const [previewBg, setPreviewBg] = useState(settings.backgroundImage || '');
  const [logoAlign, setLogoAlign] = useState<'left' | 'center' | 'right'>('left');
  const [storeNameAlign, setStoreNameAlign] = useState<'left' | 'center' | 'right'>('left');
  const [email, setEmail] = useState(settings.contacts?.email || '');
  const [phone, setPhone] = useState(settings.contacts?.phone || '');
  const [address, setAddress] = useState(settings.contacts?.address || '');
  const [city, setCity] = useState(settings.contacts?.city || '');
  const [country, setCountry] = useState(settings.contacts?.country || '');
  const [whatsapp, setWhatsapp] = useState(settings.contacts?.whatsapp || '');
  const [telegram, setTelegram] = useState(settings.contacts?.telegram || '');
  
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [newTallaName, setNewTallaName] = useState('');
  const [newModeloName, setNewModeloName] = useState('');
  const [newModeloDesc, setNewModeloDesc] = useState('');
  const [newCatalogoName, setNewCatalogoName] = useState('');
  const [newCatalogoDesc, setNewCatalogoDesc] = useState('');
  const [newCatalogoTipo, setNewCatalogoTipo] = useState<TipoCatalogo>('permanente');
  const [newCatalogoEstado, setNewCatalogoEstado] = useState<EstadoCatalogo>('clasico');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const shippingFormatRef = useRef<HTMLDivElement>(null);
  
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldKey, setNewFieldKey] = useState('');
  const shippingFields = settings.shippingFields || [];
  
  const defaultTickerMessages = ["✦ ENVÍO gratis", "✦ PAN FRESCO", "✦ PAGOS 100% SEGUROS", "✦ DEVOLUCIONES SIN COSTO", "✦ ATENCIÓN 24/7"];
  const [tickerMessages, setTickerMessages] = useState<string[]>(settings.tickerMessages || defaultTickerMessages);
  const [newTickerMessage, setNewTickerMessage] = useState('');
  
  const [nosotrosTitulo, setNosotrosTitulo] = useState(settings.nosotros?.titulo || 'Sobre Nosotros');
  const [nosotrosDescripcion, setNosotrosDescripcion] = useState(settings.nosotros?.descripcion || '');
  const [nosotrosHistoria, setNosotrosHistoria] = useState(settings.nosotros?.historia || '');
  const [nosotrosValores, setNosotrosValores] = useState<string[]>(settings.nosotros?.valores || []);
  const [nosotrosAnos, setNosotrosAnos] = useState(settings.nosotros?.anos_experiencia || 0);
  const [nosotrosImagen, setNosotrosImagen] = useState(settings.nosotros?.imagen_principal || '');
  const [newValor, setNewValor] = useState('');
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log('SHOW TOAST:', message, type)
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };
  
  useEffect(() => {
    if (settings.tickerMessages) {
      setTickerMessages(settings.tickerMessages);
    }
  }, [settings.tickerMessages]);
  
  const currentTheme = (settings.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[currentTheme] || THEME_PRESETS.moderno;
  const isEjecutivo = currentTheme === 'ejecutivo';
  
  const themes = [
    { id: 'moderno', name: 'Evolution', desc: 'Verde moderno y blanco', colors: ['#22c55e', '#4ade80', '#ffffff'] },
    { id: 'empresarial', name: 'Empresarial', desc: 'Azul corporativo', colors: ['#2563eb', '#3b82f6', '#f8fafc'] },
    { id: 'ejecutivo', name: 'Ejecutivo', desc: 'Gris con dorado', colors: ['#0f172a', '#fbbf24', '#ffffff'] },
    { id: 'clasico', name: 'Clásico', desc: 'Tonos tierra', colors: ['#78350f', '#d97706', '#fffbeb'] },
    { id: 'dark_black', name: 'Dark Orange', desc: 'Negro con naranja', colors: ['#000000', '#f97316', '#ffffff'] },
    { id: 'neutral', name: 'Rose Pink', desc: 'Rosa suave', colors: ['#ec4899', '#f472b6', '#fdf2f8'] },
    { id: 'negocio', name: 'Negocio', desc: 'Rojo elegante', colors: ['#dc2626', '#ef4444', '#fef2f2'] },
  ];

  const handleSaveStore = () => {
    setSettings({ 
      storeName, 
      storeUrl,
      logo,
      backgroundImage: bgImage,
      costo_envio: costoEnvio,
      contacts: { 
        ...settings.contacts,
        email, 
        phone, 
        address,
        city,
        country,
        whatsapp,
        telegram
      },
      tickerMessages
    });
    alert('Información de tienda guardada');
  };

  const handleSaveNosotros = () => {
    setSettings({
      nosotros: {
        titulo: nosotrosTitulo,
        descripcion: nosotrosDescripcion,
        historia: nosotrosHistoria,
        valores: nosotrosValores,
        anos_experiencia: nosotrosAnos,
        imagen_principal: nosotrosImagen
      }
    });
    alert('Información de "Sobre Nosotros" guardada');
  };

  const handleAddValor = () => {
    if (newValor.trim()) {
      setNosotrosValores([...nosotrosValores, newValor.trim()]);
      setNewValor('');
    }
  };

  const handleDeleteValor = (index: number) => {
    setNosotrosValores(nosotrosValores.filter((_, i) => i !== index));
  };

  const handleAddShippingField = () => {
    if (!newFieldLabel.trim() || !newFieldKey.trim()) return;
    addShippingField({
      id: `SF-${Date.now()}`,
      label: newFieldLabel,
      key: newFieldKey,
      enabled: true,
      order: shippingFields.length + 1
    });
    setNewFieldLabel('');
    setNewFieldKey('');
  };

  const handleToggleShippingField = (id: string, enabled: boolean) => {
    updateShippingField(id, { enabled: !enabled });
  };

  const handleDeleteShippingField = (id: string) => {
    deleteShippingField(id);
  };

  const handlePrintFormat = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    const enabledFields = shippingFields.filter(f => f.enabled);
    
    let fieldsHtml = '';
    if (enabledFields.length > 0) {
      enabledFields.forEach(field => {
        fieldsHtml += '<tr style="height: 24px;"><td style="padding: 4px 8px; font-size: 9pt; color: #666;">' + field.label.toUpperCase() + '</td><td style="padding: 4px 8px; border-bottom: 1px solid #000; font-size: 11pt;">_________________</td></tr>';
      });
    } else {
      fieldsHtml = '<tr style="height: 24px;"><td style="padding: 4px 8px; font-size: 9pt; color: #666;">NOMBRE</td><td style="padding: 4px 8px; border-bottom: 1px solid #000; font-size: 11pt;">_________________</td></tr>' +
        '<tr style="height: 24px;"><td style="padding: 4px 8px; font-size: 9pt; color: #666;">DIRECCIÓN</td><td style="padding: 4px 8px; border-bottom: 1px solid #000; font-size: 11pt;">_________________</td></tr>' +
        '<tr style="height: 24px;"><td style="padding: 4px 8px; font-size: 9pt; color: #666;">TELÉFONO</td><td style="padding: 4px 8px; border-bottom: 1px solid #000; font-size: 11pt;">_________________</td></tr>';
    }

    let logoHtml = '';
    const logoStyle = 'width: 72px; height: 72px; object-fit: contain; border-radius: 6px;';
    if (logo) {
      logoHtml = '<img src="' + logo + '" alt="Logo" style="' + logoStyle + '" />';
    } else {
      logoHtml = '<div style="width: 72px; height: 72px; background: #f0f0f0; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 28pt; font-weight: 700; color: #999;">' + (storeName?.charAt(0) || 'L') + '</div>';
    }

    const urlDisplay = storeUrl ? storeUrl.replace(/^https?:\/\//, '') : '';
    const urlHtml = storeUrl ? '<p style="margin: 0; font-size: 10pt; color: #0066cc;">' + urlDisplay + '</p>' : '';
    
    const logoAlignStyle = logoAlign === 'center' ? 'text-align: center;' : logoAlign === 'right' ? 'text-align: right;' : 'text-align: left;';
    const storeNameAlignStyle = storeNameAlign === 'center' ? 'text-align: center;' : storeNameAlign === 'right' ? 'text-align: right;' : 'text-align: left;';
    const storeNameCellStyle = 'vertical-align: top; ' + storeNameAlignStyle;

    const htmlContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>Formato de Envío - ' + (storeName || 'Tienda') + '</title>' +
      '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->' +
      '<style>body { font-family: Arial, sans-serif; margin: 40px; } table { border-collapse: collapse; width: 100%; }</style></head>' +
      '<body>' +
      '<table style="border-bottom: 2px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px;"><tr>' +
      '<td style="vertical-align: top; ' + logoAlignStyle + ' padding-right: 12px;">' + logoHtml + '</td>' +
      '<td style="' + storeNameCellStyle + '"><p style="margin: 0; font-size: 16pt; font-weight: 700; color: #000;">' + (storeName || 'Nombre de la tienda') + '</p>' + urlHtml + '</td>' +
      '<td style="text-align: right; min-width: 100px;"><p style="margin: 0; font-size: 10pt; color: #666; font-weight: 600;">PEDIDO</p><div style="width: 100px; border-bottom: 1px solid #333; font-size: 14pt; font-weight: 600; padding: 4px 0; text-align: right;">PED-000</div></td>' +
      '</tr></table>' +
      '<table><tr><td style="padding-bottom: 8px;"><p style="margin: 0; font-size: 10pt; color: #666; font-weight: 600;">DESTINATARIO</p>' + fieldsHtml + '</td></tr></table>' +
      '</body></html>';

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'formato-envio-' + (storeName || 'tienda') + '.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  const handleSelectTheme = (themeId: string) => {
    updateTheme(themeId as any);
    document.body.style.setProperty('--primary', THEME_PRESETS[themeId as ThemeType]?.primary || '#4ade80');
  };

  const handleAddColor = async () => {
    if (!newColorName.trim()) {
      showToast('Ingresa un nombre de color', 'error')
      return;
    }
    
    try {
      const { getSupabase } = await import('../../../../services/supabaseClient')
      const supabase = getSupabase()
      
      const { data, error } = await supabase
        .from('colors')
        .insert({ nombre: newColorName, codigo_hex: newColorHex })
        .select()
        .single()
      
      if (error) {
        console.error('Error adding color:', error)
        showToast('Error al agregar color: ' + error.message, 'error')
        return
      }
      
      if (data) {
        addColor({
          id: data.id,
          nombre: data.nombre,
          codigo_hex: data.codigo_hex,
          status: data.activo ? 'active' : 'inactive',
          created_at: data.created_at
        })
        showToast('Color agregado exitosamente', 'success')
      }
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al agregar color', 'error')
    }
    
    setNewColorName('')
  }

  const handleAddTalla = async () => {
    if (!newTallaName.trim()) {
      showToast('Ingresa un nombre de talla', 'error')
      return;
    }
    
    try {
      const { getSupabase } = await import('../../../../services/supabaseClient')
      const supabase = getSupabase()
      
      const { data, error } = await supabase
        .from('sizes')
        .insert({ nombre: newTallaName, orden: tallas.length + 1 })
        .select()
        .single()
      
      if (error) {
        console.error('Error adding talla:', error)
        showToast('Error al agregar talla: ' + error.message, 'error')
        return
      }
      
      if (data) {
        addTalla({
          id: data.id,
          nombre: data.nombre,
          orden: data.orden,
          status: data.activo ? 'active' : 'inactive',
          created_at: data.created_at
        })
        showToast('Talla agregada exitosamente', 'success')
      }
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al agregar talla', 'error')
    }
    
    setNewTallaName('')
  }

  const handleAddModelo = async () => {
    if (!newModeloName.trim()) {
      showToast('Ingresa un nombre de modelo', 'error')
      return;
    }
    
    try {
      const { getSupabase } = await import('../../../../services/supabaseClient')
      const supabase = getSupabase()
      
      const { data, error } = await supabase
        .from('models')
        .insert({ nombre: newModeloName, descripcion: newModeloDesc })
        .select()
        .single()
      
      if (error) {
        console.error('Error adding modelo:', error)
        showToast('Error al agregar modelo: ' + error.message, 'error')
        return
      }
      
      if (data) {
        addModelo({
          id: data.id,
          nombre: data.nombre,
          descripcion: data.descripcion,
          status: data.activo ? 'active' : 'inactive',
          created_at: data.created_at
        })
        showToast('Modelo agregado exitosamente', 'success')
      }
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al agregar modelo', 'error')
    }
    
    setNewModeloName('')
    setNewModeloDesc('')
  }

  const handleAddCatalogo = async () => {
    if (!newCatalogoName.trim()) {
      showToast('Ingresa un nombre de catálogo', 'error')
      return;
    }
    
    try {
      const { getSupabase } = await import('../../../../services/supabaseClient')
      const supabase = getSupabase()
      
      const { data, error } = await supabase
        .from('vista_catalogo')
        .insert({ 
          nombre: newCatalogoName, 
          descripcion: newCatalogoDesc, 
          tipo_catalogo: newCatalogoTipo, 
          estado_catalogo: newCatalogoEstado
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error adding catalogo:', error)
        showToast('Error al agregar catálogo: ' + error.message, 'error')
        return
      }
      
      if (data) {
        addCatalogo({
          id: data.id,
          nombre: data.nombre,
          descripcion: data.descripcion,
          tipo: data.tipo_catalogo,
          estado: data.estado_catalogo,
          activo: true,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin,
          created_at: data.created_at
        })
        showToast('Catálogo creado exitosamente', 'success')
      }
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al agregar catálogo', 'error')
    }
    
    setNewCatalogoName('')
    setNewCatalogoDesc('')
  }

  const handleAddCategory = async () => {
    console.log('handleAddCategory called', newCategoryName)
    if (!newCategoryName.trim()) {
      showToast('Ingresa un nombre de categoría', 'error')
      return;
    }
    
    const newCategory = {
      nombre: newCategoryName,
      descripcion: newCategoryDesc,
      imagen: newCategoryImage && newCategoryImage.startsWith('http') ? newCategoryImage : null,
      activa: true,
      orden: categories.length + 1,
      created_at: new Date().toISOString()
    }
    
    try {
      const { getSupabase } = await import('../../../../services/supabaseClient')
      const supabase = getSupabase()
      
      // Verificar sesión
      const { data: sessionData } = await supabase.auth.getSession()
      console.log('Session:', sessionData)
      
      console.log('Inserting category to Supabase:', newCategory)
      
      const { data, error } = await supabase
        .from('categories')
        .insert(newCategory)
        .select()
        .single()
      
      console.log('Insert result - data:', data, 'error:', error)
      
      if (error) {
        console.error('Error creating category:', error)
        showToast('Error al crear categoría: ' + error.message, 'error')
        return
      }
      
      if (data && !error) {
        console.log('Category created:', data)
        showToast('Categoría creada exitosamente', 'success')
        addCategory({
          id: (data as any).id,
          name: (data as any).nombre,
          description: (data as any).descripcion,
          image: (data as any).imagen,
          status: (data as any).activa ? 'active' : 'inactive',
          created_at: (data as any).created_at
        })
      }
    } catch (err) {
      console.error('Error:', err)
    }
    
    setNewCategoryName('');
    setNewCategoryDesc('');
    setNewCategoryImage('');
    setNewCategoryImage('');
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { getSupabase } = await import('../../../../services/supabaseClient')
      const supabase = getSupabase()
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting category:', error)
        showToast('Error al eliminar categoría', 'error')
        return
      }
      
      deleteCategory(id)
      showToast('Categoría eliminada', 'success')
    } catch (err) {
      console.error('Error:', err)
    }
  };

  const handleToggleCategory = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? false : true
    
    try {
      const { getSupabase } = await import('../../../../services/supabaseClient')
      const supabase = getSupabase()
      
      const { error } = await supabase
        .from('categories')
        .update({ activa: newStatus })
        .eq('id', id)
      
      if (error) {
        console.error('Error toggling category:', error)
        showToast('Error al actualizar categoría', 'error')
        return
      }
      
      updateCategory(id, { status: newStatus ? 'active' : 'inactive' })
      showToast(newStatus ? 'Categoría activada' : 'Categoría desactivada', 'success')
    } catch (err) {
      console.error('Error:', err)
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogo(result);
        setPreviewLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setBgImage(result);
        setPreviewBg(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSocialNetwork = () => {
    if (!newSocialName.trim() || !newSocialLink.trim()) return;
    addSocialNetwork({
      id: `SN-${Date.now()}`,
      name: newSocialName,
      link: newSocialLink,
      icon: newSocialIcon || '🔗',
      active: true
    });
    setNewSocialName('');
    setNewSocialLink('');
    setNewSocialIcon('');
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: themeColors.background, border: `1px solid ${themeColors.border}`, borderRadius: 8, color: themeColors.text, fontSize: 13 };
  const labelStyle: React.CSSProperties = { fontSize: 10, color: themeColors.textMuted, display: 'block', marginBottom: 6, fontWeight: 600, letterSpacing: '0.5px' };

  return (
    <div style={{ animation: 'fadeUp .4s ease', position: 'relative' }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          borderRadius: 8,
          background: toast.type === 'success' ? '#22c55e' : '#ef4444',
          color: '#fff',
          fontWeight: 600,
          fontSize: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 99999,
          textAlign: 'center',
          minWidth: 300,
        }}>
          {toast.message}
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      
      <h1 style={{ fontSize: 24, fontWeight: 700, color: themeColors.text, marginBottom: 20 }}>Configuración</h1>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: `1px solid ${themeColors.border}`, paddingBottom: 8, flexWrap: 'wrap' }}>
        <SectionTab active={activeTab === 'tienda'} onClick={() => setActiveTab('tienda')} label="Tienda" icon="🏪" />
        <SectionTab active={activeTab === 'nosotros'} onClick={() => setActiveTab('nosotros')} label="Sobre Nosotros" icon="🏢" />
        <SectionTab active={activeTab === 'redes'} onClick={() => setActiveTab('redes')} label="Redes" icon="📱" />
        <SectionTab active={activeTab === 'temas'} onClick={() => setActiveTab('temas')} label="Temas" icon="🎨" />
        <SectionTab active={activeTab === 'atributos'} onClick={() => setActiveTab('atributos')} label="Atributos" icon="🏷️" />
        <SectionTab active={activeTab === 'categorias'} onClick={() => setActiveTab('categorias')} label="Categorías" icon="📂" />
        <SectionTab active={activeTab === 'envios'} onClick={() => setActiveTab('envios')} label="Envíos" icon="📦" />
      </div>

      {activeTab === 'tienda' && (
        <div className="settings-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card themeColors={themeColors}>
            <SHead title="Información de la Tienda" themeColors={themeColors} />
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={labelStyle}>NOMBRE DE LA TIENDA</label>
                <input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Pane Catalogo" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>ENLACE DE LA TIENDA</label>
                <input value={storeUrl} onChange={e => setStoreUrl(e.target.value)} placeholder="https://mitienda.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>LOGO DE LA TIENDA</label>
                <input
                  type="file"
                  ref={logoInputRef}
                  accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  style={{ 
                    border: `2px dashed ${themeColors.border}`, 
                    borderRadius: 12, 
                    padding: 24, 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    background: themeColors.background,
                    transition: 'all .2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = themeColors.primary;
                    e.currentTarget.style.background = `${themeColors.primary}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = themeColors.border;
                    e.currentTarget.style.background = themeColors.background;
                  }}
                >
                  {previewLogo ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img 
                        src={previewLogo} 
                        alt="Logo" 
                        style={{ 
                          width: 100, 
                          height: 100, 
                          objectFit: 'contain', 
                          borderRadius: 12,
                          background: '#fff',
                          padding: 8,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }} 
                        onError={() => setPreviewLogo('')} 
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: -8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: themeColors.primary,
                        color: '#000',
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}>
                        ✏️ Cambiar
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ 
                        width: 64, 
                        height: 64, 
                        margin: '0 auto 12px',
                        background: `${themeColors.primary}15`, 
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28
                      }}>
                        🖼️
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: themeColors.text, fontWeight: 500 }}>
                        Haz clic para subir tu logo
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: themeColors.textMuted }}>
                        PNG, JPG o SVG • Máximo 5MB
                      </p>
                      <div style={{ marginTop: 10, padding: '10px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                        <p style={{ margin: 0, fontSize: 10, color: '#166534', fontWeight: 600 }}>📌 Formatos recomendados:</p>
                        <p style={{ margin: '4px 0 0', fontSize: 10, color: '#15803d' }}>• <strong>SVG</strong> (vectorial - nunca pierde calidad)</p>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#15803d' }}>• <strong>PNG</strong> grande (2000px o más)</p>
                        <p style={{ margin: '4px 0 0', fontSize: 9, color: '#166534' }}>Así funcionará en formatos de envío, facturas, tienda y admin.</p>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: themeColors.textMuted }}>o pega una URL:</span>
                  <input 
                    value={logo} 
                    onChange={e => { setLogo(e.target.value); setPreviewLogo(e.target.value); }} 
                    placeholder="https://ejemplo.com/logo.png" 
                    style={{ ...inputStyle, flex: 1 }} 
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>EMAIL</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@tienda.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>TELÉFONO / WHATSAPP</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+57 300 123 4567" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>DIRECCIÓN</label>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle 123 #45-67" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>CIUDAD</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Bogotá" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>PAÍS</label>
                <input value={country} onChange={e => setCountry(e.target.value)} placeholder="Colombia" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>WHATSAPP</label>
                <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+57 300 123 4567" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>COSTO DE ENVÍO ($)</label>
                <input
                  type="number"
                  value={costoEnvio}
                  onChange={e => setCostoEnvio(Number(e.target.value))}
                  placeholder="5"
                  min={0}
                  step={0.5}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>TELEGRAM</label>
                <input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@tuusuario" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>FONDO DE LA TIENDA</label>
                <input
                  type="file"
                  ref={bgInputRef}
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={handleBgUpload}
                  style={{ display: 'none' }}
                />
                <div 
                  onClick={() => bgInputRef.current?.click()}
                  style={{ 
                    border: `2px dashed ${themeColors.border}`, 
                    borderRadius: 12, 
                    padding: 20, 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    background: themeColors.background,
                    transition: 'all .2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 100,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = themeColors.primary;
                    e.currentTarget.style.background = `${themeColors.primary}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = themeColors.border;
                    e.currentTarget.style.background = themeColors.background;
                  }}
                >
                  {previewBg ? (
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={previewBg} 
                        alt="Fondo" 
                        style={{ 
                          width: '100%', 
                          maxHeight: 160, 
                          objectFit: 'cover', 
                          borderRadius: 8,
                        }} 
                        onError={() => setPreviewBg('')} 
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: themeColors.primary,
                        color: '#000',
                        padding: '4px 14px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}>
                        ✏️ Cambiar fondo
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ 
                        width: 48, 
                        height: 48, 
                        margin: '0 auto 8px',
                        background: `${themeColors.primary}15`, 
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24
                      }}>
                        🖼️
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: themeColors.text, fontWeight: 500 }}>
                        Haz clic para subir imagen de fondo
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: themeColors.textMuted }}>
                        PNG, JPG o WebP • Recomendado 1920×1080px
                      </p>
                    </>
                  )}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: themeColors.textMuted }}>o pega una URL:</span>
                  <input 
                    value={bgImage} 
                    onChange={e => { setBgImage(e.target.value); setPreviewBg(e.target.value); }} 
                    placeholder="https://ejemplo.com/fondo.jpg" 
                    style={{ ...inputStyle, flex: 1 }} 
                  />
                </div>
              </div>
              <button onClick={handleSaveStore} style={{ padding: 12, background: isEjecutivo ? '#000000' : `linear-gradient(135deg,${themeColors.primary},${themeColors.secondary})`, border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#000', fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                GUARDAR CAMBIOS
              </button>
            </div>
          </Card>

          <Card themeColors={themeColors}>
            <SHead title="Mensajes del Ticker (Barra superior)" themeColors={themeColors} />
            <p style={{ fontSize: 11, color: themeColors.textMuted, marginBottom: 16 }}>
              Edita los mensajes que aparecen en la barra superior de la tienda. Cada mensaje debe llevar ✦ al inicio.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {tickerMessages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    value={msg}
                    onChange={e => {
                      const newMessages = [...tickerMessages];
                      newMessages[idx] = e.target.value;
                      setTickerMessages(newMessages);
                    }}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="✦ Mensaje"
                  />
                  <button
                    onClick={() => setTickerMessages(tickerMessages.filter((_, i) => i !== idx))}
                    style={{ padding: '8px 12px', background: '#ef4444', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newTickerMessage}
                onChange={e => setNewTickerMessage(e.target.value)}
                placeholder="✦ Nuevo mensaje"
                style={{ ...inputStyle, flex: 1 }}
                onKeyPress={e => {
                  if (e.key === 'Enter' && newTickerMessage.trim()) {
                    setTickerMessages([...tickerMessages, newTickerMessage.startsWith('✦ ') ? newTickerMessage : '✦ ' + newTickerMessage]);
                    setNewTickerMessage('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newTickerMessage.trim()) {
                    setTickerMessages([...tickerMessages, newTickerMessage.startsWith('✦ ') ? newTickerMessage : '✦ ' + newTickerMessage]);
                    setNewTickerMessage('');
                  }
                }}
                style={{ padding: '10px 16px', background: '#2563eb', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                +
              </button>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => setTickerMessages(defaultTickerMessages)}
                style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${themeColors.border}`, borderRadius: 6, color: themeColors.textMuted, fontSize: 11, cursor: 'pointer' }}
              >
                Restaurar por defecto
              </button>
              <button
                onClick={() => setTickerMessages([...tickerMessages].sort(() => Math.random() - 0.5))}
                style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${themeColors.border}`, borderRadius: 6, color: themeColors.textMuted, fontSize: 11, cursor: 'pointer' }}
              >
                Aleatorio
              </button>
            </div>
          </Card>
          
          <Card themeColors={themeColors}>
            <SHead title="Vista Previa" themeColors={themeColors} />
            <div style={{ 
              padding: 32, 
              background: `linear-gradient(135deg, ${themeColors.surface} 0%, ${themeColors.background} 100%)`, 
              borderRadius: 16, 
              textAlign: 'center', 
              minHeight: 240, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: `1px solid ${themeColors.border}`
            }}>
              <div style={{
                width: 120,
                height: 120,
                borderRadius: 20,
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                padding: 16
              }}>
                {previewLogo ? (
                  <img 
                    src={previewLogo} 
                    alt="Logo" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    onError={() => setPreviewLogo('')} 
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    background: `linear-gradient(135deg,${themeColors.primary},${themeColors.secondary})`, 
                    borderRadius: 12, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 40, 
                    fontWeight: 700, 
                    color: '#000'
                  }}>
                    {storeName.charAt(0) || 'P'}
                  </div>
                )}
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: themeColors.text }}>{storeName || 'Nombre de tu tienda'}</h2>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: themeColors.textMuted }}>{email || 'email@tienda.com'}</p>
              {phone && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: themeColors.textMuted }}>📞 {phone}</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'temas' && (
        <div>
          <Card style={{ marginBottom: 20 }} themeColors={themeColors}>
            <SHead title="Seleccionar Tema" themeColors={themeColors} />
            <p style={{ fontSize: 12, color: themeColors.textMuted, marginBottom: 20 }}>El tema seleccionado se aplicará automáticamente a la tienda y al panel</p>
            <div className="settings-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {themes.map(theme => (
                <div key={theme.id} onClick={() => handleSelectTheme(theme.id)} 
                  onMouseEnter={(e) => {
                    const h4 = e.currentTarget.querySelector('.theme-name');
                    const p = e.currentTarget.querySelector('.theme-desc');
                    if (h4) (h4 as HTMLElement).style.color = '#ffffff';
                    if (p) (p as HTMLElement).style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    const h4 = e.currentTarget.querySelector('.theme-name');
                    const p = e.currentTarget.querySelector('.theme-desc');
                    if (h4) (h4 as HTMLElement).style.color = themeColors.text;
                    if (p) (p as HTMLElement).style.color = themeColors.textMuted;
                  }}
                  style={{ 
                    padding: 16, background: settings.theme === theme.id ? `${themeColors.primary}18` : themeColors.background, 
                    border: `2px solid ${settings.theme === theme.id ? themeColors.primary : themeColors.border}`, borderRadius: 12, cursor: 'pointer',
                    transition: 'all .2s'
                  }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                    {theme.colors.map((c, i) => (
                      <div key={i} style={{ width: 30, height: 30, background: c, borderRadius: 6 }} />
                    ))}
                  </div>
                  <h4 className="theme-name" style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: themeColors.text, transition: 'color .2s' }}>{theme.name}</h4>
                  <p className="theme-desc" style={{ margin: 0, fontSize: 11, color: themeColors.textMuted, transition: 'color .2s' }}>{theme.desc}</p>
                  {settings.theme === theme.id && (
                    <span style={{ display: 'inline-block', marginTop: 8, padding: '2px 8px', background: themeColors.primary, borderRadius: 4, fontSize: 10, color: '#000', fontWeight: 600 }}>ACTIVO</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
          
          <Card themeColors={themeColors}>
            <SHead title="Vista Previa del Tema" themeColors={themeColors} />
            <div className="settings-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
                <div style={{ padding: 20, background: themeColors.background, borderRadius: 12, border: `1px solid ${themeColors.border}` }}>
                  <p style={{ margin: '0 0 8px', fontSize: 10, color: themeColors.textMuted }}>TIENDA</p>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: themeColors.text }}>Panel de Productos</h3>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button style={{ padding: '8px 16px', background: themeColors.primary, border: 'none', borderRadius: 6, color: '#000', fontSize: 12, fontWeight: 600 }}>Comprar</button>
                    <button style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${themeColors.border}`, borderRadius: 6, color: themeColors.text, fontSize: 12 }}>Ver más</button>
                  </div>
                </div>
                <div style={{ padding: 20, background: themeColors.surface, borderRadius: 12, border: `1px solid ${themeColors.border}` }}>
                  <p style={{ margin: '0 0 8px', fontSize: 10, color: themeColors.textMuted }}>ADMINISTRACIÓN</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, background: themeColors.primary, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000' }}>A</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: themeColors.text }}>Admin Panel</p>
                      <p style={{ margin: 0, fontSize: 11, color: themeColors.textMuted }}>Gestión completa</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, height: 8, background: themeColors.primary, borderRadius: 4 }} />
                    <div style={{ flex: 1, height: 8, background: themeColors.secondary, borderRadius: 4 }} />
                  </div>
                </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'atributos' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <SectionTab active={activeAttrTab === 'colores'} onClick={() => setActiveAttrTab('colores')} label="Colores" icon="🎨" />
            <SectionTab active={activeAttrTab === 'tallas'} onClick={() => setActiveAttrTab('tallas')} label="Tallas" icon="📏" />
            <SectionTab active={activeAttrTab === 'modelos'} onClick={() => setActiveAttrTab('modelos')} label="Modelos" icon="👔" />
            <SectionTab active={activeAttrTab === 'catalogos'} onClick={() => setActiveAttrTab('catalogos')} label="Catálogos" icon="📑" />
          </div>

          {activeAttrTab === 'colores' && (
            <Card themeColors={themeColors}>
              <SHead title="Gestión de Colores" themeColors={themeColors} />
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <input value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Nombre del color" style={{ ...inputStyle, flex: 1 }} />
                <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} style={{ width: 50, height: 42, padding: 4, borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, cursor: 'pointer' }} />
                <button onClick={handleAddColor} style={{ padding: '10px 20px', background: isEjecutivo ? '#000000' : '#2563eb', border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#fff', fontWeight: 600, cursor: 'pointer' }}>Agregar</button>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {colors.map(color => (
                  <ItemRow key={color.id} item={color} onToggle={() => toggleColorStatus(color.id)} onDelete={() => deleteColor(color.id)} themeColors={themeColors} />
                ))}
                {colors.length === 0 && <p style={{ textAlign: 'center', color: themeColors.textMuted, padding: 20 }}>No hay colores registrados</p>}
              </div>
            </Card>
          )}

          {activeAttrTab === 'tallas' && (
            <Card themeColors={themeColors}>
              <SHead title="Gestión de Tallas" themeColors={themeColors} />
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <input value={newTallaName} onChange={e => setNewTallaName(e.target.value)} placeholder="Nombre de la talla (ej: S, M, L, XL)" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={handleAddTalla} style={{ padding: '10px 20px', background: isEjecutivo ? '#000000' : '#2563eb', border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#fff', fontWeight: 600, cursor: 'pointer' }}>Agregar</button>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {tallas.map(talla => (
                  <ItemRow key={talla.id} item={talla} onToggle={() => toggleTallaStatus(talla.id)} onDelete={() => deleteTalla(talla.id)} themeColors={themeColors} />
                ))}
                {tallas.length === 0 && <p style={{ textAlign: 'center', color: themeColors.textMuted, padding: 20 }}>No hay tallas registradas</p>}
              </div>
            </Card>
          )}

          {activeAttrTab === 'modelos' && (
            <Card themeColors={themeColors}>
              <SHead title="Gestión de Modelos" themeColors={themeColors} />
              <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                <input value={newModeloName} onChange={e => setNewModeloName(e.target.value)} placeholder="Nombre del modelo" style={inputStyle} />
                <input value={newModeloDesc} onChange={e => setNewModeloDesc(e.target.value)} placeholder="Descripción (opcional)" style={inputStyle} />
                <button onClick={handleAddModelo} style={{ padding: 10, background: isEjecutivo ? '#000000' : '#2563eb', border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#fff', fontWeight: 600, cursor: 'pointer' }}>Agregar Modelo</button>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {modelos.map(modelo => (
                  <ItemRow key={modelo.id} item={modelo} onToggle={() => toggleModeloStatus(modelo.id)} onDelete={() => deleteModelo(modelo.id)} themeColors={themeColors} />
                ))}
                {modelos.length === 0 && <p style={{ textAlign: 'center', color: themeColors.textMuted, padding: 20 }}>No hay modelos registrados</p>}
              </div>
            </Card>
          )}

          {activeAttrTab === 'catalogos' && (
            <Card themeColors={themeColors}>
              <SHead title="Gestión de Catálogos" themeColors={themeColors} />
              <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                <input value={newCatalogoName} onChange={e => setNewCatalogoName(e.target.value)} placeholder="Nombre del catálogo" style={inputStyle} />
                <input value={newCatalogoDesc} onChange={e => setNewCatalogoDesc(e.target.value)} placeholder="Descripción" style={inputStyle} />
                <div className="settings-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <select value={newCatalogoTipo} onChange={e => setNewCatalogoTipo(e.target.value as TipoCatalogo)} style={inputStyle}>
                    <option value="permanente">Permanente</option>
                    <option value="temporada">Temporada</option>
                  </select>
                  <select value={newCatalogoEstado} onChange={e => setNewCatalogoEstado(e.target.value as EstadoCatalogo)} style={inputStyle}>
                    <option value="clasico">Clásico</option>
                    <option value="exclusivo">Exclusivo</option>
                    <option value="tendencia">Tendencia</option>
                    <option value="liquidacion">Liquidación</option>
                    <option value="descontinuado">Descontinuado</option>
                  </select>
                </div>
                <button onClick={handleAddCatalogo} style={{ padding: 10, background: isEjecutivo ? '#000000' : '#2563eb', border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#fff', fontWeight: 600, cursor: 'pointer' }}>Crear Catálogo</button>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {catalogos.map(catalogo => (
                  <ItemRow key={catalogo.id} item={{ ...catalogo, nombre: `${catalogo.nombre} (${catalogo.tipo})` }} onToggle={() => toggleCatalogoActivo(catalogo.id)} onDelete={() => deleteCatalogo(catalogo.id)} themeColors={themeColors} />
                ))}
                {catalogos.length === 0 && <p style={{ textAlign: 'center', color: themeColors.textMuted, padding: 20 }}>No hay catálogos registrados</p>}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'categorias' && (
        <Card themeColors={themeColors}>
          <SHead title="Gestión de Categorías" themeColors={themeColors} />
          <div style={{ display: 'grid', gap: 12, marginBottom: 20, padding: 16, background: themeColors.background, borderRadius: 12, border: `1px solid ${themeColors.border}` }}>
            <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nombre de la categoría" style={inputStyle} />
            <input value={newCategoryDesc} onChange={e => setNewCategoryDesc(e.target.value)} placeholder="Descripción" style={inputStyle} />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input 
                type="file" 
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    try {
                      const { getSupabase } = await import('../../../../services/supabaseClient')
                      const supabase = getSupabase()
                      
                      const fileName = `${Date.now()}-${file.name}`
                      const { data, error } = await supabase.storage
                        .from('categorias')
                        .upload(fileName, file)
                      
                      if (error) {
                        console.error('Error uploading:', error)
                        showToast('Error al subir imagen', 'error')
                        return
                      }
                      
                      if (data) {
                        const { data: urlData } = supabase.storage.from('categorias').getPublicUrl(fileName)
                        setNewCategoryImage(urlData.publicUrl)
                        showToast('Imagen subida exitosamente', 'success')
                      }
                    } catch (err) {
                      console.error('Upload error:', err)
                    }
                  }
                }} 
                style={{ ...inputStyle, padding: 8 }} 
              />
              {newCategoryImage && (
                <img src={newCategoryImage} alt="Preview" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} />
              )}
            </div>
            <button onClick={handleAddCategory} style={{ padding: 10, background: isEjecutivo ? '#000000' : '#2563eb', border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#fff', fontWeight: 600, cursor: 'pointer' }}>Crear Categoría</button>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {categories.map(category => (
              <CategoryCard 
                key={category.id} 
                category={category} 
                onEdit={() => {}} 
                onDelete={() => handleDeleteCategory(category.id)} 
                onToggle={() => handleToggleCategory(category.id, category.status)} 
                themeColors={themeColors} 
              />
            ))}
            {categories.length === 0 && <p style={{ textAlign: 'center', color: themeColors.textMuted, padding: 20 }}>No hay categorías registradas</p>}
          </div>
        </Card>
      )}

      {activeTab === 'redes' && (
        <Card themeColors={themeColors}>
          <SHead title="Redes Sociales" themeColors={themeColors} />
          <p style={{ fontSize: 12, color: themeColors.textMuted, marginBottom: 20 }}>Agrega los enlaces a tus redes sociales que aparecerán en la tienda</p>
          
          <div style={{ display: 'grid', gap: 12, marginBottom: 20, padding: 16, background: themeColors.background, borderRadius: 12, border: `1px solid ${themeColors.border}` }}>
            <div className="settings-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input value={newSocialName} onChange={e => setNewSocialName(e.target.value)} placeholder="Nombre (ej: Facebook)" style={inputStyle} />
              <input value={newSocialIcon} onChange={e => setNewSocialIcon(e.target.value)} placeholder="Emoji (ej: 📘)" style={inputStyle} />
            </div>
            <input value={newSocialLink} onChange={e => setNewSocialLink(e.target.value)} placeholder="URL (ej: https://facebook.com/tutienda)" style={inputStyle} />
            <button onClick={handleAddSocialNetwork} style={{ padding: 10, background: isEjecutivo ? '#000000' : '#2563eb', border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#fff', fontWeight: 600, cursor: 'pointer' }}>Agregar Red Social</button>
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {socialNetworks.map((network: SocialNetwork) => (
              <div key={network.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: themeColors.background, borderRadius: 10, marginBottom: 8, border: `1px solid ${themeColors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{network.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: themeColors.text }}>{network.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: themeColors.textMuted }}>{network.link || 'Sin enlace'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => updateSocialNetwork(network.id, { active: !network.active })} style={{
                    padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500,
                    background: network.active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                    color: network.active ? '#4ade80' : '#94a3b8'
                  }}>
                    {network.active ? 'Activo' : 'Inactivo'}
                  </button>
                  <button onClick={() => deleteSocialNetwork(network.id)} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>×</button>
                </div>
              </div>
            ))}
            {socialNetworks.length === 0 && <p style={{ textAlign: 'center', color: themeColors.textMuted, padding: 20 }}>No hay redes sociales registradas</p>}
          </div>
        </Card>
      )}

      {activeTab === 'nosotros' && (
        <div className="settings-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card themeColors={themeColors}>
            <SHead title="Información de la Empresa" themeColors={themeColors} />
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={labelStyle}>TÍTULO</label>
                <input value={nosotrosTitulo} onChange={e => setNosotrosTitulo(e.target.value)} placeholder="Sobre Nosotros" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>DESCRIPCIÓN CORTA</label>
                <textarea value={nosotrosDescripcion} onChange={e => setNosotrosDescripcion(e.target.value)} placeholder="Breve descripción de tu empresa..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>HISTORIA</label>
                <textarea value={nosotrosHistoria} onChange={e => setNosotrosHistoria(e.target.value)} placeholder="La historia de tu empresa..." style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>AÑOS DE EXPERIENCIA</label>
                <input type="number" value={nosotrosAnos} onChange={e => setNosotrosAnos(parseInt(e.target.value) || 0)} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>URL IMAGEN PRINCIPAL</label>
                <input value={nosotrosImagen} onChange={e => setNosotrosImagen(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" style={inputStyle} />
                {nosotrosImagen && (
                  <div style={{ marginTop: 12 }}>
                    <img src={nosotrosImagen} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} onError={() => setNosotrosImagen('')} />
                  </div>
                )}
              </div>
              <button onClick={handleSaveNosotros} style={{ padding: 12, background: isEjecutivo ? '#000000' : `linear-gradient(135deg,${themeColors.primary},${themeColors.secondary})`, border: 'none', borderRadius: 8, color: isEjecutivo ? '#ffffff' : '#000', fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                GUARDAR CAMBIOS
              </button>
            </div>
          </Card>

          <Card themeColors={themeColors}>
            <SHead title="Valores de la Empresa" themeColors={themeColors} />
            <p style={{ fontSize: 11, color: themeColors.textMuted, marginBottom: 16 }}>
              Agrega los valores que caracterizan a tu empresa (calidad, innovación, etc.)
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input 
                value={newValor} 
                onChange={e => setNewValor(e.target.value)} 
                placeholder="Nuevo valor (ej: Calidad premium)" 
                style={{ ...inputStyle, flex: 1 }}
                onKeyPress={e => {
                  if (e.key === 'Enter') handleAddValor();
                }}
              />
              <button onClick={handleAddValor} style={{ padding: '10px 16px', background: '#2563eb', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                +
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {nosotrosValores.map((valor, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: themeColors.background, borderRadius: 10, border: `1px solid ${themeColors.border}` }}>
                  <span style={{ fontSize: 13, color: themeColors.text }}>{valor}</span>
                  <button onClick={() => handleDeleteValor(idx)} style={{ padding: '4px 10px', background: 'rgba(239, 68, 68, 0.15)', border: 'none', borderRadius: 6, color: '#f87171', cursor: 'pointer' }}>×</button>
                </div>
              ))}
              {nosotrosValores.length === 0 && (
                <p style={{ textAlign: 'center', color: themeColors.textMuted, padding: 20, fontSize: 13 }}>No hay valores agregados</p>
              )}
            </div>
          </Card>

          <Card themeColors={themeColors} style={{ gridColumn: '1 / -1' }}>
            <SHead title="Vista Previa" themeColors={themeColors} />
            <div style={{ 
              padding: 32, 
              background: `linear-gradient(135deg, ${themeColors.surface} 0%, ${themeColors.background} 100%)`, 
              borderRadius: 16, 
              border: `1px solid ${themeColors.border}`
            }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                {nosotrosImagen && (
                  <img 
                    src={nosotrosImagen} 
                    alt="Nosotros" 
                    style={{ width: 200, height: 150, objectFit: 'cover', borderRadius: 12 }}
                    onError={() => {}}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700, color: themeColors.text }}>
                    {nosotrosTitulo || 'Título de la empresa'}
                  </h2>
                  <p style={{ margin: '0 0 12px', fontSize: 14, color: themeColors.textMuted }}>
                    {nosotrosDescripcion || 'Descripción de tu empresa...'}
                  </p>
                  {nosotrosAnos > 0 && (
                    <p style={{ margin: 0, fontSize: 13, color: themeColors.primary, fontWeight: 600 }}>
                      ✦ {nosotrosAnos} años de experiencia
                    </p>
                  )}
                </div>
              </div>
              {nosotrosValores.length > 0 && (
                <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {nosotrosValores.map((valor, idx) => (
                    <span key={idx} style={{ padding: '8px 16px', background: `${themeColors.primary}15`, borderRadius: 20, fontSize: 12, color: themeColors.text, fontWeight: 500 }}>
                      {valor}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'envios' && (
        <Card themeColors={themeColors}>
            <SHead title="Campos para Envíos" themeColors={themeColors} />
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Configura los campos que aparecerán en las etiquetas de envío</p>
          
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>AGREGAR CAMPO</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                value={newFieldLabel} 
                onChange={e => setNewFieldLabel(e.target.value)} 
                placeholder="Etiqueta (ej: Teléfono)"
                style={{ flex: 1, padding: '10px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 13 }}
              />
              <input 
                value={newFieldKey} 
                onChange={e => setNewFieldKey(e.target.value)} 
                placeholder="Clave (ej: telefono)"
                style={{ flex: 1, padding: '10px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 13 }}
              />
              <button 
                onClick={handleAddShippingField}
                style={{ padding: '10px 20px', background: '#22c55e', border: 'none', borderRadius: 8, color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                + Agregar
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>CAMPOS ACTIVOS</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {shippingFields.map(field => (
                <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#1a1a1a', borderRadius: 8, border: '1px solid #333' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={field.enabled} 
                      onChange={() => handleToggleShippingField(field.id, field.enabled)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 12, color: '#fff' }}>{field.label}</span>
                  </label>
                  <button 
                    onClick={() => handleDeleteShippingField(field.id)}
                    style={{ padding: '2px 8px', background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 4, color: '#f87171', fontSize: 12, cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {shippingFields.length === 0 && <p style={{ color: '#64748b', fontSize: 12 }}>No hay campos configurados</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Alinear Logo</p>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setLogoAlign('left')} style={{ padding: '6px 12px', background: logoAlign === 'left' ? (isEjecutivo ? '#fbbf24' : '#2563eb') : (isEjecutivo ? '#000000' : '#1a1a1a'), border: '1px solid #333', borderRadius: 6, color: logoAlign === 'left' ? (isEjecutivo ? '#000000' : '#fff') : '#fff', fontSize: 12, cursor: 'pointer' }}>← Izq</button>
                <button onClick={() => setLogoAlign('center')} style={{ padding: '6px 12px', background: logoAlign === 'center' ? (isEjecutivo ? '#fbbf24' : '#2563eb') : (isEjecutivo ? '#000000' : '#1a1a1a'), border: '1px solid #333', borderRadius: 6, color: logoAlign === 'center' ? (isEjecutivo ? '#000000' : '#fff') : '#fff', fontSize: 12, cursor: 'pointer' }}>Centrar</button>
                <button onClick={() => setLogoAlign('right')} style={{ padding: '6px 12px', background: logoAlign === 'right' ? (isEjecutivo ? '#fbbf24' : '#2563eb') : (isEjecutivo ? '#000000' : '#1a1a1a'), border: '1px solid #333', borderRadius: 6, color: logoAlign === 'right' ? (isEjecutivo ? '#000000' : '#fff') : '#fff', fontSize: 12, cursor: 'pointer' }}>Der →</button>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Alinear Nombre</p>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setStoreNameAlign('left')} style={{ padding: '6px 12px', background: storeNameAlign === 'left' ? (isEjecutivo ? '#fbbf24' : '#2563eb') : (isEjecutivo ? '#000000' : '#1a1a1a'), border: '1px solid #333', borderRadius: 6, color: storeNameAlign === 'left' ? (isEjecutivo ? '#000000' : '#fff') : '#fff', fontSize: 12, cursor: 'pointer' }}>← Izq</button>
                <button onClick={() => setStoreNameAlign('center')} style={{ padding: '6px 12px', background: storeNameAlign === 'center' ? (isEjecutivo ? '#fbbf24' : '#2563eb') : (isEjecutivo ? '#000000' : '#1a1a1a'), border: '1px solid #333', borderRadius: 6, color: storeNameAlign === 'center' ? (isEjecutivo ? '#000000' : '#fff') : '#fff', fontSize: 12, cursor: 'pointer' }}>Centrar</button>
                <button onClick={() => setStoreNameAlign('right')} style={{ padding: '6px 12px', background: storeNameAlign === 'right' ? (isEjecutivo ? '#fbbf24' : '#2563eb') : (isEjecutivo ? '#000000' : '#1a1a1a'), border: '1px solid #333', borderRadius: 6, color: storeNameAlign === 'right' ? (isEjecutivo ? '#000000' : '#fff') : '#fff', fontSize: 12, cursor: 'pointer' }}>Der →</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button 
                onClick={handleDownloadWord}
                style={{ padding: '10px 24px', background: '#16a34a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar Word
              </button>
              <button 
                onClick={handlePrintFormat}
                style={{ padding: '10px 24px', background: '#2563eb', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir PDF
              </button>
            </div>
          </div>

          <div style={{ padding: 20, background: '#0a0a0f', borderRadius: 12 }}>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>VISTA PREVIA</p>
            <div ref={shippingFormatRef} className="print-container" style={{ background: '#fff', borderRadius: 8, padding: 20, color: '#000' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px dashed #ccc', paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: logoAlign }}>
                  {logo ? (
                    <img src={logo} alt="Logo" style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 72, height: 72, background: '#f0f0f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#999' }}>{storeName?.charAt(0) || 'L'}</div>
                  )}
                  <div style={{ textAlign: storeNameAlign }}>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#000' }}>{storeName || 'Nombre de la tienda'}</p>
                    {storeUrl && <a href={storeUrl} target="_blank" rel="noopener noreferrer" style={{ margin: 0, fontSize: 10, color: '#0066cc', textDecoration: 'none' }}>{storeUrl.replace(/^https?:\/\//, '')}</a>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 100 }}>
                  <p style={{ margin: 0, fontSize: 10, color: '#666', fontWeight: 600 }}>PEDIDO</p>
                  <div style={{ width: 100, borderBottom: '1px solid #333', fontSize: 14, fontWeight: 600, padding: '4px 0', textAlign: 'right' }}>PED-000</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 10, color: '#666', fontWeight: 600, marginBottom: 8 }}>DESTINATARIO</p>
                  {shippingFields.filter(f => f.enabled).map(field => (
                    <div key={field.id} style={{ marginBottom: 6 }}>
                      <p style={{ margin: 0, fontSize: 9, color: '#999' }}>{field.label.toUpperCase()}</p>
                      <div style={{ borderBottom: '1px solid #333', padding: '4px 0', fontSize: 12 }}>_________________</div>
                    </div>
                  ))}
                  {shippingFields.filter(f => f.enabled).length === 0 && (
                    <>
                      <div style={{ marginBottom: 6 }}>
                        <p style={{ margin: 0, fontSize: 9, color: '#999' }}>NOMBRE</p>
                        <div style={{ borderBottom: '1px solid #333', padding: '4px 0', fontSize: 12 }}>_________________</div>
                      </div>
                      <div style={{ marginBottom: 6 }}>
                        <p style={{ margin: 0, fontSize: 9, color: '#999' }}>DIRECCIÓN</p>
                        <div style={{ borderBottom: '1px solid #333', padding: '4px 0', fontSize: 12 }}>_________________</div>
                      </div>
                      <div style={{ marginBottom: 6 }}>
                        <p style={{ margin: 0, fontSize: 9, color: '#999' }}>TELÉFONO</p>
                        <div style={{ borderBottom: '1px solid #333', padding: '4px 0', fontSize: 12 }}>_________________</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
