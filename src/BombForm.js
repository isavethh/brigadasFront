import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Configuración de secciones con endpoints y reglas básicas
const SECTIONS = [
    {
        id: 'info',
        name: 'Información de la Brigada',
        endpoint: '',
        fields: ['nombre', 'cantidadactivos', 'nombrecomandante', 'celularcomandante', 'encargadologistica', 'celularlogistica', 'numerosemergencia'],
        required: ['nombre', 'cantidadactivos', 'nombrecomandante', 'celularcomandante']
    },
    {
        id: 'epp',
        name: 'Equipamiento EPP',
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
        name: 'Logística Vehículos',
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
        name: 'Equipo de Campo',
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
        name: 'Rescate Animal',
        endpoint: '/rescate-animal',
        fields: ['item', 'cantidad', 'observaciones']
    }
];

// Componente de input numérico con botones +/-
const NumberInput = ({ value, onChange, min = 0, className = '', ...props }) => {
    const handleIncrement = () => {
        onChange(value + 1);
    };

    const handleDecrement = () => {
        if (value > min) {
            onChange(value - 1);
        }
    };

    const handleDirectChange = (e) => {
        const newValue = parseInt(e.target.value, 10) || min;
        onChange(newValue);
    };

    return (
        <div className={`flex items-center ${className}`}>
            <button
                type="button"
                onClick={handleDecrement}
                className="bg-red-500 text-white px-3 py-1 rounded-l-lg hover:bg-red-600 focus:outline-none"
                aria-label="Decrementar"
            >
                -
            </button>
            <input
                type="number"
                value={value}
                min={min}
                onChange={handleDirectChange}
                className="w-16 px-2 py-1 border-t border-b border-gray-300 text-center"
                {...props}
            />
            <button
                type="button"
                onClick={handleIncrement}
                className="bg-green-500 text-white px-3 py-1 rounded-r-lg hover:bg-green-600 focus:outline-none"
                aria-label="Incrementar"
            >
                +
            </button>
        </div>
    );
};

