import React, { useState, useEffect, useRef } from 'react';
import {
    createBrigada,
    updateBrigada,
    upsertEppRopa,
    upsertBotas,
    upsertGuantes,
    addEppEquipoItem,
    addHerramientaItem,
    addLogisticaRepuesto,
    addAlimentacionItem,
    addLogisticaCampoItem,
    addLimpiezaPersonalItem,
    addLimpiezaGeneralItem,
    addMedicamentoItem,
    addRescateAnimalItem
} from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ✨ NUEVA PALETA DE COLORES AMARILLA HERMOSA
const SECTION_COLORS = [
    { primary: '#f59e0b', secondary: '#fef3c7', hover: '#f97316' }, // Amarillo brillante - Información
    { primary: '#d97706', secondary: '#fed7aa', hover: '#ea580c' }, // Amber oscuro - EPP
    { primary: '#dc2626', secondary: '#fecaca', hover: '#dc2626' }, // Rojo complementario - Herramientas
    { primary: '#7c3aed', secondary: '#ddd6fe', hover: '#8b5cf6' }, // Púrpura - Logística
    { primary: '#0ea5e9', secondary: '#bae6fd', hover: '#0284c7' }, // Azul cielo - Alimentación
    { primary: '#059669', secondary: '#a7f3d0', hover: '#047857' }, // Esmeralda - Equipo de campo
    { primary: '#0d9488', secondary: '#99f6e4', hover: '#0f766e' }, // Teal - Limpieza
    { primary: '#db2777', secondary: '#fbcfe8', hover: '#be185d' }, // Rosa fuerte - Medicamentos
    { primary: '#7c2d12', secondary: '#fed7aa', hover: '#9a3412' }  // Café - Rescate animal
];

// Configuración de secciones con endpoints y reglas básicas
const SECTIONS = [
    {
        id: 'info',
        name: 'Información',
        endpoint: '',
        fields: ['nombre', 'cantidadactivos', 'nombrecomandante', 'celularcomandante', 'encargadologistica', 'celularlogistica', 'numerosemergencia'],
        required: ['nombre', 'cantidadactivos', 'nombrecomandante', 'celularcomandante']
    },
    {
        id: 'epp',
        name: 'Equipamiento',
        endpoint: '/epp-ropa',
        fields: ['tipo', 'talla', 'cantidad', 'observaciones']
    },
    {
        id: 'tools',
        name: 'Herramientas',
        endpoint: '/herramientas',
        fields: ['item', 'cantidad', 'observaciones']
    },
    {
        id: 'logistics',
        name: 'Logística',
        endpoint: '/logistica-repuestos',
        fields: ['item', 'costo', 'observaciones']
    },
    {
        id: 'food',
        name: 'Alimentación',
        endpoint: '/alimentacion',
        fields: ['item', 'cantidad', 'observaciones']
    },
    {
        id: 'camp',
        name: 'Campo',
        endpoint: '/logistica-campo',
        fields: ['item', 'cantidad', 'observaciones']
    },
    {
        id: 'hygiene',
        name: 'Limpieza',
        endpoint: '/limpieza-personal',
        fields: ['item', 'cantidad', 'observaciones']
    },
    {
        id: 'meds',
        name: 'Medicamentos',
        endpoint: '/medicamentos',
        fields: ['item', 'cantidad', 'observaciones']
    },
    {
        id: 'animals',
        name: 'Rescate',
        endpoint: '/rescate-animal',
        fields: ['item', 'cantidad', 'observaciones']
    }
];

// 🎨 Componente de input numérico mejorado con colores amarillos
// Componente de input numérico mejorado con colores amarillos
const NumberInput = ({ value, onChange, min = 0, max, className = '', darkMode = false, ...props }) => {
    const handleIncrement = () => onChange(Math.min(value + 1, max || Infinity));
    const handleDecrement = () => onChange(Math.max(value - 1, min));

    return (
        <div className={`inline-flex items-center whitespace-nowrap rounded-md overflow-hidden border 
            min-w-[100px] sm:min-w-[120px] ${className} 
            ${darkMode 
                ? 'border-amber-600/50 bg-slate-800/50' 
                : 'border-amber-300/50 bg-white'
            }`}>
            {/* Botón Decrementar */}
            <button
                type="button"
                onClick={handleDecrement}
                className={`px-2 sm:px-3 py-1 text-sm font-bold flex-shrink-0 min-w-[32px] sm:min-w-[36px] h-[32px] sm:h-[36px]
                    flex items-center justify-center transition-colors duration-200
                    ${darkMode 
                        ? 'bg-red-600 text-white hover:bg-red-500' 
                        : 'bg-red-500 text-white hover:bg-red-400'
                    }`}
                aria-label="Decrementar"
                disabled={value <= min}
            >
                <span className="text-base leading-none">−</span>
            </button>

            {/* Campo de input numérico */}
            <input
                type="number"
                value={value}
                min={min}
                max={max}
                onChange={(e) => onChange(parseInt(e.target.value) || min)}
                className={`w-16 sm:w-20 px-2 py-1 text-center text-sm font-medium flex-shrink-0 border-none outline-none
                    ${darkMode 
                        ? 'bg-slate-700 text-amber-100' 
                        : 'bg-amber-50 text-slate-800'
                    }`}
                {...props}
            />

            {/* Botón Incrementar */}
            <button
                type="button"
                onClick={handleIncrement}
                className={`px-2 sm:px-3 py-1 text-sm font-bold flex-shrink-0 min-w-[32px] sm:min-w-[36px] h-[32px] sm:h-[36px]
                    flex items-center justify-center transition-colors duration-200
                    ${darkMode 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                        : 'bg-emerald-500 text-white hover:bg-emerald-400'
                    }`}
                aria-label="Incrementar"
                disabled={max !== undefined && value >= max}
            >
                <span className="text-base leading-none">+</span>
            </button>
        </div>
    );
};

