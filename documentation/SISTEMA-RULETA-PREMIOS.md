# 🎰 Sistema de Ruleta de Premios - CamiTex

## 🎯 Concepto: "Gira y Gana tu Diseño Perfecto"

Sistema de gamificación con límites anti-abuso y tracking completo.

---

## 📊 ESTRUCTURA DE BASE DE DATOS

### Tabla 1: `ruleta_participantes`
```sql
CREATE TABLE ruleta_participantes (
    id_participante SERIAL PRIMARY KEY,
    
    -- Identificación
    telefono VARCHAR(15) NOT NULL UNIQUE,
    nombre VARCHAR(100),
    email VARCHAR(100),
    
    -- Control de participaciones
    intentos_usados INTEGER DEFAULT 0,
    intentos_maximos INTEGER DEFAULT 3, -- 3 giros gratis
    intentos_extra INTEGER DEFAULT 0, -- Comprados o ganados
    
    -- Tracking
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_giro TIMESTAMP,
    ip_registro VARCHAR(45),
    dispositivo_id VARCHAR(100), -- Browser fingerprint
    
    -- Premios ganados
    premios_ganados JSONB DEFAULT '[]'::jsonb,
    total_premios_valor NUMERIC DEFAULT 0,
    
    -- Estado
    bloqueado BOOLEAN DEFAULT false,
    razon_bloqueo TEXT,
    activo BOOLEAN DEFAULT true,
    
    -- Indices
    CONSTRAINT unique_telefono UNIQUE (telefono)
);

CREATE INDEX idx_ruleta_telefono ON ruleta_participantes(telefono);
CREATE INDEX idx_ruleta_dispositivo ON ruleta_participantes(dispositivo_id);
CREATE INDEX idx_ruleta_ultimo_giro ON ruleta_participantes(ultimo_giro);
```

### Tabla 2: `ruleta_premios`
```sql
CREATE TABLE ruleta_premios (
    id_premio SERIAL PRIMARY KEY,
    
    -- Configuración del premio
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50), -- 'descuento', 'regalo', 'servicio', 'cupon'
    
    -- Valor y límites
    valor_monetario NUMERIC,
    porcentaje_descuento INTEGER,
    stock_disponible INTEGER,
    stock_inicial INTEGER,
    
    -- Probabilidad (de 0 a 100)
    probabilidad NUMERIC(5,2) NOT NULL,
    
    -- Condiciones
    monto_minimo_compra NUMERIC DEFAULT 0,
    valido_hasta DATE,
    codigo_cupon VARCHAR(20),
    
    -- Visual
    color_hex VARCHAR(7),
    icono VARCHAR(50),
    posicion_ruleta INTEGER, -- Posición visual en la ruleta
    
    -- Estado
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    
    -- Metadata
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INTEGER REFERENCES usuarios(id_usuario)
);

CREATE INDEX idx_premio_activo ON ruleta_premios(activo);
CREATE INDEX idx_premio_probabilidad ON ruleta_premios(probabilidad);
```

### Tabla 3: `ruleta_giros`
```sql
CREATE TABLE ruleta_giros (
    id_giro SERIAL PRIMARY KEY,
    
    -- Participante
    id_participante INTEGER REFERENCES ruleta_participantes(id_participante),
    telefono VARCHAR(15) NOT NULL,
    
    -- Giro
    id_premio_ganado INTEGER REFERENCES ruleta_premios(id_premio),
    fecha_giro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_intento VARCHAR(20), -- 'gratis', 'extra', 'compartido'
    
    -- Tracking
    ip_giro VARCHAR(45),
    navegador TEXT,
    sistema_operativo VARCHAR(50),
    pais VARCHAR(10),
    ciudad VARCHAR(100),
    
    -- Resultado
    premio_canjeado BOOLEAN DEFAULT false,
    fecha_canje TIMESTAMP,
    pedido_id INTEGER, -- Referencia al pedido donde se usó
    
    -- Detección de fraude
    tiempo_en_pagina INTEGER, -- Segundos antes de girar
    clicks_antes_giro INTEGER,
    sospechoso BOOLEAN DEFAULT false,
    
    CONSTRAINT fk_participante FOREIGN KEY (id_participante) 
        REFERENCES ruleta_participantes(id_participante)
);

CREATE INDEX idx_giro_participante ON ruleta_giros(id_participante);
CREATE INDEX idx_giro_fecha ON ruleta_giros(fecha_giro);
CREATE INDEX idx_giro_canjeado ON ruleta_giros(premio_canjeado);
CREATE INDEX idx_giro_telefono ON ruleta_giros(telefono);
```