const BombForm = () => {
    const [activeSection, setActiveSection] = useState('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ success: null, message: '' });
    const [brigadaId, setBrigadaId] = useState(null);
    const [completedSections, setCompletedSections] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const formRef = useRef();

    // Catálogos de ítems por sección
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
    const LIMPIEZA_PERSONAL_ITEMS = ['Papel Higiénico', 'Cepillos de Dientes', 'Jabón', 'Pasta Dental', 'Toallas', 'Alcohol en Gel'];
    const LIMPIEZA_GENERAL_ITEMS = ['Detergente', 'Escobas', 'Trapeadores', 'Bolsas de Basura', 'Lavandina', 'Desinfectante'];
    const MEDICAMENTOS_ITEMS = ['Paracetamol', 'Ibuprofeno', 'Antibióticos', 'Suero Oral', 'Gasas', 'Vendas', 'Alcohol', 'Yodo', 'Curitas'];
    const RESCATE_ANIMAL_ITEMS = ['Jaulas de Transporte', 'Collares', 'Comida para Mascotas', 'Guantes Especiales', 'Medicamentos Veterinarios'];

    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        cantidadactivos: 0,
        nombrecomandante: '',
        celularcomandante: '',
        encargadologistica: '',
        celularlogistica: '',
        numerosemergencia: ''
    });

    // Estados específicos por sección
    const [eppRopa, setEppRopa] = useState(() =>
        Object.fromEntries(EPP_ROPA_ITEMS.map(item => [item, { xs: 0, s: 0, m: 0, l: 0, xl: 0, observaciones: '' }]))
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

    // Manejador para campos simples de brigada
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        let nextValue = type === 'checkbox' ? checked : value;

        if (name === 'cantidadactivos') {
            nextValue = value.replace(/\D/g, '');
        }

        setFormData(prev => ({
            ...prev,
            [name]: nextValue
        }));

        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: null
            }));
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

    // Validar sección actual
    const validateSection = (sectionId) => {
        const section = SECTIONS.find(s => s.id === sectionId);
        if (!section || !section.required) return true;

        const errors = {};
        let isValid = true;

        section.required.forEach(field => {
            if (field === 'cantidadactivos') {
                if (formData[field] <= 0) {
                    errors[field] = 'Debe haber al menos un bombero activo';
                    isValid = false;
                }
            } else if (!formData[field] || formData[field].toString().trim() === '') {
                errors[field] = 'Este campo es obligatorio';
                isValid = false;
            }
        });

        setFormErrors(errors);
        return isValid;
    };

    // Función mejorada para navegación entre secciones
    const goToSection = (sectionId) => {
        if (validateSection(activeSection)) {
            setActiveSection(sectionId);
            // Asegurar que se hace scroll al principio
            setTimeout(() => {
                const formElement = document.getElementById('bomb-form');
                if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth' });
                }
                window.scrollTo(0, 0);
            }, 50);
            setSubmitStatus({ success: null, message: '' });
            return true;
        }
        return false;
    };


    // Manejador de envío del formulario corregido
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateSection(activeSection)) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Construir el objeto de datos completo
            const fullData = {
                // Información básica de la brigada
                ...formData,

                // Equipamiento EPP
                eppRopa,
                botas,
                guantes,
                eppEquipo: {
                    ...eppEquipo,
                    custom: eppEquipoCustom
                },
                eppRopaCustom,

                // Herramientas
                herramientas: {
                    ...herramientas,
                    custom: herramientasCustom
                },

                // Logística
                logisticaRepuestos: {
                    ...logisticaRepuestos,
                    custom: logisticaRepuestosCustom
                },

                // Alimentación
                alimentacion: {
                    ...alimentacion,
                    custom: alimentacionCustom
                },

                // Equipo de campo
                logisticaCampo: {
                    ...logisticaCampo,
                    custom: logisticaCampoCustom
                },

                // Limpieza
                limpiezaPersonal: {
                    ...limpiezaPersonal,
                    custom: limpiezaPersonalCustom
                },
                limpiezaGeneral: {
                    ...limpiezaGeneral,
                    custom: limpiezaGeneralCustom
                },

                // Medicamentos
                medicamentos: {
                    ...medicamentos,
                    custom: medicamentosCustom
                },

                // Rescate animal
                rescateAnimal: {
                    ...rescateAnimal,
                    custom: rescateAnimalCustom
                }
            };

            // Enviar datos a la API
            const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
            const isLastSection = currentIndex === SECTIONS.length - 1;

            if (isLastSection) {
                setSubmitStatus({
                    success: true,
                    message: '¡Formulario completado con éxito! Tus necesidades han sido registradas.'
                });
            } else {
                setSubmitStatus({
                    success: true,
                    message: 'Sección guardada correctamente. Avanzando...'
                });

                // CORRECCIÓN: Navegar inmediatamente a la siguiente sección
                setActiveSection(SECTIONS[currentIndex + 1].id);
                window.scrollTo(0, 0);

                // Limpiar mensaje después de 1.5 segundos
                setTimeout(() => {
                    setSubmitStatus({ success: null, message: '' });
                }, 1500);
            }
        } catch (error) {
            console.error('Error al enviar formulario:', error);
            setSubmitStatus({
                success: false,
                message: 'Error al enviar el formulario: ' + (error.response?.data?.message || error.message)
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Generar PDF
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

            // Cabecera del documento
            doc.setFillColor(139, 0, 0); // Rojo oscuro
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

            // Función para generar tablas de datos CORREGIDA
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
                            if (header === 'Artículo' || header === 'Item') return key;
                            return value[header.toLowerCase()] || '';
                        });
                        tableData.push(row);
                    }
                });

                // CORRECCIÓN PRINCIPAL: Usar autoTable directamente
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

            // Sección: EPP - Ropa
            generateTable('2. EQUIPAMIENTO EPP - ROPA',
                ['Artículo', 'XS', 'S', 'M', 'L', 'XL', 'Observaciones'],
                eppRopa
            );

            // Sección: EPP - Botas
            addText('3. EQUIPAMIENTO EPP - BOTAS', 14, 'bold');
            Object.entries(botas).forEach(([talla, cantidad]) => {
                if (talla !== 'observaciones' && talla !== 'otratalla') {
                    addText(`Talla ${talla === 'otra' ? 'Otra' : talla}: ${cantidad}`);
                }
            });
            if (botas.otratalla) addText(`Otra talla: ${botas.otratalla}`);
            if (botas.observaciones) addText(`Observaciones: ${botas.observaciones}`);
            y += 10;

            // Sección: EPP - Equipo
            generateTable('4. EQUIPAMIENTO EPP - OTROS EQUIPOS',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...EPP_EQUIPO_ITEMS.map(item => [item, eppEquipo[item]]),
                    ...eppEquipoCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // Sección: Herramientas
            generateTable('5. HERRAMIENTAS',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...HERRAMIENTAS_ITEMS.map(item => [item, herramientas[item]]),
                    ...herramientasCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // Sección: Logística
            generateTable('6. LOGÍSTICA VEHÍCULOS',
                ['Item', 'Costo (S/.)', 'Observaciones'],
                Object.fromEntries([
                    ...LOGISTICA_REPUESTOS_ITEMS.map(item => [item, logisticaRepuestos[item]]),
                    ...logisticaRepuestosCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // Sección: Alimentación
            generateTable('7. ALIMENTACIÓN',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...ALIMENTACION_ITEMS.map(item => [item, alimentacion[item]]),
                    ...alimentacionCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // Sección: Equipo de campo
            generateTable('8. EQUIPO DE CAMPO',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...CAMPO_ITEMS.map(item => [item, logisticaCampo[item]]),
                    ...logisticaCampoCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // Sección: Limpieza
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

            // Sección: Medicamentos
            generateTable('11. MEDICAMENTOS',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...MEDICAMENTOS_ITEMS.map(item => [item, medicamentos[item]]),
                    ...medicamentosCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
            );

            // Sección: Rescate animal
            generateTable('12. RESCATE ANIMAL',
                ['Item', 'Cantidad', 'Observaciones'],
                Object.fromEntries([
                    ...RESCATE_ANIMAL_ITEMS.map(item => [item, rescateAnimal[item]]),
                    ...rescateAnimalCustom.map((item, i) => [`${item.item} (adicional)`, item])
                ])
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

    // Componente de navegación
    const renderNavigation = () => {
        const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
        const isLastSection = currentIndex === SECTIONS.length - 1;

        return (
            <div className="mt-8 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex justify-between md:justify-start gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            if (currentIndex > 0) {
                                setActiveSection(SECTIONS[currentIndex - 1].id);
                                window.scrollTo(0, 0);
                                setSubmitStatus({ success: null, message: '' });
                            }
                        }}
                        disabled={currentIndex === 0}
                        className={`px-6 py-2 rounded-lg font-medium ${
                            currentIndex === 0
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        }`}
                    >
                        Anterior
                    </button>

                    {isLastSection && (
                        <button
                            type="button"
                            onClick={generatePDF}
                            disabled={isGeneratingPDF}
                            className={`px-6 py-2 rounded-lg font-medium ${
                                isGeneratingPDF
                                    ? 'bg-blue-300 text-white cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                        >
                            {isGeneratingPDF ? 'Generando PDF...' : 'Descargar PDF'}
                        </button>
                    )}
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
                        className={`px-6 py-2 rounded-lg font-medium text-white ${
                            isSubmitting
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        {isLastSection
                            ? (isSubmitting ? 'Enviando...' : 'Finalizar')
                            : (isSubmitting ? 'Guardando...' : 'Siguiente')}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl overflow-hidden max-w-7xl mx-auto my-8" ref={formRef}>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 py-6 px-8">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="flex items-center mb-4 md:mb-0">
                        <div className="bg-yellow-400 p-3 rounded-full mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Formulario de Necesidades</h1>
                            <p className="text-yellow-100 mt-1">Cuerpo de Bomberos</p>
                        </div>
                    </div>
                    <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                        <p className="text-white text-sm">Fecha: <span className="font-semibold">{new Date().toLocaleDateString()}</span></p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-gray-100 px-4 py-3 border-b">
                <div className="flex overflow-x-auto pb-2 space-x-2">
                    {SECTIONS.map(section => (
                        <button
                            key={section.id}
                            onClick={() => goToSection(section.id)}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                                activeSection === section.id
                                    ? 'bg-red-600 text-white shadow-md'
                                    : 'bg-white text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {section.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Form Sections */}
            <div className="p-6">
                {submitStatus.success && activeSection === SECTIONS[SECTIONS.length - 1].id && (
                    <div className="mb-6 rounded-lg border border-green-600 bg-green-50 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">✓</span>
                                <div>
                                    <p className="font-semibold text-green-800">Formulario completado</p>
                                    <p className="text-sm text-green-700">Tus necesidades han sido registradas correctamente. ¡Gracias!</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={generatePDF}
                                    disabled={isGeneratingPDF}
                                    className={`rounded-md border px-3 py-1 text-sm font-medium ${
                                        isGeneratingPDF
                                            ? 'border-blue-300 text-blue-300 cursor-not-allowed'
                                            : 'border-blue-700 text-blue-800 hover:bg-blue-700 hover:text-white'
                                    }`}
                                >
                                    {isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="rounded-md border border-green-700 px-3 py-1 text-sm font-medium text-green-800 hover:bg-green-700 hover:text-white"
                                >
                                    Finalizar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Información de la Brigada */}
                {activeSection === 'info' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Datos de la Brigada</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Brigada</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Ingrese el nombre"
                                    maxLength={120}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Bomberos Activos</label>
                                <NumberInput
                                    value={formData.cantidadactivos}
                                    onChange={(value) => setFormData(prev => ({ ...prev, cantidadactivos: value }))}
                                    min="0"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comandante</label>
                                <input
                                    type="text"
                                    name="nombrecomandante"
                                    value={formData.nombrecomandante}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border ${
                                        formErrors.nombrecomandante ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                                    placeholder="Nombre del comandante"
                                    maxLength={120}
                                    required
                                />
                                {formErrors.nombrecomandante && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.nombrecomandante}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto Celular Comandante</label>
                                <input
                                    type="tel"
                                    name="celularcomandante"
                                    value={formData.celularcomandante}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border ${
                                        formErrors.celularcomandante ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                                    placeholder="Número de teléfono"
                                    maxLength={30}
                                    required
                                />
                                {formErrors.celularcomandante && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.celularcomandante}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Encargado de Logística</label>
                                <input
                                    type="text"
                                    name="encargadologistica"
                                    value={formData.encargadologistica}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Nombre del encargado"
                                    maxLength={120}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto Celular Logística</label>
                                <input
                                    type="tel"
                                    name="celularlogistica"
                                    value={formData.celularlogistica}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border ${
                                        formErrors.celularlogistica ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                                    placeholder="Número de teléfono"
                                    maxLength={30}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Emergencia Público (si lo tiene)</label>
                                <input
                                    type="tel"
                                    name="numerosemergencia"
                                    value={formData.numerosemergencia}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Número de emergencia"
                                    maxLength={30}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Equipamiento EPP */}
                {activeSection === 'epp' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Equipamiento de Protección Personal</h2>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-700 mb-3">Ropa</h3>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artículo</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">XS</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">S</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">M</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">XL</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {EPP_ROPA_ITEMS.map((itemNombre, rowIndex) => (
                                            <tr key={itemNombre} className={rowIndex % 2 === 1 ? 'bg-gray-50' : ''}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{itemNombre}</td>
                                                {['xs','s','m','l','xl'].map(sizeKey => (
                                                    <td key={sizeKey} className="px-4 py-3">
                                                        <NumberInput
                                                            value={eppRopa[itemNombre][sizeKey]}
                                                            onChange={(value) => handleEppRopaSizeChange(itemNombre, sizeKey, value)}
                                                            min="0"
                                                            className="mx-auto"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
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

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-700 mb-3">Botas para Bomberos</h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {BOTAS_SIZES.map(size => (
                                        <div key={size} className="flex items-center">
                                            <label className="text-sm text-gray-700 w-28">Talla {size === 'otra' ? 'Otra' : size}</label>
                                            <NumberInput
                                                value={botas[size]}
                                                onChange={(value) => handleBotasChange(size, value)}
                                                min="0"
                                            />
                                        </div>
                                    ))}
                                    <div className="col-span-full">
                                        <label className="text-sm text-gray-700">Otra talla (texto)</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Especifica otra talla, por ejemplo 44/45..."
                                            value={botas.otratalla}
                                            maxLength={80}
                                            onChange={(e) => handleBotasOtraTallaText(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-full">
                                        <label className="text-sm text-gray-700">Observaciones</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Notas generales de botas"
                                            value={botas.observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleBotasObsChange(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-700 mb-3">Otros Equipos EPP</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {EPP_EQUIPO_ITEMS.map(item => (
                                        <div key={item} className="flex items-center justify-between">
                                            <label className="text-sm text-gray-700">{item}</label>
                                            <div className="flex items-center space-x-2">
                                                <NumberInput
                                                    value={eppEquipo[item].cantidad}
                                                    onChange={(value) => handleListQuantityChange(setEppEquipo)(item, value)}
                                                    min="0"
                                                />
                                                <input
                                                    type="text"
                                                    className="w-40 px-2 py-1 border border-gray-300 rounded"
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
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button
                                        type="button"
                                        className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white"
                                        onClick={() => setEppEquipoCustom(prev => [...prev, { item: '', cantidad: 0, observaciones: '' }])}
                                    >
                                        Añadir otro
                                    </button>
                                </div>
                                {eppEquipoCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {eppEquipoCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre del ítem" value={row.item} onChange={(e) => setEppEquipoCustom(prev => prev.map((r,i) => i===idx ? { ...r, item: e.target.value } : r))} />
                                                <NumberInput value={row.cantidad} onChange={(value) => setEppEquipoCustom(prev => prev.map((r,i) => i===idx ? { ...r, cantidad: value } : r))} min="0" />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e) => setEppEquipoCustom(prev => prev.map((r,i) => i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={() => setEppEquipoCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* EPP Ropa - Otros */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Ropa - Otros</h3>
                                    <button
                                        type="button"
                                        className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white"
                                        onClick={() => setEppRopaCustom(prev => [...prev, { item: '', xs:0, s:0, m:0, l:0, xl:0, observaciones:'' }])}
                                    >
                                        Añadir otro
                                    </button>
                                </div>
                                {eppRopaCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay prendas personalizadas aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {eppRopaCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Prenda" value={row.item} onChange={(e) => setEppRopaCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                {['xs','s','m','l','xl'].map(sizeKey => (
                                                    <NumberInput
                                                        key={sizeKey}
                                                        value={row[sizeKey]}
                                                        onChange={(value) => setEppRopaCustom(prev => prev.map((r,i)=> i===idx ? { ...r, [sizeKey]: value } : r))}
                                                        min="0"
                                                    />
                                                ))}
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1" placeholder="Observaciones" value={row.observaciones} onChange={(e) => setEppRopaCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={() => setEppRopaCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-700 mb-3">Guantes</h3>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {GUANTES_SIZES.map(talla => (
                                        <div key={talla} className="flex items-center">
                                            <label className="text-sm text-gray-700 w-28">Talla {talla}</label>
                                            <NumberInput
                                                value={guantes[talla]}
                                                onChange={(value) => handleGuantesChange(talla, value)}
                                                min="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 grid grid-cols-1 gap-3">
                                    <div className="flex items-center">
                                        <label className="text-sm text-gray-700 w-40">Otra talla (texto)</label>
                                        <input
                                            type="text"
                                            className="flex-1 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Describe talla extra (por ej. Talla única, 7.5, etc.)"
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
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Herramientas</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {HERRAMIENTAS_ITEMS.map(tool => (
                                <div key={tool} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{tool}</label>
                                    <div className="flex items-center space-x-2">
                                        <NumberInput
                                            value={herramientas[tool].cantidad}
                                            onChange={(value) => handleListQuantityChange(setHerramientas)(tool, value)}
                                            min="0"
                                        />
                                        <input
                                            type="text"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                            value={herramientas[tool].observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleListObsChange(setHerramientas)(tool, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Herramientas - Otros */}
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button
                                        type="button"
                                        className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white"
                                        onClick={() => setHerramientasCustom(prev => [...prev, { item: '', cantidad: 0, observaciones: '' }])}
                                    >
                                        Añadir otro
                                    </button>
                                </div>
                                {herramientasCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {herramientasCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setHerramientasCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <NumberInput value={row.cantidad} onChange={(value) => setHerramientasCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))} min="0" />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setHerramientasCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setHerramientasCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Logística Vehículos */}
                {activeSection === 'logistics' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Logística: Repuestos y Combustibles</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {LOGISTICA_REPUESTOS_ITEMS.map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex items-center">
                                            <span className="mr-1">S/.</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="Monto"
                                                value={logisticaRepuestos[item].costo}
                                                onChange={(e) => handleListCostChange(setLogisticaRepuestos)(item, e.target.value)}
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                            value={logisticaRepuestos[item].observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleListObsChange(setLogisticaRepuestos)(item, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Logística - Otros */}
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setLogisticaRepuestosCustom(prev => [...prev, { item:'', costo:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {logisticaRepuestosCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {logisticaRepuestosCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setLogisticaRepuestosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <div className="flex items-center">
                                                    <span className="mr-1">S/.</span>
                                                    <input type="number" min="0" step="0.01" className="px-2 py-1 border border-gray-300 rounded" placeholder="Costo" value={row.costo} onChange={(e)=> setLogisticaRepuestosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, costo: Number(e.target.value)||0 } : r))} />
                                                </div>
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setLogisticaRepuestosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setLogisticaRepuestosCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Alimentación */}
                {activeSection === 'food' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Alimentación y Bebidas</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {ALIMENTACION_ITEMS.map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <NumberInput
                                            value={alimentacion[item].cantidad}
                                            onChange={(value) => handleListQuantityChange(setAlimentacion)(item, value)}
                                            min="0"
                                        />
                                        <input
                                            type="text"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                            value={alimentacion[item].observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleListObsChange(setAlimentacion)(item, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Alimentación - Otros */}
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setAlimentacionCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {alimentacionCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {alimentacionCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setAlimentacionCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <NumberInput value={row.cantidad} onChange={(value) => setAlimentacionCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))} min="0" />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setAlimentacionCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setAlimentacionCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
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
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Equipo de Campo</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {CAMPO_ITEMS.map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <NumberInput
                                            value={logisticaCampo[item].cantidad}
                                            onChange={(value) => handleListQuantityChange(setLogisticaCampo)(item, value)}
                                            min="0"
                                        />
                                        <input
                                            type="text"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                            value={logisticaCampo[item].observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleListObsChange(setLogisticaCampo)(item, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Campo - Otros */}
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setLogisticaCampoCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {logisticaCampoCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {logisticaCampoCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setLogisticaCampoCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <NumberInput value={row.cantidad} onChange={(value) => setLogisticaCampoCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))} min="0" />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setLogisticaCampoCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setLogisticaCampoCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
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
                            <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Limpieza Personal</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {LIMPIEZA_PERSONAL_ITEMS.map(item => (
                                    <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                        <label className="text-sm font-medium text-gray-700">{item}</label>
                                        <div className="flex items-center space-x-2">
                                            <NumberInput
                                                value={limpiezaPersonal[item].cantidad}
                                                onChange={(value) => handleListQuantityChange(setLimpiezaPersonal)(item, value)}
                                                min="0"
                                            />
                                            <input
                                                type="text"
                                                className="w-40 px-2 py-1 border border-gray-300 rounded"
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
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setLimpiezaPersonalCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {limpiezaPersonalCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {limpiezaPersonalCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setLimpiezaPersonalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <NumberInput value={row.cantidad} onChange={(value) => setLimpiezaPersonalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))} min="0" />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setLimpiezaPersonalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setLimpiezaPersonalCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Limpieza General */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Limpieza General</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {LIMPIEZA_GENERAL_ITEMS.map(item => (
                                    <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                        <label className="text-sm font-medium text-gray-700">{item}</label>
                                        <div className="flex items-center space-x-2">
                                            <NumberInput
                                                value={limpiezaGeneral[item].cantidad}
                                                onChange={(value) => handleListQuantityChange(setLimpiezaGeneral)(item, value)}
                                                min="0"
                                            />
                                            <input
                                                type="text"
                                                className="w-40 px-2 py-1 border border-gray-300 rounded"
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
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setLimpiezaGeneralCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {limpiezaGeneralCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {limpiezaGeneralCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setLimpiezaGeneralCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <NumberInput value={row.cantidad} onChange={(value) => setLimpiezaGeneralCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))} min="0" />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setLimpiezaGeneralCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setLimpiezaGeneralCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
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
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Medicamentos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {MEDICAMENTOS_ITEMS.map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <NumberInput
                                            value={medicamentos[item].cantidad}
                                            onChange={(value) => handleListQuantityChange(setMedicamentos)(item, value)}
                                            min="0"
                                        />
                                        <input
                                            type="text"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                            value={medicamentos[item].observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleListObsChange(setMedicamentos)(item, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Medicamentos - Otros */}
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setMedicamentosCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {medicamentosCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {medicamentosCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setMedicamentosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <NumberInput value={row.cantidad} onChange={(value) => setMedicamentosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))} min="0" />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setMedicamentosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setMedicamentosCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
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
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Rescate Animal</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {RESCATE_ANIMAL_ITEMS.map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <NumberInput
                                            value={rescateAnimal[item].cantidad}
                                            onChange={(value) => handleListQuantityChange(setRescateAnimal)(item, value)}
                                            min="0"
                                        />
                                        <input
                                            type="text"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                            value={rescateAnimal[item].observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleListObsChange(setRescateAnimal)(item, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Rescate Animal - Otros */}
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setRescateAnimalCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {rescateAnimalCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {rescateAnimalCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setRescateAnimalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <NumberInput value={row.cantidad} onChange={(value) => setRescateAnimalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: value } : r))} min="0" />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setRescateAnimalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setRescateAnimalCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* Footer */}
                {renderNavigation()}
            </div>
        </form>
    );
};

export default BombForm;