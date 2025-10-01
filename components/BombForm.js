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
} from '../src/services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Paleta de colores para cada secciÃ³n
const SECTION_COLORS = [
    { primary: '#9c27b0', secondary: '#e1bee7' }, // Lila - InformaciÃ³n
    { primary: '#7b1fa2', secondary: '#ce93d8' }, // Lila oscuro - EPP
    { primary: '#673ab7', secondary: '#b39ddb' }, // Ãndigo - Herramientas
    { primary: '#3f51b5', secondary: '#9fa8da' }, // Azul - LogÃ­stica
    { primary: '#2196f3', secondary: '#90caf9' }, // Azul claro - AlimentaciÃ³n
    { primary: '#03a9f4', secondary: '#81d4fa' }, // Cian - Equipo de campo
    { primary: '#00bcd4', secondary: '#80deea' }, // Turquesa - Limpieza
    { primary: '#009688', secondary: '#80cbc4' }, // Verde azulado - Medicamentos
    { primary: '#4caf50', secondary: '#a5d6a7' }  // Verde - Rescate animal
];

// ConfiguraciÃ³n de secciones con endpoints y reglas bÃ¡sicas
const SECTIONS = [
    {
        id: 'info',
        name: 'InformaciÃ³n',
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
        name: 'LogÃ­stica',
        endpoint: '/logistica-repuestos',
        fields: ['item', 'costo', 'observaciones']
    },
    {
        id: 'food',
        name: 'AlimentaciÃ³n',
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

// Componente de input numÃ©rico con botones +/-
const NumberInput = ({ value, onChange, min = 0, max, className = '', darkMode = false, ...props }) => {
    const handleIncrement = () => {
        onChange(Math.min(value + 1, max || Infinity));
    };

    const handleDecrement = () => {
        onChange(Math.max(value - 1, min));
    };

    return (
        <div className={`flex items-center ${className}`}>
            <button
                type="button"
                onClick={handleDecrement}
                className={`px-3 py-1 rounded-l-lg focus:outline-none ${
                    darkMode
                        ? 'bg-purple-700 text-purple-100 hover:bg-purple-600'
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
                aria-label="Decrementar"
                disabled={value <= min}
            >
                âˆ’
            </button>
            <input
                type="number"
                value={value}
                min={min}
                max={max}
                onChange={(e) => onChange(parseInt(e.target.value) || min)}
                className={`w-16 px-2 py-1 border-t border-b text-center ${
                    darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-800'
                }`}
                {...props}
            />
            <button
                type="button"
                onClick={handleIncrement}
                className={`px-3 py-1 rounded-r-lg focus:outline-none ${
                    darkMode
                        ? 'bg-teal-700 text-teal-100 hover:bg-teal-600'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                aria-label="Incrementar"
                disabled={max !== undefined && value >= max}
            >
                +
            </button>
        </div>
    );
};


const BombForm = () => {
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
    const formRef = useRef();

    // Obtener colores de la secciÃ³n actual
    const currentSectionIndex = SECTIONS.findIndex(s => s.id === activeSection);
    const currentColors = SECTION_COLORS[currentSectionIndex] || SECTION_COLORS[0];

    // CatÃ¡logos de Ã­tems por secciÃ³n
    const EPP_ROPA_ITEMS = ['Camisa Forestal', 'PantalÃ³n Forestal', 'Overol FR'];
    const EPP_EQUIPO_ITEMS = [
        'Esclavina', 'Linterna', 'Antiparra', 'Casco Forestal Ala Ancha',
        'MÃ¡scara para Polvo y PartÃ­culas', 'MÃ¡scara Media Cara', 'Barbijos'
    ];
    const BOTAS_SIZES = ['37', '38', '39', '40', '41', '42', '43', 'otra'];
    const GUANTES_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'otra'];
    const HERRAMIENTAS_ITEMS = [
        'Linternas de Cabeza', 'Pilas AA', 'Pilas AAA', 'AzadÃ³n',
        'Pala con Mango de Fibra', 'Rastrillo Mango de Fibra',
        'McLeod Mango de Fibra', 'Batefuego', 'Gorgui',
        'Pulasky con Mango de Fibra', 'Quemador de Goteo',
        'Mochila Forestal', 'Escobeta de Alambre'
    ];
    const LOGISTICA_REPUESTOS_ITEMS = [
        'Gasolina', 'DiÃ©sel', 'Amortiguadores', 'Prensa Disco',
        'RectificaciÃ³n de Frenos', 'Llantas', 'Aceite de Motor',
        'Grasa', 'Cambio de Aceite', 'Otro Tipo de Arreglo'
    ];
    const ALIMENTACION_ITEMS = [
        'Alimentos y Bebidas', 'Agua', 'Rehidratantes', 'Barras Energizantes',
        'Lata de AtÃºn', 'Lata de Frejol', 'Lata de Viandada', 'Lata de Chorizos',
        'Refresco en Sobres', 'Leche Polvo', 'Frutos Secos',
        'Pastillas de Menta o Dulces', 'Alimentos No Perecederos'
    ];
    const CAMPO_ITEMS = ['Carpas', 'Colchonetas', 'Mochilas Personales', 'Mantas', 'Cuerdas', 'Radio Comunicadores', 'BaterÃ­as PortÃ¡tiles'];
    const LIMPIEZA_PERSONAL_ITEMS = ['Papel HigiÃ©nico', 'Cepillos de Dientes', 'JabÃ³n', 'Pasta Dental', 'Toallas', 'Alcohol en Gel'];
    const LIMPIEZA_GENERAL_ITEMS = ['Detergente', 'Escobas', 'Trapeadores', 'Bolsas de Basura', 'Lavandina', 'Desinfectante'];
    const MEDICAMENTOS_ITEMS = ['Paracetamol', 'Ibuprofeno', 'AntibiÃ³ticos', 'Suero Oral', 'Gasas', 'Vendas', 'Alcohol', 'Yodo', 'Curitas'];
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

    // Estados especÃ­ficos por secciÃ³n
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

    // Handlers especÃ­ficos por secciÃ³n
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

    // Validar secciÃ³n actual con mÃ¡s detalle
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
                    errors[field] = 'El telÃ©fono debe tener 8 dÃ­gitos';
                    isValid = false;
                }
            }
        });

        setFormErrors(errors);
        return isValid;
    };

    // NavegaciÃ³n entre secciones con validaciÃ³n
    const goToSection = (sectionId) => {
        if (validateSection(activeSection)) {
            setActiveSection(sectionId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setSubmitStatus({ success: null, message: '' });
            return true;
        }
        return false;
    };

    // ====================
    // Ayudantes de persistencia a la API
    // ====================
    // Construye el payload de InformaciÃ³n de Brigada que espera la API
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
            const { data } = await createBrigada(payload);
            if (!data?.brigadaId) {
                throw new Error('No se recibiÃ³ brigadaId desde la API');
            }
            setBrigadaId(data.brigadaId);
            return data.brigadaId;
        }
        await updateBrigada(brigadaId, payload);
        return brigadaId;
    };

    // Persiste EPP Ropa: envÃ­a por prenda y talla con cantidad > 0
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
        // Ãtems personalizados de ropa
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

    // Persiste Botas: envÃ­a por cada talla con cantidad > 0
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
        // Talla "otra": la API sÃ³lo guarda el texto en otratalla
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

    // Persiste Guantes: la API espera todos los tamaÃ±os en un Ãºnico POST
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

    // Utilidad para iterar y enviar Ã­tems simples { item, cantidad, observaciones }
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

    // Utilidad para iterar y enviar Ã­tems con costo { item, costo, observaciones }
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

    // Manejador de envÃ­o del formulario
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
                // Si por alguna razÃ³n se intenta guardar otra secciÃ³n sin ID, crea primero la brigada
                id = await persistInfo();
            }

            // 2) Persistencia especÃ­fica por secciÃ³n
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
                setSubmitStatus({ success: true, message: 'Â¡Formulario completado con Ã©xito!', isFinal: true });
            } else {
                setSubmitStatus({ success: true, message: 'SecciÃ³n guardada correctamente. Avanzando...' });
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

    // Generar PDF
    const generatePDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const doc = new jsPDF('p', 'mm', 'a4');

            // ConfiguraciÃ³n
            const margin = 15;
            let y = margin;
            const pageWidth = doc.internal.pageSize.getWidth();
            const maxWidth = pageWidth - 2 * margin;

            // FunciÃ³n para agregar texto con manejo de saltos de pÃ¡gina
            const addText = (text, size = 12, style = 'normal', x = margin) => {
                doc.setFontSize(size);
                doc.setFont(undefined, style);

                // Manejo de saltos de pÃ¡gina
                if (y > 280) {
                    doc.addPage();
                    y = margin;
                }

                const lines = doc.splitTextToSize(text, maxWidth - x);
                doc.text(lines, x, y);
                y += lines.length * (size / 2 + 2);
            };

            // Cabecera del documento
            doc.setFillColor(139, 0, 0); // Rojo oscuro
            doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text('Formulario de Necesidades', pageWidth / 2, 15, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Cuerpo de Bomberos | ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

            // Resetear posiciÃ³n y color
            y = 35;
            doc.setTextColor(0, 0, 0);

            // SecciÃ³n: InformaciÃ³n de la Brigada
            addText('1. INFORMACIÃ“N DE LA BRIGADA', 14, 'bold');
            addText(`Nombre: ${formData.nombre}`);
            addText(`Bomberos activos: ${formData.cantidadactivos}`);
            addText(`Comandante: ${formData.nombrecomandante}`);
            addText(`Celular comandante: ${formData.celularcomandante}`);
            addText(`Encargado de logÃ­stica: ${formData.encargadologistica || 'No especificado'}`);
            addText(`Celular logÃ­stica: ${formData.celularlogistica || 'No especificado'}`);
            addText(`NÃºmeros de emergencia: ${formData.numerosemergencia || 'No especificado'}`);
            y += 10;

            // FunciÃ³n para generar tablas de datos
            const generateTable = (title, headers, data) => {
                addText(title, 14, 'bold');
                y += 5;

                const tableData = [];

                // Encabezados
                tableData.push(headers);

                // Datos
                Object.entries(data).forEach(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                        const row = headers.map(header => {
                            if (header === 'ArtÃ­culo' || header === 'Item') return key;
                            return value[header.toLowerCase()] || '';
                        });
                        tableData.push(row);
                    }
                });

                autoTable(doc, {
                    startY: y,
                    head: [tableData[0]],
                    body: tableData.slice(1),
                    theme: 'grid',
                    margin: { left: margin, right: margin },
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [220, 220, 220], fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [245, 245, 245] }
                });

                y = doc.lastAutoTable.finalY + 10;
            };

            // SecciÃ³n: EPP - Ropa
            generateTable('2. EQUIPAMIENTO EPP - ROPA',
                ['ArtÃ­culo', 'XS', 'S', 'M', 'L', 'XL', 'Observaciones'],
                eppRopa
            );

            // SecciÃ³n: EPP - Botas
            addText('3. EQUIPAMIENTO EPP - BOTAS', 14, 'bold');
            Object.entries(botas).forEach(([talla, cantidad]) => {
                if (talla !== 'observaciones' && talla !== 'otratalla') {
                    addText(`Talla ${talla === 'otra' ? 'Otra' : talla}: ${cantidad}`);
                }
            });
            if (botas.otratalla) addText(`Otra talla: ${botas.otratalla}`);
            if (botas.observaciones) addText(`Observaciones: ${botas.observaciones}`);
            y += 10;

            // SecciÃ³n: EPP - Equipo
            generateTable('4. EQUIPAMIENTO EPP - OTROS EQUIPOS',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...EPP_EQUIPO_ITEMS.map(item => [item, eppEquipo[item]]),
                    ...eppEquipoCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // SecciÃ³n: Herramientas
            generateTable('5. HERRAMIENTAS',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...HERRAMIENTAS_ITEMS.map(item => [item, herramientas[item]]),
                    ...herramientasCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // SecciÃ³n: LogÃ­stica
            generateTable('6. LOGÃSTICA VEHÃCULOS',
                ['Item', 'Costo (S/.)', 'Observaciones'],
                Object.fromEntries([
                    ...LOGISTICA_REPUESTOS_ITEMS.map(item => [item, logisticaRepuestos[item]]),
                    ...logisticaRepuestosCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // SecciÃ³n: AlimentaciÃ³n
            generateTable('7. ALIMENTACIÃ“N',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...ALIMENTACION_ITEMS.map(item => [item, alimentacion[item]]),
                    ...alimentacionCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // SecciÃ³n: Equipo de campo
            generateTable('8. EQUIPO DE CAMPO',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...CAMPO_ITEMS.map(item => [item, logisticaCampo[item]]),
                    ...logisticaCampoCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // SecciÃ³n: Limpieza
            generateTable('9. LIMPIEZA PERSONAL',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...LIMPIEZA_PERSONAL_ITEMS.map(item => [item, limpiezaPersonal[item]]),
                    ...limpiezaPersonalCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            generateTable('10. LIMPIEZA GENERAL',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...LIMPIEZA_GENERAL_ITEMS.map(item => [item, limpiezaGeneral[item]]),
                    ...limpiezaGeneralCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // SecciÃ³n: Medicamentos
            generateTable('11. MEDICAMENTOS',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...MEDICAMENTOS_ITEMS.map(item => [item, medicamentos[item]]),
                    ...medicamentosCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // SecciÃ³n: Rescate animal
            generateTable('12. RESCATE ANIMAL',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...RESCATE_ANIMAL_ITEMS.map(item => [item, rescateAnimal[item]]),
                    ...rescateAnimalCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // Pie de pÃ¡gina
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('Formulario generado automÃ¡ticamente por el Sistema de GestiÃ³n de Brigadas',
                pageWidth / 2, 290, { align: 'center' });

            // Guardar PDF
            doc.save(`formulario-brigada-${formData.nombre.replace(/\s+/g, '_') || 'sin_nombre'}.pdf`);

            setSubmitStatus({
                success: true,
                message: 'PDF generado correctamente. Puedes descargar tu formulario completo como respaldo.'
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

    // Renderizar navegaciÃ³n con indicador de progreso
    const renderNavigation = () => {
        const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
        const isLastSection = currentIndex === SECTIONS.length - 1;
        const progress = ((currentIndex + 1) / SECTIONS.length) * 100;

        return (
            <div className="mt-8">
                {/* Barra de progreso */}
                <div className="mb-4 w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{ width: `${progress}%`, transition: 'width 0.3s ease' }}
                    ></div>
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex justify-between md:justify-start gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                if (currentIndex > 0) {
                                    setActiveSection(SECTIONS[currentIndex - 1].id);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }}
                            disabled={currentIndex === 0}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                currentIndex === 0
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : `bg-white text-${currentColors.primary} border border-${currentColors.primary} hover:bg-${currentColors.primary} hover:text-white`
                            }`}
                            style={{
                                color: currentIndex === 0 ? '' : currentColors.primary,
                                borderColor: currentIndex === 0 ? '' : currentColors.primary,
                                backgroundColor: currentIndex === 0 ? '' : 'white',
                                '&:hover': {
                                    backgroundColor: currentColors.primary,
                                    color: 'white'
                                }
                            }}
                        >
                            Anterior
                        </button>
                    </div>

                    <div className="flex items-center justify-end gap-4">
                        {submitStatus.message && (
                            <div className={`px-4 py-2 rounded-lg ${
                                submitStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {submitStatus.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                                isSubmitting
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : `bg-${currentColors.primary} hover:bg-${currentColors.primary}`
                            }`}
                            style={{
                                backgroundColor: isSubmitting ? '#9ca3af' : currentColors.primary,
                                '&:hover': {
                                    backgroundColor: currentColors.primary
                                }
                            }}
                        >
                            {isLastSection
                                ? (isSubmitting ? 'Enviando...' : 'Finalizar')
                                : (isSubmitting ? 'Guardando...' : 'Siguiente')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Estilos dinÃ¡micos para modo oscuro
    const bgColor = darkMode ? 'bg-gray-900' : 'bg-white';
    const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
    const cardBg = darkMode ? 'bg-gray-800' : 'bg-gray-50';
    const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
    const inputStyle = `w-full px-4 py-2 rounded-lg border ${darkMode
        ? 'bg-gray-700 border-gray-600 focus:ring-2 focus:ring-purple-500'
        : 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500'} focus:outline-none transition-colors`;

    return (
        <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-200`}>
            {/* BotÃ³n de modo oscuro flotante */}
            <button
                onClick={toggleDarkMode}
                className={`fixed top-4 right-4 z-50 p-2 rounded-full shadow-lg ${
                    darkMode
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                        : 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                } transition-colors`}
                aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
                {darkMode ? 'â˜€ï¸' : 'ðŸŒ™'}
            </button>

            <form
                onSubmit={handleSubmit}
                className={`rounded-xl shadow-xl overflow-hidden max-w-7xl mx-auto my-8 ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                } transition-colors`}
                ref={formRef}
            >
                {/* Header con gradiente dinÃ¡mico */}
<div
    className="py-6 px-8 text-white"
    style={{
        background: `linear-gradient(135deg, ${
            darkMode ? currentColors.primary.replace('7', '8') : currentColors.primary
        }, ${
            darkMode ? currentColors.secondary.replace('d', '9') : currentColors.secondary
        })`
    }}
>
    <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
            {/* BotÃ³n de regresar */}
            <button 
        onClick={onBack}
        className="absolute top-4 left-4 p-2 rounded-full hover:bg-black hover:bg-opacity-20 transition-colors"
        title="Volver atrÃ¡s"
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
    </button>
            <div className={`p-3 rounded-full mr-4 ${
                darkMode ? 'bg-gray-700 shadow-inner' : 'bg-white shadow-md'
            }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill={currentColors.primary}>
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Formulario de Necesidades</h1>
                <p className="opacity-90 mt-1">Cuerpo de Bomberos Voluntarios</p>
            </div>
        </div>
        <div className={`px-4 py-2 rounded-lg ${
            darkMode ? 'bg-black bg-opacity-30' : 'bg-white bg-opacity-30'
        } backdrop-blur-sm`}>
            <p className="text-sm">SecciÃ³n: <span className="font-semibold">{SECTIONS[currentSectionIndex]?.name}</span></p>
        </div>
    </div>
</div>
                {/* NavegaciÃ³n entre secciones */}
                <div className={`px-4 py-3 border-b ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                    <div className="flex overflow-x-auto pb-2 space-x-2">
                        {SECTIONS.map((section, index) => {
                            const sectionColors = SECTION_COLORS[index] || SECTION_COLORS[0];
                            return (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => goToSection(section.id)}
                                    className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                                        activeSection === section.id
                                            ? 'text-white shadow-md'
                                            : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`
                                    }`}
                                    style={{
                                        backgroundColor: activeSection === section.id ? sectionColors.primary : '',
                                        border: activeSection === section.id ? 'none' : `1px solid ${darkMode ? sectionColors.secondary : sectionColors.primary}`
                                    }}
                                >
                                    {section.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Contenido principal del formulario */}
                <div className="p-6">
                    {submitStatus.isFinal && (
                        <div className={`mb-6 rounded-lg p-6 ${
                            submitStatus.success
                                ? `${darkMode ? 'bg-green-900 bg-opacity-30' : 'bg-green-50'} border-green-600`
                                : `${darkMode ? 'bg-red-900 bg-opacity-30' : 'bg-red-50'} border-red-600`
                        } border`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                                        submitStatus.success ? 'bg-green-600' : 'bg-red-600'
                                    } text-white`}>
                                        {submitStatus.success ? 'âœ“' : 'âœ—'}
                                    </span>
                                    <div>
                                        <p className={`font-semibold ${
                                            submitStatus.success
                                                ? darkMode ? 'text-green-300' : 'text-green-800'
                                                : darkMode ? 'text-red-300' : 'text-red-800'
                                        }`}>
                                            {submitStatus.success ? 'Â¡Formulario completado!' : 'Error al procesar'}
                                        </p>
                                        <p className={`text-sm ${
                                            submitStatus.success
                                                ? darkMode ? 'text-green-200' : 'text-green-700'
                                                : darkMode ? 'text-red-200' : 'text-red-700'
                                        }`}>
                                            {submitStatus.message}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={generatePDF}
                                        disabled={isGeneratingPDF}
                                        className={`rounded-md border px-3 py-1 text-sm font-medium ${
                                            isGeneratingPDF
                                                ? `${darkMode ? 'border-blue-900 text-blue-900' : 'border-blue-300 text-blue-300'} cursor-not-allowed`
                                                : `${darkMode ? 'border-blue-500 text-blue-400 hover:bg-blue-900' : 'border-blue-700 text-blue-800 hover:bg-blue-100'}`
                                        }`}
                                    >
                                        {isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}
                                    </button>
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
                    )}

                    {/* SecciÃ³n de InformaciÃ³n */}
                    {activeSection === 'info' && (
                        <div className="space-y-6">
                            <h2 className={`text-xl font-bold border-l-4 pl-3 py-1 ${
                                darkMode ? 'border-purple-400' : 'border-purple-600'
                            }`}>
                                InformaciÃ³n BÃ¡sica de la Brigada
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Campo Nombre */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${textColor}`}>
                                        Nombre de la Brigada <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        className={`${inputStyle} ${
                                            formErrors.nombre ? 'border-red-500 focus:ring-red-500' :
                                                darkMode ? 'focus:border-purple-400' : 'focus:border-blue-500'
                                        }`}
                                        placeholder="Ej: Brigada San MartÃ­n"
                                        required
                                    />
                                    {formErrors.nombre && (
                                        <p className="mt-1 text-sm text-red-500">{formErrors.nombre}</p>
                                    )}
                                </div>

                                {/* Campo Cantidad de Bomberos */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${textColor}`}>
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
                                        <p className="mt-1 text-sm text-red-500">{formErrors.cantidadactivos}</p>
                                    )}
                                    <p className={`text-xs mt-1 ${
                                        darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                        MÃ­nimo 1 bombero activo
                                    </p>
                                </div>

                                {/* Campo Comandante */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${textColor}`}>
                                        Comandante <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nombrecomandante"
                                        value={formData.nombrecomandante}
                                        onChange={handleInputChange}
                                        className={`${inputStyle} ${
                                            formErrors.nombrecomandante ? 'border-red-500 focus:ring-red-500' :
                                                darkMode ? 'focus:border-purple-400' : 'focus:border-blue-500'
                                        }`}
                                        placeholder="Nombre completo del comandante"
                                        required
                                    />
                                    {formErrors.nombrecomandante && (
                                        <p className="mt-1 text-sm text-red-500">{formErrors.nombrecomandante}</p>
                                    )}
                                </div>

                                {/* Campo TelÃ©fono Comandante */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${textColor}`}>
                                        TelÃ©fono Comandante <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="celularcomandante"
                                        value={formData.celularcomandante}
                                        onChange={handleInputChange}
                                        className={`${inputStyle} ${
                                            formErrors.celularcomandante ? 'border-red-500 focus:ring-red-500' :
                                                darkMode ? 'focus:border-purple-400' : 'focus:border-blue-500'
                                        }`}
                                        placeholder="Ej: 987654321"
                                        maxLength={8}
                                        required
                                    />
                                    {formErrors.celularcomandante && (
                                        <p className="mt-1 text-sm text-red-500">{formErrors.celularcomandante}</p>
                                    )}
                                    <p className={`text-xs mt-1 ${
                                        darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                        8 dÃ­gitos sin espacios ni guiones
                                    </p>
                                </div>

                                {/* Campo Encargado LogÃ­stica */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${textColor}`}>
                                        Encargado de LogÃ­stica
                                    </label>
                                    <input
                                        type="text"
                                        name="encargadologistica"
                                        value={formData.encargadologistica}
                                        onChange={handleInputChange}
                                        className={`${inputStyle} ${
                                            darkMode ? 'focus:border-purple-400' : 'focus:border-blue-500'
                                        }`}
                                        placeholder="Nombre completo del encargado"
                                    />
                                </div>

                                {/* Campo TelÃ©fono LogÃ­stica */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${textColor}`}>
                                        TelÃ©fono LogÃ­stica
                                    </label>
                                    <input
                                        type="tel"
                                        name="celularlogistica"
                                        value={formData.celularlogistica}
                                        onChange={handleInputChange}
                                        className={`${inputStyle} ${
                                            formErrors.celularlogistica ? 'border-red-500 focus:ring-red-500' :
                                                darkMode ? 'focus:border-purple-400' : 'focus:border-blue-500'
                                        }`}
                                        placeholder="Ej: 987654321"
                                        maxLength={8}
                                    />
                                    {formErrors.celularlogistica && (
                                        <p className="mt-1 text-sm text-red-500">{formErrors.celularlogistica}</p>
                                    )}
                                </div>

                                {/* Campo NÃºmeros de Emergencia */}
                                <div className="md:col-span-2">
                                    <label className={`block text-sm font-medium mb-1 ${textColor}`}>
                                        NÃºmeros de Emergencia (Opcional)
                                    </label>
                                    <input
                                        type="tel"
                                        name="numerosemergencia"
                                        value={formData.numerosemergencia}
                                        onChange={handleInputChange}
                                        className={`${inputStyle} ${
                                            darkMode ? 'focus:border-purple-400' : 'focus:border-blue-500'
                                        }`}
                                        placeholder="Ej: 12345678, 87654321"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Equipamiento EPP */}
                    {activeSection === 'epp' && (
                        <div className="space-y-6">
                            <h2 className={`text-xl font-bold border-l-4 pl-3 py-1 ${
                                darkMode ? 'border-purple-400' : 'border-purple-600'
                            }`}>
                                Equipamiento de ProtecciÃ³n Personal
                            </h2>

                            <div className="grid grid-cols-1 gap-6">
                                <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
                                    <h3 className="font-semibold mb-3">Ropa</h3>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">ArtÃ­culo</th>
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
                                </div>

                                <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
                                    <h3 className="font-semibold mb-3">Botas para Bomberos</h3>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {BOTAS_SIZES.map(size => (
                                            <div key={size} className="flex items-center">
                                                <label className="text-sm w-28">Talla {size === 'otra' ? 'Otra' : size}</label>
                                                <NumberInput
                                                    value={botas[size]}
                                                    onChange={(value) => handleBotasChange(size, value)}
                                                    min="0"
                                                    darkMode={darkMode}
                                                />
                                            </div>
                                        ))}
                                        <div className="col-span-full">
                                            <label className="text-sm">Otra talla (texto)</label>
                                            <input
                                                type="text"
                                                className={`w-full px-2 py-1 border rounded ${
                                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                }`}
                                                placeholder="Especifica otra talla, por ejemplo 44/45..."
                                                value={botas.otratalla}
                                                maxLength={80}
                                                onChange={(e) => handleBotasOtraTallaText(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-full">
                                            <label className="text-sm">Observaciones</label>
                                            <input
                                                type="text"
                                                className={`w-full px-2 py-1 border rounded ${
                                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                }`}
                                                placeholder="Notas generales de botas"
                                                value={botas.observaciones}
                                                maxLength={400}
                                                onChange={(e) => handleBotasObsChange(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
                                    <h3 className="font-semibold mb-3">Otros Equipos EPP</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {EPP_EQUIPO_ITEMS.map(item => (
                                            <div key={item} className="flex items-center justify-between">
                                                <label className="text-sm">{item}</label>
                                                <div className="flex items-center space-x-2">
                                                    <NumberInput
                                                        value={eppEquipo[item].cantidad}
                                                        onChange={(value) => handleListQuantityChange(setEppEquipo)(item, value)}
                                                        min="0"
                                                        darkMode={darkMode}
                                                    />
                                                    <input
                                                        type="text"
                                                        className={`w-40 px-2 py-1 border rounded ${
                                                            darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                        }`}
                                                        placeholder="Observaciones"
                                                        value={eppEquipo[item].observaciones}
                                                        maxLength={400}
                                                        onChange={(e) => handleListObsChange(setEppEquipo)(item, e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                                            AÃ±adir otro
                                        </button>
                                    </div>
                                    {eppEquipoCustom.length === 0 ? (
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay Ã­tems personalizados aÃºn.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {eppEquipoCustom.map((row, idx) => (
                                                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                    <input
                                                        type="text"
                                                        className={`px-2 py-1 border rounded ${
                                                            darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                        }`}
                                                        placeholder="Nombre del Ã­tem"
                                                        value={row.item}
                                                        onChange={(e) => setEppEquipoCustom(prev => prev.map((r,i) => i===idx ? { ...r, item: e.target.value } : r))}
                                                    />
                                                    <NumberInput
                                                        value={row.cantidad}
                                                        onChange={(value) => setEppEquipoCustom(prev => prev.map((r,i) => i===idx ? { ...r, cantidad: value } : r))}
                                                        min="0"
                                                        darkMode={darkMode}
                                                    />
                                                    <input
                                                        type="text"
                                                        className={`px-2 py-1 border rounded col-span-1 md:col-span-2 ${
                                                            darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                        }`}
                                                        placeholder="Observaciones"
                                                        value={row.observaciones}
                                                        onChange={(e) => setEppEquipoCustom(prev => prev.map((r,i) => i===idx ? { ...r, observaciones: e.target.value } : r))}
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
                                            AÃ±adir otro
                                        </button>
                                    </div>
                                    {eppRopaCustom.length === 0 ? (
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay prendas personalizadas aÃºn.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {eppRopaCustom.map((row, idx) => (
                                                <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
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

                                <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
                                    <h3 className="font-semibold mb-3">Guantes</h3>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {GUANTES_SIZES.map(talla => (
                                            <div key={talla} className="flex items-center">
                                                <label className="text-sm w-28">Talla {talla}</label>
                                                <NumberInput
                                                    value={guantes[talla]}
                                                    onChange={(value) => handleGuantesChange(talla, value)}
                                                    min="0"
                                                    darkMode={darkMode}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-3">
                                        <div className="flex items-center">
                                            <label className="text-sm w-40">Otra talla (texto)</label>
                                            <input
                                                type="text"
                                                className={`flex-1 px-2 py-1 border rounded ${
                                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                }`}
                                                placeholder="Describe talla extra (por ej. Talla Ãºnica, 7.5, etc.)"
                                                value={guantes.otratalla}
                                                maxLength={80}
                                                onChange={(e) => handleGuantesOtraTallaText(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Herramientas */}
                    {activeSection === 'tools' && (
                        <div className="space-y-6">
                            <h2 className={`text-xl font-bold border-l-4 pl-3 py-1 ${
                                darkMode ? 'border-indigo-400' : 'border-indigo-600'
                            }`}>
                                Herramientas
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {HERRAMIENTAS_ITEMS.map(tool => (
                                    <div key={tool} className={`flex items-center justify-between ${cardBg} p-4 rounded-lg border ${borderColor}`}>
                                        <label className="text-sm font-medium">{tool}</label>
                                        <div className="flex items-center space-x-2">
                                            <NumberInput
                                                value={herramientas[tool].cantidad}
                                                onChange={(value) => handleListQuantityChange(setHerramientas)(tool, value)}
                                                min="0"
                                                darkMode={darkMode}
                                            />
                                            <input
                                                type="text"
                                                className={`w-40 px-2 py-1 border rounded ${
                                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                }`}
                                                placeholder="Observaciones"
                                                value={herramientas[tool].observaciones}
                                                maxLength={400}
                                                onChange={(e) => handleListObsChange(setHerramientas)(tool, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Herramientas - Otros */}
                                <div className={`md:col-span-2 ${cardBg} p-4 rounded-lg border ${borderColor}`}>
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
                                            AÃ±adir otro
                                        </button>
                                    </div>
                                    {herramientasCustom.length === 0 ? (
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay Ã­tems personalizados aÃºn.</p>
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
                                                        className={`px-2 py-1 border rounded col-span-1 md:col-span-2 ${
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
                        </div>
                    )}

                    {/* LogÃ­stica VehÃ­culos */}
                    {activeSection === 'logistics' && (
                        <div className="space-y-6">
                            <h2 className={`text-xl font-bold border-l-4 pl-3 py-1 ${
                                darkMode ? 'border-blue-400' : 'border-blue-600'
                            }`}>
                                LogÃ­stica: Repuestos y Combustibles
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {LOGISTICA_REPUESTOS_ITEMS.map(item => (
                                    <div key={item} className={`flex items-center justify-between ${cardBg} p-4 rounded-lg border ${borderColor}`}>
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
                                                className={`w-40 px-2 py-1 border rounded ${
                                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                }`}
                                                placeholder="Observaciones"
                                                value={logisticaRepuestos[item].observaciones}
                                                maxLength={400}
                                                onChange={(e) => handleListObsChange(setLogisticaRepuestos)(item, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* LogÃ­stica - Otros */}
                                <div className={`md:col-span-2 ${cardBg} p-4 rounded-lg border ${borderColor}`}>
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
                                            AÃ±adir otro
                                        </button>
                                    </div>
                                    {logisticaRepuestosCustom.length === 0 ? (
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay Ã­tems personalizados aÃºn.</p>
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
                                                        className={`px-2 py-1 border rounded col-span-1 md:col-span-2 ${
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
                        </div>
                    )}

                    {/* AlimentaciÃ³n */}
                    {activeSection === 'food' && (
                        <div className="space-y-6">
                            <h2 className={`text-xl font-bold border-l-4 pl-3 py-1 ${
                                darkMode ? 'border-blue-300' : 'border-blue-500'
                            }`}>
                                AlimentaciÃ³n y Bebidas
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {ALIMENTACION_ITEMS.map(item => (
                                    <div key={item} className={`flex items-center justify-between ${cardBg} p-4 rounded-lg border ${borderColor}`}>
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
                                                className={`w-40 px-2 py-1 border rounded ${
                                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                }`}
                                                placeholder="Observaciones"
                                                value={alimentacion[item].observaciones}
                                                maxLength={400}
                                                onChange={(e) => handleListObsChange(setAlimentacion)(item, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* AlimentaciÃ³n - Otros */}
                                <div className={`md:col-span-2 ${cardBg} p-4 rounded-lg border ${borderColor}`}>
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
                                            AÃ±adir otro
                                        </button>
                                    </div>
                                    {alimentacionCustom.length === 0 ? (
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay Ã­tems personalizados aÃºn.</p>
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
                                                        className={`px-2 py-1 border rounded col-span-1 md:col-span-2 ${
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
                        </div>
                    )}

                    {/* Equipo de Campo */}
                    {activeSection === 'camp' && (
                        <div className="space-y-6">
                            <h2 className={`text-xl font-bold border-l-4 pl-3 py-1 ${
                                darkMode ? 'border-cyan-400' : 'border-cyan-600'
                            }`}>
                                Equipo de Campo
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {CAMPO_ITEMS.map(item => (
                                    <div key={item} className={`flex items-center justify-between ${cardBg} p-4 rounded-lg border ${borderColor}`}>
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
                                                className={`w-40 px-2 py-1 border rounded ${
                                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                }`}
                                                placeholder="Observaciones"
                                                value={logisticaCampo[item].observaciones}
                                                maxLength={400}
                                                onChange={(e) => handleListObsChange(setLogisticaCampo)(item, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Campo - Otros */}
                                <div className={`md:col-span-2 ${cardBg} p-4 rounded-lg border ${borderColor}`}>
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
                                            AÃ±adir otro
                                        </button>
                                    </div>
                                    {logisticaCampoCustom.length === 0 ? (
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay Ã­tems personalizados aÃºn.</p>
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
                                                        className={`px-2 py-1 border rounded col-span-1 md:col-span-2 ${
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
                        </div>
                    )}

                    {/* Limpieza */}
                    {activeSection === 'hygiene' && (
                        <div className="space-y-10">
                            {/* Limpieza Personal */}
                            <div className="space-y-6">
                                <h2 className={`text-lg font-semibold border-l-4 pl-3 py-1 ${
                                    darkMode ? 'border-teal-400' : 'border-teal-600'
                                }`}>Limpieza Personal</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {LIMPIEZA_PERSONAL_ITEMS.map(item => (
                                        <div key={item} className={`flex items-center justify-between ${cardBg} p-4 rounded-lg border ${borderColor}`}>
                                            <label className="text-sm font-medium">{item}</label>
                                            <div className="flex items-center space-x-2">
                                                <NumberInput
                                                    value={limpiezaPersonal[item].cantidad}
                                                    onChange={(value) => handleListQuantityChange(setLimpiezaPersonal)(item, value)}
                                                    min="0"
                                                    darkMode={darkMode}
                                                />
                                                <input
                                                    type="text"
                                                    className={`w-40 px-2 py-1 border rounded ${
                                                        darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
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
                                            AÃ±adir otro
                                        </button>
                                    </div>
                                    {limpiezaPersonalCustom.length === 0 ? (
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay Ã­tems personalizados aÃºn.</p>
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
                                                        className={`px-2 py-1 border rounded col-span-1 md:col-span-2 ${
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
                                <h2 className={`text-lg font-semibold border-l-4 pl-3 py-1 ${
                                    darkMode ? 'border-teal-400' : 'border-teal-600'
                                }`}>Limpieza General</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {LIMPIEZA_GENERAL_ITEMS.map(item => (
                                        <div key={item} className={`flex items-center justify-between ${cardBg} p-4 rounded-lg border ${borderColor}`}>
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
                                                    className={`w-40 px-2 py-1 border rounded ${
                                                        darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
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
                                            AÃ±adir otro
                                        </button>
                                    </div>
                                    {limpiezaGeneralCustom.length === 0 ? (
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay Ã­tems personalizados aÃºn.</p>
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
                                                        className={`px-2 py-1 border rounded col-span-1 md:col-span-2 ${
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

                    {/* Medicamentos */}
                    {activeSection === 'meds' && (
                        <div className="space-y-6">
                            <h2 className={`text-xl font-bold border-l-4 pl-3 py-1 ${
                                darkMode ? 'border-green-500' : 'border-green-600'
                            }`}>
                                Medicamentos
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {MEDICAMENTOS_ITEMS.map(item => (
                                    <div key={item} className={`flex items-center justify-between ${cardBg} p-4 rounded-lg border ${borderColor}`}>
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
                                                className={`w-40 px-2 py-1 border rounded ${
                                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                }`}
                                                placeholder="Observaciones"
                                                value={medicamentos[item].observaciones}
                                                maxLength={400}
                                                onChange={(e) => handleListObsChange(setMedicamentos)(item, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Medicamentos - Otros */}
                                <div className={`md:col-span-2 ${cardBg} p-4 rounded-lg border ${borderColor}`}>
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
                                            AÃ±adir otro
                                        </button>
                                    </div>
                                    {medicamentosCustom.length === 0 ? (
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay Ã­tems personalizados aÃºn.</p>
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
                                                        className={`px-2 py-1 border rounded col-span-1 md:col-span-2 ${
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
                        </div>
                    )}

                    {/* Rescate Animal */}
                    {activeSection === 'animals' && (
                        <div className="space-y-6">
                            <h2 className={`text-xl font-bold border-l-4 pl-3 py-1 ${
                                darkMode ? 'border-green-400' : 'border-green-600'
                            }`}>
                                Rescate Animal
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {RESCATE_ANIMAL_ITEMS.map(item => (
                                    <div key={item} className={`flex items-center justify-between ${cardBg} p-4 rounded-lg border ${borderColor}`}>
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
                                                className={`w-40 px-2 py-1 border rounded ${
                                                    darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                                                }`}
                                                placeholder="Observaciones"
                                                value={rescateAnimal[item].observaciones}
                                                maxLength={400}
                                                onChange={(e) => handleListObsChange(setRescateAnimal)(item, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Rescate Animal - Otros */}
                                <div className={`md:col-span-2 ${cardBg} p-4 rounded-lg border ${borderColor}`}>
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
                                            AÃ±adir otro
                                        </button>
                                    </div>
                                    {rescateAnimalCustom.length === 0 ? (
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay Ã­tems personalizados aÃºn.</p>
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
                                                        className={`px-2 py-1 border rounded col-span-1 md:col-span-2 ${
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
                                                        onClick={()=> setRescateAnimalCustom(prev => prev.filter((_,i)=> i!==idx))}
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

                    {/* NavegaciÃ³n inferior */}
                    <div className="mt-8">
                        <div className="mb-4 w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-green-500 h-2.5 rounded-full"
                                style={{
                                    width: `${((currentSectionIndex + 1) / SECTIONS.length) * 100}%`,
                                    transition: 'width 0.3s ease'
                                }}
                            ></div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <button
                                type="button"
                                onClick={() => currentSectionIndex > 0 && goToSection(SECTIONS[currentSectionIndex - 1].id)}
                                disabled={currentSectionIndex === 0}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                    currentSectionIndex === 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                                        : `${
                                            darkMode
                                                ? 'bg-purple-700 text-white hover:bg-purple-600'
                                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                        }`
                                }`}
                            >
                                Anterior
                            </button>

                            <div className="flex items-center justify-end gap-4">
                                {submitStatus.message && !submitStatus.isFinal && (
                                    <div className={`px-4 py-2 rounded-lg ${
                                        submitStatus.success
                                            ? darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                            : darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {submitStatus.message}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                                        isSubmitting
                                            ? 'bg-gray-400 cursor-not-allowed dark:bg-gray-600'
                                            : `${
                                                darkMode
                                                    ? 'bg-teal-700 hover:bg-teal-600'
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                            }`
                                    }`}
                                >
                                    {currentSectionIndex === SECTIONS.length - 1
                                        ? (isSubmitting ? 'Finalizando...' : 'Finalizar')
                                        : (isSubmitting ? 'Guardando...' : 'Siguiente')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BombForm;