### Tabla 4: `ruleta_compartidos`
```sql
CREATE TABLE ruleta_compartidos (
    id_compartido SERIAL PRIMARY KEY,
    
    -- Quien comparte
    id_participante INTEGER REFERENCES ruleta_participantes(id_participante),
    telefono_origen VARCHAR(15) NOT NULL,
    
    -- A quien comparte
    telefono_referido VARCHAR(15),
    nombre_referido VARCHAR(100),
    
    -- Tracking
    fecha_compartido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo VARCHAR(20), -- 'whatsapp', 'facebook', 'link', 'email'
    link_unico VARCHAR(100) UNIQUE,
    
    -- Resultado
    referido_registro BOOLEAN DEFAULT false,
    fecha_registro_referido TIMESTAMP,
    referido_compro BOOLEAN DEFAULT false,
    
    -- Recompensa
    intento_extra_otorgado BOOLEAN DEFAULT false,
    fecha_otorgado TIMESTAMP
);

CREATE INDEX idx_compartido_origen ON ruleta_compartidos(telefono_origen);
CREATE INDEX idx_compartido_link ON ruleta_compartidos(link_unico);
```

### Tabla 5: `ruleta_configuracion`
```sql
CREATE TABLE ruleta_configuracion (
    id_config SERIAL PRIMARY KEY,
    
    -- Límites generales
    intentos_gratis_inicial INTEGER DEFAULT 3,
    intentos_maximos_por_dia INTEGER DEFAULT 5,
    tiempo_entre_giros_minutos INTEGER DEFAULT 30,
    
    -- Sistema anti-abuso
    max_intentos_por_ip INTEGER DEFAULT 10,
    max_intentos_por_dispositivo INTEGER DEFAULT 15,
    bloquear_vpn BOOLEAN DEFAULT true,
    
    -- Reglas de compartir
    intentos_por_compartir INTEGER DEFAULT 1,
    max_compartidos_por_dia INTEGER DEFAULT 5,
    requiere_registro_referido BOOLEAN DEFAULT true,
    
    -- Premios
    probabilidad_premio_grande NUMERIC(5,2) DEFAULT 5.00,
    probabilidad_premio_medio NUMERIC(5,2) DEFAULT 20.00,
    probabilidad_premio_pequeno NUMERIC(5,2) DEFAULT 75.00,
    
    -- Estado
    ruleta_activa BOOLEAN DEFAULT true,
    mensaje_ruleta_inactiva TEXT,
    
    -- Metadata
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modificado_por INTEGER REFERENCES usuarios(id_usuario)
);

-- Solo debe haber un registro de configuración
INSERT INTO ruleta_configuracion DEFAULT VALUES;
```

### Tabla 6: `ruleta_logs_seguridad`
```sql
CREATE TABLE ruleta_logs_seguridad (
    id_log SERIAL PRIMARY KEY,
    
    -- Evento
    tipo_evento VARCHAR(50), -- 'intento_bloqueado', 'vpn_detectado', 'multiples_cuentas'
    gravedad VARCHAR(20), -- 'info', 'warning', 'critical'
    
    -- Detalles
    telefono VARCHAR(15),
    ip VARCHAR(45),
    dispositivo_id VARCHAR(100),
    descripcion TEXT,
    datos_adicionales JSONB,
    
    -- Acción tomada
    accion_tomada VARCHAR(50), -- 'bloqueo', 'alerta', 'ninguna'
    
    -- Timestamp
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_log_tipo ON ruleta_logs_seguridad(tipo_evento);
CREATE INDEX idx_log_fecha ON ruleta_logs_seguridad(fecha_evento);
```

---

## 🎨 CONFIGURACIÓN DE PREMIOS (Ejemplo)

