-- =============================================
-- SISTEMA DE ETIQUETAS V2.5 - BASE DE DATOS COMPLETA
-- Generado: 5/11/2025, 5:32:52 p. m.
-- =============================================


-- Tabla: chat_canales
CREATE TABLE IF NOT EXISTS chat_canales (
    id_canal SERIAL,
    nombre_canal VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo_canal VARCHAR(20) DEFAULT 'general'::character varying,
    departamento INTEGER,
    creado_por INTEGER,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: chat_mensajes
CREATE TABLE IF NOT EXISTS chat_mensajes (
    id_mensaje SERIAL,
    id_canal INTEGER,
    id_usuario INTEGER,
    contenido TEXT NOT NULL,
    tipo_mensaje VARCHAR(20) DEFAULT 'texto'::character varying,
    editado BOOLEAN DEFAULT false,
    fecha_mensaje TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_edicion TIMESTAMP,
    respondiendo_a INTEGER
);

-- Tabla: chat_mensajes_no_leidos
CREATE TABLE IF NOT EXISTS chat_mensajes_no_leidos (
    id_no_leido SERIAL,
    id_mensaje INTEGER,
    id_usuario INTEGER,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: chat_participantes
CREATE TABLE IF NOT EXISTS chat_participantes (
    id_participante SERIAL,
    id_canal INTEGER,
    id_usuario INTEGER,
    rol_participante VARCHAR(20) DEFAULT 'miembro'::character varying,
    silenciado BOOLEAN DEFAULT false,
    fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: chat_usuarios_en_linea
CREATE TABLE IF NOT EXISTS chat_usuarios_en_linea (
    id_estado SERIAL,
    id_usuario INTEGER,
    estado VARCHAR(20) DEFAULT 'en_linea'::character varying,
    ultimo_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: cola_impresion
CREATE TABLE IF NOT EXISTS cola_impresion (
    id SERIAL,
    id_solicitud INTEGER,
    numero_solicitud VARCHAR(50) NOT NULL,
    qr_code VARCHAR(100) NOT NULL,
    nombre_producto VARCHAR(255) NOT NULL,
    descripcion_adicional VARCHAR(255),
    unidad_medida VARCHAR(20) DEFAULT 'UNIDAD'::character varying,
    id_producto INTEGER NOT NULL,
    cantidad_solicitada INTEGER NOT NULL,
    cantidad_a_imprimir INTEGER NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente'::character varying,
    error_mensaje TEXT,
    fecha_creacion TIMESTAMP DEFAULT now(),
    fecha_impresion TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    costurera_nombre VARCHAR(255),
    empresa VARCHAR(100) DEFAULT 'HECHO EN PERU'::character varying,
    cantidad INTEGER DEFAULT 1
);

-- Tabla: cola_impresion_rotulado
CREATE TABLE IF NOT EXISTS cola_impresion_rotulado (
    id SERIAL,
    id_solicitud INTEGER,
    numero_solicitud VARCHAR(100),
    nombre_producto VARCHAR(255),
    cantidad INTEGER,
    datos_zpl TEXT,
    fecha_impresion TIMESTAMP DEFAULT now(),
    codigo_producto VARCHAR(50),
    unidad_medida VARCHAR(20),
    tela VARCHAR(100),
    tamano VARCHAR(50)
);

-- Tabla: config_impresion_especiales
CREATE TABLE IF NOT EXISTS config_impresion_especiales (
    id_config SERIAL,
    id_producto_especial INTEGER NOT NULL,
    mostrar_nombre BOOLEAN DEFAULT true,
    mostrar_modelo BOOLEAN DEFAULT false,
    mostrar_unidad BOOLEAN DEFAULT false,
    mostrar_id BOOLEAN DEFAULT true,
    mostrar_empresa BOOLEAN DEFAULT true,
    fecha_configuracion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_configuro INTEGER
);

-- Tabla: contadores_lotes
CREATE TABLE IF NOT EXISTS contadores_lotes (
    id_contador SERIAL,
    fecha_actual DATE NOT NULL DEFAULT CURRENT_DATE,
    id_departamento INTEGER,
    contador_diario INTEGER DEFAULT 0
);

-- Tabla: departamentos
CREATE TABLE IF NOT EXISTS departamentos (
    id_departamento SERIAL,
    nombre_departamento VARCHAR(50) NOT NULL,
    descripcion TEXT,
    codigo_departamento VARCHAR(10) NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: entidades
CREATE TABLE IF NOT EXISTS entidades (
    id_entidad SERIAL,
    nombre_entidad VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT now(),
    fecha_modificacion TIMESTAMP DEFAULT now()
);

-- Tabla: etiquetas_generadas
CREATE TABLE IF NOT EXISTS etiquetas_generadas (
    id_etiqueta SERIAL,
    id_solicitud INTEGER NOT NULL,
    codigo_qr TEXT NOT NULL,
    numero_serie VARCHAR(50) NOT NULL,
    formato_etiqueta VARCHAR(20) DEFAULT 'estandar'::character varying,
    estado_impresion VARCHAR(20) DEFAULT 'generada'::character varying,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_impresion TIMESTAMP,
    impresora_utilizada VARCHAR(50),
    usuario_impresion INTEGER
);

-- Tabla: gestion_impresora
CREATE TABLE IF NOT EXISTS gestion_impresora (
    id_gestion SERIAL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_evento VARCHAR(50) NOT NULL,
    id_solicitud INTEGER,
    cantidad_etiquetas INTEGER DEFAULT 0,
    estado_impresora VARCHAR(50) DEFAULT 'desconocido'::character varying,
    codigo_error VARCHAR(100),
    mensaje_detalle TEXT,
    duracion_segundos INTEGER DEFAULT 0,
    prioridad VARCHAR(20) DEFAULT 'normal'::character varying,
    posicion_cola INTEGER DEFAULT 0,
    etiquetas_impresas_dia INTEGER DEFAULT 0,
    tiempo_respuesta_ms INTEGER DEFAULT 0,
    usuario_responsable INTEGER,
    ip_impresora INET DEFAULT '192.168.15.34'::inet,
    puerto_impresora INTEGER DEFAULT 9100,
    version_firmware VARCHAR(50),
    creado_por VARCHAR(100),
    datos_adicionales JSONB DEFAULT '{}'::jsonb
);

-- Tabla: historial_solicitudes
CREATE TABLE IF NOT EXISTS historial_solicitudes (
    id_historial SERIAL,
    id_solicitud INTEGER NOT NULL,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    usuario_cambio INTEGER NOT NULL,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comentarios TEXT
);

-- Tabla: historial_supervisor
CREATE TABLE IF NOT EXISTS historial_supervisor (
    id_historial SERIAL,
    id_supervisor INTEGER NOT NULL,
    id_costurera_afectada INTEGER,
    id_solicitud_modificada INTEGER,
    accion_realizada VARCHAR(100) NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    requirio_password BOOLEAN DEFAULT false,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: plantillas_etiquetas
CREATE TABLE IF NOT EXISTS plantillas_etiquetas (
    id_plantilla SERIAL,
    nombre_plantilla VARCHAR(100) NOT NULL,
    descripcion TEXT,
    ancho_dots INTEGER DEFAULT 812,
    alto_dots INTEGER DEFAULT 203,
    dpi INTEGER DEFAULT 203,
    config_elementos JSONB NOT NULL DEFAULT '{"elementos": []}'::jsonb,
    zpl_template TEXT,
    activa BOOLEAN DEFAULT true,
    es_default BOOLEAN DEFAULT false,
    creado_por VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT now(),
    fecha_actualizacion TIMESTAMP DEFAULT now()
);

-- Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
    id_producto SERIAL,
    codigo_producto VARCHAR(30) NOT NULL,
    nombre_producto VARCHAR(100) NOT NULL,
    descripcion_corta VARCHAR(100),
    categoria VARCHAR(50),
    subcategoria VARCHAR(50),
    marca VARCHAR(30),
    modelo VARCHAR(50),
    codigo_barras VARCHAR(30),
    unidad_medida VARCHAR(20) DEFAULT 'UNIDAD'::character varying,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_producto_original VARCHAR(20),
    sku VARCHAR(100),
    precios TEXT,
    mostrar_qr BOOLEAN DEFAULT true,
    mostrar_nombre BOOLEAN DEFAULT true,
    mostrar_id BOOLEAN DEFAULT false,
    mostrar_unidad BOOLEAN DEFAULT true,
    mostrar_modelo BOOLEAN DEFAULT true,
    mostrar_empresa BOOLEAN DEFAULT true,
    empresa VARCHAR(100) DEFAULT 'HECHO EN PERU'::character varying
);

-- Tabla: productos_especiales
CREATE TABLE IF NOT EXISTS productos_especiales (
    id_producto_especial SERIAL,
    codigo_producto VARCHAR(50),
    nombre_producto VARCHAR(255) NOT NULL,
    descripcion_corta VARCHAR(255),
    categoria VARCHAR(100) DEFAULT 'Productos Especiales'::character varying,
    subcategoria VARCHAR(100),
    tipo_combo VARCHAR(50) DEFAULT 'JUEGO'::character varying,
    id_producto_1 INTEGER NOT NULL,
    cantidad_producto_1 INTEGER DEFAULT 1,
    id_producto_2 INTEGER,
    cantidad_producto_2 INTEGER DEFAULT 1,
    id_producto_3 INTEGER,
    cantidad_producto_3 INTEGER DEFAULT 1,
    id_producto_4 INTEGER,
    cantidad_producto_4 INTEGER DEFAULT 1,
    mostrar_qr BOOLEAN DEFAULT true,
    mostrar_nombre BOOLEAN DEFAULT true,
    mostrar_id BOOLEAN DEFAULT true,
    mostrar_unidad BOOLEAN DEFAULT true,
    mostrar_modelo BOOLEAN DEFAULT true,
    mostrar_empresa BOOLEAN DEFAULT true,
    unidad_medida VARCHAR(50) DEFAULT 'JUEGO'::character varying,
    precio_venta NUMERIC,
    observaciones TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: registros_productos_especiales
CREATE TABLE IF NOT EXISTS registros_productos_especiales (
    id_registro SERIAL,
    id_producto_especial INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    cantidad_juego INTEGER NOT NULL,
    cantidad_producto_1_solicitada INTEGER DEFAULT 0,
    cantidad_producto_1_impresa INTEGER DEFAULT 0,
    cantidad_producto_2_solicitada INTEGER DEFAULT 0,
    cantidad_producto_2_impresa INTEGER DEFAULT 0,
    cantidad_producto_3_solicitada INTEGER DEFAULT 0,
    cantidad_producto_3_impresa INTEGER DEFAULT 0,
    cantidad_producto_4_solicitada INTEGER DEFAULT 0,
    cantidad_producto_4_impresa INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'parcial'::character varying,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: sesiones_supervisor
CREATE TABLE IF NOT EXISTS sesiones_supervisor (
    id_sesion SERIAL,
    id_supervisor INTEGER NOT NULL,
    id_costurera_activa INTEGER,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT true
);

-- Tabla: sesiones_usuarios
CREATE TABLE IF NOT EXISTS sesiones_usuarios (
    id_sesion SERIAL,
    id_usuario INTEGER NOT NULL,
    token_sesion VARCHAR(255) NOT NULL,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    activa BOOLEAN DEFAULT true
);

-- Tabla: solicitudes_especiales
CREATE TABLE IF NOT EXISTS solicitudes_especiales (
    id_solicitud_especial SERIAL,
    numero_solicitud VARCHAR(50) NOT NULL,
    id_producto_especial INTEGER NOT NULL,
    id_usuario_costurera INTEGER NOT NULL,
    id_usuario_supervisor INTEGER,
    cantidad_solicitada INTEGER NOT NULL DEFAULT 1,
    cantidad_total_etiquetas INTEGER,
    estado VARCHAR(50) DEFAULT 'pendiente'::character varying,
    prioridad VARCHAR(20) DEFAULT 'normal'::character varying,
    observaciones TEXT,
    observaciones_supervisor TEXT,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMP,
    fecha_inicio_produccion TIMESTAMP,
    fecha_completado TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    empresa VARCHAR(100) DEFAULT 'HECHO EN PERU'::character varying,
    qr_code VARCHAR(100)
);

-- Tabla: solicitudes_etiquetas
CREATE TABLE IF NOT EXISTS solicitudes_etiquetas (
    id_solicitud SERIAL,
    numero_solicitud VARCHAR(20) NOT NULL,
    id_usuario INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    lote_produccion VARCHAR(30) NOT NULL,
    cantidad_solicitada INTEGER NOT NULL,
    fecha_produccion DATE NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prioridad VARCHAR(20) DEFAULT 'normal'::character varying,
    estado VARCHAR(20) DEFAULT 'pendiente'::character varying,
    observaciones TEXT,
    datos_qr JSONB,
    creado_por_supervisor BOOLEAN DEFAULT false,
    supervisor_id INTEGER,
    observaciones_supervisor TEXT,
    qr_code VARCHAR(100),
    id_producto_especial INTEGER,
    numero_solicitud_grupo VARCHAR(50),
    empresa VARCHAR(100) DEFAULT 'HECHO EN PERU'::character varying,
    rotulado_impreso BOOLEAN DEFAULT false,
    qr_impreso BOOLEAN DEFAULT false,
    config_logo_misti BOOLEAN DEFAULT true,
    config_iconos BOOLEAN DEFAULT true,
    logo_principal VARCHAR(50) DEFAULT 'camitex'::character varying
);

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL,
    codigo_empleado VARCHAR(20) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    id_departamento INTEGER NOT NULL,
    puesto VARCHAR(50),
    nivel_acceso VARCHAR(20) DEFAULT 'operador'::character varying,
    activo BOOLEAN DEFAULT true,
    fecha_ingreso DATE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_hash VARCHAR(255),
    ultimo_login TIMESTAMP,
    activo_sesion BOOLEAN DEFAULT false,
    genero VARCHAR(10) DEFAULT 'femenino'::character varying,
    auto_services BOOLEAN DEFAULT false,
    auto_servicesgd BOOLEAN DEFAULT false
);

-- =============================================
-- PRIMARY KEYS
-- =============================================

ALTER TABLE chat_canales ADD PRIMARY KEY (id_canal);
ALTER TABLE chat_mensajes ADD PRIMARY KEY (id_mensaje);
ALTER TABLE chat_mensajes_no_leidos ADD PRIMARY KEY (id_no_leido);
ALTER TABLE chat_participantes ADD PRIMARY KEY (id_participante);
ALTER TABLE chat_usuarios_en_linea ADD PRIMARY KEY (id_estado);
ALTER TABLE cola_impresion ADD PRIMARY KEY (id);
ALTER TABLE cola_impresion_rotulado ADD PRIMARY KEY (id);
ALTER TABLE config_impresion_especiales ADD PRIMARY KEY (id_config);
ALTER TABLE contadores_lotes ADD PRIMARY KEY (id_contador);
ALTER TABLE departamentos ADD PRIMARY KEY (id_departamento);
ALTER TABLE entidades ADD PRIMARY KEY (id_entidad);
ALTER TABLE etiquetas_generadas ADD PRIMARY KEY (id_etiqueta);
ALTER TABLE gestion_impresora ADD PRIMARY KEY (id_gestion);
ALTER TABLE historial_solicitudes ADD PRIMARY KEY (id_historial);
ALTER TABLE historial_supervisor ADD PRIMARY KEY (id_historial);
ALTER TABLE plantillas_etiquetas ADD PRIMARY KEY (id_plantilla);
ALTER TABLE productos ADD PRIMARY KEY (id_producto);
ALTER TABLE productos_especiales ADD PRIMARY KEY (id_producto_especial);
ALTER TABLE registros_productos_especiales ADD PRIMARY KEY (id_registro);
ALTER TABLE sesiones_supervisor ADD PRIMARY KEY (id_sesion);
ALTER TABLE sesiones_usuarios ADD PRIMARY KEY (id_sesion);
ALTER TABLE solicitudes_especiales ADD PRIMARY KEY (id_solicitud_especial);
ALTER TABLE solicitudes_etiquetas ADD PRIMARY KEY (id_solicitud);
ALTER TABLE usuarios ADD PRIMARY KEY (id_usuario);

-- =============================================
-- FOREIGN KEYS
-- =============================================

ALTER TABLE chat_canales ADD CONSTRAINT chat_canales_departamento_fkey FOREIGN KEY (departamento) REFERENCES departamentos(id_departamento);
ALTER TABLE chat_canales ADD CONSTRAINT chat_canales_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario);
ALTER TABLE chat_mensajes ADD CONSTRAINT chat_mensajes_respondiendo_a_fkey FOREIGN KEY (respondiendo_a) REFERENCES chat_mensajes(id_mensaje);
ALTER TABLE chat_mensajes ADD CONSTRAINT chat_mensajes_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE chat_mensajes ADD CONSTRAINT chat_mensajes_id_canal_fkey FOREIGN KEY (id_canal) REFERENCES chat_canales(id_canal);
ALTER TABLE chat_mensajes_no_leidos ADD CONSTRAINT chat_mensajes_no_leidos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE chat_mensajes_no_leidos ADD CONSTRAINT chat_mensajes_no_leidos_id_mensaje_fkey FOREIGN KEY (id_mensaje) REFERENCES chat_mensajes(id_mensaje);
ALTER TABLE chat_participantes ADD CONSTRAINT chat_participantes_id_canal_fkey FOREIGN KEY (id_canal) REFERENCES chat_canales(id_canal);
ALTER TABLE chat_participantes ADD CONSTRAINT chat_participantes_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE chat_usuarios_en_linea ADD CONSTRAINT chat_usuarios_en_linea_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE cola_impresion ADD CONSTRAINT cola_impresion_id_solicitud_fkey FOREIGN KEY (id_solicitud) REFERENCES solicitudes_etiquetas(id_solicitud);
ALTER TABLE config_impresion_especiales ADD CONSTRAINT config_impresion_especiales_usuario_configuro_fkey FOREIGN KEY (usuario_configuro) REFERENCES usuarios(id_usuario);
ALTER TABLE config_impresion_especiales ADD CONSTRAINT config_impresion_especiales_id_producto_especial_fkey FOREIGN KEY (id_producto_especial) REFERENCES productos_especiales(id_producto_especial);
ALTER TABLE contadores_lotes ADD CONSTRAINT contadores_lotes_id_departamento_fkey FOREIGN KEY (id_departamento) REFERENCES departamentos(id_departamento);
ALTER TABLE etiquetas_generadas ADD CONSTRAINT etiquetas_generadas_id_solicitud_fkey FOREIGN KEY (id_solicitud) REFERENCES solicitudes_etiquetas(id_solicitud);
ALTER TABLE etiquetas_generadas ADD CONSTRAINT etiquetas_generadas_usuario_impresion_fkey FOREIGN KEY (usuario_impresion) REFERENCES usuarios(id_usuario);
ALTER TABLE gestion_impresora ADD CONSTRAINT gestion_impresora_usuario_responsable_fkey FOREIGN KEY (usuario_responsable) REFERENCES usuarios(id_usuario);
ALTER TABLE gestion_impresora ADD CONSTRAINT gestion_impresora_id_solicitud_fkey FOREIGN KEY (id_solicitud) REFERENCES solicitudes_etiquetas(id_solicitud);
ALTER TABLE historial_solicitudes ADD CONSTRAINT historial_solicitudes_usuario_cambio_fkey FOREIGN KEY (usuario_cambio) REFERENCES usuarios(id_usuario);
ALTER TABLE historial_solicitudes ADD CONSTRAINT historial_solicitudes_id_solicitud_fkey FOREIGN KEY (id_solicitud) REFERENCES solicitudes_etiquetas(id_solicitud);
ALTER TABLE historial_supervisor ADD CONSTRAINT fk_costurera_hist FOREIGN KEY (id_costurera_afectada) REFERENCES usuarios(id_usuario);
ALTER TABLE historial_supervisor ADD CONSTRAINT fk_solicitud_hist FOREIGN KEY (id_solicitud_modificada) REFERENCES solicitudes_etiquetas(id_solicitud);
ALTER TABLE historial_supervisor ADD CONSTRAINT fk_supervisor_hist FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario);
ALTER TABLE productos_especiales ADD CONSTRAINT productos_especiales_id_producto_2_fkey FOREIGN KEY (id_producto_2) REFERENCES productos(id_producto);
ALTER TABLE productos_especiales ADD CONSTRAINT productos_especiales_id_producto_3_fkey FOREIGN KEY (id_producto_3) REFERENCES productos(id_producto);
ALTER TABLE productos_especiales ADD CONSTRAINT productos_especiales_id_producto_4_fkey FOREIGN KEY (id_producto_4) REFERENCES productos(id_producto);
ALTER TABLE productos_especiales ADD CONSTRAINT productos_especiales_id_producto_1_fkey FOREIGN KEY (id_producto_1) REFERENCES productos(id_producto);
ALTER TABLE sesiones_supervisor ADD CONSTRAINT fk_supervisor_sesion FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario);
ALTER TABLE sesiones_supervisor ADD CONSTRAINT fk_costurera_activa_sesion FOREIGN KEY (id_costurera_activa) REFERENCES usuarios(id_usuario);
ALTER TABLE sesiones_usuarios ADD CONSTRAINT sesiones_usuarios_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE solicitudes_especiales ADD CONSTRAINT solicitudes_especiales_id_usuario_costurera_fkey FOREIGN KEY (id_usuario_costurera) REFERENCES usuarios(id_usuario);
ALTER TABLE solicitudes_especiales ADD CONSTRAINT solicitudes_especiales_id_usuario_supervisor_fkey FOREIGN KEY (id_usuario_supervisor) REFERENCES usuarios(id_usuario);
ALTER TABLE solicitudes_especiales ADD CONSTRAINT solicitudes_especiales_id_producto_especial_fkey FOREIGN KEY (id_producto_especial) REFERENCES productos_especiales(id_producto_especial);
ALTER TABLE solicitudes_etiquetas ADD CONSTRAINT fk_supervisor_creador FOREIGN KEY (supervisor_id) REFERENCES usuarios(id_usuario);
ALTER TABLE solicitudes_etiquetas ADD CONSTRAINT solicitudes_etiquetas_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE solicitudes_etiquetas ADD CONSTRAINT solicitudes_etiquetas_id_producto_especial_fkey FOREIGN KEY (id_producto_especial) REFERENCES productos_especiales(id_producto_especial);
ALTER TABLE solicitudes_etiquetas ADD CONSTRAINT solicitudes_etiquetas_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES productos(id_producto);
ALTER TABLE usuarios ADD CONSTRAINT usuarios_id_departamento_fkey FOREIGN KEY (id_departamento) REFERENCES departamentos(id_departamento);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_chat_mensajes_canal ON chat_mensajes(id_canal);
CREATE INDEX IF NOT EXISTS idx_chat_mensajes_fecha ON chat_mensajes(fecha_mensaje);
CREATE UNIQUE INDEX IF NOT EXISTS chat_mensajes_no_leidos_id_mensaje_id_usuario_key ON chat_mensajes_no_leidos(id_usuario);
CREATE INDEX IF NOT EXISTS idx_chat_no_leidos_mensaje ON chat_mensajes_no_leidos(id_mensaje);
CREATE INDEX IF NOT EXISTS idx_chat_no_leidos_usuario ON chat_mensajes_no_leidos(id_usuario);
CREATE UNIQUE INDEX IF NOT EXISTS chat_participantes_id_canal_id_usuario_key ON chat_participantes(id_usuario);
CREATE INDEX IF NOT EXISTS idx_chat_participantes_canal ON chat_participantes(id_canal);
CREATE INDEX IF NOT EXISTS idx_chat_participantes_usuario ON chat_participantes(id_usuario);
CREATE UNIQUE INDEX IF NOT EXISTS chat_usuarios_en_linea_id_usuario_key ON chat_usuarios_en_linea(id_usuario);
CREATE UNIQUE INDEX IF NOT EXISTS cola_impresion_qr_code_key ON cola_impresion(qr_code);
CREATE INDEX IF NOT EXISTS idx_cola_impresion_estado ON cola_impresion(estado);
CREATE INDEX IF NOT EXISTS idx_cola_impresion_fecha ON cola_impresion(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_cola_impresion_qr ON cola_impresion(qr_code);
CREATE INDEX IF NOT EXISTS idx_cola_impresion_solicitud ON cola_impresion(id_solicitud);
CREATE INDEX IF NOT EXISTS idx_cola_rotulado_fecha ON cola_impresion_rotulado(fecha_impresion);
CREATE INDEX IF NOT EXISTS idx_cola_rotulado_solicitud ON cola_impresion_rotulado(id_solicitud);
CREATE UNIQUE INDEX IF NOT EXISTS config_impresion_especiales_id_producto_especial_key ON config_impresion_especiales(id_producto_especial);
CREATE INDEX IF NOT EXISTS idx_config_especiales_producto ON config_impresion_especiales(id_producto_especial);
CREATE UNIQUE INDEX IF NOT EXISTS contadores_lotes_fecha_actual_id_departamento_key ON contadores_lotes(fecha_actual);
CREATE UNIQUE INDEX IF NOT EXISTS departamentos_codigo_departamento_key ON departamentos(codigo_departamento);
CREATE UNIQUE INDEX IF NOT EXISTS departamentos_nombre_departamento_key ON departamentos(nombre_departamento);
CREATE UNIQUE INDEX IF NOT EXISTS entidades_nombre_entidad_key ON entidades(nombre_entidad);
CREATE INDEX IF NOT EXISTS idx_entidades_activo ON entidades(activo);
CREATE UNIQUE INDEX IF NOT EXISTS etiquetas_generadas_numero_serie_key ON etiquetas_generadas(numero_serie);
CREATE INDEX IF NOT EXISTS idx_etiquetas_serie ON etiquetas_generadas(numero_serie);
CREATE INDEX IF NOT EXISTS idx_etiquetas_solicitud ON etiquetas_generadas(id_solicitud);
CREATE INDEX IF NOT EXISTS idx_gestion_impresora_estado ON gestion_impresora(estado_impresora);
CREATE INDEX IF NOT EXISTS idx_gestion_impresora_prioridad ON gestion_impresora(prioridad);
CREATE INDEX IF NOT EXISTS idx_gestion_impresora_solicitud ON gestion_impresora(id_solicitud);
CREATE INDEX IF NOT EXISTS idx_gestion_impresora_timestamp ON gestion_impresora(timestamp);
CREATE INDEX IF NOT EXISTS idx_gestion_impresora_tipo_evento ON gestion_impresora(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_historial_solicitud ON historial_solicitudes(id_solicitud);
CREATE INDEX IF NOT EXISTS idx_historial_supervisor ON historial_supervisor(id_supervisor);
CREATE UNIQUE INDEX IF NOT EXISTS chk_solo_un_default ON plantillas_etiquetas(activa);
CREATE INDEX IF NOT EXISTS idx_plantillas_activa ON plantillas_etiquetas(activa);
CREATE INDEX IF NOT EXISTS idx_plantillas_default ON plantillas_etiquetas(es_default);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo_producto);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_productos_id_original ON productos(id_producto_original);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre_producto);
CREATE INDEX IF NOT EXISTS idx_productos_subcategoria ON productos(subcategoria);
CREATE UNIQUE INDEX IF NOT EXISTS productos_codigo_producto_key ON productos(codigo_producto);
CREATE INDEX IF NOT EXISTS idx_productos_especiales_activo ON productos_especiales(activo);
CREATE INDEX IF NOT EXISTS idx_productos_especiales_categoria ON productos_especiales(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_especiales_producto1 ON productos_especiales(id_producto_1);
CREATE INDEX IF NOT EXISTS idx_productos_especiales_producto2 ON productos_especiales(id_producto_2);
CREATE INDEX IF NOT EXISTS idx_productos_especiales_producto3 ON productos_especiales(id_producto_3);
CREATE INDEX IF NOT EXISTS idx_productos_especiales_subcategoria ON productos_especiales(subcategoria);
CREATE UNIQUE INDEX IF NOT EXISTS productos_especiales_codigo_producto_key ON productos_especiales(codigo_producto);
CREATE INDEX IF NOT EXISTS idx_registros_estado ON registros_productos_especiales(estado);
CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros_productos_especiales(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_registros_producto_especial ON registros_productos_especiales(id_producto_especial);
CREATE INDEX IF NOT EXISTS idx_registros_usuario ON registros_productos_especiales(id_usuario);
CREATE INDEX IF NOT EXISTS idx_sesiones_supervisor ON sesiones_supervisor(activa);
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones_usuarios(token_sesion);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_activa ON sesiones_usuarios(activa);
CREATE UNIQUE INDEX IF NOT EXISTS sesiones_usuarios_token_sesion_key ON sesiones_usuarios(token_sesion);
CREATE INDEX IF NOT EXISTS idx_solicitudes_especiales_costurera ON solicitudes_especiales(id_usuario_costurera);
CREATE INDEX IF NOT EXISTS idx_solicitudes_especiales_estado ON solicitudes_especiales(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_especiales_numero ON solicitudes_especiales(numero_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_especiales_producto ON solicitudes_especiales(id_producto_especial);
CREATE INDEX IF NOT EXISTS idx_solicitudes_especiales_qr ON solicitudes_especiales(qr_code);
CREATE UNIQUE INDEX IF NOT EXISTS solicitudes_especiales_numero_solicitud_key ON solicitudes_especiales(numero_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_etiquetas(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_etiquetas(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_grupo ON solicitudes_etiquetas(numero_solicitud_grupo);
CREATE INDEX IF NOT EXISTS idx_solicitudes_numero ON solicitudes_etiquetas(numero_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_pendientes ON solicitudes_etiquetas(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_prioridad ON solicitudes_etiquetas(prioridad);
CREATE INDEX IF NOT EXISTS idx_solicitudes_producto ON solicitudes_etiquetas(id_producto);
CREATE INDEX IF NOT EXISTS idx_solicitudes_producto_especial ON solicitudes_etiquetas(id_producto_especial);
CREATE INDEX IF NOT EXISTS idx_solicitudes_qr_code ON solicitudes_etiquetas(qr_code);
CREATE INDEX IF NOT EXISTS idx_solicitudes_qr_impreso ON solicitudes_etiquetas(qr_impreso);
CREATE INDEX IF NOT EXISTS idx_solicitudes_rotulado_impreso ON solicitudes_etiquetas(rotulado_impreso);
CREATE INDEX IF NOT EXISTS idx_solicitudes_supervisor ON solicitudes_etiquetas(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario ON solicitudes_etiquetas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario_fecha ON solicitudes_etiquetas(id_usuario);
CREATE UNIQUE INDEX IF NOT EXISTS solicitudes_etiquetas_numero_solicitud_key ON solicitudes_etiquetas(numero_solicitud);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_auto_services ON usuarios(auto_services);
CREATE INDEX IF NOT EXISTS idx_usuarios_codigo ON usuarios(codigo_empleado);
CREATE INDEX IF NOT EXISTS idx_usuarios_departamento ON usuarios(id_departamento);
CREATE INDEX IF NOT EXISTS idx_usuarios_nivel_acceso ON usuarios(nivel_acceso);
CREATE INDEX IF NOT EXISTS idx_usuarios_ultimo_login ON usuarios(ultimo_login);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_codigo_empleado_key ON usuarios(codigo_empleado);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_key ON usuarios(email);

-- =============================================
-- FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.actualizar_estado_registro_especial()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    total_solicitada INTEGER;
    total_impresa INTEGER;
BEGIN
    total_solicitada := COALESCE(NEW.cantidad_producto_1_solicitada, 0) +
                        COALESCE(NEW.cantidad_producto_2_solicitada, 0) +
                        COALESCE(NEW.cantidad_producto_3_solicitada, 0) +
                        COALESCE(NEW.cantidad_producto_4_solicitada, 0);
    
    total_impresa := COALESCE(NEW.cantidad_producto_1_impresa, 0) +
                     COALESCE(NEW.cantidad_producto_2_impresa, 0) +
                     COALESCE(NEW.cantidad_producto_3_impresa, 0) +
                     COALESCE(NEW.cantidad_producto_4_impresa, 0);
    
    IF total_impresa = 0 THEN
        NEW.estado := 'parcial';
    ELSIF total_impresa >= total_solicitada AND total_solicitada > 0 THEN
        NEW.estado := 'completado';
    ELSE
        NEW.estado := 'pendiente';
    END IF;
    
    NEW.fecha_actualizacion := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.actualizar_fecha_plantilla()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.actualizar_fecha_productos_especiales()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.actualizar_fecha_solicitudes_especiales()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    
    -- Actualizar fechas según cambio de estado
    IF NEW.estado = 'aprobada' AND OLD.estado = 'pendiente' THEN
        NEW.fecha_aprobacion = CURRENT_TIMESTAMP;
    END IF;
    
    IF NEW.estado = 'en_proceso' AND OLD.estado != 'en_proceso' THEN
        NEW.fecha_inicio_produccion = CURRENT_TIMESTAMP;
    END IF;
    
    IF NEW.estado = 'completada' AND OLD.estado != 'completada' THEN
        NEW.fecha_completado = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.actualizar_ultimo_acceso()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE chat_participantes 
    SET ultimo_acceso = CURRENT_TIMESTAMP
    WHERE id_canal = NEW.id_canal AND id_usuario = NEW.id_usuario;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generar_codigo_producto_especial()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Solo generar si no viene código o está vacío
    IF NEW.codigo_producto IS NULL OR NEW.codigo_producto = '' THEN
        NEW.codigo_producto := 'ESP-' || LPAD(nextval('productos_especiales_codigo_seq')::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generar_lote_automatico(p_id_departamento integer)
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
DECLARE
    fecha_hoy DATE := CURRENT_DATE;
    codigo_dept VARCHAR(10);
    contador INTEGER;
    lote_generado VARCHAR(30);
BEGIN
    SELECT codigo_departamento INTO codigo_dept 
    FROM departamentos WHERE id_departamento = p_id_departamento;
    
    INSERT INTO contadores_lotes (fecha_actual, id_departamento, contador_diario)
    VALUES (fecha_hoy, p_id_departamento, 1)
    ON CONFLICT (fecha_actual, id_departamento)
    DO UPDATE SET contador_diario = contadores_lotes.contador_diario + 1
    RETURNING contador_diario INTO contador;
    
    lote_generado := 'LOT-' || TO_CHAR(fecha_hoy, 'YYYYMMDD') || '-' || codigo_dept || '-' || LPAD(contador::TEXT, 3, '0');
    
    RETURN lote_generado;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generar_qr_code_especial()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    codigo_producto_val VARCHAR(50);
    fecha_formato VARCHAR(8);
BEGIN
    -- Obtener el código del producto especial
    SELECT codigo_producto INTO codigo_producto_val
    FROM productos_especiales
    WHERE id_producto_especial = NEW.id_producto_especial;
    
    -- Formato de fecha: YYYYMMDD
    fecha_formato := TO_CHAR(NEW.fecha_solicitud, 'YYYYMMDD');
    
    -- Generar QR: QR-ESP-001-20251018-solicitud_id
    NEW.qr_code := 'QR-' || codigo_producto_val || '-' || fecha_formato || '-' || NEW.numero_solicitud;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.marcar_mensajes_no_leidos()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Marcar el mensaje como no leído para todos los participantes del canal
    -- excepto para el usuario que envió el mensaje
    INSERT INTO chat_mensajes_no_leidos (id_mensaje, id_usuario)
    SELECT NEW.id_mensaje, p.id_usuario
    FROM chat_participantes p
    WHERE p.id_canal = NEW.id_canal 
    AND p.id_usuario != NEW.id_usuario
    AND NOT p.silenciado;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.obtener_estadisticas_impresora(fecha_desde date DEFAULT (CURRENT_DATE - '7 days'::interval))
 RETURNS TABLE(total_impresiones bigint, etiquetas_impresas bigint, tiempo_promedio_impresion numeric, errores_totales bigint, uptime_porcentaje numeric, solicitudes_urgentes bigint, pico_actividad_hora integer)
 LANGUAGE plpgsql
AS $function$
            BEGIN
                RETURN QUERY
                SELECT 
                    COUNT(*) FILTER (WHERE tipo_evento = 'impresion_completada') as total_impresiones,
                    COALESCE(SUM(cantidad_etiquetas) FILTER (WHERE tipo_evento = 'impresion_completada'), 0) as etiquetas_impresas,
                    COALESCE(AVG(duracion_segundos) FILTER (WHERE tipo_evento = 'impresion_completada'), 0) as tiempo_promedio_impresion,
                    COUNT(*) FILTER (WHERE tipo_evento = 'impresion_error') as errores_totales,
                    CASE 
                        WHEN COUNT(*) FILTER (WHERE tipo_evento IN ('conexion', 'desconexion')) > 0 
                        THEN (COUNT(*) FILTER (WHERE tipo_evento = 'conexion') * 100.0 / 
                              NULLIF(COUNT(*) FILTER (WHERE tipo_evento IN ('conexion', 'desconexion')), 0))
                        ELSE 100.0 
                    END as uptime_porcentaje,
                    COUNT(*) FILTER (WHERE prioridad = 'urgente') as solicitudes_urgentes,
                    COALESCE(
                        (SELECT EXTRACT(HOUR FROM timestamp) 
                         FROM gestion_impresora 
                         WHERE timestamp >= fecha_desde AND tipo_evento = 'impresion_completada'
                         GROUP BY EXTRACT(HOUR FROM timestamp) 
                         ORDER BY COUNT(*) DESC 
                         LIMIT 1), 
                        12
                    )::INTEGER as pico_actividad_hora
                FROM gestion_impresora 
                WHERE timestamp >= fecha_desde;
            END;
            $function$
;

CREATE OR REPLACE FUNCTION public.procesar_cola_impresion()
 RETURNS TABLE(id_solicitud integer, prioridad character varying, tiempo_espera_minutos integer, debe_procesar boolean)
 LANGUAGE plpgsql
AS $function$
            BEGIN
                RETURN QUERY
                SELECT 
                    se.id_solicitud,
                    CASE 
                        WHEN se.prioridad = 'urgente' THEN 'urgente'::VARCHAR(20)
                        WHEN EXTRACT(EPOCH FROM (NOW() - se.fecha_solicitud))/3600 > 2 THEN 'alta'::VARCHAR(20)
                        WHEN EXTRACT(EPOCH FROM (NOW() - se.fecha_solicitud))/3600 > 1 THEN 'normal'::VARCHAR(20)
                        ELSE 'baja'::VARCHAR(20)
                    END as prioridad,
                    EXTRACT(EPOCH FROM (NOW() - se.fecha_solicitud))::INTEGER / 60 as tiempo_espera_minutos,
                    (se.prioridad = 'urgente' OR 
                     EXTRACT(EPOCH FROM (NOW() - se.fecha_solicitud))/3600 > 2 OR
                     se.estado = 'aprobada') as debe_procesar
                FROM solicitudes_etiquetas se
                WHERE se.estado IN ('pendiente', 'aprobada')
                ORDER BY 
                    CASE se.prioridad 
                        WHEN 'urgente' THEN 1 
                        WHEN 'alta' THEN 2 
                        WHEN 'normal' THEN 3 
                        ELSE 4 
                    END,
                    se.fecha_solicitud ASC;
            END;
            $function$
;

CREATE OR REPLACE FUNCTION public.update_cola_impresion_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;


-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER trigger_marcar_no_leidos AFTER INSERT ON public.chat_mensajes FOR EACH ROW EXECUTE FUNCTION marcar_mensajes_no_leidos();

CREATE TRIGGER trigger_actualizar_acceso AFTER DELETE ON public.chat_mensajes_no_leidos FOR EACH ROW EXECUTE FUNCTION actualizar_ultimo_acceso();

CREATE TRIGGER update_cola_impresion_updated_at BEFORE UPDATE ON public.cola_impresion FOR EACH ROW EXECUTE FUNCTION update_cola_impresion_updated_at();

CREATE TRIGGER trg_actualizar_fecha_plantilla BEFORE UPDATE ON public.plantillas_etiquetas FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_plantilla();

CREATE TRIGGER trigger_actualizar_fecha_productos_especiales BEFORE UPDATE ON public.productos_especiales FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_productos_especiales();

CREATE TRIGGER trigger_generar_codigo_especial BEFORE INSERT ON public.productos_especiales FOR EACH ROW EXECUTE FUNCTION generar_codigo_producto_especial();

CREATE TRIGGER trigger_actualizar_estado_registro BEFORE INSERT OR UPDATE ON public.registros_productos_especiales FOR EACH ROW EXECUTE FUNCTION actualizar_estado_registro_especial();

CREATE TRIGGER trigger_actualizar_solicitudes_especiales BEFORE UPDATE ON public.solicitudes_especiales FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_solicitudes_especiales();

CREATE TRIGGER trigger_generar_qr_especial BEFORE INSERT ON public.solicitudes_especiales FOR EACH ROW EXECUTE FUNCTION generar_qr_code_especial();