const BombForm = ({ onBack }) => {
    const [darkMode, setDarkMode] = useState(false);
    const [activeSection, setActiveSection] = useState('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({
        success: null,
        isFinal: false,
        message: ''
    });
    const [brigadaId, setBrigadaId] = useState(null);
    const [completedSections, setCompletedSections] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    // showSummary deprecated: use activeSection === 'summary'
    const formRef = useRef();

    // Obtener colores de la sección actual
    const currentSectionIndex = SECTIONS.findIndex(s => s.id === activeSection);
    const currentColors = SECTION_COLORS[currentSectionIndex] || SECTION_COLORS[0];

    // 📋 Catálogos de ítems por sección - 🩸 AGREGADAS TOALLAS FEMENINAS EN LIMPIEZA
    const EPP_ROPA_ITEMS = ['Camisa Forestal', 'Pantalón Forestal', 'Overol FR'];
    const EPP_EQUIPO_ITEMS = [
        'Esclavina', 'Linterna', 'Antiparra', 'Casco Forestal Ala Ancha',
        'Máscara para Polvo y Partículas', 'Máscara Media Cara', 'Barbijos'
    ];
    const BOTAS_SIZES = ['37', '38', '39', '40', '41', '42', '43', 'otra'];
    const GUANTES_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'otra'];
    const HERRAMIENTAS_ITEMS = [
        'Linternas de Cabeza', 'Pilas AA', 'Pilas AAA', 'Azadón',
        'Pala con Mango de Fibra', 'Rastrillo Mango de Fibra',
        'McLeod Mango de Fibra', 'Batefuego', 'Gorgui',
        'Pulasky con Mango de Fibra', 'Quemador de Goteo',
        'Mochila Forestal', 'Escobeta de Alambre'
    ];
    const LOGISTICA_REPUESTOS_ITEMS = [
        'Gasolina', 'Diésel', 'Amortiguadores', 'Prensa Disco',
        'Rectificación de Frenos', 'Llantas', 'Aceite de Motor',
        'Grasa', 'Cambio de Aceite', 'Otro Tipo de Arreglo'
    ];
    const ALIMENTACION_ITEMS = [
        'Alimentos y Bebidas', 'Agua', 'Rehidratantes', 'Barras Energizantes',
        'Lata de Atún', 'Lata de Frejol', 'Lata de Viandada', 'Lata de Chorizos',
        'Refresco en Sobres', 'Leche Polvo', 'Frutos Secos',
        'Pastillas de Menta o Dulces', 'Alimentos No Perecederos'
    ];
    const CAMPO_ITEMS = ['Carpas', 'Colchonetas', 'Mochilas Personales', 'Mantas', 'Cuerdas', 'Radio Comunicadores', 'Baterías Portátiles'];
    
    // 🩸 ¡AGREGADAS TOALLAS FEMENINAS EN LIMPIEZA PERSONAL!
    const LIMPIEZA_PERSONAL_ITEMS = ['Papel Higiénico', 'Cepillos de Dientes', 'Jabón', 'Pasta Dental', 'Toallas', 'Alcohol en Gel', 'Toallas Femeninas'];
    
    const LIMPIEZA_GENERAL_ITEMS = ['Detergente', 'Escobas', 'Trapeadores', 'Bolsas de Basura', 'Lavandina', 'Desinfectante'];
    const MEDICAMENTOS_ITEMS = ['Paracetamol', 'Ibuprofeno', 'Antibióticos', 'Suero Oral', 'Gasas', 'Vendas', 'Alcohol', 'Yodo', 'Curitas'];
    const RESCATE_ANIMAL_ITEMS = ['Jaulas de Transporte', 'Collares', 'Comida para Mascotas', 'Guantes Especiales', 'Medicamentos Veterinarios'];

    // Estado del formulario principal
    const [formData, setFormData] = useState({
        nombre: '',
        cantidadactivos: 1,
        nombrecomandante: '',
        celularcomandante: '',
        encargadologistica: '',
        celularlogistica: '',
        numerosemergencia: ''
    });

    // Estados específicos por sección
    const [eppRopa, setEppRopa] = useState(() =>
        Object.fromEntries(EPP_ROPA_ITEMS.map(item => [item, {
            xs: 0,
            s: 0,
            m: 0,
            l: 0,
            xl: 0,
            observaciones: ''
        }]))
    );
    const [botas, setBotas] = useState(() => ({
        '37': 0, '38': 0, '39': 0, '40': 0, '41': 0, '42': 0, '43': 0,
        otra: 0, otratalla: '', observaciones: ''
    }));
    const [guantes, setGuantes] = useState(() => ({
        XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, otra: 0, otratalla: ''
    }));
    const [eppEquipo, setEppEquipo] = useState(() =>
        Object.fromEntries(EPP_EQUIPO_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    );
    const [eppEquipoCustom, setEppEquipoCustom] = useState([]);
    const [herramientas, setHerramientas] = useState(() =>
        Object.fromEntries(HERRAMIENTAS_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    );
    const [herramientasCustom, setHerramientasCustom] = useState([]);
    const [logisticaRepuestos, setLogisticaRepuestos] = useState(() =>
        Object.fromEntries(LOGISTICA_REPUESTOS_ITEMS.map(item => [item, { costo: 0, observaciones: '' }]))
    );
    const [logisticaRepuestosCustom, setLogisticaRepuestosCustom] = useState([]);
    const [alimentacion, setAlimentacion] = useState(() =>
        Object.fromEntries(ALIMENTACION_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    );
    const [alimentacionCustom, setAlimentacionCustom] = useState([]);
    const [logisticaCampo, setLogisticaCampo] = useState(() =>
        Object.fromEntries(CAMPO_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    );
    const [logisticaCampoCustom, setLogisticaCampoCustom] = useState([]);
    const [limpiezaPersonal, setLimpiezaPersonal] = useState(() =>
        Object.fromEntries(LIMPIEZA_PERSONAL_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    );
    const [limpiezaPersonalCustom, setLimpiezaPersonalCustom] = useState([]);
    const [limpiezaGeneral, setLimpiezaGeneral] = useState(() =>
        Object.fromEntries(LIMPIEZA_GENERAL_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    );
    const [limpiezaGeneralCustom, setLimpiezaGeneralCustom] = useState([]);
    const [medicamentos, setMedicamentos] = useState(() =>
        Object.fromEntries(MEDICAMENTOS_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    );
    const [medicamentosCustom, setMedicamentosCustom] = useState([]);
    const [rescateAnimal, setRescateAnimal] = useState(() =>
        Object.fromEntries(RESCATE_ANIMAL_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    );
    const [rescateAnimalCustom, setRescateAnimalCustom] = useState([]);
    const [eppRopaCustom, setEppRopaCustom] = useState([]);

    // Toggle modo oscuro
    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        document.documentElement.classList.toggle('dark', newMode);
        localStorage.setItem('darkMode', newMode);
    };

    // Efecto para cargar preferencia de modo oscuro
    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedMode);
        if (savedMode) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    // Manejador para campos simples de brigada con validaciones
    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        const processedValue = name === 'cantidadactivos'
            ? Math.max(1, parseInt(value) || 1)
            : value;

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Handlers específicos por sección
    const handleEppRopaSizeChange = (item, sizeKey, value) => {
        setEppRopa(prev => ({
            ...prev,
            [item]: { ...prev[item], [sizeKey]: Number(value) || 0 }
        }));
    };

    const handleEppRopaObsChange = (item, text) => {
        setEppRopa(prev => ({
            ...prev,
            [item]: { ...prev[item], observaciones: text }
        }));
    };

    const handleBotasChange = (sizeKey, value) => {
        setBotas(prev => ({ ...prev, [sizeKey]: Number(value) || 0 }));
    };

    const handleBotasObsChange = (text) => {
        setBotas(prev => ({ ...prev, observaciones: text }));
    };

    const handleBotasOtraTallaText = (text) => {
        setBotas(prev => ({ ...prev, otratalla: text }));
    };

    const handleGuantesChange = (sizeKey, value) => {
        setGuantes(prev => ({ ...prev, [sizeKey]: Number(value) || 0 }));
    };

    const handleGuantesOtraTallaText = (text) => {
        setGuantes(prev => ({ ...prev, otratalla: text }));
    };

    const handleListQuantityChange = (setter) => (item, value) => {
        setter(prev => ({
            ...prev,
            [item]: { ...prev[item], cantidad: Number(value) || 0 }
        }));
    };

    const handleListCostChange = (setter) => (item, value) => {
        setter(prev => ({
            ...prev,
            [item]: { ...prev[item], costo: Number(value) || 0 }
        }));
    };

    const handleListObsChange = (setter) => (item, text) => {
        setter(prev => ({
            ...prev,
            [item]: { ...prev[item], observaciones: text }
        }));
    };

    // Validar sección actual with more details
    const validateSection = (sectionId) => {
        const section = SECTIONS.find(s => s.id === sectionId);
        if (!section || !section.required) return true;

        const errors = {};
        let isValid = true;

        section.required.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                errors[field] = 'Este campo es obligatorio';
                isValid = false;
            } else if (field === 'cantidadactivos' && formData[field] < 1) {
                errors[field] = 'Debe haber al menos un bombero activo';
                isValid = false;
            } else if ((field === 'celularcomandante' || field === 'celularlogistica')) {
                const phoneValue = formData[field].toString().replace(/\D/g, '');
                if (phoneValue.length !== 8) {
                    errors[field] = 'El teléfono debe tener 8 dígitos';
                    isValid = false;
                }
            }
        });

        setFormErrors(errors);
        return isValid;
    };

    // Navegación entre secciones con validación
    const goToSection = (sectionId) => {
        if (validateSection(activeSection)) {
            setActiveSection(sectionId);
            // previously hid the summary; now navigate to current section (no-op)
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setSubmitStatus({ success: null, message: '' });
            return true;
        }
        return false;
    };

    // Construye el payload de Información de Brigada que espera la API
    const buildInfoPayload = () => ({
        nombre: formData.nombre,
        cantidadactivos: Number(formData.cantidadactivos) || 0,
        nombrecomandante: formData.nombrecomandante,
        celularcomandante: formData.celularcomandante,
        encargadologistica: formData.encargadologistica || '',
        celularlogistica: formData.celularlogistica || '',
        numerosemergencia: formData.numerosemergencia || ''
    });

    // Crea o actualiza la brigada en base a si ya tenemos brigadaId
    const persistInfo = async () => {
    const payload = buildInfoPayload();
    if (!brigadaId) {
        const response = await createBrigada(payload);
        console.log('Respuesta de API:', response); // 🔍 Para ver qué devuelve
        
        // Intentar diferentes estructuras de respuesta
        const newBrigadaId = response.data?.brigadaId || 
                            response.data?.id || 
                            response.brigadaId || 
                            response.id;
        
        if (!newBrigadaId) {
            console.error('Estructura completa:', response);
            throw new Error(`No se pudo obtener ID. Respuesta: ${JSON.stringify(response)}`);
        }
        setBrigadaId(newBrigadaId);
        return newBrigadaId;
    }
    await updateBrigada(brigadaId, payload);
    return brigadaId;
};


    // Persiste EPP Ropa: envía por prenda y talla con cantidad > 0
    const persistEppRopa = async (id) => {
        const sizeKeys = ['xs','s','m','l','xl'];
        const tasks = [];
        Object.entries(eppRopa).forEach(([itemNombre, itemData]) => {
            sizeKeys.forEach((sizeKey) => {
                const qty = Number(itemData[sizeKey]) || 0;
                if (qty > 0) {
                    tasks.push(
                        upsertEppRopa(id, {
                            tipo: itemNombre,
                            talla: sizeKey,
                            cantidad: qty,
                            observaciones: itemData.observaciones || ''
                        })
                    );
                }
            });
        });
        // Ítems personalizados de ropa
        (eppRopaCustom || []).forEach((row) => {
            sizeKeys.forEach((sizeKey) => {
                const qty = Number(row[sizeKey]) || 0;
                if ((row.item || '').trim() && qty > 0) {
                    tasks.push(
                        upsertEppRopa(id, {
                            tipo: row.item,
                            talla: sizeKey,
                            cantidad: qty,
                            observaciones: row.observaciones || ''
                        })
                    );
                }
            });
        });
        if (tasks.length === 0) return;
        await Promise.all(tasks);
    };

    // Persiste Botas: envía por cada talla con cantidad > 0
    const persistBotas = async (id) => {
        const sizeKeys = ['37','38','39','40','41','42','43'];
        const tasks = [];
        sizeKeys.forEach((sizeKey) => {
            const qty = Number(botas[sizeKey]) || 0;
            if (qty > 0) {
                tasks.push(
                    upsertBotas(id, {
                        tipo: 'botas',
                        talla: sizeKey,
                        cantidad: qty,
                        observaciones: botas.observaciones || '',
                        otratalla: ''
                    })
                );
            }
        });
        // Talla "otra": la API sólo guarda el texto en otratalla
        if ((botas.otratalla || '').trim()) {
            tasks.push(
                upsertBotas(id, {
                    tipo: 'botas',
                    talla: 'otra',
                    cantidad: Number(botas.otra) || 0,
                    observaciones: botas.observaciones || '',
                    otratalla: botas.otratalla
                })
            );
        }
        if (tasks.length === 0) return;
        await Promise.all(tasks);
    };

    // Persiste Guantes: la API espera todos los tamaños en un único POST
    const persistGuantes = async (id) => {
        const payload = {
            xs: Number(guantes.XS) || 0,
            s: Number(guantes.S) || 0,
            m: Number(guantes.M) || 0,
            l: Number(guantes.L) || 0,
            xl: Number(guantes.XL) || 0,
            xxl: Number(guantes.XXL) || 0,
            otratalla: guantes.otratalla || null
        };
        // Evita llamadas innecesarias sin datos
        const hasAny = Object.values(payload).some((v) => (typeof v === 'number' ? v > 0 : !!v));
        if (!hasAny) return;
        await upsertGuantes(id, payload);
    };

    // Utilidad para iterar y enviar ítems simples { item, cantidad, observaciones }
    const persistSimpleItems = async (id, itemsMap, customList, addItemFn) => {
        const tasks = [];
        Object.entries(itemsMap).forEach(([item, data]) => {
            const qty = Number(data.cantidad) || 0;
            const obs = data.observaciones || '';
            if (qty > 0 || obs.trim()) {
                tasks.push(addItemFn(id, { item, cantidad: qty, observaciones: obs }));
            }
        });
        (customList || []).forEach((row) => {
            const name = (row.item || '').trim();
            const qty = Number(row.cantidad) || 0;
            const obs = row.observaciones || '';
            if (name && (qty > 0 || obs.trim())) {
                tasks.push(addItemFn(id, { item: name, cantidad: qty, observaciones: obs }));
            }
        });
        if (tasks.length === 0) return;
        await Promise.all(tasks);
    };

    // Utilidad para iterar y enviar ítems con costo { item, costo, observaciones }
    const persistCostItems = async (id, itemsMap, customList, addItemFn) => {
        const tasks = [];
        Object.entries(itemsMap).forEach(([item, data]) => {
            const cost = Number(data.costo) || 0;
            const obs = data.observaciones || '';
            if (cost > 0 || obs.trim()) {
                tasks.push(addItemFn(id, { item, costo: cost, observaciones: obs }));
            }
        });
        (customList || []).forEach((row) => {
            const name = (row.item || '').trim();
            const cost = Number(row.costo) || 0;
            const obs = row.observaciones || '';
            if (name && (cost > 0 || obs.trim())) {
                tasks.push(addItemFn(id, { item: name, costo: cost, observaciones: obs }));
            }
        });
        if (tasks.length === 0) return;
        await Promise.all(tasks);
    };

    // 📋 Función para obtener resumen de datos
    const getSummaryData = () => {
        const summary = {
            informacion: formData,
            equipamiento: {
                ropa: eppRopa,
                ropaCustom: eppRopaCustom,
                botas: botas,
                guantes: guantes,
                equipo: eppEquipo,
                equipoCustom: eppEquipoCustom
            },
            herramientas: {
                items: herramientas,
                custom: herramientasCustom
            },
            logistica: {
                repuestos: logisticaRepuestos,
                repuestosCustom: logisticaRepuestosCustom
            },
            alimentacion: {
                items: alimentacion,
                custom: alimentacionCustom
            },
            campo: {
                items: logisticaCampo,
                custom: logisticaCampoCustom
            },
            limpieza: {
                personal: limpiezaPersonal,
                personalCustom: limpiezaPersonalCustom,
                general: limpiezaGeneral,
                generalCustom: limpiezaGeneralCustom
            },
            medicamentos: {
                items: medicamentos,
                custom: medicamentosCustom
            },
            rescate: {
                animal: rescateAnimal,
                animalCustom: rescateAnimalCustom
            }
        };
        return summary;
    };

    // Manejador de envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateSection(activeSection)) {
            return;
        }

        setIsSubmitting(true);
        try {
            const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
            const isLastSection = currentIndex === SECTIONS.length - 1;

            // 1) Siempre asegura que exista la brigada (crea o actualiza info cuando procede)
            let id = brigadaId;
            if (activeSection === 'info') {
                id = await persistInfo();
            } else if (!id) {
                // Si por alguna razón se intenta guardar otra sección sin ID, crea primero la brigada
                id = await persistInfo();
            }

            // 2) Persistencia específica por sección
            if (activeSection === 'epp') {
                await persistEppRopa(id);
                await persistBotas(id);
                await persistGuantes(id);
                // EPP Equipo (otros equipos)
                await persistSimpleItems(id, eppEquipo, eppEquipoCustom, addEppEquipoItem);
            } else if (activeSection === 'tools') {
                await persistSimpleItems(id, herramientas, herramientasCustom, addHerramientaItem);
            } else if (activeSection === 'logistics') {
                await persistCostItems(id, logisticaRepuestos, logisticaRepuestosCustom, addLogisticaRepuesto);
            } else if (activeSection === 'food') {
                await persistSimpleItems(id, alimentacion, alimentacionCustom, addAlimentacionItem);
            } else if (activeSection === 'camp') {
                await persistSimpleItems(id, logisticaCampo, logisticaCampoCustom, addLogisticaCampoItem);
            } else if (activeSection === 'hygiene') {
                await persistSimpleItems(id, limpiezaPersonal, limpiezaPersonalCustom, addLimpiezaPersonalItem);
                await persistSimpleItems(id, limpiezaGeneral, limpiezaGeneralCustom, addLimpiezaGeneralItem);
            } else if (activeSection === 'meds') {
                await persistSimpleItems(id, medicamentos, medicamentosCustom, addMedicamentoItem);
            } else if (activeSection === 'animals') {
                await persistSimpleItems(id, rescateAnimal, rescateAnimalCustom, addRescateAnimalItem);
            }

            if (isLastSection) {
                setSubmitStatus({ success: true, message: '¡Formulario completado con éxito!', isFinal: true });
                setActiveSection('summary');
            } else {
                setSubmitStatus({ success: true, message: 'Sección guardada correctamente. Avanzando...' });
                setActiveSection(SECTIONS[currentIndex + 1].id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setSubmitStatus({ success: null, message: '' }), 1500);
            }
        } catch (error) {
            console.error('Error al enviar formulario:', error);
            setSubmitStatus({ success: false, message: 'Error: ' + (error.response?.data?.message || error.message) });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 📄 Generar PDF mejorado con paleta amarilla
    const generatePDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const doc = new jsPDF('p', 'mm', 'a4');

            // Configuración
            const margin = 15;
            let y = margin;
            const pageWidth = doc.internal.pageSize.getWidth();
            const maxWidth = pageWidth - 2 * margin;

            // Función para agregar texto con manejo de saltos de página
            const addText = (text, size = 12, style = 'normal', x = margin) => {
                doc.setFontSize(size);
                doc.setFont(undefined, style);

                // Manejo de saltos de página
                if (y > 280) {
                    doc.addPage();
                    y = margin;
                }

                const lines = doc.splitTextToSize(text, maxWidth - x);
                doc.text(lines, x, y);
                y += lines.length * (size / 2 + 2);
            };

            // Cabecera del documento con colores amarillos
            doc.setFillColor(245, 158, 11); // Amarillo brillante
            doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text('Formulario de Necesidades', pageWidth / 2, 15, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Cuerpo de Bomberos | ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

            // Resetear posición y color
            y = 35;
            doc.setTextColor(0, 0, 0);

            // Sección: Información de la Brigada
            addText('1. INFORMACIÓN DE LA BRIGADA', 14, 'bold');
            addText(`Nombre: ${formData.nombre}`);
            addText(`Bomberos activos: ${formData.cantidadactivos}`);
            addText(`Comandante: ${formData.nombrecomandante}`);
            addText(`Celular comandante: ${formData.celularcomandante}`);
            addText(`Encargado de logística: ${formData.encargadologistica || 'No especificado'}`);
            addText(`Celular logística: ${formData.celularlogistica || 'No especificado'}`);
            addText(`Números de emergencia: ${formData.numerosemergencia || 'No especificado'}`);
            y += 10;

            // Función para generar tablas de datos
            const generateTable = (title, headers, data) => {
                addText(title, 14, 'bold');
                y += 5;

                const tableData = [];

                // Encabezados
                tableData.push(headers);

                // Datos
                Object.entries(data).forEach(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                        if (headers.includes('XS') || headers.includes('Cantidad') || headers.includes('Costo')) {
                            const row = headers.map(header => {
                                if (header === 'Artículo' || header === 'Item') return key;
                                if (header === 'Observaciones') return value.observaciones || '';
                                return value[header.toLowerCase()] || '';
                            });
                            if (row.some(cell => cell && cell !== '0')) {
                                tableData.push(row);
                            }
                        }
                    }
                });

                if (tableData.length > 1) {
                    autoTable(doc, {
                        startY: y,
                        head: [tableData[0]],
                        body: tableData.slice(1),
                        theme: 'grid',
                        margin: { left: margin, right: margin },
                        styles: { fontSize: 9 },
                        headStyles: { fillColor: [245, 158, 11], fontStyle: 'bold', textColor: [255, 255, 255] }, // Amarillo
                        alternateRowStyles: { fillColor: [254, 243, 199] } // Amarillo claro
                    });

                    y = doc.lastAutoTable.finalY + 10;
                }
            };

            // Todas las secciones del formulario incluyendo custom items
            generateTable('2. EQUIPAMIENTO EPP - ROPA',
                ['Artículo', 'XS', 'S', 'M', 'L', 'XL', 'Observaciones'],
                { ...eppRopa, ...Object.fromEntries(eppRopaCustom.map((item, i) => [`${item.item} (personalizado)`, item])) }
            );

            generateTable('3. HERRAMIENTAS',
                ['Item', 'Cantidad', 'Observaciones'],
                { ...herramientas, ...Object.fromEntries(herramientasCustom.map((item, i) => [`${item.item} (personalizado)`, item])) }
            );

            generateTable('4. LOGÍSTICA',
                ['Item', 'Costo', 'Observaciones'],
                { ...logisticaRepuestos, ...Object.fromEntries(logisticaRepuestosCustom.map((item, i) => [`${item.item} (personalizado)`, item])) }
            );

            generateTable('5. ALIMENTACIÓN',
                ['Item', 'Cantidad', 'Observaciones'],
                { ...alimentacion, ...Object.fromEntries(alimentacionCustom.map((item, i) => [`${item.item} (personalizado)`, item])) }
            );

            generateTable('6. EQUIPO DE CAMPO',
                ['Item', 'Cantidad', 'Observaciones'],
                { ...logisticaCampo, ...Object.fromEntries(logisticaCampoCustom.map((item, i) => [`${item.item} (personalizado)`, item])) }
            );

            generateTable('7. LIMPIEZA PERSONAL (CON TOALLAS FEMENINAS)',
                ['Item', 'Cantidad', 'Observaciones'],
                { ...limpiezaPersonal, ...Object.fromEntries(limpiezaPersonalCustom.map((item, i) => [`${item.item} (personalizado)`, item])) }
            );

            generateTable('8. LIMPIEZA GENERAL',
                ['Item', 'Cantidad', 'Observaciones'],
                { ...limpiezaGeneral, ...Object.fromEntries(limpiezaGeneralCustom.map((item, i) => [`${item.item} (personalizado)`, item])) }
            );

            generateTable('9. MEDICAMENTOS',
                ['Item', 'Cantidad', 'Observaciones'],
                { ...medicamentos, ...Object.fromEntries(medicamentosCustom.map((item, i) => [`${item.item} (personalizado)`, item])) }
            );

            generateTable('10. RESCATE ANIMAL',
                ['Item', 'Cantidad', 'Observaciones'],
                { ...rescateAnimal, ...Object.fromEntries(rescateAnimalCustom.map((item, i) => [`${item.item} (personalizado)`, item])) }
            );

            // Pie de página
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('Formulario generado automáticamente por el Sistema de Gestión de Brigadas',
                pageWidth / 2, 290, { align: 'center' });

            // Guardar PDF
            doc.save(`formulario-brigada-${formData.nombre.replace(/\s+/g, '_') || 'sin_nombre'}.pdf`);

            setSubmitStatus({
                success: true,
                message: 'PDF generado correctamente. Descarga completada.'
            });
        } catch (error) {
            console.error('Error al generar PDF:', error);
            setSubmitStatus({
                success: false,
                message: 'Error al generar el PDF: ' + error.message
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // 📝 Renderizar resumen con botones de edición
    const renderSummary = () => {
        const summary = getSummaryData();
        
        return (
            <div className="space-y-8">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-4 leading-tight pb-2">
                        📋 Resumen del Formulario
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-lg">
                        Revisa toda la información antes de finalizar
                    </p>
                </div>

                {/* Información básica */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-amber-800 dark:text-amber-200 flex items-center">
                            <span className="mr-2">ℹ️</span>
                            Información de la Brigada
                        </h3>
                        <button
                            onClick={() => goToSection('info')}
                            className="group text-sm px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-lg transition-all duration-300 font-medium transform hover:scale-105 shadow-lg hover:shadow-amber-500/25"
                        >
                            <div className="flex items-center">
                                <span className="mr-1">✏️</span>
                                <span className="group-hover:mr-1 transition-all duration-300">Clic para editar información</span>
                            </div>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><strong>Brigada:</strong> {summary.informacion.nombre}</div>
                        <div><strong>Bomberos activos:</strong> {summary.informacion.cantidadactivos}</div>
                        <div><strong>Comandante:</strong> {summary.informacion.nombrecomandante}</div>
                        <div><strong>Tel. Comandante:</strong> {summary.informacion.celularcomandante}</div>
                        {summary.informacion.encargadologistica && (
                            <div><strong>Encargado Logística:</strong> {summary.informacion.encargadologistica}</div>
                        )}
                        {summary.informacion.celularlogistica && (
                            <div><strong>Tel. Logística:</strong> {summary.informacion.celularlogistica}</div>
                        )}
                    </div>
                </div>

                {/* Equipamiento */}
                {Object.values(summary.equipamiento.ropa).some(item => 
                    Object.values(item).some(val => typeof val === 'number' && val > 0)
                ) && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200 flex items-center">
                                <span className="mr-2">🦺</span>
                                Equipamiento EPP
                            </h3>
                            <button
                                onClick={() => goToSection('epp')}
                                className="group text-sm px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-lg transition-all duration-300 font-medium transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                            >
                                <div className="flex items-center">
                                    <span className="mr-1">✏️</span>
                                    <span className="group-hover:mr-1 transition-all duration-300">Clic para editar equipamiento</span>
                                </div>
                            </button>
                        </div>
                        <div className="space-y-2 text-sm">
                            {Object.entries(summary.equipamiento.ropa).map(([item, tallas]) => {
                                const totalTallas = Object.entries(tallas).filter(([key, val]) => key !== 'observaciones' && val > 0);
                                if (totalTallas.length > 0) {
                                    return (
                                        <div key={item}>
                                            <strong>{item}:</strong> {totalTallas.map(([talla, cantidad]) => `${talla.toUpperCase()}: ${cantidad}`).join(', ')}
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}

                {/* Herramientas */}
                {Object.values(summary.herramientas.items).some(item => item.cantidad > 0) && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-red-800 dark:text-red-200 flex items-center">
                                <span className="mr-2">🔧</span>
                                Herramientas
                            </h3>
                            <button
                                onClick={() => goToSection('tools')}
                                className="group text-sm px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white rounded-lg transition-all duration-300 font-medium transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
                            >
                                <div className="flex items-center">
                                    <span className="mr-1">✏️</span>
                                    <span className="group-hover:mr-1 transition-all duration-300">Clic para editar herramientas</span>
                                </div>
                            </button>
                        </div>
                        <div className="space-y-1 text-sm">
                            {Object.entries(summary.herramientas.items).map(([item, data]) => {
                                if (data.cantidad > 0) {
                                    return <div key={item}><strong>{item}:</strong> {data.cantidad}</div>;
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}

                {/* Logística */}
                {Object.values(summary.logistica.repuestos).some(item => item.costo > 0) && (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-indigo-800 dark:text-indigo-200 flex items-center">
                                <span className="mr-2">🚛</span>
                                Logística
                            </h3>
                            <button
                                onClick={() => goToSection('logistics')}
                                className="group text-sm px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white rounded-lg transition-all duration-300 font-medium transform hover:scale-105 shadow-lg hover:shadow-indigo-500/25"
                            >
                                <div className="flex items-center">
                                    <span className="mr-1">✏️</span>
                                    <span className="group-hover:mr-1 transition-all duration-300">Clic para editar logística</span>
                                </div>
                            </button>
                        </div>
                        <div className="space-y-1 text-sm">
                            {Object.entries(summary.logistica.repuestos).map(([item, data]) => {
                                if (data.costo > 0) {
                                    return <div key={item}><strong>{item}:</strong> S/. {data.costo}</div>;
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}

                {/* Alimentación */}
                {Object.values(summary.alimentacion.items).some(item => item.cantidad > 0) && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 flex items-center">
                                <span className="mr-2">🍽️</span>
                                Alimentación
                            </h3>
                            <button
                                onClick={() => goToSection('food')}
                                className="group text-sm px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white rounded-lg transition-all duration-300 font-medium transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                            >
                                <div className="flex items-center">
                                    <span className="mr-1">✏️</span>
                                    <span className="group-hover:mr-1 transition-all duration-300">Clic para editar alimentación</span>
                                </div>
                            </button>
                        </div>
                        <div className="space-y-1 text-sm">
                            {Object.entries(summary.alimentacion.items).map(([item, data]) => {
                                if (data.cantidad > 0) {
                                    return <div key={item}><strong>{item}:</strong> {data.cantidad}</div>;
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}

                {/* Equipo de Campo */}
                {Object.values(summary.campo.items).some(item => item.cantidad > 0) && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 flex items-center">
                                <span className="mr-2">⛺</span>
                                Equipo de Campo
                            </h3>
                            <button
                                onClick={() => goToSection('camp')}
                                className="group text-sm px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-lg transition-all duration-300 font-medium transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
                            >
                                <div className="flex items-center">
                                    <span className="mr-1">✏️</span>
                                    <span className="group-hover:mr-1 transition-all duration-300">Clic para editar equipo de campo</span>
                                </div>
                            </button>
                        </div>
                        <div className="space-y-1 text-sm">
                            {Object.entries(summary.campo.items).map(([item, data]) => {
                                if (data.cantidad > 0) {
                                    return <div key={item}><strong>{item}:</strong> {data.cantidad}</div>;
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}

                {/* Limpieza - CON TOALLAS FEMENINAS 🩸 */}
                {(Object.values(summary.limpieza.personal).some(item => item.cantidad > 0) || 
                  Object.values(summary.limpieza.general).some(item => item.cantidad > 0)) && (
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-teal-800 dark:text-teal-200 flex items-center">
                                <span className="mr-2">🧼</span>
                                Limpieza
                            </h3>
                            <button
                                onClick={() => goToSection('hygiene')}
                                className="group text-sm px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg transition-all duration-300 font-medium transform hover:scale-105 shadow-lg hover:shadow-teal-500/25"
                            >
                                <div className="flex items-center">
                                    <span className="mr-1">✏️</span>
                                    <span className="group-hover:mr-1 transition-all duration-300">Clic para editar limpieza</span>
                                </div>
                            </button>
                        </div>
                        <div className="space-y-1 text-sm">
                            {Object.entries(summary.limpieza.personal).map(([item, data]) => {
                                if (data.cantidad > 0) {
                                    return (
                                        <div key={item}>
                                            <strong>{item} (Personal):</strong> {data.cantidad}
                                            {item === 'Toallas Femeninas' && <span className="ml-2 text-pink-500">🩸</span>}
                                        </div>
                                    );
                                }
                                return null;
                            })}
                            {Object.entries(summary.limpieza.general).map(([item, data]) => {
                                if (data.cantidad > 0) {
                                    return <div key={item}><strong>{item} (General):</strong> {data.cantidad}</div>;
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}

                {/* Medicamentos */}
                {Object.values(summary.medicamentos.items).some(item => item.cantidad > 0) && (
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-pink-200 dark:border-pink-800">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-pink-800 dark:text-pink-200 flex items-center">
                                <span className="mr-2">💊</span>
                                Medicamentos
                            </h3>
                            <button
                                onClick={() => goToSection('meds')}
                                className="group text-sm px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-lg transition-all duration-300 font-medium transform hover:scale-105 shadow-lg hover:shadow-pink-500/25"
                            >
                                <div className="flex items-center">
                                    <span className="mr-1">✏️</span>
                                    <span className="group-hover:mr-1 transition-all duration-300">Clic para editar medicamentos</span>
                                </div>
                            </button>
                        </div>
                        <div className="space-y-1 text-sm">
                            {Object.entries(summary.medicamentos.items).map(([item, data]) => {
                                if (data.cantidad > 0) {
                                    return <div key={item}><strong>{item}:</strong> {data.cantidad}</div>;
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}

                {/* Rescate Animal */}
                {Object.values(summary.rescate.animal).some(item => item.cantidad > 0) && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-orange-800 dark:text-orange-200 flex items-center">
                                <span className="mr-2">🐕</span>
                                Rescate Animal
                            </h3>
                            <button
                                onClick={() => goToSection('animals')}
                                className="group text-sm px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-lg transition-all duration-300 font-medium transform hover:scale-105 shadow-lg hover:shadow-orange-500/25"
                            >
                                <div className="flex items-center">
                                    <span className="mr-1">✏️</span>
                                    <span className="group-hover:mr-1 transition-all duration-300">Clic para editar rescate animal</span>
                                </div>
                            </button>
                        </div>
                        <div className="space-y-1 text-sm">
                            {Object.entries(summary.rescate.animal).map(([item, data]) => {
                                if (data.cantidad > 0) {
                                    return <div key={item}><strong>{item}:</strong> {data.cantidad}</div>;
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}

                {/* 📄 BOTÓN DE DESCARGA PDF AL FINAL - ¡ESPECTACULAR! */}
                <div className="flex justify-center pt-8">
                    <button
                        onClick={generatePDF}
                        disabled={isGeneratingPDF}
                        className="group relative bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:via-yellow-400 hover:to-orange-400 text-white font-bold px-6 sm:px-12 py-4 sm:py-6 rounded-xl sm:rounded-2xl transition-all duration-700 transform hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg sm:text-xl border-2 border-amber-300 hover:border-amber-200"

                        style={{
                            background: isGeneratingPDF ? '#9ca3af' : 'linear-gradient(135deg, #f59e0b, #fbbf24, #f97316)',
                            boxShadow: '0 0 40px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                            animation: isGeneratingPDF ? 'none' : 'pulse 3s infinite'
                        }}
                    >
                        {/* Efecto de brillo animado */}
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                             style={{
                                background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
                                animation: 'shimmer 2s infinite'
                            }}></div>
                        
                        <div className="relative z-10">
                            {isGeneratingPDF ? (
                                <div className="flex items-center">
                                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mr-4"></div>
                                    <span className="animate-pulse text-lg">Generando PDF...</span>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <span className="mr-4 text-4xl animate-bounce">📄</span>
                                    <div className="text-left">
                                        <div className="group-hover:mr-2 transition-all duration-300 text-2xl font-bold">
                                            Descargar PDF Completo
                                        </div>
                                        <div className="text-sm opacity-90 font-medium">
                                            Formulario con todas las selecciones
                                        </div>
                                    </div>
                                    <span className="ml-4 text-3xl transform group-hover:translate-x-2 group-hover:scale-125 transition-all duration-500">⬇️</span>
                                </div>
                            )}
                        </div>
                    </button>
                </div>
            </div>
        );
    };

    // Renderizar navegación con indicador de progreso mejorado
    const renderNavigation = () => {
        const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
        const isLastSection = currentIndex === SECTIONS.length - 1;
        const progress = ((currentIndex + 1) / SECTIONS.length) * 100;

        return (
            <div className="mt-8 space-y-6">
                {/* Barra de progreso mejorada */}
                <div className="w-full">
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <span>Progreso</span>
                        <span>{Math.round(progress)}% completado</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="h-full bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* CAMBIO PRINCIPAL: Usar flex-row siempre en lugar de flex-col md:flex-row */}
                <div className="flex flex-row justify-between items-center gap-2">
                    {/* Botón Anterior (izquierda) */}
                    <button
                        type="button"
                        onClick={() => {
                            if (currentIndex > 0) {
                                setActiveSection(SECTIONS[currentIndex - 1].id);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                        disabled={currentIndex === 0}
                        className={`group flex items-center justify-center px-3 sm:px-6 py-3 h-12 rounded-xl transition-all duration-300 ${
                            currentIndex === 0
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105'
                        }`}
                        aria-label="Anterior"
                    >
                        <div className="flex items-center justify-center gap-1">
                            <svg className="h-5 w-5 text-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M9 6l6 6-6 6" transform="rotate(180 12 12)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="hidden sm:inline">Anterior</span>
                        </div>
                    </button>

                    {/* Mensaje de estado (centro) - Solo visible en pantallas grandes */}
                    {submitStatus.message && !submitStatus.isFinal && (
                        <div className={`hidden md:flex px-4 py-3 rounded-xl font-medium ${
                            submitStatus.success 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                        } animate-pulse`}>
                            {submitStatus.message}
                        </div>
                    )}

                    {/* Botón Siguiente/Finalizar (derecha) */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`group flex items-center justify-center px-3 sm:px-6 py-3 h-12 rounded-xl text-white transition-all duration-300 ${
                            isSubmitting
                                ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 hover:shadow-lg hover:shadow-amber-500/25'
                        }`}
                        aria-label={isLastSection ? 'Finalizar' : 'Siguiente'}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center gap-1">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="hidden sm:inline">{isLastSection ? 'Finalizando...' : 'Guardando...'}</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-1">
                                <span className="hidden sm:inline">{isLastSection ? 'Finalizar' : 'Siguiente'}</span>
                                <svg className="h-5 w-5 text-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        )}
                    </button>
                </div>

                {/* Mensaje de estado para móvil - Debajo de los botones */}
                {submitStatus.message && !submitStatus.isFinal && (
                    <div className={`md:hidden px-4 py-3 rounded-xl font-medium text-center ${
                        submitStatus.success 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                    } animate-pulse`}>
                        {submitStatus.message}
                    </div>
                )}
            </div>
        );
    };


    // Estilos dinámicos para modo oscuro con colores amarillos
    const bgColor = darkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-amber-50 via-white to-orange-50';
    const textColor = darkMode ? 'text-slate-100' : 'text-slate-800';
    const cardBg = darkMode ? 'bg-slate-800/80 backdrop-blur-xl border-amber-500/20' : 'bg-white/80 backdrop-blur-xl border-amber-200/50';
    const borderColor = darkMode ? 'border-slate-700' : 'border-amber-200';
    const inputStyle = `w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
        darkMode
            ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500'
            : 'bg-white/70 border-amber-300 text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-amber-400 focus:border-amber-400'
    } focus:outline-none`;

    return (
        <div className={`min-h-screen ${bgColor} ${textColor} relative overflow-hidden`}>
         {onBack && (
            <button
             onClick={onBack}
             className="fixed top-4 left-4 z-50 p-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg text-slate-900 hover:scale-110 transition-all duration-300"
             aria-label="Volver"
             title="Volver al inicio"
             type="button"
            >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
             </svg>
            </button>
    )}

            {/* Elementos decorativos de fondo */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-20 left-20 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            {/* Logo en la parte superior */}
            <div className="relative w-full py-6 flex justify-center">
                <div className="group relative">
                    <div className="w-32 h-16 bg-white/95 rounded-xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-all duration-500">
                        <img 
                            src="/path/to/your/logo.png" 
                            alt="Logo de la empresa" 
                            className="max-w-full max-h-full object-contain"
                        />
                        <span className="text-slate-700 font-bold text-base tracking-wide">LOGO</span>
                    </div>
                </div>
            </div>

            {/* Botón de modo oscuro flotante mejorado */}
            <button
                onClick={toggleDarkMode}
                className={`fixed top-6 right-6 z-50 p-3 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 ${
                    darkMode
                        ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 hover:from-amber-300 hover:to-orange-300'
                        : 'bg-gradient-to-r from-slate-800 to-slate-900 text-amber-400 hover:from-slate-700 hover:to-slate-800'
                }`}
                aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
                <div className="text-2xl">
                    {darkMode ? '☀️' : '🌙'}
                </div>
            </button>

            {/* Contenido principal */}
            <div className="relative max-w-7xl mx-auto px-6 py-8">
                <form
                    onSubmit={handleSubmit}
                    className={`rounded-2xl shadow-2xl overflow-hidden ${cardBg} border`}
                    ref={formRef}
                >
                    {/* Header con gradiente dinámico mejorado */}
                    <div
                        className="relative py-8 px-8 text-white overflow-hidden"
                        style={{
                            background: `linear-gradient(135deg, ${currentColors.primary}, ${currentColors.hover})`
                        }}
                    >
                        {/* Elementos decorativos del header */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                        </div>

                        <div className="relative flex flex-col md:flex-row items-center justify-between">
                            <div className="flex items-center mb-4 md:mb-0">
                                {/* Botón de regresar mejorado */}
                                {onBack && (
                                    <button 
                                        onClick={onBack}
                                        className="absolute top-4 left-4 p-3 rounded-full hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
                                        title="Volver atrás"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                    </button>
                                )}

                                <div className="bg-white/20 p-4 rounded-full mr-6 backdrop-blur-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="white">
                                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Formulario de Necesidades</h1>
                                    <p className="opacity-90 text-lg">Cuerpo de Bomberos Voluntarios</p>
                                </div>
                            </div>
                            <div className="bg-white/20 px-6 py-3 rounded-xl backdrop-blur-sm">
                                <p className="text-sm font-medium">Sección: <span className="font-bold text-lg">{
                                    SECTIONS.find(s => s.id === activeSection)?.name || 'Desconocida'
                                }</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Navegación entre secciones mejorada */}
                    <div className={`px-6 py-4 border-b ${
                        darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-amber-50/50 border-amber-200'
                    }`}>
                        <div className="flex overflow-x-auto pb-2 space-x-3 scrollbar-hide">
                            {SECTIONS.map((section, index) => {
                                const sectionColors = SECTION_COLORS[index] || SECTION_COLORS[0];
                                return (
                                    <button
                                        key={section.id}
                                        type="button"
                                        onClick={() => goToSection(section.id)}
                                        className={`px-6 py-3 rounded-xl whitespace-nowrap text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                                            activeSection === section.id
                                                ? 'text-white shadow-lg scale-105'
                                                : `${
                                                    darkMode 
                                                        ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600 border border-slate-600' 
                                                        : 'bg-white/70 text-slate-700 hover:bg-white border border-amber-200 hover:border-amber-300'
                                                }`
                                        }`}
                                        style={{
                                            backgroundColor: activeSection === section.id ? sectionColors.primary : '',
                                            backgroundImage: activeSection === section.id ? `linear-gradient(135deg, ${sectionColors.primary}, ${sectionColors.hover})` : ''
                                        }}
                                    >
                                        {section.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Contenido principal del formulario */}
                    <div className="p-4 sm:p-8"
>
                        {/* Mostrar resumen si está finalizado */}
                        {submitStatus.isFinal && activeSection === 'summary' ? (
                            <>
                                <div className={`mb-8 rounded-xl p-6 border-2 ${
                                    submitStatus.success
                                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-300 dark:border-emerald-700'
                                        : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-300 dark:border-red-700'
                                } animate-pulse`}>
                                    <div className="flex items-center space-x-4">
                                        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                                            submitStatus.success ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                        }`}>
                                            {submitStatus.success ? '✓' : '✗'}
                                        </div>
                                        <div>
                                            <p className={`font-bold text-xl ${
                                                submitStatus.success
                                                    ? 'text-emerald-800 dark:text-emerald-200'
                                                    : 'text-red-800 dark:text-red-200'
                                            }`}>
                                                {submitStatus.success ? '¡Formulario completado exitosamente!' : 'Error al procesar'}
                                            </p>
                                            <p className={`text-sm ${
                                                submitStatus.success
                                                    ? 'text-emerald-700 dark:text-emerald-300'
                                                    : 'text-red-700 dark:text-red-300'
                                            }`}>
                                                {submitStatus.message}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 ml-auto">
                                            <button
                                                type="button"
                                                onClick={() => window.location.reload()}
                                                className={`rounded-md border px-3 py-1 text-sm font-medium ${
                                                    darkMode
                                                        ? 'border-green-500 text-green-400 hover:bg-green-900'
                                                        : 'border-green-700 text-green-800 hover:bg-green-100'
                                                }`}
                                            >
                                                Nuevo Formulario
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {renderSummary()}
                            </>
                        ) : (
                            <>
                                {/* 🔥 TODAS LAS SECCIONES COMPLETAS CON CUSTOM ITEMS */}
                                {/* Sección de Información */}
                                {activeSection === 'info' && (
                                    <div className="space-y-8">
                                        <div className="text-center mb-8">
                                            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
                                                Información Básica de la Brigada
                                            </h2>
                                            <p className="text-slate-600 dark:text-slate-300 text-lg">
                                                Datos fundamentales de identificación y contacto
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Campo Nombre */}
                                            <div className="space-y-2">
                                                <label className={`block text-sm font-bold ${textColor}`}>
                                                    Nombre de la Brigada <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="nombre"
                                                    value={formData.nombre}
                                                    onChange={handleInputChange}
                                                    className={`${inputStyle} ${
                                                        formErrors.nombre ? 'border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                    placeholder="Ej: Brigada San Martín"
                                                    required
                                                />
                                                {formErrors.nombre && (
                                                    <p className="text-sm text-red-500 font-medium">{formErrors.nombre}</p>
                                                )}
                                            </div>

                                            {/* Campo Cantidad de Bomberos */}
                                            <div className="space-y-2">
                                                <label className={`block text-sm font-bold ${textColor}`}>
                                                    Bomberos Activos <span className="text-red-500">*</span>
                                                </label>
                                                <NumberInput
                                                    value={formData.cantidadactivos}
                                                    onChange={(value) => setFormData(prev => ({
                                                        ...prev,
                                                        cantidadactivos: Math.max(1, value)
                                                    }))}
                                                    min={1}
                                                    darkMode={darkMode}
                                                    className="w-full"
                                                />
                                                {formErrors.cantidadactivos && (
                                                    <p className="text-sm text-red-500 font-medium">{formErrors.cantidadactivos}</p>
                                                )}
                                                <p className={`text-xs ${
                                                    darkMode ? 'text-slate-400' : 'text-slate-500'
                                                }`}>
                                                    Mínimo 1 bombero activo
                                                </p>
                                            </div>

                                            {/* Resto de campos... */}
                                            <div className="space-y-2">
                                                <label className={`block text-sm font-bold ${textColor}`}>
                                                    Comandante <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="nombrecomandante"
                                                    value={formData.nombrecomandante}
                                                    onChange={handleInputChange}
                                                    className={`${inputStyle} ${
                                                        formErrors.nombrecomandante ? 'border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                    placeholder="Nombre completo del comandante"
                                                    required
                                                />
                                                {formErrors.nombrecomandante && (
                                                    <p className="text-sm text-red-500 font-medium">{formErrors.nombrecomandante}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className={`block text-sm font-bold ${textColor}`}>
                                                    Teléfono Comandante <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="celularcomandante"
                                                    value={formData.celularcomandante}
                                                    onChange={handleInputChange}
                                                    className={`${inputStyle} ${
                                                        formErrors.celularcomandante ? 'border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                    placeholder="Ej: 987654321"
                                                    maxLength={8}
                                                    required
                                                />
                                                {formErrors.celularcomandante && (
                                                    <p className="text-sm text-red-500 font-medium">{formErrors.celularcomandante}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className={`block text-sm font-bold ${textColor}`}>
                                                    Encargado de Logística
                                                </label>
                                                <input
                                                    type="text"
                                                    name="encargadologistica"
                                                    value={formData.encargadologistica}
                                                    onChange={handleInputChange}
                                                    className={inputStyle}
                                                    placeholder="Nombre completo del encargado"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className={`block text-sm font-bold ${textColor}`}>
                                                    Teléfono Logística
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="celularlogistica"
                                                    value={formData.celularlogistica}
                                                    onChange={handleInputChange}
                                                    className={`${inputStyle} ${
                                                        formErrors.celularlogistica ? 'border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                    placeholder="Ej: 987654321"
                                                    maxLength={8}
                                                />
                                                {formErrors.celularlogistica && (
                                                    <p className="text-sm text-red-500 font-medium">{formErrors.celularlogistica}</p>
                                                )}
                                            </div>

                                            <div className="md:col-span-2 space-y-2">
                                                <label className={`block text-sm font-bold ${textColor}`}>
                                                    Números de Emergencia (Opcional)
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="numerosemergencia"
                                                    value={formData.numerosemergencia}
                                                    onChange={handleInputChange}
                                                    className={inputStyle}
                                                    placeholder="Ej: 12345678, 87654321"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* EQUIPAMIENTO EPP CON TODAS LAS FUNCIONES CUSTOM - INCLUYENDO TODAS LAS CARACTERÍSTICAS QUE FALTABAN */}
                                {activeSection === 'epp' && (
                                    <div className="space-y-10">
                                        {/* EPP - Ropa */}
                                        <div className="space-y-6">
                                            <h2 className={`text-lg font-semibold border-l-4 pl-3 py-1 ${
                                                darkMode ? 'border-purple-400' : 'border-purple-600'
                                            }`}>EPP - Ropa</h2>
                                            
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Artículo</th>
                                                            <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">XS</th>
                                                            <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">S</th>
                                                            <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">M</th>
                                                            <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">L</th>
                                                            <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">XL</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Observaciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className={`${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                                                        {EPP_ROPA_ITEMS.map((itemNombre, rowIndex) => (
                                                            <tr key={itemNombre} className={rowIndex % 2 === 1 ? (darkMode ? 'bg-gray-800' : 'bg-gray-50') : ''}>
                                                                <td className="px-4 py-3 text-sm font-medium">{itemNombre}</td>
                                                                {['xs','s','m','l','xl'].map(sizeKey => (
                                                                    <td key={sizeKey} className="px-4 py-3">
                                                                        <NumberInput
                                                                            value={eppRopa[itemNombre][sizeKey]}
                                                                            onChange={(value) => handleEppRopaSizeChange(itemNombre, sizeKey, value)}
                                                                            min="0"
                                                                            darkMode={darkMode}
                                                                            className="mx-auto"
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="text"
                                                                        className={`w-full px-2 py-1 border rounded ${
                                                                            darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                                        }`}
                                                                        placeholder="Notas"
                                                                        value={eppRopa[itemNombre].observaciones}
                                                                        maxLength={400}
                                                                        onChange={(e) => handleEppRopaObsChange(itemNombre, e.target.value)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* EPP Ropa - Otros */}
                                            <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h3 className="font-semibold">Ropa - Otros</h3>
                                                    <button
                                                        type="button"
                                                        className={`rounded-md border px-3 py-1 text-sm ${
                                                            darkMode
                                                                ? 'border-gray-300 text-gray-300 hover:bg-gray-700'
                                                                : 'border-gray-700 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                        onClick={() => setEppRopaCustom(prev => [...prev, { item: '', xs:0, s:0, m:0, l:0, xl:0, observaciones:'' }])}
                                                    >
                                                        Añadir otro
                                                    </button>
                                                </div>
                                                {eppRopaCustom.length === 0 ? (
                                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay prendas personalizadas aún.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {eppRopaCustom.map((row, idx) => (
                                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-8 gap-3 items-center">
                                                                <input
                                                                    type="text"
                                                                    className={`px-2 py-1 border rounded ${
                                                                        darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                                    }`}
                                                                    placeholder="Prenda"
                                                                    value={row.item}
                                                                    onChange={(e) => setEppRopaCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))}
                                                                />
                                                                {['xs','s','m','l','xl'].map(sizeKey => (
                                                                    <NumberInput
                                                                        key={sizeKey}
                                                                        value={row[sizeKey]}
                                                                        onChange={(value) => setEppRopaCustom(prev => prev.map((r,i)=> i===idx ? { ...r, [sizeKey]: value } : r))}
                                                                        min="0"
                                                                        darkMode={darkMode}
                                                                    />
                                                                ))}
                                                                <input
                                                                    type="text"
                                                                    className={`px-2 py-1 border rounded col-span-1 ${
                                                                        darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                                    }`}
                                                                    placeholder="Observaciones"
                                                                    value={row.observaciones}
                                                                    onChange={(e) => setEppRopaCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className={`justify-self-end rounded-md border px-3 py-1 text-sm ${
                                                                        darkMode
                                                                            ? 'border-red-500 text-red-400 hover:bg-red-900'
                                                                            : 'border-red-700 text-red-700 hover:bg-red-100'
                                                                    }`}
                                                                    onClick={() => setEppRopaCustom(prev => prev.filter((_,i)=> i!==idx))}
                                                                >
                                                                    Quitar
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* EPP - Botas */}
                                        <div className="space-y-6">
                                            <h2 className={`text-lg font-semibold border-l-4 pl-3 py-1 ${
                                                darkMode ? 'border-purple-400' : 'border-purple-600'
                                            }`}>EPP - Botas</h2>
                                            <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    {['37','38','39','40','41','42','43'].map(size => (
                                                        <div key={size} className="flex flex-col items-center space-y-2">
                                                            <label className="text-sm font-medium">Talla {size}</label>
                                                            <NumberInput
                                                                value={botas[size]}
                                                                onChange={(value) => handleBotasChange(size, value)}
                                                                min="0"
                                                                darkMode={darkMode}
                                                            />
                                                        </div>
                                                    ))}
                                                    <div className="flex flex-col items-center space-y-2">
                                                        <label className="text-sm font-medium">Otra</label>
                                                        <NumberInput
                                                            value={botas.otra}
                                                            onChange={(value) => handleBotasChange('otra', value)}
                                                            min="0"
                                                            darkMode={darkMode}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        className={`px-3 py-2 border rounded ${
                                                            darkMode ? 'bg-gray-700 border-gray-600' : 'border-amber-300 bg-white'
                                                        }`}
                                                        placeholder="Especificar otra talla"
                                                        value={botas.otratalla}
                                                        onChange={(e) => handleBotasOtraTallaText(e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        className={`px-3 py-2 border rounded ${
                                                            darkMode ? 'bg-gray-700 border-gray-600' : 'border-amber-300 bg-white'
                                                        }`}
                                                        placeholder="Observaciones"
                                                        value={botas.observaciones}
                                                        onChange={(e) => handleBotasObsChange(e.target.value)}
                                                        maxLength={400}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* EPP - Guantes */}
                                        <div className="space-y-6">
                                            <h2 className={`text-lg font-semibold border-l-4 pl-3 py-1 ${
                                                darkMode ? 'border-purple-400' : 'border-purple-600'
                                            }`}>EPP - Guantes</h2>
                                            <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                                                        <div key={size} className="flex flex-col items-center space-y-2">
                                                            <label className="text-sm font-medium">{size}</label>
                                                            <NumberInput
                                                                value={guantes[size]}
                                                                onChange={(value) => handleGuantesChange(size, value)}
                                                                min="0"
                                                                darkMode={darkMode}
                                                            />
                                                        </div>
                                                    ))}
                                                    <div className="flex flex-col items-center space-y-2">
                                                        <label className="text-sm font-medium">Otra</label>
                                                        <NumberInput
                                                            value={guantes.otra}
                                                            onChange={(value) => handleGuantesChange('otra', value)}
                                                            min="0"
                                                            darkMode={darkMode}
                                                        />
                                                    </div>
                                                </div>
                                                <input
                                                    type="text"
                                                    className={`w-full px-3 py-2 border rounded ${
                                                        darkMode ? 'bg-gray-700 border-gray-600' : 'border-amber-300 bg-white'
                                                    }`}
                                                    placeholder="Especificar otra talla"
                                                    value={guantes.otratalla}
                                                    onChange={(e) => handleGuantesOtraTallaText(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* EPP - Equipo con Custom */}
                                        <div className="space-y-6">
                                            <h2 className={`text-lg font-semibold border-l-4 pl-3 py-1 ${
                                                darkMode ? 'border-purple-400' : 'border-purple-600'
                                            }`}>EPP - Equipo</h2>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6"
>
                                                {EPP_EQUIPO_ITEMS.map(item => (
                                                    <div key={item} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${cardBg} p-3 sm:p-4 rounded-lg border ${borderColor} space-y-2 sm:space-y-0`}
>
                                                        <label className="text-sm font-medium">{item}</label>
                                                        <div className="flex items-center space-x-2">
                                                            <NumberInput
                                                                value={eppEquipo[item].cantidad}
                                                                onChange={(value) => handleListQuantityChange(setEppEquipo)(item, value)}
                                                                min="0"
                                                                darkMode={darkMode}
                                                            />
                                                            <input
                                                                type="text"
                                                                className={`w-full sm:w-40 px-2 py-1 border rounded text-sm ${
                                                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-amber-300 bg-white'
                                                                }`}
                                                                placeholder="Observaciones"
                                                                value={eppEquipo[item].observaciones}
                                                                onChange={(e) => handleListObsChange(setEppEquipo)(item, e.target.value)}
                                                                maxLength={400}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* EPP Equipo - Otros */}
                                            <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h3 className="font-semibold">Otros</h3>
                                                    <button
                                                        type="button"
                                                        className={`rounded-md border px-3 py-1 text-sm ${
                                                            darkMode
                                                                ? 'border-gray-300 text-gray-300 hover:bg-gray-700'
                                                                : 'border-gray-700 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                        onClick={() => setEppEquipoCustom(prev => [...prev, { item: '', cantidad: 0, observaciones: '' }])}
                                                    >
                                                        Añadir otro
                                                    </button>
                                                </div>
                                                {eppEquipoCustom.length === 0 ? (
                                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay ítems personalizados aún.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {eppEquipoCustom.map((row, idx) => (
                                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                                <input
                                                                    type="text"
                                                                    className={`px-2 py-1 border rounded ${
                                                                        darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                                    }`}
                                                                    placeholder="Nombre del ítem"
                                                                    value={row.item}
                                                                    onChange={(e) => setEppEquipoCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))}
                                                                />
                                                                <NumberInput
                                                                    value={row.cantidad}
                                                                    onChange={(value) => setEppEquipoCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))}
                                                                    min="0"
                                                                    darkMode={darkMode}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    className={`px-2 py-1 border rounded col-span-1 ${
                                                                        darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                                    }`}
                                                                    placeholder="Observaciones"
                                                                    value={row.observaciones}
                                                                    onChange={(e) => setEppEquipoCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className={`justify-self-end rounded-md border px-3 py-1 text-sm ${
                                                                        darkMode
                                                                            ? 'border-red-500 text-red-400 hover:bg-red-900'
                                                                            : 'border-red-700 text-red-700 hover:bg-red-100'
                                                                    }`}
                                                                    onClick={() => setEppEquipoCustom(prev => prev.filter((_,i)=> i!==idx))}
                                                                >
                                                                    Quitar
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
{/* Sección de Herramientas CON CUSTOM */}
{activeSection === 'tools' && (
    <div className="space-y-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-4">
                Herramientas
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
                Equipos y herramientas necesarios para las operaciones
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6"
>
            {HERRAMIENTAS_ITEMS.map(item => (
                <div key={item} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${cardBg} p-3 sm:p-4 rounded-lg border ${borderColor} space-y-2 sm:space-y-0`}
>
                    <label className="text-sm font-medium">{item}</label>
                    <div className="flex items-center space-x-2">
                        <NumberInput
                            value={herramientas[item].cantidad}
                            onChange={(value) => handleListQuantityChange(setHerramientas)(item, value)}
                            min="0"
                            darkMode={darkMode}
                        />
                        <input
                            type="text"
                            className={`w-full sm:w-40 px-2 py-1 border rounded text-sm ${
                                darkMode ? 'bg-gray-700 border-gray-600' : 'border-amber-300 bg-white'
                            }`}
                            placeholder="Observaciones"
                            value={herramientas[item].observaciones}
                            onChange={(e) => handleListObsChange(setHerramientas)(item, e.target.value)}
                            maxLength={400}
                        />
                    </div>
                </div>
            ))}
        </div>

        {/* Herramientas - Otros */}
        <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Otros</h3>
                <button
                    type="button"
                    className={`rounded-md border px-3 py-1 text-sm ${
                        darkMode
                            ? 'border-gray-300 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-700 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setHerramientasCustom(prev => [...prev, { item: '', cantidad: 0, observaciones: '' }])}
                >
                    Añadir otro
                </button>
            </div>
            {herramientasCustom.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay ítems personalizados aún.</p>
            ) : (
                <div className="space-y-3">
                    {herramientasCustom.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                            <input
                                type="text"
                                className={`px-2 py-1 border rounded ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                }`}
                                placeholder="Nombre"
                                value={row.item}
                                onChange={(e)=> setHerramientasCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))}
                            />
                            <NumberInput
                                value={row.cantidad}
                                onChange={(value) => setHerramientasCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))}
                                min="0"
                                darkMode={darkMode}
                            />
                            <input
                                type="text"
                                className={`px-2 py-1 border rounded col-span-1 ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                }`}
                                placeholder="Observaciones"
                                value={row.observaciones}
                                onChange={(e)=> setHerramientasCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))}
                            />
                            <button
                                type="button"
                                className={`justify-self-end rounded-md border px-3 py-1 text-sm ${
                                    darkMode
                                        ? 'border-red-500 text-red-400 hover:bg-red-900'
                                        : 'border-red-700 text-red-700 hover:bg-red-100'
                                }`}
                                onClick={()=> setHerramientasCustom(prev => prev.filter((_,i)=> i!==idx))}
                            >
                                Quitar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
)}

{/* Sección de Logística CON CUSTOM */}
{activeSection === 'logistics' && (
    <div className="space-y-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-4">
                Logística
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
                Repuestos y mantenimiento necesario
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6"
>
            {LOGISTICA_REPUESTOS_ITEMS.map(item => (
                <div key={item} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${cardBg} p-3 sm:p-4 rounded-lg border ${borderColor} space-y-2 sm:space-y-0`}>
                    <label className="text-sm font-medium">{item}</label>
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                            <span className="mr-1">S/.</span>
                            <NumberInput
                                value={logisticaRepuestos[item].costo}
                                onChange={(value) => handleListCostChange(setLogisticaRepuestos)(item, value)}
                                min="0"
                                darkMode={darkMode}
                            />
                        </div>
                        <input
                            type="text"
                            className={`w-full sm:w-40 px-2 py-1 border rounded text-sm ${
                                darkMode ? 'bg-gray-700 border-gray-600' : 'border-amber-300 bg-white'
                            }`}
                            placeholder="Observaciones"
                            value={logisticaRepuestos[item].observaciones}
                            maxLength={400}
                            onChange={(e) => handleListObsChange(setLogisticaRepuestos)(item, e.target.value)}
                        />
                    </div>
                </div>
            ))}
        </div>

        {/* Logística - Otros */}
        <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Otros</h3>
                <button
                    type="button"
                    className={`rounded-md border px-3 py-1 text-sm ${
                        darkMode
                            ? 'border-gray-300 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-700 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setLogisticaRepuestosCustom(prev => [...prev, { item:'', costo:0, observaciones:'' }])}
                >
                    Añadir otro
                </button>
            </div>
            {logisticaRepuestosCustom.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay ítems personalizados aún.</p>
            ) : (
                <div className="space-y-3">
                    {logisticaRepuestosCustom.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                            <input
                                type="text"
                                className={`px-2 py-1 border rounded ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                }`}
                                placeholder="Nombre"
                                value={row.item}
                                onChange={(e)=> setLogisticaRepuestosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))}
                            />
                            <div className="flex items-center">
                                <span className="mr-1">S/.</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={`px-2 py-1 border rounded ${
                                        darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                    }`}
                                    placeholder="Costo"
                                    value={row.costo}
                                    onChange={(e)=> setLogisticaRepuestosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, costo: Number(e.target.value)||0 } : r))}
                                />
                            </div>
                            <input
                                type="text"
                                className={`px-2 py-1 border rounded col-span-1 ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                }`}
                                placeholder="Observaciones"
                                value={row.observaciones}
                                onChange={(e)=> setLogisticaRepuestosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))}
                            />
                            <button
                                type="button"
                                className={`justify-self-end rounded-md border px-3 py-1 text-sm ${
                                    darkMode
                                        ? 'border-red-500 text-red-400 hover:bg-red-900'
                                        : 'border-red-700 text-red-700 hover:bg-red-100'
                                }`}
                                onClick={()=> setLogisticaRepuestosCustom(prev => prev.filter((_,i)=> i!==idx))}
                            >
                                Quitar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
)}

{/* Sección de Alimentación CON CUSTOM */}
{activeSection === 'food' && (
    <div className="space-y-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
                Alimentación
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
                Alimentos y bebidas necesarios para la brigada
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6"
>
            {ALIMENTACION_ITEMS.map(item => (
                <div key={item} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${cardBg} p-3 sm:p-4 rounded-lg border ${borderColor} space-y-2 sm:space-y-0`}
>
                    <label className="text-sm font-medium">{item}</label>
                    <div className="flex items-center space-x-2">
                        <NumberInput
                            value={alimentacion[item].cantidad}
                            onChange={(value) => handleListQuantityChange(setAlimentacion)(item, value)}
                            min="0"
                            darkMode={darkMode}
                        />
                        <input
                            type="text"
                            className={`w-full sm:w-40 px-2 py-1 border rounded text-sm ${
                                darkMode ? 'bg-gray-700 border-gray-600' : 'border-amber-300 bg-white'
                            }`}
                            placeholder="Observaciones"
                            value={alimentacion[item].observaciones}
                            onChange={(e) => handleListObsChange(setAlimentacion)(item, e.target.value)}
                            maxLength={400}
                        />
                    </div>
                </div>
            ))}
        </div>

        {/* Alimentación - Otros */}
        <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Otros</h3>
                <button
                    type="button"
                    className={`rounded-md border px-3 py-1 text-sm ${
                        darkMode
                            ? 'border-gray-300 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-700 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setAlimentacionCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}
                >
                    Añadir otro
                </button>
            </div>
            {alimentacionCustom.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay ítems personalizados aún.</p>
            ) : (
                <div className="space-y-3">
                    {alimentacionCustom.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                            <input
                                type="text"
                                className={`px-2 py-1 border rounded ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                }`}
                                placeholder="Nombre"
                                value={row.item}
                                onChange={(e)=> setAlimentacionCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))}
                            />
                            <NumberInput
                                value={row.cantidad}
                                onChange={(value) => setAlimentacionCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))}
                                min="0"
                                darkMode={darkMode}
                            />
                            <input
                                type="text"
                                className={`px-2 py-1 border rounded col-span-1 ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                }`}
                                placeholder="Observaciones"
                                value={row.observaciones}
                                onChange={(e)=> setAlimentacionCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))}
                            />
                            <button
                                type="button"
                                className={`justify-self-end rounded-md border px-3 py-1 text-sm ${
                                    darkMode
                                        ? 'border-red-500 text-red-400 hover:bg-red-900'
                                        : 'border-red-700 text-red-700 hover:bg-red-100'
                                }`}
                                onClick={()=> setAlimentacionCustom(prev => prev.filter((_,i)=> i!==idx))}
                            >
                                Quitar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
)}

{/* Sección de Equipo de Campo CON CUSTOM */}
{activeSection === 'camp' && (
    <div className="space-y-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
                Equipo de Campo
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
                Equipos necesarios para operaciones en terreno
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6"
>
            {CAMPO_ITEMS.map(item => (
                <div key={item} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${cardBg} p-3 sm:p-4 rounded-lg border ${borderColor} space-y-2 sm:space-y-0`}>
                    <label className="text-sm font-medium">{item}</label>
                    <div className="flex items-center space-x-2">
                        <NumberInput
                            value={logisticaCampo[item].cantidad}
                            onChange={(value) => handleListQuantityChange(setLogisticaCampo)(item, value)}
                            min="0"
                            darkMode={darkMode}
                        />
                        <input
                            type="text"
                            className={`w-full sm:w-40 px-2 py-1 border rounded text-sm ${
                                darkMode ? 'bg-gray-700 border-gray-600' : 'border-amber-300 bg-white'
                            }`}
                            placeholder="Observaciones"
                            value={logisticaCampo[item].observaciones}
                            onChange={(e) => handleListObsChange(setLogisticaCampo)(item, e.target.value)}
                            maxLength={400}
                        />
                    </div>
                </div>
            ))}
        </div>

        {/* Campo - Otros */}
        <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Otros</h3>
                <button
                    type="button"
                    className={`rounded-md border px-3 py-1 text-sm ${
                        darkMode
                            ? 'border-gray-300 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-700 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setLogisticaCampoCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}
                >
                    Añadir otro
                </button>
            </div>
            {logisticaCampoCustom.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay ítems personalizados aún.</p>
            ) : (
                <div className="space-y-3">
                    {logisticaCampoCustom.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                            <input
                                type="text"
                                className={`px-2 py-1 border rounded ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                }`}
                                placeholder="Nombre"
                                value={row.item}
                                onChange={(e)=> setLogisticaCampoCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))}
                            />
                            <NumberInput
                                value={row.cantidad}
                                onChange={(value) => setLogisticaCampoCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))}
                                min="0"
                                darkMode={darkMode}
                            />
                            <input
                                type="text"
                                className={`px-2 py-1 border rounded col-span-1 ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                }`}
                                placeholder="Observaciones"
                                value={row.observaciones}
                                onChange={(e)=> setLogisticaCampoCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))}
                            />
                            <button
                                type="button"
                                className={`justify-self-end rounded-md border px-3 py-1 text-sm ${
                                    darkMode
                                        ? 'border-red-500 text-red-400 hover:bg-red-900'
                                        : 'border-red-700 text-red-700 hover:bg-red-100'
                                }`}
                                onClick={()=> setLogisticaCampoCustom(prev => prev.filter((_,i)=> i!==idx))}
                            >
                                Quitar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
)}

{/* Sección Limpieza CON TOALLAS FEMENINAS Y CUSTOM */}
{activeSection === 'hygiene' && (
    <div className="space-y-10">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">
                Limpieza e Higiene
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
                Productos de limpieza personal y general
            </p>
        </div>

        {/* Limpieza Personal */}
        <div className="space-y-6">
            <h3 className={`text-xl font-semibold border-l-4 pl-3 py-1 ${
                darkMode ? 'border-teal-400' : 'border-teal-600'
            }`}>Limpieza Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6"
>
                {LIMPIEZA_PERSONAL_ITEMS.map(item => (
                    <div key={item} className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:shadow-lg ${
                        item === 'Toallas Femeninas' 
                            ? 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-pink-200 dark:border-pink-800'
                            : `${cardBg} ${borderColor}`
                    }`}>
                        <label className={`text-sm font-medium ${
                            item === 'Toallas Femeninas' ? 'text-pink-800 dark:text-pink-200 font-bold' : ''
                        }`}>
                            {item}
                            {item === 'Toallas Femeninas' && <span className="ml-2">🩸</span>}
                        </label>
                        <div className="flex items-center space-x-2">
                            <NumberInput
                                value={limpiezaPersonal[item].cantidad}
                                onChange={(value) => handleListQuantityChange(setLimpiezaPersonal)(item, value)}
                                min="0"
                                darkMode={darkMode}
                            />
                            <input
                                type="text"
                                className={`w-40 px-2 py-1 border rounded text-sm ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-amber-300 bg-white'
                                }`}
                                placeholder="Observaciones"
                                value={limpiezaPersonal[item].observaciones}
                                maxLength={400}
                                onChange={(e) => handleListObsChange(setLimpiezaPersonal)(item, e.target.value)}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Limpieza Personal - Otros */}
            <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">Otros</h3>
                    <button
                        type="button"
                        className={`rounded-md border px-3 py-1 text-sm ${
                            darkMode
                                ? 'border-gray-300 text-gray-300 hover:bg-gray-700'
                                : 'border-gray-700 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => setLimpiezaPersonalCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}
                    >
                        Añadir otro
                    </button>
                </div>
                {limpiezaPersonalCustom.length === 0 ? (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay ítems personalizados aún.</p>
                ) : (
                    <div className="space-y-3">
                        {limpiezaPersonalCustom.map((row, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                <input
                                    type="text"
                                    className={`px-2 py-1 border rounded ${
                                        darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                    }`}
                                    placeholder="Nombre"
                                    value={row.item}
                                    onChange={(e)=> setLimpiezaPersonalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))}
                                />
                                <NumberInput
                                    value={row.cantidad}
                                    onChange={(value) => setLimpiezaPersonalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))}
                                    min="0"
                                    darkMode={darkMode}
                                />
                                <input
                                    type="text"
                                    className={`px-2 py-1 border rounded col-span-1 ${
                                        darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                    }`}
                                    placeholder="Observaciones"
                                    value={row.observaciones}
                                    onChange={(e)=> setLimpiezaPersonalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))}
                                />
                                <button
                                    type="button"
                                    className={`justify-self-end rounded-md border px-3 py-1 text-sm ${
                                        darkMode
                                            ? 'border-red-500 text-red-400 hover:bg-red-900'
                                            : 'border-red-700 text-red-700 hover:bg-red-100'
                                    }`}
                                    onClick={()=> setLimpiezaPersonalCustom(prev => prev.filter((_,i)=> i!==idx))}
                                >
                                    Quitar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Limpieza General */}
        <div className="space-y-6">
            <h3 className={`text-xl font-semibold border-l-4 pl-3 py-1 ${
                darkMode ? 'border-teal-400' : 'border-teal-600'
            }`}>Limpieza General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6"
>
                {LIMPIEZA_GENERAL_ITEMS.map(item => (
                    <div key={item} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${cardBg} p-3 sm:p-4 rounded-lg border ${borderColor} space-y-2 sm:space-y-0`}
>
                        <label className="text-sm font-medium">{item}</label>
                        <div className="flex items-center space-x-2">
                            <NumberInput
                                value={limpiezaGeneral[item].cantidad}
                                onChange={(value) => handleListQuantityChange(setLimpiezaGeneral)(item, value)}
                                min="0"
                                darkMode={darkMode}
                            />
                            <input
                                type="text"
                               className={`w-full sm:w-40 px-2 py-1 border rounded text-sm ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-amber-300 bg-white'
                                }`}
                                placeholder="Observaciones"
                                value={limpiezaGeneral[item].observaciones}
                                maxLength={400}
                                onChange={(e) => handleListObsChange(setLimpiezaGeneral)(item, e.target.value)}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Limpieza General - Otros */}
            <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">Otros</h3>
                    <button
                        type="button"
                        className={`rounded-md border px-3 py-1 text-sm ${
                            darkMode
                                ? 'border-gray-300 text-gray-300 hover:bg-gray-700'
                                : 'border-gray-700 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => setLimpiezaGeneralCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}
                    >
                        Añadir otro
                    </button>
                </div>
                {limpiezaGeneralCustom.length === 0 ? (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay ítems personalizados aún.</p>
                ) : (
                    <div className="space-y-3">
                        {limpiezaGeneralCustom.map((row, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                <input
                                    type="text"
                                    className={`px-2 py-1 border rounded ${
                                        darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                    }`}
                                    placeholder="Nombre"
                                    value={row.item}
                                    onChange={(e)=> setLimpiezaGeneralCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))}
                                />
                                <NumberInput
                                    value={row.cantidad}
                                    onChange={(value) => setLimpiezaGeneralCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))}
                                    min="0"
                                    darkMode={darkMode}
                                />
                                <input
                                    type="text"
                                    className={`px-2 py-1 border rounded col-span-1 ${
                                        darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                    }`}
                                    placeholder="Observaciones"
                                    value={row.observaciones}
                                    onChange={(e)=> setLimpiezaGeneralCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))}
                                />
                                <button
                                    type="button"
                                    className={`justify-self-end rounded-md border px-3 py-1 text-sm ${
                                        darkMode
                                            ? 'border-red-500 text-red-400 hover:bg-red-900'
                                            : 'border-red-700 text-red-700 hover:bg-red-100'
                                    }`}
                                    onClick={()=> setLimpiezaGeneralCustom(prev => prev.filter((_,i)=> i!==idx))}
                                >
                                    Quitar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
)}

{/* Sección de Medicamentos CON CUSTOM */}
{activeSection === 'meds' && (
    <div className="space-y-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">
                Medicamentos
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
                Suministros médicos y medicamentos esenciales
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6"
>
            {MEDICAMENTOS_ITEMS.map(item => (
                <div key={item} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${cardBg} p-3 sm:p-4 rounded-lg border ${borderColor} space-y-2 sm:space-y-0`}
>
                    <label className="text-sm font-medium">{item}</label>
                    <div className="flex items-center space-x-2">
                        <NumberInput
                            value={medicamentos[item].cantidad}
                            onChange={(value) => handleListQuantityChange(setMedicamentos)(item, value)}
                            min="0"
                            darkMode={darkMode}
                        />
                        <input
                            type="text"
                            className={`w-full sm:w-40 px-2 py-1 border rounded text-sm ${
                                darkMode ? 'bg-gray-700 border-gray-600' : 'border-amber-300 bg-white'
                            }`}
                            placeholder="Observaciones"
                            value={medicamentos[item].observaciones}
                            maxLength={400}
                            onChange={(e) => handleListObsChange(setMedicamentos)(item, e.target.value)}
                        />
                    </div>
                </div>
            ))}
        </div>

        {/* Medicamentos - Otros */}
        <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Otros</h3>
                <button
                    type="button"
                    className={`rounded-md border px-3 py-1 text-sm ${
                        darkMode
                            ? 'border-gray-300 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-700 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setMedicamentosCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}
                >
                    Añadir otro
                </button>
            </div>
            {medicamentosCustom.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay ítems personalizados aún.</p>
            ) : (
                <div className="space-y-3">
                    {medicamentosCustom.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                            <input
                                type="text"
                                className={`px-2 py-1 border rounded ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                }`}
                                placeholder="Nombre"
                                value={row.item}
                                onChange={(e)=> setMedicamentosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))}
                            />
                            <NumberInput
                                value={row.cantidad}
                                onChange={(value) => setMedicamentosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))}
                                min="0"
                                darkMode={darkMode}
                            />
                            <input
                                type="text"
                                className={`px-2 py-1 border rounded col-span-1 ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                }`}
                                placeholder="Observaciones"
                                value={row.observaciones}
                                onChange={(e)=> setMedicamentosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))}
                            />
                            <button
                                type="button"
                                className={`justify-self-end rounded-md border px-3 py-1 text-sm ${
                                    darkMode
                                        ? 'border-red-500 text-red-400 hover:bg-red-900'
                                        : 'border-red-700 text-red-700 hover:bg-red-100'
                                }`}
                                onClick={()=> setMedicamentosCustom(prev => prev.filter((_,i)=> i!==idx))}
                            >
                                Quitar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
)}

{/* Sección de Rescate Animal CON CUSTOM */}
{activeSection === 'animals' && (
    <div className="space-y-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
                Rescate Animal
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
                Equipos y suministros para rescate de animales
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6"
>
            {RESCATE_ANIMAL_ITEMS.map(item => (
                <div key={item} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${cardBg} p-3 sm:p-4 rounded-lg border ${borderColor} space-y-2 sm:space-y-0`}
>
                    <label className="text-sm font-medium">{item}</label>
                    <div className="flex items-center space-x-2">
                        <NumberInput
                            value={rescateAnimal[item].cantidad}
                            onChange={(value) => handleListQuantityChange(setRescateAnimal)(item, value)}
                            min="0"
                            darkMode={darkMode}
                        />
                        <input
                            type="text"
                            className={`w-full sm:w-40 px-2 py-1 border rounded text-sm ${
                                darkMode ? 'bg-gray-700 border-gray-600' : 'border-amber-300 bg-white'
                            }`}
                            placeholder="Observaciones"
                            value={rescateAnimal[item].observaciones}
                            maxLength={400}
                            onChange={(e) => handleListObsChange(setRescateAnimal)(item, e.target.value)}
                        />
                    </div>
                </div>
            ))}
        </div>

        {/* Rescate Animal - Otros */}
        <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Otros</h3>
                <button
                    type="button"
                    className={`rounded-md border px-3 py-1 text-sm ${
                        darkMode
                            ? 'border-gray-300 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-700 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setRescateAnimalCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}
                >
                    Añadir otro
                </button>
            </div>
            {rescateAnimalCustom.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay ítems personalizados aún.</p>
            ) : (
                <div className="space-y-3">
                    {rescateAnimalCustom.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                            <input
                                type="text"
                                className={`px-2 py-1 border rounded ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                }`}
                                placeholder="Nombre"
                                value={row.item}
                                onChange={(e)=> setRescateAnimalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))}
                            />
                            <NumberInput
                                value={row.cantidad}
                                onChange={(value) => setRescateAnimalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))}
                                min="0"
                                darkMode={darkMode}
                            />
                            <input
                                type="text"
                                className={`px-2 py-1 border rounded col-span-1 ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                }`}
                                placeholder="Observaciones"
                                value={row.observaciones}
                                onChange={(e)=> setRescateAnimalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))}
                            />
                            <button
                                type="button"
                                className={`justify-self-end rounded-md border px-3 py-1 text-sm ${
                                    darkMode
                                        ? 'border-red-500 text-red-400 hover:bg-red-900'
                                        : 'border-red-700 text-red-700 hover:bg-red-100'
                                }`}
                                onClick={() => setRescateAnimalCustom(prev => prev.filter((_,i)=> i!==idx))}
                            >
                                Quitar
                            </button>
                        </div>
                    ))}
                </div>
            )}

        </div>
    </div>
)}

                {/* Navegación inferior */}
                {renderNavigation()}

            </>
        )}
    </div>
    </form>
    </div>
    </div>
    );
};

export default BombForm;