```sql
-- Premios de la ruleta (8 segmentos)
INSERT INTO ruleta_premios (nombre, descripcion, tipo, valor_monetario, probabilidad, color_hex, icono, posicion_ruleta, activo) VALUES
-- Premios grandes (5%)
('Set Completo Gratis', 'Set completo personalizado valorizado en S/250', 'regalo', 250, 2.5, '#FFD700', '🎁', 1, true),
('50% Descuento', 'Descuento del 50% en tu pedido', 'descuento', NULL, 2.5, '#FF6B6B', '🔥', 5, true),

-- Premios medianos (20%)
('Almohada Premium Gratis', 'Almohada memory foam de regalo', 'regalo', 65, 10, '#4ECDC4', '💤', 3, true),
('30% Descuento', '30% off en tu próximo pedido', 'descuento', NULL, 10, '#95E1D3', '💰', 7, true),

-- Premios pequeños (75%)
('Diseño 3D Gratis', 'Visualización 3D personalizada', 'servicio', 50, 25, '#A8E6CF', '🎨', 2, true),
('Muestra de Tela Gratis', 'Muestra física a domicilio', 'servicio', 15, 25, '#C7CEEA', '🧵', 4, true),
('15% Descuento', '15% off en compras +S/100', 'descuento', NULL, 15, '#FFDAC1', '✨', 6, true),
('Envío Gratis', 'Delivery gratis en Arequipa', 'servicio', 10, 10, '#FFB7B2', '🚚', 8, true);
```

---

## 🔒 SISTEMA ANTI-ABUSO

### Función: Validar si puede girar
```sql
CREATE OR REPLACE FUNCTION puede_girar_ruleta(
    p_telefono VARCHAR(15),
    p_ip VARCHAR(45),
    p_dispositivo_id VARCHAR(100)
) RETURNS TABLE (
    puede_girar BOOLEAN,
    razon TEXT,
    intentos_restantes INTEGER
) AS $$
DECLARE
    v_participante RECORD;
    v_config RECORD;
    v_intentos_ip INTEGER;
    v_intentos_dispositivo INTEGER;
    v_ultimo_giro TIMESTAMP;
BEGIN
    -- Obtener configuración
    SELECT * INTO v_config FROM ruleta_configuracion LIMIT 1;
    
    -- Verificar si ruleta está activa
    IF NOT v_config.ruleta_activa THEN
        RETURN QUERY SELECT false, 'Ruleta temporalmente desactivada', 0;
        RETURN;
    END IF;
    
    -- Buscar participante
    SELECT * INTO v_participante 
    FROM ruleta_participantes 
    WHERE telefono = p_telefono;
    
    -- Si no existe, puede girar (nuevo usuario)
    IF v_participante IS NULL THEN
        RETURN QUERY SELECT true, 'Nuevo usuario - 3 intentos disponibles', 3;
        RETURN;
    END IF;
    
    -- Verificar si está bloqueado
    IF v_participante.bloqueado THEN
        RETURN QUERY SELECT false, v_participante.razon_bloqueo, 0;
        RETURN;
    END IF;
    
    -- Verificar intentos disponibles
    IF v_participante.intentos_usados >= (v_participante.intentos_maximos + v_participante.intentos_extra) THEN
        RETURN QUERY SELECT false, 'No tienes más intentos disponibles. Comparte con amigos para ganar más!', 0;
        RETURN;
    END IF;
    
    -- Verificar tiempo entre giros
    IF v_participante.ultimo_giro IS NOT NULL THEN
        IF EXTRACT(EPOCH FROM (NOW() - v_participante.ultimo_giro))/60 < v_config.tiempo_entre_giros_minutos THEN
            RETURN QUERY SELECT 
                false, 
                'Debes esperar ' || v_config.tiempo_entre_giros_minutos || ' minutos entre giros',
                (v_participante.intentos_maximos + v_participante.intentos_extra - v_participante.intentos_usados);
            RETURN;
        END IF;
    END IF;
    
    -- Verificar límite por IP
    SELECT COUNT(*) INTO v_intentos_ip
    FROM ruleta_giros
    WHERE ip_giro = p_ip
    AND fecha_giro > NOW() - INTERVAL '1 day';
    
    IF v_intentos_ip >= v_config.max_intentos_por_ip THEN
        -- Registrar en log de seguridad
        INSERT INTO ruleta_logs_seguridad (tipo_evento, gravedad, telefono, ip, descripcion)
        VALUES ('intento_bloqueado', 'warning', p_telefono, p_ip, 'Demasiados intentos desde misma IP');
        
        RETURN QUERY SELECT false, 'Límite de intentos por dispositivo alcanzado', 0;
        RETURN;
    END IF;
    
    -- Verificar límite por dispositivo
    SELECT COUNT(*) INTO v_intentos_dispositivo
    FROM ruleta_giros
    WHERE dispositivo_id = p_dispositivo_id
    AND fecha_giro > NOW() - INTERVAL '1 day';
    
    IF v_intentos_dispositivo >= v_config.max_intentos_por_dispositivo THEN
        INSERT INTO ruleta_logs_seguridad (tipo_evento, gravedad, telefono, dispositivo_id, descripcion)
        VALUES ('intento_bloqueado', 'warning', p_telefono, p_dispositivo_id, 'Demasiados intentos desde mismo dispositivo');
        
        RETURN QUERY SELECT false, 'Límite de intentos alcanzado', 0;
        RETURN;
    END IF;
    
    -- TODO: Agregar detección de VPN si está habilitado
    
    -- Puede girar
    RETURN QUERY SELECT 
        true, 
        'Puedes girar!',
        (v_participante.intentos_maximos + v_participante.intentos_extra - v_participante.intentos_usados);
END;
$$ LANGUAGE plpgsql;
```

### Función: Girar ruleta
```sql
CREATE OR REPLACE FUNCTION girar_ruleta(
    p_telefono VARCHAR(15),
    p_nombre VARCHAR(100),
    p_ip VARCHAR(45),
    p_dispositivo_id VARCHAR(100),
    p_navegador TEXT,
    p_sistema_operativo VARCHAR(50)
) RETURNS TABLE (
    exito BOOLEAN,
    mensaje TEXT,
    premio JSONB
) AS $$
DECLARE
    v_participante_id INTEGER;
    v_premio_ganado RECORD;
    v_random NUMERIC;
    v_suma_probabilidad NUMERIC := 0;
BEGIN
    -- Registrar o actualizar participante
    INSERT INTO ruleta_participantes (telefono, nombre, ip_registro, dispositivo_id)
    VALUES (p_telefono, p_nombre, p_ip, p_dispositivo_id)
    ON CONFLICT (telefono) DO UPDATE
    SET nombre = COALESCE(EXCLUDED.nombre, ruleta_participantes.nombre),
        ultimo_giro = NOW(),
        intentos_usados = ruleta_participantes.intentos_usados + 1
    RETURNING id_participante INTO v_participante_id;
    
    -- Si ya existía, solo incrementar intentos
    IF v_participante_id IS NULL THEN
        SELECT id_participante INTO v_participante_id
        FROM ruleta_participantes
        WHERE telefono = p_telefono;
        
        UPDATE ruleta_participantes
        SET intentos_usados = intentos_usados + 1,
            ultimo_giro = NOW()
        WHERE id_participante = v_participante_id;
    END IF;
    
    -- Seleccionar premio basado en probabilidades
    v_random := random() * 100;
    
    FOR v_premio_ganado IN
        SELECT * FROM ruleta_premios
        WHERE activo = true
        AND (stock_disponible IS NULL OR stock_disponible > 0)
        ORDER BY probabilidad DESC
    LOOP
        v_suma_probabilidad := v_suma_probabilidad + v_premio_ganado.probabilidad;
        
        IF v_random <= v_suma_probabilidad THEN
            -- Premio ganado!
            
            -- Reducir stock si aplica
            IF v_premio_ganado.stock_disponible IS NOT NULL THEN
                UPDATE ruleta_premios
                SET stock_disponible = stock_disponible - 1
                WHERE id_premio = v_premio_ganado.id_premio;
            END IF;
            
            -- Registrar giro
            INSERT INTO ruleta_giros (
                id_participante,
                telefono,
                id_premio_ganado,
                ip_giro,
                navegador,
                sistema_operativo
            ) VALUES (
                v_participante_id,
                p_telefono,
                v_premio_ganado.id_premio,
                p_ip,
                p_navegador,
                p_sistema_operativo
            );
            
            -- Actualizar participante con premio ganado
            UPDATE ruleta_participantes
            SET premios_ganados = premios_ganados || jsonb_build_object(
                    'id', v_premio_ganado.id_premio,
                    'nombre', v_premio_ganado.nombre,
                    'fecha', NOW()
                ),
                total_premios_valor = total_premios_valor + COALESCE(v_premio_ganado.valor_monetario, 0)
            WHERE id_participante = v_participante_id;
            
            -- Retornar resultado
            RETURN QUERY SELECT 
                true,
                '🎉 ¡Felicidades! Has ganado: ' || v_premio_ganado.nombre,
                jsonb_build_object(
                    'id_premio', v_premio_ganado.id_premio,
                    'nombre', v_premio_ganado.nombre,
                    'descripcion', v_premio_ganado.descripcion,
                    'tipo', v_premio_ganado.tipo,
                    'valor', v_premio_ganado.valor_monetario,
                    'color', v_premio_ganado.color_hex,
                    'icono', v_premio_ganado.icono,
                    'codigo_cupon', v_premio_ganado.codigo_cupon,
                    'valido_hasta', v_premio_ganado.valido_hasta
                );
            RETURN;
        END IF;
    END LOOP;
    
    -- Si llegamos aquí, algo salió mal
    RETURN QUERY SELECT false, 'Error al seleccionar premio', '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;
```

### Función: Compartir para ganar intentos
```sql
CREATE OR REPLACE FUNCTION registrar_compartido(
    p_telefono_origen VARCHAR(15),
    p_metodo VARCHAR(20)
) RETURNS TABLE (
    exito BOOLEAN,
    link_referido TEXT,
    intentos_ganados INTEGER
) AS $$
DECLARE
    v_participante_id INTEGER;
    v_link_unico VARCHAR(100);
    v_compartidos_hoy INTEGER;
    v_config RECORD;
BEGIN
    -- Obtener configuración
    SELECT * INTO v_config FROM ruleta_configuracion LIMIT 1;
    
    -- Verificar cuántos ha compartido hoy
    SELECT COUNT(*) INTO v_compartidos_hoy
    FROM ruleta_compartidos
    WHERE telefono_origen = p_telefono_origen
    AND fecha_compartido > NOW() - INTERVAL '1 day';
    
    IF v_compartidos_hoy >= v_config.max_compartidos_por_dia THEN
        RETURN QUERY SELECT false, '', 0;
        RETURN;
    END IF;
    
    -- Obtener ID de participante
    SELECT id_participante INTO v_participante_id
    FROM ruleta_participantes
    WHERE telefono = p_telefono_origen;
    
    -- Generar link único
    v_link_unico := 'CT-' || substr(md5(random()::text || p_telefono_origen), 1, 8);
    
    -- Registrar compartido
    INSERT INTO ruleta_compartidos (
        id_participante,
        telefono_origen,
        metodo,
        link_unico
    ) VALUES (
        v_participante_id,
        p_telefono_origen,
        p_metodo,
        v_link_unico
    );
    
    -- Dar intento extra inmediato por compartir
    UPDATE ruleta_participantes
    SET intentos_extra = intentos_extra + 1
    WHERE id_participante = v_participante_id;
    
    RETURN QUERY SELECT 
        true,
        'https://camitex.com/ruleta?ref=' || v_link_unico,
        1;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎨 FRONTEND - HTML/JS

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎰 Gira y Gana - CamiTex</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
        }

        h1 {
            text-align: center;
            color: #667eea;
            margin-bottom: 10px;
            font-size: 2em;
        }

        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
        }

        .ruleta-container {
            position: relative;
            width: 350px;
            height: 350px;
            margin: 0 auto 30px;
        }

        .ruleta {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 10px solid #fff;
            box-shadow: 0 0 30px rgba(0,0,0,0.2);
            position: relative;
            overflow: hidden;
            transition: transform 4s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .segmento {
            position: absolute;
            width: 50%;
            height: 50%;
            transform-origin: 100% 100%;
            clip-path: polygon(0 0, 100% 0, 100% 100%);
        }

        .flecha {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 20px solid transparent;
            border-right: 20px solid transparent;
            border-top: 40px solid #ff4757;
            filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));
            z-index: 10;
        }

        .boton-girar {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
            border: 5px solid white;
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 6px 20px rgba(255, 71, 87, 0.4);
            z-index: 5;
            transition: all 0.3s;
        }

        .boton-girar:hover:not(:disabled) {
            transform: translate(-50%, -50%) scale(1.1);
            box-shadow: 0 8px 25px rgba(255, 71, 87, 0.6);
        }

        .boton-girar:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .info-panel {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .intentos {
            text-align: center;
            font-size: 18px;
            margin-bottom: 15px;
        }

        .intentos-numero {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
        }

        .form-registro {
            display: grid;
            gap: 15px;
            margin-bottom: 20px;
        }

        input {
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }

        input:focus {
            outline: none;
            border-color: #667eea;
        }

        button:not(.boton-girar) {
            padding: 12px 24px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
        }

        button:not(.boton-girar):hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .premio-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .premio-content {
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            animation: slideIn 0.5s;
        }

        @keyframes slideIn {
            from {
                transform: scale(0.8);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }

        .premio-icono {
            font-size: 80px;
            margin-bottom: 20px;
        }

        .premio-nombre {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }

        .premio-descripcion {
            color: #666;
            margin-bottom: 20px;
        }

        .compartir-section {
            background: #e3f2fd;
            border-radius: 10px;
            padding: 15px;
            margin-top: 20px;
            text-align: center;
        }

        .boton-compartir {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎰 Gira y Gana</h1>
        <p class="subtitle">Tu diseño perfecto te está esperando</p>

        <div id="registro-section" class="form-registro">
            <input type="tel" id="telefono" placeholder="WhatsApp (972842278)" required>
            <input type="text" id="nombre" placeholder="Tu nombre">
            <button onclick="registrarUsuario()">🎁 Comenzar a Jugar</button>
        </div>

        <div id="juego-section" style="display: none;">
            <div class="info-panel">
                <div class="intentos">
                    <div>Te quedan</div>
                    <div class="intentos-numero" id="intentos-restantes">3</div>
                    <div>giros gratis</div>
                </div>
            </div>

            <div class="ruleta-container">
                <div class="flecha"></div>
                <div class="ruleta" id="ruleta">
                    <!-- Los segmentos se generan dinámicamente -->
                </div>
                <button class="boton-girar" id="btn-girar" onclick="girar()">
                    GIRAR
                </button>
            </div>

            <div class="compartir-section">
                <p><strong>🎁 Gana más giros!</strong></p>
                <p>Comparte con tus amigos y gana 1 giro extra</p>
                <button class="boton-compartir" onclick="compartirWhatsApp()">
                    📱 Compartir por WhatsApp
                </button>
                <button class="boton-compartir" onclick="compartirFacebook()">
                    👥 Compartir en Facebook
                </button>
            </div>
        </div>
    </div>

    <!-- Modal de Premio -->
    <div class="premio-modal" id="premio-modal">
        <div class="premio-content">
            <div class="premio-icono" id="premio-icono">🎁</div>
            <h2 class="premio-nombre" id="premio-nombre">¡Felicidades!</h2>
            <p class="premio-descripcion" id="premio-descripcion">Has ganado un premio</p>
            <button onclick="cerrarModal()">Genial! 🎉</button>
            <button onclick="pedirAhora()" style="background: #27ae60;">
                📱 Hacer mi Pedido
            </button>
        </div>
    </div>

    <script>
        // Configuración
        const API_URL = '/api/ruleta';
        let userData = null;
        let girando = false;

        // Premios (sincronizar con BD)
        const premios = [
            { nombre: 'Set Completo Gratis', icono: '🎁', color: '#FFD700', angulo: 0 },
            { nombre: 'Diseño 3D Gratis', icono: '🎨', color: '#A8E6CF', angulo: 45 },
            { nombre: 'Almohada Premium', icono: '💤', color: '#4ECDC4', angulo: 90 },
            { nombre: 'Muestra Gratis', icono: '🧵', color: '#C7CEEA', angulo: 135 },
            { nombre: '50% Descuento', icono: '🔥', color: '#FF6B6B', angulo: 180 },
            { nombre: '15% Descuento', icono: '✨', color: '#FFDAC1', angulo: 225 },
            { nombre: '30% Descuento', icono: '💰', color: '#95E1D3', angulo: 270 },
            { nombre: 'Envío Gratis', icono: '🚚', color: '#FFB7B2', angulo: 315 }
        ];

        // Generar segmentos de la ruleta
        function generarRuleta() {
            const ruleta = document.getElementById('ruleta');
            const anguloSegmento = 360 / premios.length;

            premios.forEach((premio, index) => {
                const segmento = document.createElement('div');
                segmento.className = 'segmento';
                segmento.style.background = premio.color;
                segmento.style.transform = `rotate(${index * anguloSegmento}deg)`;
                
                const texto = document.createElement('div');
                texto.style.position = 'absolute';
                texto.style.left = '70%';
                texto.style.top = '10%';
                texto.style.transform = 'rotate(-45deg)';
                texto.innerHTML = `<div style="font-size: 24px;">${premio.icono}</div>`;
                
                segmento.appendChild(texto);
                ruleta.appendChild(segmento);
            });
        }

        // Registrar usuario
        async function registrarUsuario() {
            const telefono = document.getElementById('telefono').value;
            const nombre = document.getElementById('nombre').value;

            if (!telefono) {
                alert('Por favor ingresa tu WhatsApp');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/registrar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        telefono,
                        nombre,
                        ip: await obtenerIP(),
                        dispositivo_id: obtenerDispositivoID()
                    })
                });

                const data = await response.json();

                if (data.exito) {
                    userData = data.usuario;
                    document.getElementById('registro-section').style.display = 'none';
                    document.getElementById('juego-section').style.display = 'block';
                    document.getElementById('intentos-restantes').textContent = data.intentos_restantes;
                } else {
                    alert(data.mensaje);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al conectar con el servidor');
            }
        }

        // Girar ruleta
        async function girar() {
            if (girando) return;

            const btnGirar = document.getElementById('btn-girar');
            btnGirar.disabled = true;
            girando = true;

            try {
                const response = await fetch(`${API_URL}/girar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        telefono: userData.telefono,
                        dispositivo_id: obtenerDispositivoID()
                    })
                });

                const data = await response.json();

                if (data.exito) {
                    // Calcular rotación al premio ganado
                    const premioGanado = premios.find(p => p.nombre.includes(data.premio.nombre.split(' ')[0]));
                    const rotacionFinal = 1800 + (360 - premioGanado.angulo); // 5 vueltas + ajuste

                    const ruleta = document.getElementById('ruleta');
                    ruleta.style.transform = `rotate(${rotacionFinal}deg)`;

                    // Esperar animación
                    setTimeout(() => {
                        mostrarPremio(data.premio);
                        document.getElementById('intentos-restantes').textContent = data.intentos_restantes;
                        btnGirar.disabled = data.intentos_restantes === 0;
                        girando = false;
                    }, 4000);
                } else {
                    alert(data.mensaje);
                    btnGirar.disabled = false;
                    girando = false;
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al girar');
                btnGirar.disabled = false;
                girando = false;
            }
        }

        // Mostrar premio
        function mostrarPremio(premio) {
            document.getElementById('premio-icono').textContent = premio.icono;
            document.getElementById('premio-nombre').textContent = premio.nombre;
            document.getElementById('premio-descripcion').textContent = premio.descripcion;
            document.getElementById('premio-modal').style.display = 'flex';
        }

        function cerrarModal() {
            document.getElementById('premio-modal').style.display = 'none';
        }

        function pedirAhora() {
            const mensaje = `Hola! Acabo de ganar "${document.getElementById('premio-nombre').textContent}" en la ruleta de CamiTex. Quiero hacer mi pedido!`;
            window.open(`https://wa.me/51972842278?text=${encodeURIComponent(mensaje)}`, '_blank');
        }

        // Compartir
        async function compartirWhatsApp() {
            const texto = '🎰 Gira la ruleta de CamiTex y gana increíbles premios! Yo ya jugué y tú también puedes ganar descuentos y regalos. Entra aquí:';
            const url = window.location.href;
            window.open(`https://wa.me/?text=${encodeURIComponent(texto + ' ' + url)}`, '_blank');
            
            // Registrar compartido
            await fetch(`${API_URL}/compartir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telefono: userData.telefono,
                    metodo: 'whatsapp'
                })
            });
        }

        // Utilidades
        function obtenerDispositivoID() {
            let id = localStorage.getItem('dispositivo_id');
            if (!id) {
                id = 'DEV-' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('dispositivo_id', id);
            }
            return id;
        }

        async function obtenerIP() {
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                return data.ip;
            } catch {
                return '0.0.0.0';
            }
        }

        // Inicializar
        generarRuleta();
    </script>
</body>
</html>
```

---

## 📱 ENDPOINTS API (Node.js/Express)

```javascript
// routes/ruleta.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Registrar usuario y obtener intentos
router.post('/registrar', async (req, res) => {
    const { telefono, nombre, ip, dispositivo_id } = req.body;
    
    try {
        // Validar si puede girar
        const validacion = await pool.query(
            'SELECT * FROM puede_girar_ruleta($1, $2, $3)',
            [telefono, ip, dispositivo_id]
        );
        
        const { puede_girar, razon, intentos_restantes } = validacion.rows[0];
        
        if (puede_girar) {
            res.json({
                exito: true,
                usuario: { telefono, nombre },
                intentos_restantes,
                mensaje: 'Listo para jugar!'
            });
        } else {
            res.json({
                exito: false,
                mensaje: razon
            });
        }
    } catch (error) {
        console.error('Error al registrar:', error);
        res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
    }
});

// Girar ruleta
router.post('/girar', async (req, res) => {
    const { telefono, dispositivo_id } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const navegador = req.headers['user-agent'];
    
    try {
        // Validar primero
        const validacion = await pool.query(
            'SELECT * FROM puede_girar_ruleta($1, $2, $3)',
            [telefono, ip, dispositivo_id]
        );
        
        if (!validacion.rows[0].puede_girar) {
            return res.json({
                exito: false,
                mensaje: validacion.rows[0].razon
            });
        }
        
        // Girar
        const resultado = await pool.query(
            'SELECT * FROM girar_ruleta($1, $2, $3, $4, $5, $6)',
            [telefono, null, ip, dispositivo_id, navegador, 'Windows']
        );
        
        const { exito, mensaje, premio } = resultado.rows[0];
        
        // Obtener intentos restantes
        const intentos = await pool.query(
            'SELECT (intentos_maximos + intentos_extra - intentos_usados) as restantes FROM ruleta_participantes WHERE telefono = $1',
            [telefono]
        );
        
        res.json({
            exito,
            mensaje,
            premio,
            intentos_restantes: intentos.rows[0].restantes
        });
        
    } catch (error) {
        console.error('Error al girar:', error);
        res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
    }
});

// Registrar compartido
router.post('/compartir', async (req, res) => {
    const { telefono, metodo } = req.body;
    
    try {
        const resultado = await pool.query(
            'SELECT * FROM registrar_compartido($1, $2)',
            [telefono, metodo]
        );
        
        const { exito, link_referido, intentos_ganados } = resultado.rows[0];
        
        res.json({
            exito,
            link_referido,
            intentos_ganados,
            mensaje: exito ? '¡Ganaste 1 giro extra!' : 'Límite de compartidos alcanzado'
        });
        
    } catch (error) {
        console.error('Error al compartir:', error);
        res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
    }
});

// Obtener estadísticas (admin)
router.get('/admin/estadisticas', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(DISTINCT telefono) as total_participantes,
                COUNT(*) as total_giros,
                SUM(CASE WHEN premio_canjeado THEN 1 ELSE 0 END) as premios_canjeados,
                COUNT(*) FILTER (WHERE fecha_giro > NOW() - INTERVAL '1 day') as giros_24h
            FROM ruleta_giros
        `);
        
        const premios_stats = await pool.query(`
            SELECT 
                rp.nombre,
                COUNT(rg.id_giro) as veces_ganado,
                rp.stock_disponible
            FROM ruleta_premios rp
            LEFT JOIN ruleta_giros rg ON rp.id_premio = rg.id_premio_ganado
            GROUP BY rp.id_premio, rp.nombre, rp.stock_disponible
            ORDER BY veces_ganado DESC
        `);
        
        res.json({
            generales: stats.rows[0],
            premios: premios_stats.rows
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;
```

---

## 🎯 RECOMENDACIONES FINALES

### ✅ Implementar:
1. **3 giros gratis** iniciales por usuario nuevo
2. **1 giro extra** por cada compartido exitoso (máx 5/día)
3. **30 minutos** de espera entre giros
4. **Límites por IP/dispositivo** para evitar abuso (10 IP / 15 dispositivo por día)
5. **Códigos únicos** para rastrear compartidos

### 🎁 Premios Sugeridos:
- **5%** - Premio grande (Set completo S/250, 50% OFF)
- **20%** - Premio medio (Almohada S/65, 30% OFF)
- **75%** - Premio pequeño (Servicios gratis, 15% OFF, envío)

### 📊 Distribución de Probabilidad:
```
🎁 Set Completo (2.5%) -----> S/250 valor
🔥 50% Descuento (2.5%)
💤 Almohada Premium (10%) --> S/65 valor
💰 30% Descuento (10%)
🎨 Diseño 3D (25%) ---------> S/50 valor
🧵 Muestra Tela (25%) ------> S/15 valor
✨ 15% Descuento (15%)
🚚 Envío Gratis (10%) ------> S/10 valor
```

### 🔒 Medidas Anti-Abuso:
- Registro con WhatsApp (verificable)
- Fingerprint del dispositivo
- Límite por IP diaria
- Tiempo mínimo entre giros
- Log de intentos sospechosos
- Bloqueo automático por comportamiento fraudulento

### 📈 KPIs a Medir:
1. Tasa de conversión (giros → pedidos)
2. Compartidos generados
3. Viralidad (referidos por usuario)
4. Premios más canjeados
5. Horarios de mayor actividad
6. Dispositivos y ubicaciones

---

## 🚀 IMPLEMENTACIÓN

¿Quieres que implemente esto en tu sistema? Puedo:
1. ✅ Crear las tablas en tu PostgreSQL
2. ✅ Agregar los endpoints al server.js
3. ✅ Crear la página HTML de la ruleta
4. ✅ Integrar con tu sistema de WhatsApp
5. ✅ Crear dashboard de administración
6. ✅ Generar QR para promocionar

**¿Comenzamos con la implementación?** 🎰